import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';

// Procura um link direto (mp4/m3u8) para filme/episódio e guarda no banco.
// Próximas pessoas reaproveitam o resultado sem nova busca.

const SAIMO = 'https://saimo-tv.pages.dev/api/stream';
const LINK_TTL_MS = 2 * 60 * 60 * 1000; // links assinados expiram; renovamos após 2h
const NONE_TTL_MS = 24 * 60 * 60 * 1000; // "não encontrado" fica guardado 24h

const Body = z.object({
  tmdb_id: z.coerce.number().int().positive(),
  media_type: z.enum(['movie', 'tv']),
  season: z.coerce.number().int().min(0).optional().default(0),
  episode: z.coerce.number().int().min(0).optional().default(0),
  report_broken: z.boolean().optional(),
});

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

function sourceUrl(tmdb: number, type: string, s: number, e: number, versao: string) {
  const p = new URLSearchParams({ tipo: type, id: String(tmdb), versao, json: '1' });
  if (type === 'tv') { p.set('temporada', String(s)); p.set('episodio', String(e)); }
  return `${SAIMO}?${p}`;
}

async function fetchSaimo(src: string): Promise<string | null> {
  try {
    const r = await fetch(src, { signal: AbortSignal.timeout(10000) });
    if (!r.ok) return null;
    const j = await r.json();
    return typeof j.url === 'string' && /^https?:\/\//.test(j.url) ? j.url : null;
  } catch { return null; }
}

async function probe(url: string): Promise<boolean> {
  try {
    const r = await fetch(url, { headers: { Range: 'bytes=0-1023' }, signal: AbortSignal.timeout(8000) });
    const ok = r.ok || r.status === 206;
    await r.body?.cancel();
    return ok;
  } catch { return false; }
}

const kindOf = (u: string) => (/\.m3u8|mpegurl|\/hls\//i.test(u) ? 'hls' : 'mp4');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const auth = req.headers.get('Authorization') ?? '';
  const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });
  const { data: u } = await userClient.auth.getUser();
  if (!u?.user) return json({ error: 'Unauthorized' }, 401);

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
  const { tmdb_id, media_type, report_broken } = parsed.data;
  const season = media_type === 'tv' ? parsed.data.season : 0;
  const episode = media_type === 'tv' ? parsed.data.episode : 0;
  const key = { tmdb_id, media_type, season, episode };

  const { data: rows } = await admin.from('media_links').select('*').match(key);

  if (report_broken) {
    for (const r of rows ?? []) {
      await admin.from('media_links').update({ status: 'broken', fail_count: r.fail_count + 1, expires_at: new Date().toISOString() }).eq('id', r.id);
    }
    return json({ ok: true });
  }

  const now = Date.now();
  const cached = (rows ?? []).filter((r) => r.status === 'ok' && r.url && r.expires_at && new Date(r.expires_at).getTime() > now)
    .sort((a, b) => (a.versao === 'dub' ? -1 : 1) - (b.versao === 'dub' ? -1 : 1));
  if (cached.length) return json({ url: cached[0].url, kind: cached[0].kind, versao: cached[0].versao, cached: true });
  const none = (rows ?? []).find((r) => r.status === 'none' && r.expires_at && new Date(r.expires_at).getTime() > now);
  if (none) return json({ url: null, cached: true });

  for (const versao of ['dub', 'leg']) {
    const src = sourceUrl(tmdb_id, media_type, season, episode, versao);
    const url = await fetchSaimo(src);
    if (!url || !(await probe(url))) continue;
    const kind = kindOf(url);
    await admin.from('media_links').upsert({
      ...key, versao, source: 'saimo', source_url: src, url, kind, status: 'ok', fail_count: 0,
      expires_at: new Date(now + LINK_TTL_MS).toISOString(), last_checked_at: new Date().toISOString(),
    }, { onConflict: 'tmdb_id,media_type,season,episode,versao' });
    return json({ url, kind, versao, cached: false });
  }

  await admin.from('media_links').upsert({
    ...key, versao: 'dub', source: 'saimo', url: null, status: 'none',
    expires_at: new Date(now + NONE_TTL_MS).toISOString(), last_checked_at: new Date().toISOString(),
  }, { onConflict: 'tmdb_id,media_type,season,episode,versao' });
  return json({ url: null, cached: false });
});
