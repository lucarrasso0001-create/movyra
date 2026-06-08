
-- 1. Revoke sensitive columns on conteudos/episodios
REVOKE SELECT (info_hash) ON public.conteudos FROM anon, authenticated;
REVOKE SELECT (path_pasta) ON public.conteudos FROM anon, authenticated;
REVOKE SELECT (info_hash) ON public.episodios FROM anon, authenticated;
REVOKE SELECT (path_pasta) ON public.episodios FROM anon, authenticated;
REVOKE SELECT (url_video) ON public.episodios FROM anon, authenticated;

-- Re-grant SELECT on all other columns explicitly so client reads keep working
DO $$
DECLARE
  col record;
BEGIN
  FOR col IN
    SELECT attname FROM pg_attribute
    WHERE attrelid = 'public.conteudos'::regclass
      AND attnum > 0 AND NOT attisdropped
      AND attname NOT IN ('info_hash','path_pasta')
  LOOP
    EXECUTE format('GRANT SELECT (%I) ON public.conteudos TO anon, authenticated', col.attname);
  END LOOP;
  FOR col IN
    SELECT attname FROM pg_attribute
    WHERE attrelid = 'public.episodios'::regclass
      AND attnum > 0 AND NOT attisdropped
      AND attname NOT IN ('info_hash','path_pasta','url_video')
  LOOP
    EXECUTE format('GRANT SELECT (%I) ON public.episodios TO anon, authenticated', col.attname);
  END LOOP;
END $$;

-- 2. fila_sincronizacao — revoke all access from anon/authenticated (only service_role)
REVOKE ALL ON public.fila_sincronizacao FROM anon, authenticated, PUBLIC;
GRANT ALL ON public.fila_sincronizacao TO service_role;

-- 3. profiles.pin_hash — revoke SELECT on pin_hash from clients
REVOKE SELECT (pin_hash) ON public.profiles FROM anon, authenticated;
DO $$
DECLARE
  col record;
BEGIN
  FOR col IN
    SELECT attname FROM pg_attribute
    WHERE attrelid = 'public.profiles'::regclass
      AND attnum > 0 AND NOT attisdropped
      AND attname <> 'pin_hash'
  LOOP
    EXECUTE format('GRANT SELECT (%I) ON public.profiles TO authenticated', col.attname);
  END LOOP;
END $$;

-- 4. Restrict SECURITY DEFINER functions that should not be callable by clients
REVOKE EXECUTE ON FUNCTION public.pegar_proximo_item(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_download_stats() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_processar_item() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pegar_proximo_item(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_download_stats() TO service_role;
