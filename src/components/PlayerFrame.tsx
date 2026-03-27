import React, { useEffect, useRef, useState, useCallback } from "react";
import { X, Play, Pause, RotateCcw, Volume2, VolumeX, Maximize, Settings, Subtitles, Languages, FastForward } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Movie } from "@/types/tmdb";
import Hls from "hls.js";

interface PlayerFrameProps {
  movie: Movie;
  onClose: () => void;
  initialSource?: string;
  nextEpisode?: {
    id: string;
    title: string;
    source?: string;
  };
  onNextEpisode?: (nextMovie: any) => void;
}

const PlayerFrame = ({ movie, onClose, initialSource, nextEpisode, onNextEpisode }: PlayerFrameProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const { user, profile } = useAuth();
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);

  const videoSource = initialSource || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(console.error);
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  }, [isMuted]);

  const handleSeek = (amount: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += amount;
    }
  };

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case "Space":
        case "KeyK":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          handleSeek(-10);
          break;
        case "ArrowRight":
          e.preventDefault();
          handleSeek(10);
          break;
        case "KeyM":
          e.preventDefault();
          toggleMute();
          break;
        case "KeyF":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "Escape":
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            onClose();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, toggleMute, toggleFullscreen, onClose]);

  // Initialize HLS
  useEffect(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    
    if (videoSource.includes(".m3u8")) {
      if (Hls.isSupported()) {
        const hls = new Hls({ capLevelToPlayerSize: true, autoStartLoad: true });
        hls.loadSource(videoSource);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(console.error));
        return () => hls.destroy();
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = videoSource;
      }
    } else {
      video.src = videoSource;
    }
  }, [videoSource]);

  // Progress Sync
  useEffect(() => {
    if (!user || !profile || !videoRef.current) return;
    const interval = setInterval(async () => {
      if (!videoRef.current || videoRef.current.paused) return;
      const curr = Math.floor(videoRef.current.currentTime);
      const dur = Math.floor(videoRef.current.duration);
      if (curr > 0 && dur > 0) {
        await supabase.from("watch_history").upsert({
          user_id: user.id,
          profile_id: profile.id,
          movie_id: movie.id,
          movie_title: movie.title,
          movie_poster: movie.poster,
          progress_seconds: curr,
          duration_seconds: dur,
          last_watched_at: new Date().toISOString(),
        }, { onConflict: "profile_id,movie_id" });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [user, profile, movie]);

  // End of video & Countdown logic
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnded = () => {
      if (nextEpisode) {
        setShowCountdown(true);
        setCountdown(10);
        countdownInterval.current = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              if (countdownInterval.current) clearInterval(countdownInterval.current);
              onNextEpisode?.(nextEpisode);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        onClose();
      }
    };

    video.addEventListener("ended", handleEnded);
    return () => {
      video.removeEventListener("ended", handleEnded);
      if (countdownInterval.current) clearInterval(countdownInterval.current);
    };
  }, [nextEpisode, onNextEpisode, onClose]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const curr = videoRef.current.currentTime;
      const dur = videoRef.current.duration;
      setCurrentTime(curr);
      setDuration(dur);
      setProgress((curr / dur) * 100);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => setShowControls(false), 3000);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h > 0 ? h + ":" : ""}${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black flex items-center justify-center overflow-hidden"
      onMouseMove={handleMouseMove}
      style={{ cursor: showControls ? "default" : "none" }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onClick={togglePlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Countdown Overlay */}
      <AnimatePresence>
        {showCountdown && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-[210] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <div className="bg-zinc-900/90 p-8 rounded-2xl border border-white/10 shadow-2xl max-w-md w-full text-center space-y-6">
              <div className="space-y-2">
                <span className="text-primary font-black uppercase tracking-widest text-xs">Próximo Episódio</span>
                <h3 className="text-white text-2xl font-black uppercase tracking-tighter">{nextEpisode?.title}</h3>
              </div>
              
              <div className="relative w-24 h-24 mx-auto">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="48" cy="48" r="40"
                    stroke="currentColor" strokeWidth="4" fill="transparent"
                    className="text-white/10"
                  />
                  <circle
                    cx="48" cy="48" r="40"
                    stroke="currentColor" strokeWidth="4" fill="transparent"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 * (1 - countdown / 10)}
                    className="text-primary transition-all duration-1000 linear"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white text-3xl font-black">{countdown}</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    if (countdownInterval.current) clearInterval(countdownInterval.current);
                    setShowCountdown(false);
                    onClose();
                  }}
                  className="flex-1 py-3 rounded-xl bg-white/10 text-white font-black uppercase tracking-tighter hover:bg-white/20 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    if (countdownInterval.current) clearInterval(countdownInterval.current);
                    onNextEpisode?.(nextEpisode);
                  }}
                  className="flex-1 py-3 rounded-xl bg-primary text-white font-black uppercase tracking-tighter hover:bg-primary/80 transition-colors flex items-center justify-center gap-2"
                >
                  <FastForward className="w-4 h-4 fill-current" /> Agora
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls Overlay */}
      <AnimatePresence>
        {showControls && !showCountdown && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col justify-between p-6 bg-gradient-to-t from-black/90 via-transparent to-black/60"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors group">
                  <X className="text-white w-8 h-8 group-hover:scale-110 transition-transform" />
                </button>
                <div className="flex flex-col">
                  <span className="text-primary text-[10px] font-black uppercase tracking-widest mb-1">Assistindo agora</span>
                  <h2 className="text-white font-black uppercase tracking-tighter text-xl md:text-3xl leading-none">
                    {movie.title}
                  </h2>
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="space-y-4 max-w-6xl mx-auto w-full pb-4">
              <div 
                className="relative h-1.5 w-full bg-white/10 rounded-full overflow-hidden cursor-pointer group mb-2"
                onClick={(e) => {
                  if (videoRef.current) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pos = (e.clientX - rect.left) / rect.width;
                    videoRef.current.currentTime = pos * videoRef.current.duration;
                  }
                }}
              >
                <div className="absolute h-full bg-primary transition-all duration-100" style={{ width: `${progress}%` }} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <button onClick={togglePlay} className="text-white hover:scale-110 transition-transform">
                    {isPlaying ? <Pause className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current" />}
                  </button>
                  <div className="flex items-center gap-4">
                    <button className="text-white/60 hover:text-white transition-colors" onClick={() => handleSeek(-10)}>
                      <RotateCcw className="w-6 h-6" />
                    </button>
                    <span className="text-white font-bold text-sm tabular-nums">
                      {formatTime(currentTime)} <span className="text-white/30 mx-1">/</span> {formatTime(duration)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 group">
                    <button onClick={toggleMute} className="text-white/60 hover:text-white transition-colors">
                      {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                    </button>
                    <input 
                      type="range" min="0" max="1" step="0.1" 
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setVolume(val);
                        if (videoRef.current) videoRef.current.volume = val;
                        setIsMuted(val === 0);
                      }}
                      className="w-24 h-1 bg-white/10 rounded-full accent-primary appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <button className="text-white/60 hover:text-white transition-colors flex items-center gap-2">
                    <Languages className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Áudio: PT-BR</span>
                  </button>
                  <button className="text-white/60 hover:text-white transition-colors flex items-center gap-2">
                    <Subtitles className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Legendas: Off</span>
                  </button>
                  <button className="text-white/60 hover:text-white transition-colors">
                    <Settings className="w-6 h-6" />
                  </button>
                  <button className="text-white/60 hover:text-white transition-colors" onClick={toggleFullscreen}>
                    <Maximize className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PlayerFrame;
