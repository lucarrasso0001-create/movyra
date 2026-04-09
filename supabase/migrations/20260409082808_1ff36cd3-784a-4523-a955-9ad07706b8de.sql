CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  IF auth.uid() IS DISTINCT FROM _user_id AND NOT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'::public.app_role
  ) THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

CREATE OR REPLACE VIEW public.view_status_conteudo
WITH (security_barrier = true, security_invoker = true) AS
SELECT
  c.id,
  c.titulo,
  c.bunny_id,
  c.capa_url,
  c.created_at,
  c.idioma,
  c.imdb_id,
  c.info_hash,
  c.path_pasta,
  c.qualidade,
  c.status_processamento,
  c.tipo,
  c.updated_at
FROM public.conteudos AS c
WHERE public.has_role(auth.uid(), 'admin'::public.app_role);

REVOKE ALL ON public.view_status_conteudo FROM PUBLIC;
REVOKE ALL ON public.view_status_conteudo FROM anon;
REVOKE ALL ON public.view_status_conteudo FROM authenticated;
GRANT SELECT ON public.view_status_conteudo TO authenticated;