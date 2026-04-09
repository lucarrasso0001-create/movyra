-- Revoke SELECT on path_pasta from authenticated users to prevent file path disclosure
REVOKE SELECT (path_pasta) ON public.conteudos FROM authenticated;
REVOKE SELECT (path_pasta) ON public.series FROM authenticated;
REVOKE SELECT (path_pasta) ON public.episodios FROM authenticated;

-- Also revoke from anon and public for defense in depth
REVOKE SELECT (path_pasta) ON public.conteudos FROM anon;
REVOKE SELECT (path_pasta) ON public.series FROM anon;
REVOKE SELECT (path_pasta) ON public.episodios FROM anon;

REVOKE SELECT (path_pasta) ON public.conteudos FROM public;
REVOKE SELECT (path_pasta) ON public.series FROM public;
REVOKE SELECT (path_pasta) ON public.episodios FROM public;