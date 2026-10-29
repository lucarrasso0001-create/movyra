import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// Proxy para HLS (m3u8 + segmentos). Adiciona CORS, repassa referer/user-agent
// opcionais e reescreve URLs do manifesto para passarem por aqui também.

const PROXY_BASE = '/functions/v1/hls-proxy';
const DEFAULT_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

function getProxyBase(req: Request): string {
  const url = new URL(req.url);
  const host = req.headers.get('x-forwarded-host') || url.host;
  return `https://${host}${PROXY_BASE}`;
}

function isPrivateHost(h: string): boolean {
  return /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|\[?::1\]?$)/i.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h);
}

function rewriteManifest(manifest: string, baseUrl: URL, proxyBase: string, extra: string): string {
  const wrap = (u: string) => `${proxyBase}?url=${encodeURIComponent(new URL(u, baseUrl).toString())}${extra}`;
  return manifest.split('\n').map((line) => {
    const t = line.trim();
    if (!t || t.startsWith('#')) return line.replace(/URI="([^"]+)"/g, (_m, u) => `URI="${wrap(u)}"`);
    try { return wrap(t); } catch { return line; }
  }).join('\n');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const q = new URL(req.url).searchParams;
    const target = q.get('url');
    const ref = q.get('ref');
    const ua = q.get('ua');
    if (!target) {
      return new Response(JSON.stringify({ error: 'missing url' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const targetUrl = new URL(target);
    if (!['http:', 'https:'].includes(targetUrl.protocol) || isPrivateHost(targetUrl.hostname)) {
      return new Response('forbidden', { status: 403, headers: corsHeaders });
    }

    const upstream = await fetch(target, {
      headers: {
        'User-Agent': ua || DEFAULT_UA,
        'Accept': '*/*',
        'Referer': ref || `${targetUrl.protocol}//${targetUrl.host}/`,
        ...(ref ? { Origin: new URL(ref).origin } : {}),
      },
    });

    const ct = upstream.headers.get('content-type') || '';
    const isManifest = ct.includes('mpegurl') || target.toLowerCase().includes('.m3u8');

    if (isManifest) {
      const text = await upstream.text();
      const finalUrl = new URL(upstream.url || target);
      const extra = (ref ? `&ref=${encodeURIComponent(ref)}` : '') + (ua ? `&ua=${encodeURIComponent(ua)}` : '');
      return new Response(rewriteManifest(text, finalUrl, getProxyBase(req), extra), {
        status: upstream.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/vnd.apple.mpegurl', 'Cache-Control': 'no-cache' },
      });
    }

    const headers = new Headers(corsHeaders);
    ['content-type', 'content-length', 'accept-ranges', 'content-range', 'cache-control'].forEach((h) => {
      const v = upstream.headers.get(h);
      if (v) headers.set(h, v);
    });
    return new Response(upstream.body, { status: upstream.status, headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
