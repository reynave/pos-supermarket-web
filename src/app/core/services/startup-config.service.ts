import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';

export type PrinterType = 'LAN' | 'SERIAL' | 'COM';

export interface StartupConfig {
  terminalId: string;
  apiUrl: string;
  apiPort: string;
  printerName: string;
  printerType: PrinterType;
  printerIp: string;
  serialComPort: string;
}

export interface ConnectionTestResult {
  ok: boolean;
  message: string;
  url: string;
}

@Injectable({ providedIn: 'root' })
export class StartupConfigService {
  private readonly STORAGE_KEY = 'pos_startup_config';

  config = signal<StartupConfig>(this.loadConfig());

  constructor(private http: HttpClient) {}

  saveConfig(config: StartupConfig): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
    this.config.set(config);
  }

  loadConfig(): StartupConfig {
    const fallback: StartupConfig = {
      terminalId: 'T01',
      apiUrl: 'http://localhost',
      apiPort: '3000',
      printerName: 'EPSON TM-T88VI',
      printerType: 'LAN',
      printerIp: '192.168.1.200',
      serialComPort: 'COM3',
    };

    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw) return fallback;

    try {
      const parsed = JSON.parse(raw) as Partial<StartupConfig>;
      return {
        terminalId: parsed.terminalId || fallback.terminalId,
        apiUrl: parsed.apiUrl || fallback.apiUrl,
        apiPort: parsed.apiPort || fallback.apiPort,
        printerName: parsed.printerName || fallback.printerName,
        printerType: (parsed.printerType as PrinterType) || fallback.printerType,
        printerIp: parsed.printerIp || fallback.printerIp,
        serialComPort: parsed.serialComPort || fallback.serialComPort,
      };
    } catch {
      return fallback;
    }
  }

  buildApiBaseUrl(config: StartupConfig): string {
    const host = (config.apiUrl || '').trim().replace(/\/+$/, '');
    const port = (config.apiPort || '').trim();

    // If user already includes :port in apiUrl, keep as-is.
    const hasExplicitPort = /:\d+$/.test(host);
    if (!host) return '';
    if (hasExplicitPort || !port) return host;
    return `${host}:${port}`;
  }

  testConnection(config: StartupConfig): Observable<ConnectionTestResult> {
    const base = this.buildApiBaseUrl(config);
    const url = `${base}/api/health`;

    if (!base) {
      return of({ ok: false, message: 'API URL wajib diisi', url });
    }

    return this.http.get<{ success?: boolean; message?: string }>(url).pipe(
      timeout(4000),
      map((res) => {
        if (res?.success === false) {
          return { ok: false, message: res.message || 'Server merespon gagal', url };
        }
        return { ok: true, message: 'Koneksi berhasil', url };
      }),
      catchError(() => of({ ok: false, message: 'Tidak bisa terhubung ke server', url })),
    );
  }
}
