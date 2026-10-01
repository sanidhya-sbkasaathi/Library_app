/**
 * Vercel Serverless Function Proxy for Supabase Management API
 * Eliminates browser CORS restrictions when running hosted on Vercel/Cloud.
 */

export default async function handler(req, res) {
  // 1. Enable Full CORS for browser requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey, x-session-id, Prefer');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Determine the target subpath cleanly without Vercel rewrite parameter pollution
    let rawUrl = req.url || '';
    rawUrl = rawUrl.replace(/^\/api\/supabase-mgmt-proxy/, '');
    if (!rawUrl.startsWith('/')) {
      rawUrl = '/' + rawUrl;
    }

    // Parse URL and remove 'match' parameter injected by Vercel rewrite
    const parsed = new URL(`http://localhost${rawUrl}`);
    parsed.searchParams.delete('match');
    const queryStr = parsed.searchParams.toString();
    const cleanPath = parsed.pathname + (queryStr ? `?${queryStr}` : '');

    const targetUrl = `https://api.supabase.com${cleanPath}`;

    const headers = {
      Accept: 'application/json',
      'User-Agent': 'SbKasaathi-Library-App/1.0',
    };

    if (req.headers['authorization']) {
      headers['Authorization'] = req.headers['authorization'];
    }
    if (req.headers['apikey']) {
      headers['apikey'] = req.headers['apikey'];
    }
    if (req.headers['content-type']) {
      headers['Content-Type'] = req.headers['content-type'];
    }

    let body = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    });

    const responseText = await response.text();
    const contentType = response.headers.get('content-type') || 'application/json';

    res.status(response.status);
    res.setHeader('Content-Type', contentType);
    return res.send(responseText);
  } catch (error) {
    console.error('[Supabase Management Proxy Error]:', error);
    return res.status(502).json({
      error: `Supabase Management Proxy Error: ${error.message || 'Failed to reach api.supabase.com'}`,
    });
  }
}
