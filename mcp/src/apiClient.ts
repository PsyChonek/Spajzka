import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { config } from './config';
import { currentContext } from './context';
import { AuthError, evictPat, getJwtForPat } from './auth';
import { logger } from './logging';

const client: AxiosInstance = axios.create({
  baseURL: config.apiUrl,
  timeout: 15_000
});

function attachHeaders(ctx: ReturnType<typeof currentContext>, requestConfig: AxiosRequestConfig): AxiosRequestConfig {
  return {
    ...requestConfig,
    headers: {
      ...(requestConfig.headers ?? {}),
      Authorization: `Bearer ${ctx.jwt}`,
      'X-Trace-Id': ctx.traceId
    }
  };
}

export class UpstreamError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'UpstreamError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string = 'Not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string, public readonly requiredPermission?: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class InvalidParamsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidParamsError';
  }
}

async function requestOnce<T>(method: string, path: string, requestConfig: AxiosRequestConfig): Promise<T> {
  const ctx = currentContext();
  const response = await client.request<T>({
    method,
    url: path,
    ...attachHeaders(ctx, requestConfig)
  });
  return response.data;
}

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  params?: Record<string, unknown>;
  body?: unknown;
  // When true, 404 resolves to null instead of throwing. For read endpoints.
  nullOn404?: boolean;
}

export async function apiRequest<T>({ method, path, params, body, nullOn404 = false }: RequestOptions): Promise<T | null> {
  const ctx = currentContext();
  const requestConfig: AxiosRequestConfig = {
    params,
    data: body,
    headers: { 'Content-Type': 'application/json' }
  };

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await requestOnce<T>(method, path, requestConfig);
    } catch (err) {
      if (!(err instanceof AxiosError) || !err.response) {
        logger.error({ err, tool: ctx.traceId }, 'Upstream network error');
        throw new UpstreamError('Upstream network error', 0, undefined, true);
      }

      const status = err.response.status;
      const payload = err.response.data as { message?: string; code?: string } | undefined;

      if (status === 401 && attempt === 0) {
        // JWT likely expired mid-session. Evict, re-exchange, retry once.
        evictPat(ctx.pat);
        const fresh = await getJwtForPat(ctx.pat, { forceRefresh: true });
        ctx.jwt = fresh.jwt;
        continue;
      }

      if (status === 401) {
        throw new AuthError('Authentication failed. Your MCP token may have been revoked.');
      }
      if (status === 403) {
        throw new ForbiddenError(payload?.message ?? 'Forbidden', payload?.code);
      }
      if (status === 404) {
        if (nullOn404) return null;
        throw new NotFoundError(payload?.message);
      }
      if (status === 400 || status === 422) {
        throw new InvalidParamsError(payload?.message ?? 'Invalid request');
      }
      if (status === 429) {
        throw new UpstreamError('Upstream rate limited', status, payload?.code, true);
      }
      if (status >= 500 && attempt === 0) {
        await new Promise(r => setTimeout(r, 250));
        continue;
      }
      throw new UpstreamError(payload?.message ?? 'Upstream error', status, payload?.code);
    }
  }

  throw new UpstreamError('Upstream error after retry', 500);
}
