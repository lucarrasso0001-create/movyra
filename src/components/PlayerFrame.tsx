import { useEffect, useRef, useState, useCallback } from "react";
import { X, Play, Pause, Volume2, VolumeX, Maximize, SkipForward, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUpdateProgress } from "@/hooks/useWatchHistory";
import { fetchDirectVideoLink, fetchBunnyVideoId } from "@/hooks/useTMDB";

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [directUrl, setDirectUrl] = useState<string | null>(null);
  const [bunnyVideo, setBunnyVideo] = useState<{ videoId: string; libraryId: string } | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);

  // Auto-play next episode state
  const [showNextOverlay, setShowNextOverlay] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const updateProgressMutation = useUpdateProgress();
  const cleanupFns = useRef<Array<() => void>>([]);

  const displayTitle =
    mediaType === "tv" && seasonNumber && episodeNumber
      ? `${movieTitle} — T${seasonNumber}:E${episodeNumber}${episodeTitle ? ` "${episodeTitle}"` : ""}`
      : movieTitle;

  const videoUrl = directUrl || (videoHash
    ? `https://bysevepoin.com/e/${videoHash}-${audioType}`
    : mediaType === "tv" && seasonNumber && episodeNumber
    ? `https://fembed.sx/e/${movieId}/${seasonNumber}-${episodeNumber}`
    : `https://fembed.sx/e/${movieId}`);

  const isIframe = ((videoUrl.includes('fembed.sx') || videoUrl.includes('bysevepoin.com')) && !directUrl) || !!bunnyVideo;

  // Efeito para buscar Bunny Stream ou capturar link direto
  useEffect(() => {
    const loadVideoSource = async () => {
      // Se já temos um hash direto, não precisamos buscar
      if (videoHash) return;

      setIsCapturing(true);
      setCaptureError(null);

      try {
        // 1. Tenta buscar no Bunny Stream via Supabase primeiro
        const bunnyData = await fetchBunnyVideoId(movieId, mediaType, seasonNumber, episodeNumber);
        if (bunnyData) {
          console.log("[Player] Bunny Stream ID encontrado:", bunnyData);
          setBunnyVideo(bunnyData);
          setIsCapturing(false);
          return;
        }

        // 2. Se não tiver no Bunny, tenta capturar link direto do Fembed
        const currentUrl = mediaType === "tv" && seasonNumber && episodeNumber
          ? `https://fembed.sx/e/${movieId}/${seasonNumber}-${episodeNumber}`
          : `https://fembed.sx/e/${movieId}`;

        if (currentUrl.includes('fembed')) {
          const captured = await fetchDirectVideoLink(currentUrl);
          if (captured) {
            console.log("[Player] Link direto capturado com sucesso:", captured);
            setDirectUrl(captured);
          } else {
            console.warn("[Player] Falha ao capturar link direto. Usando iframe como fallback.");
            setDirectUrl(null);
          }
        }
      } catch (err) {
        console.error("[Player] Erro ao carregar fonte de vídeo:", err);
      } finally {
        setIsCapturing(false);
      }
    };

    loadVideoSource();
  }, [movieId, mediaType, seasonNumber, episodeNumber, videoHash]);

  // Handle video ended → trigger next episode countdown
  const handleVideoEnded = useCallback(() => {
    if (onNextEpisode && nextEpisodeInfo) {
      setShowNextOverlay(true);
      setCountdown(10);
    }
  }, [onNextEpisode, nextEpisodeInfo]);

  // Countdown timer for auto-play
  useEffect(() => {
    if (!showNextOverlay) {
      if (countdownRef.current) clearInterval(countdownRef.current);
      return;
    }

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          setShowNextOverlay(false);
          onNextEpisode?.();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [showNextOverlay, onNextEpisode]);

  const handlePlayNow = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setShowNextOverlay(false);
    onNextEpisode?.();
  };

  const handleCancelAutoplay = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setShowNextOverlay(false);
  };

  const handleClose = () => {
    cleanupFns.current.forEach((fn) => fn());
    if (onClose) onClose();
  };

  // Save progress on unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentTime > 0 && videoRef.current && movieId) {
        updateProgressMutation.mutate({
          mediaId: movieId,
          currentTime,
          duration: videoRef.current.duration,
          mediaType,
          seasonNumber,
          episodeNumber,
          movieTitle,
          moviePoster,
        });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    cleanupFns.current.push(() => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    });

    return () => {
      cleanupFns.current.forEach((fn) => fn());
    };
  }, [movieId, currentTime, mediaType, seasonNumber, episodeNumber, updateProgressMutation, movieTitle, moviePoster]);

  // Controls visibility
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      if (initialTime > 0) {
        videoRef.current.currentTime = initialTime;
      }
      setIsLoading(false);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) videoRef.current.volume = newVolume;
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) videoRef.current.currentTime = newTime;
  };

  const handleFullscreen = () => {
    if (videoRef.current?.parentElement) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.parentElement.requestFullscreen?.();
      }
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showNextOverlay) return;

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          handlePlayPause();
          break;
        case "f":
          handleFullscreen();
          break;
        case "m":
          setIsMuted((prev) => {
            if (videoRef.current) videoRef.current.muted = !prev;
            return !prev;
          });
          break;
        case "arrowleft":
          if (videoRef.current) videoRef.current.currentTime -= 10;
          break;
        case "arrowright":
          if (videoRef.current) videoRef.current.currentTime += 10;
          break;
        case "escape":
          handleClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, showNextOverlay]);

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00";
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    return hours > 0
      ? `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      : `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const progressPercent = duration > 0 ? (countdown / 10) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 z-30 bg-black/60 p-2 rounded-full hover:bg-black/80 transition-colors group"
      >
        <X className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
      </button>

      {/* Title bar */}
      <AnimatePresence>
        {showControls && !showNextOverlay && !isIframe && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-4 z-30 max-w-[calc(100%-6rem)]"
          >
            <h2 className="text-white font-bold text-base md:text-lg drop-shadow truncate">
              {displayTitle}
            </h2>
            {mediaType === "tv" && seasonNumber && episodeNumber && (
              <p className="text-white/50 text-xs">
                Temporada {seasonNumber} • Episódio {episodeNumber}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video */}
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        {isCapturing ? (
          <div className="flex flex-col items-center gap-4 z-20">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-white/70 font-bold animate-pulse">Capturando link direto...</p>
          </div>
        ) : captureError ? (
          <div className="flex flex-col items-center gap-4 z-20 p-6 text-center">
            <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
            <p className="text-white/80 max-w-md">{captureError}</p>
          </div>
        ) : bunnyVideo ? (
          <div className="w-full h-full relative">
            <iframe
              src={`https://iframe.mediadelivery.net/embed/${bunnyVideo.libraryId}/${bunnyVideo.videoId}?autoplay=true&loop=false&muted=false&preload=true&responsive=true`}
              loading="lazy"
              className="absolute inset-0 w-full h-full border-0"
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
              allowFullScreen
            />
          </div>
        ) : videoUrl.includes('fembed.sx') || videoUrl.includes('bysevepoin.com') ? (
          <iframe
            src={videoUrl}
            className="w-full h-full border-0"
            allowFullScreen
            allow="autoplay; encrypted-media"
          />
        ) : (
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={handleVideoEnded}
            crossOrigin="anonymous"
            autoPlay
          />
        )}

        {/* Click to play/pause */}
        {!showNextOverlay && !isIframe && (
          <div
            className="absolute inset-0 z-10 cursor-pointer"
            onClick={handlePlayPause}
          />
        )}

        {/* Controls */}
        <AnimatePresence>
          {showControls && !showNextOverlay && !isIframe && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 pt-16"
            >
              {/* Progress bar */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-white text-xs font-mono">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleProgressChange}
                  className="flex-1 h-1 bg-white/30 rounded cursor-pointer accent-primary"
                />
                <span className="text-white text-xs font-mono">{formatTime(duration)}</span>
              </div>

              {/* Control buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={handlePlayPause} className="p-2 hover:bg-white/20 rounded transition-colors">
                    {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white" />}
                  </button>

                  {/* Next episode button */}
                  {onNextEpisode && nextEpisodeInfo && (
                    <button
                      onClick={onNextEpisode}
                      className="p-2 hover:bg-white/20 rounded transition-colors"
                      title="Próximo episódio"
                    >
                      <SkipForward className="w-5 h-5 text-white" />
                    </button>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setIsMuted(!isMuted);
                        if (videoRef.current) videoRef.current.volume = isMuted ? volume : 0;
                      }}
                      className="p-2 hover:bg-white/20 rounded transition-colors"
                    >
                      {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-20 h-1 bg-white/30 rounded cursor-pointer accent-primary"
                    />
                  </div>

                  <span className="text-white text-sm ml-2 hidden sm:inline">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={handleFullscreen} className="p-2 hover:bg-white/20 rounded transition-colors">
                    <Maximize className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Loading */}
      <AnimatePresence>
        {isLoading && !isIframe && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
              <p className="text-white text-sm font-medium">Carregando vídeo...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== AUTO-PLAY NEXT EPISODE OVERLAY ===== */}
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
              {/* Next episode preview */}
              <div className="w-full rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl">
                {/* Thumbnail */}
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

                  {/* Circular countdown */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-20 h-20">
                      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                        <circle
                          cx="40"
                          cy="40"
                          r="36"
                          fill="none"
                          stroke="rgba(255,255,255,0.15)"
                          strokeWidth="4"
                        />
                        <circle
                          cx="40"
                          cy="40"
                          r="36"
                          fill="none"
                          stroke="hsl(var(--primary))"
                          strokeWidth="4"
                          strokeLinecap="round"
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

                  {/* Dark overlay */}
                  <div className="absolute inset-0 bg-black/40" />
                </div>

                {/* Info */}
                <div className="p-5">
                  <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">
                    Próximo Episódio
                  </p>
                  <h3 className="text-white font-black text-lg uppercase tracking-tight mb-1">
                    E{nextEpisodeInfo.episodeNumber} — {nextEpisodeInfo.title}
                  </h3>
                  <p className="text-white/40 text-sm">
                    Temporada {nextEpisodeInfo.seasonNumber}
                  </p>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-4 w-full">
                <button
                  onClick={handlePlayNow}
                  className="flex-1 flex items-center justify-center gap-2 bg-white text-black font-black uppercase tracking-tighter px-6 py-4 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-xl"
                >
                  <Play className="w-5 h-5 fill-current" /> Assistir Agora
                </button>
                <button
                  onClick={handleCancelAutoplay}
                  className="px-6 py-4 rounded-xl bg-white/10 text-white font-bold uppercase tracking-tighter hover:bg-white/20 transition-all border border-white/10"
                >
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
