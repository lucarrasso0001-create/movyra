CREATE TABLE public.media_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tmdb_id integer NOT NULL,
  media_type text NOT NULL DEFAULT 'movie',
  season integer NOT NULL DEFAULT 0,
  episode integer NOT NULL DEFAULT 0,
  versao text NOT NULL DEFAULT 'dub',
  source text NOT NULL DEFAULT 'saimo',
  source_url text,
  url text,
  kind text,
  status text NOT NULL DEFAULT 'ok',
  fail_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  last_checked_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tmdb_id, media_type, season, episode, versao)
);
GRANT SELECT ON public.media_links TO authenticated;
GRANT ALL ON public.media_links TO service_role;
ALTER TABLE public.media_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read media links" ON public.media_links FOR SELECT TO authenticated USING (true);