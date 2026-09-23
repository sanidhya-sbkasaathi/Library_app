/**
 * Unified Production-Grade API Console Logger & Fetch Interceptor
 * Intercepts all outgoing API calls (REST, Supabase Cloud, Management API, etc.)
 * and logs rich, colorful, collapsible badges with execution latency, request payload,
 * response status, and error diagnostics directly in the browser DevTools console.
 */

export interface ApiLogDetails {
  method: string;
  url: string;
  status?: number;
  statusText?: string;
  durationMs?: number;
  requestHeaders?: Record<string, string>;
  requestBody?: any;
  responseBody?: any;
  error?: any;
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'background: #0284c7; color: #ffffff; font-weight: bold; border-radius: 4px; padding: 2px 6px;',
  POST: 'background: #16a34a; color: #ffffff; font-weight: bold; border-radius: 4px; padding: 2px 6px;',
  PUT: 'background: #d97706; color: #ffffff; font-weight: bold; border-radius: 4px; padding: 2px 6px;',
  PATCH: 'background: #ea580c; color: #ffffff; font-weight: bold; border-radius: 4px; padding: 2px 6px;',
  DELETE: 'background: #dc2626; color: #ffffff; font-weight: bold; border-radius: 4px; padding: 2px 6px;',
  OPTIONS: 'background: #64748b; color: #ffffff; font-weight: bold; border-radius: 4px; padding: 2px 6px;',
};

const getStatusStyle = (status: number): string => {
  if (status >= 200 && status < 300) {
    return 'background: #15803d; color: #ffffff; font-weight: bold; border-radius: 4px; padding: 2px 6px;';
  }
  if (status >= 300 && status < 400) {
    return 'background: #0369a1; color: #ffffff; font-weight: bold; border-radius: 4px; padding: 2px 6px;';
  }
  if (status >= 400 && status < 500) {
    return 'background: #b45309; color: #ffffff; font-weight: bold; border-radius: 4px; padding: 2px 6px;';
  }
  return 'background: #b91c1c; color: #ffffff; font-weight: bold; border-radius: 4px; padding: 2px 6px;';
};

export class ApiLogger {
  private static isInitialized = false;

  public static logRequest(method: string, url: string, body?: any, headers?: any) {
    const timeStr = new Date().toLocaleTimeString();
    const methodStyle = METHOD_COLORS[method.toUpperCase()] || 'background: #475569; color: #fff; padding: 2px 6px; border-radius: 4px;';
    const tagStyle = 'background: #0f172a; color: #38bdf8; font-weight: 600; padding: 2px 6px; border-radius: 4px; border: 1px solid #1e293b;';

    console.groupCollapsed(
      `%c⚡ API REQ%c %c${method.toUpperCase()}%c ${url} %c(${timeStr})`,
      tagStyle,
      '',
      methodStyle,
      'color: #94a3b8; font-weight: 500;',
      'color: #64748b; font-size: 11px;'
    );
    if (headers) console.log('%cHeaders:', 'color: #38bdf8; font-weight: bold;', headers);
    if (body) console.log('%cPayload:', 'color: #34d399; font-weight: bold;', body);
    console.groupEnd();
  }

  public static logResponse(method: string, url: string, status: number, statusText: string, data: any, durationMs: number) {
    const safeMethod = String(method || 'GET').toUpperCase();
    const statusStyle = getStatusStyle(status);
    const methodStyle = METHOD_COLORS[safeMethod] || 'background: #475569; color: #fff; padding: 2px 6px; border-radius: 4px;';
    const tagStyle = status < 400
      ? 'background: #064e3b; color: #34d399; font-weight: 600; padding: 2px 6px; border-radius: 4px;'
      : 'background: #7f1d1d; color: #f87171; font-weight: 600; padding: 2px 6px; border-radius: 4px;';

    console.groupCollapsed(
      `%c${status < 400 ? '✓ API RES' : '✕ API RES'}%c %c${method.toUpperCase()}%c %c${status} ${statusText || ''}%c ${url} %c(+${durationMs}ms)`,
      tagStyle,
      '',
      methodStyle,
      '',
      statusStyle,
      'color: #94a3b8; font-weight: 500;',
      'color: #a78bfa; font-weight: bold;'
    );
    if (status >= 400) {
      console.warn(`%c⚠️ HTTP ${status} Error Response:`, 'color: #f59e0b; font-weight: bold;', data);
    } else {
      console.log('%cResponse Body:', 'color: #38bdf8; font-weight: bold;', data);
    }
    console.groupEnd();
  }

  public static logError(method: string, url: string, error: any, durationMs: number) {
    const methodStyle = METHOD_COLORS[method.toUpperCase()] || 'background: #475569; color: #fff; padding: 2px 6px; border-radius: 4px;';
    const tagStyle = 'background: #881337; color: #fda4af; font-weight: 600; padding: 2px 6px; border-radius: 4px;';

    console.group(
      `%c⚠️ API NET ERR%c %c${method.toUpperCase()}%c ${url} %c(+${durationMs}ms)`,
      tagStyle,
      '',
      methodStyle,
      'color: #f43f5e; font-weight: bold;',
      'color: #f43f5e; font-size: 11px;'
    );
    console.error('Network / Fetch Exception:', error);
    console.groupEnd();
  }

  /**
   * Initializes the Global Fetch Interceptor.
   * Intercepts all window.fetch calls seamlessly without affecting existing behavior.
   */
  public static initGlobalInterceptor() {
    if (typeof window === 'undefined' || ApiLogger.isInitialized) return;
    ApiLogger.isInitialized = true;

    const originalFetch = window.fetch;

    window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const url = typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

      // Skip logging vite HMR and websocket internal requests
      if (url.includes('/@vite/') || url.includes('/@fs/') || url.includes('__vite_ping') || url.endsWith('.tsx') || url.endsWith('.ts') || url.endsWith('.css')) {
        return originalFetch.apply(this, [input as any, init]);
      }

      const method = (init?.method || (typeof input === 'object' && 'method' in input ? input.method : 'GET') || 'GET').toUpperCase();
      const startTime = performance.now();

      let parsedBody: any = undefined;
      if (init?.body) {
        if (typeof init.body === 'string') {
          try {
            parsedBody = JSON.parse(init.body);
          } catch {
            parsedBody = init.body;
          }
        } else {
          parsedBody = '[Binary/FormData]';
        }
      }

      // Safe header capture
      let headerSnapshot: Record<string, string> | undefined = undefined;
      if (init?.headers) {
        if (init.headers instanceof Headers) {
          headerSnapshot = {};
          init.headers.forEach((v, k) => {
            headerSnapshot![k] = k.toLowerCase().includes('authorization') || k.toLowerCase().includes('apikey')
              ? `${v.substring(0, 12)}...`
              : v;
          });
        } else if (typeof init.headers === 'object') {
          headerSnapshot = {};
          for (const [k, v] of Object.entries(init.headers)) {
            headerSnapshot[k] = k.toLowerCase().includes('authorization') || k.toLowerCase().includes('apikey')
              ? `${String(v).substring(0, 12)}...`
              : String(v);
          }
        }
      }

      // 1. Log Outgoing Request
      ApiLogger.logRequest(method, url, parsedBody, headerSnapshot);

      try {
        const response = await originalFetch.apply(this, [input as any, init]);
        const durationMs = Math.round(performance.now() - startTime);

        // 2. Clone response to read body without consuming it
        try {
          const clone = response.clone();
          const contentType = clone.headers.get('content-type') || '';

          if (contentType.includes('application/json')) {
            clone.json().then((json) => {
              ApiLogger.logResponse(method, url, response.status, response.statusText, json, durationMs);
            }).catch(() => {
              ApiLogger.logResponse(method, url, response.status, response.statusText, '[Empty/Stream Response]', durationMs);
            });
          } else {
            clone.text().then((text) => {
              const preview = text.length > 500 ? text.substring(0, 500) + '... (truncated)' : text;
              ApiLogger.logResponse(method, url, response.status, response.statusText, preview || '[Empty]', durationMs);
            }).catch(() => {
              ApiLogger.logResponse(method, url, response.status, response.statusText, '[Non-text Response]', durationMs);
            });
          }
        } catch {
          ApiLogger.logResponse(method, url, response.status, response.statusText, '[Stream Read Skipped]', durationMs);
        }

        return response;
      } catch (err: any) {
        const durationMs = Math.round(performance.now() - startTime);
        ApiLogger.logError(method, url, err, durationMs);
        throw err;
      }
    };

    console.log(
      '%c[SbKasaathi API Logger]%c Unified console API interceptor active. All network requests & responses are tracked in real-time.',
      'background: #0284c7; color: #fff; font-weight: bold; padding: 2px 8px; border-radius: 4px;',
      'color: #38bdf8;'
    );
  }
}

export const logApiRequest = (method: string, url: string, body?: any, headers?: any) => ApiLogger.logRequest(method, url, body, headers);
export const logApiResponse = (method: string, url: string, status: number, statusText: string, data: any, durationMs: number) => ApiLogger.logResponse(method, url, status, statusText, data, durationMs);
export const logApiError = (method: string, url: string, error: any, durationMs: number) => ApiLogger.logError(method, url, error, durationMs);
export const initGlobalApiLogger = () => ApiLogger.initGlobalInterceptor();
