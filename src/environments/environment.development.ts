import { getRuntimeConnectionConfig } from '../app/core/config/runtime-connection';

const runtime = getRuntimeConnectionConfig();

export const environment = {
  production: true,
  apiUrl: 'http://localhost:3000/api', 
  socketUrl: 'http://localhost:3000',
  terminalId: runtime.terminalId, 
  storeOutletId: runtime.storeOutletId,
};
