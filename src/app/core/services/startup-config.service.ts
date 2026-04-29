import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';
import { getRuntimeConnectionConfig } from '../config/runtime-connection';
import { environment } from '../../../environments/environment';

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
  config = signal<StartupConfig>(this.loadConfig());

  constructor(private http: HttpClient) {}

  saveConfig(config: StartupConfig): void {
    // Runtime connection values are managed via public/connection.js.
    this.config.set(config);
  }

  loadConfig(): StartupConfig {
    const runtime = getRuntimeConnectionConfig();
    let hostWithoutPort = runtime.host;
    let apiPort = '';

    // Prefer manual values from environment.ts when provided (dev override).
    if (environment?.apiUrl) {
      try {
        const envUrl = new URL(environment.apiUrl);
        hostWithoutPort = `${envUrl.protocol}//${envUrl.hostname}`;
        apiPort = envUrl.port;
      } catch {
        // ignore and fall back to runtime
      }
    } else {
      try {
        const url = new URL(runtime.host);
        hostWithoutPort = `${url.protocol}//${url.hostname}`;
        apiPort = url.port;
      } catch {
        // Keep raw host when URL parsing fails.
      }
    }

    return {
      terminalId: runtime.terminalId,
      apiUrl: hostWithoutPort,
      apiPort,
      printerName: runtime.printerName,
      printerType: runtime.printerType,
      printerIp: runtime.printerIp,
      serialComPort: runtime.serialComPort,
    };
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

    return this.http.get<any>(url).pipe(
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
