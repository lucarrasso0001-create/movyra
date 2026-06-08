import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const EXCLUDED_CATEGORIES = new Set([
  'adulto', 'adult', '+18', '18+', 'eróticos', 'eroticos', 'xxx', 'miamitv'
]);

const NAME_BLOCKLIST = /(sexy|porn|xxx|playboy|brasileirinhas|venus|hustler|private|sextreme|eroti|adulto|18\+|\+18)/i;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const res = await fetch('https://reidosembeds.com/api/channels', {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) {
      return new Response(JSON.stringify({ error: `Upstream ${res.status}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const json = await res.json();
    const data = Array.isArray(json?.data) ? json.data : [];

    const filtered = data.filter((c: any) => {
      if (!c?.is_active) return false;
      const cat = String(c.category || '').trim().toLowerCase();
      if (EXCLUDED_CATEGORIES.has(cat)) return false;
      if (NAME_BLOCKLIST.test(String(c.name || ''))) return false;
      return true;
    });

    return new Response(JSON.stringify({ data: filtered }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=600',
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
