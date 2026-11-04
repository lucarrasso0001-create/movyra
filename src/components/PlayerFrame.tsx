import { useEffect, useRef, useState, useCallback } from "react";
import { X, Loader2, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Hls from "hls.js";
import { supabase } from "@/integrations/supabase/client";

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
  initialTime?: number;
  mediaType?: "movie" | "tv";
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
  onNextEpisode?: () => void;
  nextEpisodeInfo?: NextEpisodeInfo | null;
  videoHash?: string;
  audioType?: string;
}

// CSS injetado no iframe para bloquear anúncios
const AD_BLOCK_CSS = `
  /* Ocultar overlays de anúncios comuns */
  .ads, .ad, .ad-overlay, .ad-container, .ad-wrapper,
  [class*="banner"], [class*="popup"], [class*="overlay-ad"],
  [id*="ads"], [id*="banner"], [id*="popup"],
  .vast-blocker, .vjs-ad-playing,
  iframe[src*="ad"], iframe[src*="pop"],
  div[onclick], a[target="_blank"][rel*="nofollow"],
  .fc-ab-root, .afs_ads, #player-advertising,
  [class*="preroll"], [class*="midroll"],
  .video-ad, .videoAdUi, #ad_position_box,
  div[style*="z-index: 2147483647"],
  div[style*="z-index:2147483647"],
  .popunder, .clickunder { 
    display: none !important; 
    visibility: hidden !important;
    opacity: 0 !important;
    pointer-events: none !important;
    width: 0 !important;
    height: 0 !important;
    position: absolute !important;
    top: -9999px !important;
  }
`;

// Script injetado para bloquear popups e redirecionamentos
const AD_BLOCK_SCRIPT = `
  (function() {
    // Bloquear window.open (popups)
    window.open = function() { return null; };
    
    // Bloquear criação dinâmica de iframes de anúncios
    const origCreate = document.createElement.bind(document);
    document.createElement = function(tag) {
      const el = origCreate(tag);
      if (tag.toLowerCase() === 'iframe') {
        const origSetAttr = el.setAttribute.bind(el);
        el.setAttribute = function(name, value) {
          if (name === 'src' && (
            value.includes('ad') || value.includes('pop') || 
            value.includes('banner') || value.includes('track')
          )) {
            return;
          }
          return origSetAttr(name, value);
        };
      }
      return el;
    };

    // Bloquear event listeners suspeitos no body
    const origAdd = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, fn, opts) {
      if (type === 'click' && (this === document || this === document.body || this === window)) {
        // Bloquear click handlers globais (usados para popunder)
        return;
      }
      return origAdd.call(this, type, fn, opts);
    };

    // Injetar CSS anti-ad
    const style = document.createElement('style');
    style.textContent = ${JSON.stringify(AD_BLOCK_CSS)};
    document.head.appendChild(style);

    // Observar DOM para remover novos elementos de anúncios
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(m) {
        m.addedNodes.forEach(function(node) {
          if (node.nodeType === 1) {
            const el = node;
            const cls = (el.className || '').toString().toLowerCase();
            const id = (el.id || '').toLowerCase();
            if (
              cls.match(/ad[s_-]|popup|banner|overlay|preroll/) ||
              id.match(/ad[s_-]|popup|banner|overlay/) ||
              (el.tagName === 'IFRAME' && el.src && (el.src.includes('ad') || el.src.includes('pop'))) ||
              (el.style && el.style.zIndex > 999999)
            ) {
              el.remove();
            }
          }
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  })();
`;

const PlayerFrame = ({
  movieId = "",
  movieTitle = "Vídeo",
  moviePoster,
  onClose,
  initialTime = 0,
  mediaType = "movie",
  seasonNumber,
  episodeNumber,
  episodeTitle,
  onNextEpisode,
  nextEpisodeInfo,
  videoHash,
  audioType = "dub",
}: PlayerFrameProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  // "searching" -> procurando link direto; "direct" -> tocando link direto; "iframe" -> WarezCDN
  const [mode, setMode] = useState<"searching" | "direct" | "iframe">("searching");
  const [direct, setDirect] = useState<{ url: string; kind: string } | null>(null);
  const tmdbNum = Number(movieId);
  const reqBody = { tmdb_id: tmdbNum, media_type: mediaType, season: seasonNumber ?? 0, episode: episodeNumber ?? 0 };

  // 1) Procurar link direto (banco primeiro, depois busca nova). Sem link -> WarezCDN.
  useEffect(() => {
    let cancelled = false;
    setMode("searching");
    setDirect(null);
    if (!tmdbNum || (mediaType === "tv" && !(seasonNumber && episodeNumber))) { setMode("iframe"); return; }
    supabase.functions.invoke("resolve-media", { body: reqBody }).then(({ data, error }) => {
      if (cancelled) return;
      if (!error && data?.url) { setDirect({ url: data.url, kind: data.kind }); setMode("direct"); }
      else setMode("iframe");
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movieId, mediaType, seasonNumber, episodeNumber]);

  const directFailed = useCallback(() => {
    supabase.functions.invoke("resolve-media", { body: { ...reqBody, report_broken: true } });
    setMode("iframe");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movieId, mediaType, seasonNumber, episodeNumber]);

  // 2) Tocar link direto (mp4 nativo ou HLS)
  useEffect(() => {
    if (mode !== "direct" || !direct || !videoRef.current) return;
    const video = videoRef.current;
    let hls: Hls | null = null;
    const onErr = () => directFailed();
    if (direct.kind === "hls" && Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hls-proxy?url=${encodeURIComponent(direct.url)}`);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_e, d) => { if (d.fatal) onErr(); });
    } else {
      video.src = direct.url;
      video.addEventListener("error", onErr);
    }
    if (initialTime) video.currentTime = initialTime;
    video.play().catch(() => {});
    return () => { hls?.destroy(); video.removeEventListener("error", onErr); video.removeAttribute("src"); };
  }, [mode, direct, directFailed, initialTime]);

  const displayTitle =
    mediaType === "tv" && seasonNumber && episodeNumber
      ? `${movieTitle} — T${seasonNumber}:E${episodeNumber}${episodeTitle ? ` "${episodeTitle}"` : ""}`
      : movieTitle;

  // Construir URL do WarezCDN
  // Filmes: /filme/{tmdb_id ou tt_imdb}
  // Séries/Animes/Doramas: /serie/{tmdb_id}/{temporada}/{episodio}
  const videoUrl =
    mediaType === "tv" && seasonNumber && episodeNumber
      ? `https://warezcdn.lat/serie/${movieId}/${seasonNumber}/${episodeNumber}`
      : `https://warezcdn.lat/filme/${movieId}`;

  const handleClose = () => {
    if (onClose) onClose();
  };

  // Tentar injetar o bloqueador de anúncios no iframe
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const tryInjectAdBlock = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
          // Injetar CSS
          const style = doc.createElement('style');
          style.textContent = AD_BLOCK_CSS;
          doc.head?.appendChild(style);

          // Injetar script
          const script = doc.createElement('script');
          script.textContent = AD_BLOCK_SCRIPT;
          doc.head?.appendChild(script);
        }
      } catch (e) {
        // Cross-origin - não consegue injetar diretamente
        // O sandbox já fornece proteção contra popups
        console.log("[AdBlock] Cross-origin iframe, usando sandbox como proteção");
      }
    };

    iframe.addEventListener('load', () => {
      setIsLoading(false);
      tryInjectAdBlock();
    });

    return () => {
      iframe.removeEventListener('load', () => {});
    };
  }, [videoUrl]);

  // Keyboard shortcut para fechar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auto-play next episode overlay
  const [showNextOverlay, setShowNextOverlay] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handlePlayNow = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setShowNextOverlay(false);
    onNextEpisode?.();
  };

  const handleCancelAutoplay = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setShowNextOverlay(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 z-30 bg-black/60 p-2 rounded-full hover:bg-black/80 transition-colors group"
      >
        <X className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
      </button>

      {/* Title bar */}
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

      {/* Iframe Player - Fembed Only */}
      {mode === "searching" && (
        <div className="absolute inset-0 z-40 bg-black flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-white/70 font-bold animate-pulse">Procurando melhor fonte...</p>
        </div>
      )}
      {mode === "direct" && (
        <video ref={videoRef} controls autoPlay playsInline className="absolute inset-0 w-full h-full bg-black" />
      )}
      {mode === "iframe" && (
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <iframe
          ref={iframeRef}
          src={videoUrl}
          className="w-full h-full border-0"
          allowFullScreen
          allow="autoplay; encrypted-media; fullscreen"
          referrerPolicy="no-referrer"
        />

        {/* Camada anti-clique para bloquear popups */}
        <div 
          className="absolute inset-0 z-10 pointer-events-none"
          style={{ background: 'transparent' }}
        />
      </div>
      )}

      {/* Loading overlay */}
      <AnimatePresence>
        {isLoading && mode === "iframe" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black flex items-center justify-center z-50"
          >
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-white/70 font-bold animate-pulse">Sincronizando com o servidor...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auto-play Next Episode Overlay */}
      <AnimatePresence>
        {showNextOverlay && nextEpisodeInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/85 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 20 }}
              className="flex flex-col items-center gap-6 max-w-lg w-full px-6"
            >
              <div className="w-full rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl">
                <div className="relative aspect-video bg-muted overflow-hidden">
                  {nextEpisodeInfo.still_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w780${nextEpisodeInfo.still_path}`}
                      alt={nextEpisodeInfo.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <Play className="w-16 h-16 text-white/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-20 h-20">
                      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
                        <circle cx="40" cy="40" r="36" fill="none" stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 36}`}
                          strokeDashoffset={`${2 * Math.PI * 36 * (1 - countdown / 10)}`}
                          className="transition-all duration-1000 ease-linear"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white text-2xl font-black">{countdown}</span>
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-black/40" />
                </div>
                <div className="p-5">
                  <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">Próximo Episódio</p>
                  <h3 className="text-white font-black text-lg uppercase tracking-tight mb-1">
                    E{nextEpisodeInfo.episodeNumber} — {nextEpisodeInfo.title}
                  </h3>
                  <p className="text-white/40 text-sm">Temporada {nextEpisodeInfo.seasonNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 w-full">
                <button onClick={handlePlayNow}
                  className="flex-1 flex items-center justify-center gap-2 bg-white text-black font-black uppercase tracking-tighter px-6 py-4 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-xl">
                  <Play className="w-5 h-5 fill-current" /> Assistir Agora
                </button>
                <button onClick={handleCancelAutoplay}
                  className="px-6 py-4 rounded-xl bg-white/10 text-white font-bold uppercase tracking-tighter hover:bg-white/20 transition-all border border-white/10">
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PlayerFrame;
