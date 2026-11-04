import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// Lista de canais vinda do catálogo público do Saimo TV
const CATALOG_URL = 'https://canais-saimo.pages.dev/catalogo.txt';
const NAME_BLOCK = /(sexy|porn|xxx|playboy|brasileirinhas|venus|hustler|private|sextreme|eroti|adulto|18\+|\+18|hot)/i;

interface Source { url: string; quality: string | null; referer: string | null; ua: string | null }
interface Channel { id: string; name: string; logo_url: string | null; category: string; stream_url: string; quality: string | null; sources: Source[]; alive?: boolean }

let cache: { ts: number; data: Channel[] } | null = null;
const TTL = 30 * 60 * 1000;

const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function parse(text: string): Channel[] {
  const out: Channel[] = [];
  let cur: Channel | null = null;
  let src: Source | null = null;
  const push = () => {
    if (cur && cur.sources.length && !NAME_BLOCK.test(cur.name) && !NAME_BLOCK.test(cur.category)) {
      cur.stream_url = cur.sources[0].url;
      cur.quality = cur.sources[0].quality;
      out.push(cur);
    }
  };
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf(':');
    if (i < 0) continue;
    const key = line.slice(0, i).trim().toLowerCase();
    const val = line.slice(i + 1).trim();
    if (key === 'canal') {
      push();
      cur = { id: slug(val), name: val, logo_url: null, category: 'Outros', stream_url: '', quality: null, sources: [] };
      src = null;
    } else if (!cur) continue;
    else if (key === 'logo') cur.logo_url = val || null;
    else if (key === 'categoria') cur.category = val || 'Outros';
    else if (key === 'fonte') {
      if (/error\.txt|desativado\.invalid/i.test(val) || !/^https?:\/\//i.test(val)) { src = null; continue; }
      src = { url: val, quality: null, referer: null, ua: null };
      cur.sources.push(src);
    } else if (src && key === 'qualidade') src.quality = val;
    else if (src && key === 'referer') src.referer = val;
    else if (src && key === 'agente') src.ua = val;
  }
  push();
  const seen = new Set<string>();
  return out.filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true))).sort((a, b) => a.name.localeCompare(b.name));
}

// Testa uma fonte: precisa responder 200 com um manifesto HLS (#EXT).
async function check(s: Source): Promise<boolean> {
  try {
    const r = await fetch(s.url, {
      headers: { 'User-Agent': s.ua || 'Mozilla/5.0', ...(s.referer ? { Referer: s.referer } : {}) },
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) { await r.body?.cancel(); return false; }
    const reader = r.body!.getReader();
    const { value } = await reader.read();
    reader.cancel();
    return !!value && new TextDecoder().decode(value.slice(0, 2000)).includes('#EXT');
  } catch { return false; }
}

// Testa todas as fontes em paralelo, reordena (as que funcionam primeiro) e marca `alive`.
async function healthCheck(list: Channel[]): Promise<Channel[]> {
  const all = list.flatMap((c) => c.sources);
  const ok = new Map<Source, boolean>();
  let i = 0;
  await Promise.all(Array.from({ length: 50 }, async () => {
    while (i < all.length) { const s = all[i++]; ok.set(s, await check(s)); }
  }));
  return list.map((c) => {
    const sources = [...c.sources].sort((a, b) => Number(ok.get(b)) - Number(ok.get(a)));
    const alive = sources.some((s) => ok.get(s));
    return { ...c, sources, stream_url: sources[0].url, quality: sources[0].quality, alive };
  });
}

let checking: Promise<void> | null = null;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (!cache || Date.now() - cache.ts > TTL) {
      const res = await fetch(CATALOG_URL, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) throw new Error(`catalogo ${res.status}`);
      cache = { ts: Date.now(), data: parse(await res.text()) };
      checking = null;
    }
    if (!checking) {
      const snapshot = cache;
      checking = healthCheck(snapshot.data).then((d) => { if (cache === snapshot) cache = { ts: snapshot.ts, data: d }; });
    }
    // Espera o teste por até 25s; se não terminar, devolve a lista sem teste e ele continua em segundo plano.
    await Promise.race([checking, new Promise((r) => setTimeout(r, 25000))]);
    // @ts-ignore EdgeRuntime existe no runtime
    if (typeof EdgeRuntime !== 'undefined') EdgeRuntime.waitUntil(checking);
    return new Response(JSON.stringify({ data: cache.data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=1800' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
