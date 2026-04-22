import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  pat: string;
  userId: string;
  jwt: string;
  traceId: string;
}

export const contextStorage = new AsyncLocalStorage<RequestContext>();

export function currentContext(): RequestContext {
  const ctx = contextStorage.getStore();
  if (!ctx) {
    throw new Error('Tool handler invoked without request context');
  }
  return ctx;
}
