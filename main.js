import { app, BrowserWindow, session, protocol, Menu } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Request Single Instance Lock to prevent dual database corruption
const gotTheLock = app.requestSingleInstanceLock();
let mainWindow = null;

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  // Register custom protocol before app is ready
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'app',
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true,
        allowServiceWorkers: true,
        bypassCSP: true,
      }
    }
  ]);

  const createWindow = () => {
    mainWindow = new BrowserWindow({
      width: 1440,
      height: 900,
      minWidth: 1024,
      minHeight: 768,
      title: 'SbKasaathi Library Management System',
      backgroundColor: '#070d19',
      autoHideMenuBar: true,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: false,
        sandbox: false,
      }
    });

    Menu.setApplicationMenu(null);

    mainWindow.once('ready-to-show', () => {
      if (mainWindow) {
        mainWindow.show();
      }
    });

    if (process.env.ELECTRON_ENABLE_LOGGING || process.env.DEBUG) {
      mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
        console.log(`[Renderer Console] [Level ${level}] ${message} (${sourceId}:${line})`);
      });
    }

    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.error(`[did-fail-load] Code ${errorCode}: ${errorDescription} on ${validatedURL}`);
    });

    mainWindow.webContents.on('render-process-gone', (event, details) => {
      console.error('[render-process-gone]', details);
    });

    const isDev = !app.isPackaged && process.env.NODE_ENV === 'development';

    if (isDev) {
      mainWindow.loadURL('http://localhost:5173');
    } else {
      // In production, load the built React app via the custom protocol from packaged assets
      mainWindow.loadURL('app://app/index.html');
    }

    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  };

  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.wasm': 'application/wasm',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ttf': 'font/ttf',
    '.webmanifest': 'application/manifest+json',
  };

  app.whenReady().then(() => {
    // Set headers required for SQLite WASM OPFS and SharedArrayBuffer on local schemes
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      const responseHeaders = { ...details.responseHeaders };
      if (details.url.startsWith('app://') || details.resourceType === 'mainFrame') {
        responseHeaders['Cross-Origin-Opener-Policy'] = ['same-origin'];
        responseHeaders['Cross-Origin-Embedder-Policy'] = ['require-corp'];
      }
      callback({ responseHeaders });
    });

    // Handle app:// protocol to serve packaged local files from dist
    protocol.handle('app', async (request) => {
      try {
        const url = new URL(request.url);
        let pathname = decodeURIComponent(url.pathname);
        if (pathname.startsWith('/')) pathname = pathname.slice(1);
        if (!pathname || pathname === '.' || pathname === './') pathname = 'index.html';

        // Native proxy for Supabase Management API inside packaged desktop application
        if (pathname.startsWith('api/supabase-mgmt-proxy')) {
          if (request.method === 'OPTIONS') {
            return new Response(null, {
              status: 204,
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': '*',
              },
            });
          }

          const targetPath = pathname.replace(/^api\/supabase-mgmt-proxy/, '') || '/';
          const targetUrl = `https://api.supabase.com${targetPath}${url.search}`;

          try {
            const forwardHeaders = {
              'Accept': 'application/json',
              'User-Agent': 'SbKasaathi-Library-App/1.0',
            };
            if (request.headers) {
              request.headers.forEach((val, key) => {
                const lk = key.toLowerCase();
                if (lk !== 'host' && lk !== 'origin' && lk !== 'accept-encoding') {
                  forwardHeaders[key] = val;
                }
              });
            }

            const bodyData = ['GET', 'HEAD'].includes(request.method) ? undefined : await request.text();

            const proxyRes = await fetch(targetUrl, {
              method: request.method,
              headers: forwardHeaders,
              body: bodyData || undefined,
            });

            const textData = await proxyRes.text();
            return new Response(textData, {
              status: proxyRes.status,
              statusText: proxyRes.statusText,
              headers: {
                'Content-Type': proxyRes.headers.get('content-type') || 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': '*',
              },
            });
          } catch (proxyErr) {
            console.error('[Electron Proxy Error]', targetUrl, proxyErr);
            return new Response(
              JSON.stringify({ error: proxyErr.message || 'Failed to proxy request to Supabase Management API' }),
              {
                status: 502,
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*',
                },
              }
            );
          }
        }

        let filePath = path.join(__dirname, 'dist', pathname);

        if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
          const candidateInAssets = path.join(__dirname, 'dist', 'assets', pathname);
          if (fs.existsSync(candidateInAssets)) {
            filePath = candidateInAssets;
          } else {
            filePath = path.join(__dirname, 'dist', 'index.html');
          }
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        const fileData = await fs.promises.readFile(filePath);

        return new Response(fileData, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache',
          }
        });
      } catch (err) {
        console.error('[Electron Protocol app:// error]', err);
        return new Response('Asset not found', { status: 404 });
      }
    });

    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}

