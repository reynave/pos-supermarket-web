import { getRuntimeConnectionConfig } from '../app/core/config/runtime-connection';

const runtime = getRuntimeConnectionConfig();

export const environment = {
  production: true,
  apiUrl: runtime.apiUrl,
  socketUrl: runtime.socketUrl,
  terminalId: runtime.terminalId,
  storeOutletId: runtime.storeOutletId,
};
