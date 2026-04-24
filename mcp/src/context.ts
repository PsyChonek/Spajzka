import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  /** Raw credential: either a PAT (spk_mcp_...) or an OAuth access token (JWT). */
  token: string;
  /** Differentiates the two auth paths for retry/refresh logic. */
  tokenType: 'pat' | 'oauth';
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
