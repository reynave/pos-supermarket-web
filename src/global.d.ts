import type { RuntimeConnectionConfig } from './app/core/config/runtime-connection';

declare global {
  interface Window {
    __POS_CONNECTION__?: Partial<RuntimeConnectionConfig>;
  }
}

export {};
