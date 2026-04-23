import { ApiError } from '@shared/api-client'

/**
 * Classified fetch failure. `kind` drives whether to show a user-facing
 * toast and what text to use; the rest is for diagnostic logging.
 */
export type FetchErrorKind =
  | 'offline'       // we know we're offline (navigator.onLine === false)
  | 'network'       // request left the browser but got no response (DNS, TLS, timeout)
  | 'notfound'      // 404
  | 'unauthorized'  // 401 / 403 — authStore re-auths on 401, so silent
  | 'server'        // 5xx
  | 'client'        // 4xx (non-404/401/403) — likely a bug in the caller
  | 'unknown'

export interface ClassifiedFetchError {
  kind: FetchErrorKind
  status: number | null
  url: string | null
  message: string
  raw: unknown
}

function classifyByStatus(status: number): FetchErrorKind {
  if (status === 0) return 'network'
  if (status === 404) return 'notfound'
  if (status === 401 || status === 403) return 'unauthorized'
  if (status >= 500) return 'server'
  if (status >= 400) return 'client'
  return 'unknown'
}

export function classifyFetchError(error: unknown): ClassifiedFetchError {
  const any = error as any

  if (error instanceof ApiError) {
    const status = error.status ?? 0
    return {
      kind: status ? classifyByStatus(status) : 'network',
      status: status || null,
      url: (error as any).url ?? null,
      message: error.message,
      raw: error
    }
  }

  if (any?.isAxiosError) {
    const status: number | undefined = any.response?.status
    return {
      kind: status ? classifyByStatus(status) : 'network',
      status: status ?? null,
      url: any.config?.url ?? null,
      message: any.message,
      raw: error
    }
  }

  if (any?.message === 'offline') {
    return { kind: 'offline', status: null, url: null, message: 'offline', raw: error }
  }

  return {
    kind: 'unknown',
    status: null,
    url: null,
    message: String(any?.message ?? error),
    raw: error
  }
}

/**
 * Structured log line. Grep DevTools console for `[spajzka/fetch]` to see
 * every failing refresh, or `store=mealPlan` to isolate a single domain.
 */
export function logFetchError(
  storeName: string,
  operation: string,
  classified: ClassifiedFetchError
): void {
  const { kind, status, url, message } = classified
  // eslint-disable-next-line no-console
  console.warn(
    `[spajzka/fetch] store=${storeName} op=${operation} kind=${kind} status=${status ?? '-'} url=${url ?? '-'} message=${message}`,
    classified.raw
  )
}

/**
 * Returns the toast text to show, or `null` if the failure should be silent
 * (offline / notfound / unauthorized / client-bug). We stay quiet on
 * `unauthorized` because authStore's 401 handler already triggers a
 * re-auth flow — a warning toast during that flow is misleading.
 */
export function fetchErrorToast(classified: ClassifiedFetchError): string | null {
  switch (classified.kind) {
    case 'offline':
      return null
    case 'notfound':
      return null
    case 'unauthorized':
      return null
    case 'network':
      return 'Cannot reach the server. Showing cached data.'
    case 'server':
      return 'Server error. Showing cached data.'
    case 'client':
      return null
    case 'unknown':
    default:
      return 'Could not refresh. Showing cached data.'
  }
}
