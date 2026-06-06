import { useEffect, useRef, useState } from "react";
import { X, Loader2, Play, AlertTriangle, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import Hls from "hls.js";

interface NextEpisodeInfo {
  title: string;
  episodeNumber: number;
  seasonNumber: number;
  still_path: string | null;
}

interface PlayerFrameProps {
  movieId?: string;
  movieTitle?: string;
  moviePoster?: string;
  onClose?: () => void;
  mediaType?: "movie" | "tv";
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
  onNextEpisode?: () => void;
  nextEpisodeInfo?: NextEpisodeInfo | null;
}

type Status = "resolving" | "playing" | "error";

const PlayerFrame = ({
  movieId = "",
  movieTitle = "Vídeo",
  onClose,
  mediaType = "movie",
  seasonNumber,
  episodeNumber,
  episodeTitle,
  onNextEpisode,
  nextEpisodeInfo,
}: PlayerFrameProps) => {
  const [status, setStatus] = useState<Status>("resolving");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const displayTitle =
    mediaType === "tv" && seasonNumber && episodeNumber
      ? `${movieTitle} — T${seasonNumber}:E${episodeNumber}${episodeTitle ? ` "${episodeTitle}"` : ""}`
      : movieTitle;

  // 1) Resolve direct stream URL via edge function
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatus("resolving");
      setErrorMsg("");
      try {
        const { data, error } = await supabase.functions.invoke("stream-resolver", {
          body: {
            tmdbId: movieId,
            mediaType,
            season: seasonNumber,
            episode: episodeNumber,
          },
        });
        if (cancelled) return;
        if (error || !data?.url) {
          setErrorMsg(data?.error || error?.message || "Nenhuma fonte direta encontrada");
          setStatus("error");
          return;
        }
        setStreamUrl(data.url);
        setStatus("playing");
      } catch (e: any) {
        if (cancelled) return;
        setErrorMsg(e?.message || "Falha ao resolver fonte");
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [movieId, mediaType, seasonNumber, episodeNumber]);

  // 2) Attach stream to <video> (with HLS.js when needed)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    hlsRef.current?.destroy();
    hlsRef.current = null;

    const isHls = /\.m3u8(\?|$)/i.test(streamUrl);

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) {
          setErrorMsg("Erro de streaming HLS");
          setStatus("error");
        }
      });
    } else {
      video.src = streamUrl;
    }

    video.play().catch(() => {});

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [streamUrl]);

  // ESC to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const fallbackUrl =
    mediaType === "tv" && seasonNumber && episodeNumber
      ? `https://warezcdn.lat/serie/${movieId}/${seasonNumber}/${episodeNumber}`
      : `https://warezcdn.lat/filme/${movieId}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Close */}
      <button
        onClick={() => onClose?.()}
        className="absolute top-4 right-4 z-30 bg-black/60 p-2 rounded-full hover:bg-black/80 transition-colors"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Title */}
      <div className="absolute top-4 left-4 z-30 max-w-[calc(100%-6rem)]">
        <h2 className="text-white font-bold text-base md:text-lg drop-shadow truncate">
          {displayTitle}
        </h2>
        {mediaType === "tv" && seasonNumber && episodeNumber && (
          <p className="text-white/50 text-xs">
            Temporada {seasonNumber} • Episódio {episodeNumber}
          </p>
        )}
      </div>

      {/* Video element */}
      {status === "playing" && (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full bg-black"
          controls
          autoPlay
          playsInline
        />
      )}

      {/* Loading */}
      <AnimatePresence>
        {status === "resolving" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black flex items-center justify-center z-50"
          >
            <div className="flex flex-col items-center gap-4 text-center px-6">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-white/90 font-bold">Buscando fonte sem anúncios…</p>
              <p className="text-white/40 text-sm max-w-md">
                Resolvendo via Real-Debrid. Isso pode levar alguns segundos.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error / fallback */}
      <AnimatePresence>
        {status === "error" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black flex items-center justify-center z-50 p-6"
          >
            <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-2xl p-8 text-center backdrop-blur-xl">
              <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-white font-black text-xl mb-2">Fonte direta indisponível</h3>
              <p className="text-white/60 text-sm mb-6">{errorMsg}</p>
              <div className="flex flex-col gap-3">
                <a
                  href={fallbackUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-white text-black font-black uppercase tracking-tighter px-6 py-3 rounded-xl hover:scale-105 transition-transform"
                >
                  <ExternalLink className="w-5 h-5" /> Abrir no WarezCDN
                </a>
                <button
                  onClick={() => onClose?.()}
                  className="px-6 py-3 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-all border border-white/10"
                >
                  Fechar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auto-play next episode (kept) */}
      {nextEpisodeInfo && onNextEpisode && (
        <button
          onClick={onNextEpisode}
          className="absolute bottom-6 right-6 z-30 bg-white text-black px-5 py-3 rounded-xl font-black uppercase tracking-tighter flex items-center gap-2 hover:scale-105 transition-transform shadow-2xl"
        >
          <Play className="w-4 h-4 fill-current" /> Próximo: E{nextEpisodeInfo.episodeNumber}
        </button>
      )}
    </motion.div>
  );
};

export default PlayerFrame;
