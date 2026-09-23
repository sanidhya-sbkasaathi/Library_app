import type { Plugin } from 'vite';
import { supabaseOAuth } from './supabaseOAuthManager.ts';
import { migrationRunner, MIGRATION_MANIFEST } from './supabaseMigrationRunner.ts';

function parseJsonBody(req: any): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk: any) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function sendJson(res: any, statusCode: number, data: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-session-id');
  res.end(JSON.stringify(data));
}

export function viteSupabaseApiPlugin(): Plugin {
  return {
    name: 'vite-plugin-supabase-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const reqUrl = req.url || '';
        const parsedUrl = new URL(reqUrl, 'http://localhost:5173');
        const pathname = parsedUrl.pathname;

        // Handle CORS preflight
        if (req.method === 'OPTIONS' && (pathname.startsWith('/api/supabase') || pathname.startsWith('/api/supabase-mgmt-proxy'))) {
          res.statusCode = 204;
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey, x-session-id');
          return res.end();
        }

        // Direct transparent proxy for Supabase Management API to bypass browser CORS in dev mode
        if (pathname.startsWith('/api/supabase-mgmt-proxy')) {
          const targetPath = pathname.replace(/^\/api\/supabase-mgmt-proxy/, '') + (parsedUrl.search || '');
          const targetUrl = `https://api.supabase.com${targetPath}`;

          try {
            const authHeader = req.headers['authorization'];
            const fetchHeaders: Record<string, string> = {
              'Accept': 'application/json',
              'User-Agent': 'SbKasaathi-Library-App/1.0',
            };
            if (authHeader) fetchHeaders['Authorization'] = authHeader as string;
            if (req.headers['content-type']) fetchHeaders['Content-Type'] = req.headers['content-type'] as string;

            let bodyData: any = undefined;
            if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
              bodyData = await parseJsonBody(req);
            }

            const proxyRes = await fetch(targetUrl, {
              method: req.method,
              headers: fetchHeaders,
              body: bodyData ? JSON.stringify(bodyData) : undefined,
            });

            const text = await proxyRes.text();
            console.log(`[Vite Proxy] ${req.method} ${targetUrl} -> HTTP ${proxyRes.status}`);

            res.statusCode = proxyRes.status;
            res.setHeader('Content-Type', proxyRes.headers.get('content-type') || 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Headers', '*');
            return res.end(text);
          } catch (err: any) {
            console.error(`[Vite Proxy Error] ${targetUrl}:`, err.message);
            return sendJson(res, 502, { error: `Supabase Management API proxy failed: ${err.message}` });
          }
        }

        if (!pathname.startsWith('/api/supabase')) {
          return next();
        }

        const sessionIdHeader = (req.headers['x-session-id'] as string) || parsedUrl.searchParams.get('sessionId') || '';

        try {
          // 1. Manifest endpoint
          if (req.method === 'GET' && pathname === '/api/supabase/manifest') {
            return sendJson(res, 200, {
              success: true,
              version: 'v1.0.0',
              manifest: MIGRATION_MANIFEST,
            });
          }

          // 2. Initiate OAuth
          if (req.method === 'POST' && pathname === '/api/supabase/oauth/initiate') {
            const body = await parseJsonBody(req);
            const data = supabaseOAuth.initiateOAuth(body.redirectUri, body.clientId);
            return sendJson(res, data.success ? 200 : 400, data);
          }

          // 3. OAuth Callback exchange
          if (req.method === 'POST' && pathname === '/api/supabase/oauth/callback') {
            const body = await parseJsonBody(req);
            const result = await supabaseOAuth.exchangeCode({
              sessionId: body.sessionId,
              code: body.code,
              state: body.state,
              redirectUri: body.redirectUri,
            });
            return sendJson(res, result.success ? 200 : 400, result);
          }

          // 4. Token Connect (PAT fallback: sbp_...)
          if (req.method === 'POST' && pathname === '/api/supabase/token/connect') {
            const body = await parseJsonBody(req);
            const result = await supabaseOAuth.connectWithToken(body.token || '');
            return sendJson(res, result.success ? 200 : 400, result);
          }

          // 5. List Projects
          if (req.method === 'GET' && pathname === '/api/supabase/projects') {
            if (!sessionIdHeader) {
              return sendJson(res, 401, { success: false, error: 'Missing x-session-id header' });
            }
            const result = await supabaseOAuth.listProjects(sessionIdHeader);
            return sendJson(res, result.success ? 200 : 400, result);
          }

          // 6. Project Database Status
          const statusMatch = pathname.match(/^\/api\/supabase\/projects\/([^/]+)\/status$/);
          if (req.method === 'GET' && statusMatch) {
            const projectRef = statusMatch[1];
            const token = supabaseOAuth.getAccessToken(sessionIdHeader);
            if (!token) {
              return sendJson(res, 401, { success: false, error: 'Unauthorized session or session expired.' });
            }
            const status = await migrationRunner.getDatabaseStatus(token, projectRef);
            return sendJson(res, 200, { success: true, projectRef, status });
          }

          // 7. Project Database Migration Execution
          const migrateMatch = pathname.match(/^\/api\/supabase\/projects\/([^/]+)\/migrate$/);
          if (req.method === 'POST' && migrateMatch) {
            const projectRef = migrateMatch[1];
            const token = supabaseOAuth.getAccessToken(sessionIdHeader);
            if (!token) {
              return sendJson(res, 401, { success: false, error: 'Unauthorized session or session expired.' });
            }
            const summary = await migrationRunner.runMigrations(token, projectRef);
            return sendJson(res, summary.success ? 200 : 500, summary);
          }

          // 8. Project Database API Keys
          const apiKeysMatch = pathname.match(/^\/api\/supabase\/projects\/([^/]+)\/api-keys$/);
          if (req.method === 'GET' && apiKeysMatch) {
            const projectRef = apiKeysMatch[1];
            const result = await supabaseOAuth.getProjectApiKeys(sessionIdHeader, projectRef);
            return sendJson(res, result.success ? 200 : 400, result);
          }

          return sendJson(res, 404, { error: `Not found: ${pathname}` });
        } catch (err: any) {
          return sendJson(res, 500, { error: err.message || 'Internal server error' });
        }
      });
    },
  };
}
