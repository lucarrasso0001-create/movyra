import { useEffect, useRef, useState } from "react";
import { X, Play, Pause, Volume2, VolumeX, Maximize, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUpdateProgress } from "@/hooks/useWatchHistory";

interface PlayerFrameProps {
  movieId: string;
  movieTitle: string;
  moviePoster?: string;
  onClose: () => void;
  initialTime?: number;
  mediaType?: "movie" | "tv";
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
  onNextEpisode?: () => void;
  videoHash?: string;
  audioType?: string;
}

const PlayerFrame = ({
  movieId,
  movieTitle,
  moviePoster,
  onClose,
  initialTime = 0,
  mediaType = "movie",
  seasonNumber,
  episodeNumber,
  episodeTitle,
  onNextEpisode,
  videoHash,
  audioType = "dub",
}: PlayerFrameProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const updateProgressMutation = useUpdateProgress();
  const cleanupFns = useRef<Array<() => void>>([]);

  const displayTitle =
    mediaType === "tv" && seasonNumber && episodeNumber
      ? `${movieTitle} — T${seasonNumber}:E${episodeNumber}${episodeTitle ? ` "${episodeTitle}"` : ""}`
      : movieTitle;

  // Construir URL do player nativo usando hash e audio
  const videoUrl = videoHash
    ? `https://bvsevecom/e/${videoHash}-${audioType}`
    : mediaType === "tv" && seasonNumber && episodeNumber
    ? `https://fembed.sx/e/${movieId}/${seasonNumber}-${episodeNumber}`
    : `https://fembed.sx/e/${movieId}`;

  const handleClose = () => {
    cleanupFns.current.forEach((fn) => fn());
    onClose();
  };

  // Atualizar progresso do vídeo
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentTime > 0 && videoRef.current) {
        updateProgressMutation.mutate({
          mediaId: movieId,
          currentTime,
          duration: videoRef.current.duration,
          mediaType,
          seasonNumber,
          episodeNumber,
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
  }, [movieId, currentTime, mediaType, seasonNumber, episodeNumber, updateProgressMutation]);

  // Controlar visibilidade dos controles
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  };

  // Handlers do vídeo
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
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current?.parentElement) {
      videoRef.current.parentElement.requestFullscreen?.();
    }
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00";
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    return hours > 0
      ? `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      : `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

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
      <div className="absolute top-4 left-4 z-30 max-w-[calc(100%-6rem)]">
        <h2 className="text-white font-bold text-base md:text-lg drop-shadow truncate">{displayTitle}</h2>
        {mediaType === "tv" && seasonNumber && episodeNumber && (
          <p className="text-white/50 text-xs">
            Temporada {seasonNumber} • Episódio {episodeNumber}
          </p>
        )}
      </div>

      {/* Player nativo HTML5 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 flex items-center justify-center bg-black"
      >
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          crossOrigin="anonymous"
        />

        {/* Controles do player */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 to-transparent p-4"
            >
              {/* Progress bar */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-white text-xs">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleProgressChange}
                  className="flex-1 h-1 bg-white/30 rounded cursor-pointer accent-red-600"
                />
                <span className="text-white text-xs">{formatTime(duration)}</span>
              </div>

              {/* Control buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Play/Pause */}
                  <button
                    onClick={handlePlayPause}
                    className="p-2 hover:bg-white/20 rounded transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 text-white" />
                    ) : (
                      <Play className="w-5 h-5 text-white" />
                    )}
                  </button>

                  {/* Volume */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setIsMuted(!isMuted);
                        if (videoRef.current) {
                          videoRef.current.volume = isMuted ? volume : 0;
                        }
                      }}
                      className="p-2 hover:bg-white/20 rounded transition-colors"
                    >
                      {isMuted ? (
                        <VolumeX className="w-5 h-5 text-white" />
                      ) : (
                        <Volume2 className="w-5 h-5 text-white" />
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-20 h-1 bg-white/30 rounded cursor-pointer accent-red-600"
                    />
                  </div>

                  {/* Time display */}
                  <span className="text-white text-sm ml-2 hidden sm:inline">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Settings */}
                  <button className="p-2 hover:bg-white/20 rounded transition-colors">
                    <Settings className="w-5 h-5 text-white" />
                  </button>

                  {/* Fullscreen */}
                  <button
                    onClick={handleFullscreen}
                    className="p-2 hover:bg-white/20 rounded transition-colors"
                  >
                    <Maximize className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Loading indicator */}
      <AnimatePresence>
        {isLoading && (
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
    </motion.div>
  );
};

export default PlayerFrame;
