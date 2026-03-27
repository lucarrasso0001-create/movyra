
-- Tabela para armazenar fontes de mídia diretas (MP4, HLS, DASH)
CREATE TABLE IF NOT EXISTS public.media_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  movie_id TEXT NOT NULL, -- ID do TMDB
  media_type TEXT NOT NULL DEFAULT 'movie', -- 'movie' ou 'tv'
  url TEXT NOT NULL, -- URL direta (HLS .m3u8, DASH .mpd ou MP4)
  quality TEXT DEFAULT '1080p',
  language TEXT DEFAULT 'pt-BR',
  is_dubbed BOOLEAN DEFAULT true,
  has_subtitles BOOLEAN DEFAULT true,
  provider TEXT DEFAULT 'proprietario', -- 'CDN', 'S3', 'Mux', etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.media_sources ENABLE ROW LEVEL SECURITY;

-- Permitir que todos os usuários autenticados vejam as fontes
DROP POLICY IF EXISTS "Authenticated users can view media sources" ON public.media_sources;
CREATE POLICY "Authenticated users can view media sources"
  ON public.media_sources FOR SELECT
  TO authenticated
  USING (true);

-- Apenas administradores (ou via service role) podem inserir/atualizar
-- Por enquanto, deixaremos fechado para escrita pública
