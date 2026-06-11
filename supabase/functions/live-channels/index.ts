import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const NAME_BLOCK = /(sexy|porn|xxx|playboy|brasileirinhas|venus|hustler|private|sextreme|eroti|adulto|18\+|\+18|hot)/i;
const CAT_BLOCK = new Set(['xxx']);

interface Channel { id: string; name: string; logo: string | null; country: string; categories: string[]; is_nsfw?: boolean }
interface Stream { channel: string | null; url: string; quality?: string | null }

let cache: { ts: number; data: any[] } | null = null;
const TTL = 30 * 60 * 1000;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (cache && Date.now() - cache.ts < TTL) {
      return new Response(JSON.stringify({ data: cache.data, cached: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const [chRes, stRes] = await Promise.all([
      fetch('https://iptv-org.github.io/api/channels.json'),
      fetch('https://iptv-org.github.io/api/streams.json'),
    ]);
    const channels: Channel[] = await chRes.json();
    const streams: Stream[] = await stRes.json();

    const chMap = new Map(channels.map((c) => [c.id, c]));
    const seen = new Set<string>();
    const out: any[] = [];

    for (const s of streams) {
      if (!s.channel || !s.url) continue;
      const c = chMap.get(s.channel);
      if (!c) continue;
      if (c.country !== 'BR') continue;
      if (c.is_nsfw) continue;
      if (NAME_BLOCK.test(c.name)) continue;
      const cats = (c.categories || []).map((x: any) => String(x).toLowerCase());
      if (cats.some((cat) => CAT_BLOCK.has(cat))) continue;
      if (seen.has(c.id)) continue;
      seen.add(c.id);

      const categoryLabel = (c.categories?.[0] || 'geral').toString();
      out.push({
        id: c.id,
        name: c.name,
        logo_url: c.logo,
        stream_url: s.url,
        quality: s.quality || null,
        category: categoryLabel.charAt(0).toUpperCase() + categoryLabel.slice(1),
      });
    }

    out.sort((a, b) => a.name.localeCompare(b.name));
    cache = { ts: Date.now(), data: out };

    return new Response(JSON.stringify({ data: out, cached: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=1800' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
