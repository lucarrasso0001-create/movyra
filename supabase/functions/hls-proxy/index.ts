import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// Proxy generic para HLS (m3u8 + segmentos). Adiciona CORS e reescreve URLs do manifesto
// para que TODOS os segmentos passem por este proxy também.

const PROXY_BASE = '/functions/v1/hls-proxy';

function getProxyBase(req: Request): string {
  const url = new URL(req.url);
  // Forçar https — o runtime pode receber a request como http internamente
  const host = req.headers.get('x-forwarded-host') || url.host;
  return `https://${host}${PROXY_BASE}`;
}

function rewriteManifest(manifest: string, baseUrl: URL, proxyBase: string): string {
  return manifest
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        // Reescrever URI dentro de tags (#EXT-X-KEY, #EXT-X-MAP, #EXT-X-MEDIA)
        return line.replace(/URI="([^"]+)"/g, (_m, u) => {
          const abs = new URL(u, baseUrl).toString();
          return `URI="${proxyBase}?url=${encodeURIComponent(abs)}"`;
        });
      }
      try {
        const abs = new URL(trimmed, baseUrl).toString();
        return `${proxyBase}?url=${encodeURIComponent(abs)}`;
      } catch {
        return line;
      }
    })
    .join('\n');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const reqUrl = new URL(req.url);
    const target = reqUrl.searchParams.get('url');
    if (!target) {
      return new Response(JSON.stringify({ error: 'missing url' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const targetUrl = new URL(target);
    // SSRF basic guard: somente http/https públicos
    if (!['http:', 'https:'].includes(targetUrl.protocol)) {
      return new Response('forbidden', { status: 403, headers: corsHeaders });
    }

    const upstream = await fetch(target, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Referer': `${targetUrl.protocol}//${targetUrl.host}/`,
      },
    });

    const ct = upstream.headers.get('content-type') || '';
    const isManifest =
      ct.includes('mpegurl') ||
      ct.includes('application/x-mpegurl') ||
      ct.includes('vnd.apple.mpegurl') ||
      target.toLowerCase().includes('.m3u8');

    if (isManifest) {
      const text = await upstream.text();
      const rewritten = rewriteManifest(text, targetUrl, getProxyBase(req));
      return new Response(rewritten, {
        status: upstream.status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Cache-Control': 'no-cache',
        },
      });
    }

    // Segmento binário: stream direto
    const headers = new Headers(corsHeaders);
    const passthrough = ['content-type', 'content-length', 'accept-ranges', 'content-range', 'cache-control'];
    passthrough.forEach((h) => {
      const v = upstream.headers.get(h);
      if (v) headers.set(h, v);
    });
    return new Response(upstream.body, { status: upstream.status, headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
