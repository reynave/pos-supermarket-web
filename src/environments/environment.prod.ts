import { getRuntimeConnectionConfig } from '../app/core/config/runtime-connection';

const runtime = getRuntimeConnectionConfig();

export const environment = {
  production: true,
   apiUrl : "https://supermarket.mitralinksolusi.com/api",
  socketUrl: "https://supermarket.mitralinksolusi.com",
  terminalId: runtime.terminalId, 
  storeOutletId: runtime.storeOutletId,
};
