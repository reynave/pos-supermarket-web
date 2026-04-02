export interface RuntimeConnectionConfig {
  host: string;
  apiPath: string;
  apiUrl: string;
  socketUrl: string;
  terminalId: string;
  storeOutletId: string;
  printerName: string;
  printerType: 'LAN' | 'SERIAL' | 'COM';
  printerIp: string;
  serialComPort: string;
}

const fallback: RuntimeConnectionConfig = {
  host: 'http://localhost:3000',
  apiPath: '/api',
  apiUrl: 'http://localhost:3000/api',
  socketUrl: 'http://localhost:3000',
  terminalId: 'T01',
  storeOutletId: 'OT99',
  printerName: 'EPSON TM-T88VI',
  printerType: 'LAN',
  printerIp: '192.168.1.200',
  serialComPort: 'COM3',
};

function normalizeApiPath(path: string): string {
  const cleaned = (path || '').trim();
  if (!cleaned) return '/api';
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) return cleaned;
  return cleaned.startsWith('/') ? cleaned : `/${cleaned}`;
}

function normalize(config?: Partial<RuntimeConnectionConfig>): RuntimeConnectionConfig {
  const host = (config?.host || fallback.host).trim().replace(/\/+$/, '');
  const apiPath = normalizeApiPath(config?.apiPath || config?.apiUrl || fallback.apiPath);
  const apiUrl = apiPath.startsWith('http://') || apiPath.startsWith('https://') ? apiPath : `${host}${apiPath}`;

  return {
    host,
    apiPath,
    apiUrl,
    socketUrl: config?.socketUrl || host,
    terminalId: config?.terminalId || fallback.terminalId,
    storeOutletId: config?.storeOutletId || fallback.storeOutletId,
    printerName: config?.printerName || fallback.printerName,
    printerType: config?.printerType || fallback.printerType,
    printerIp: config?.printerIp || fallback.printerIp,
    serialComPort: config?.serialComPort || fallback.serialComPort,
  };
}

export function getRuntimeConnectionConfig(): RuntimeConnectionConfig {
  if (typeof window === 'undefined') return fallback;
  return normalize(window.__POS_CONNECTION__);
}
