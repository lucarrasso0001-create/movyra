-- 1. Remove sensitive tables from Realtime publications
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.conteudos;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.fila_sincronizacao;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.episodios;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

-- 2. Secure view_status_conteudo - revoke public access, grant only to authenticated
REVOKE ALL ON public.view_status_conteudo FROM anon;
REVOKE ALL ON public.view_status_conteudo FROM public;
GRANT SELECT ON public.view_status_conteudo TO authenticated;

-- Recreate as security_barrier view
CREATE OR REPLACE VIEW public.view_status_conteudo
  WITH (security_barrier = true) AS
  SELECT id, titulo, bunny_id, capa_url, created_at, idioma, imdb_id,
         info_hash, path_pasta, qualidade, status_processamento, tipo, updated_at
  FROM conteudos
  WHERE has_role(auth.uid(), 'admin'::app_role);

-- 3. Restrict series table to authenticated users only
DROP POLICY IF EXISTS "Anyone can read series" ON public.series;
CREATE POLICY "Authenticated users can read series"
  ON public.series
  FOR SELECT TO authenticated
  USING (true);

-- 4. Restrict conteudos table to authenticated users only
DROP POLICY IF EXISTS "Anyone can read conteudos" ON public.conteudos;
CREATE POLICY "Authenticated users can read conteudos"
  ON public.conteudos
  FOR SELECT TO authenticated
  USING (true);

-- 5. Add missing UPDATE policy for user_addons
CREATE POLICY "Users can update their own addons"
  ON public.user_addons
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);