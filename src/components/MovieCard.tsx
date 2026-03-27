import { Play, Plus, Check, Info, Volume2, VolumeX } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { useMovieDetails } from "@/hooks/useTMDB";
import { toast } from "@/hooks/use-toast";
import type { Movie } from "@/types/tmdb";

interface MovieCardProps {
  movie: Movie;
}

const MovieCard = ({ movie }: MovieCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite, isPending } = useFavorites();
  const [isHovered, setIsHovered] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const { data: movieDetails } = useMovieDetails(isHovered ? movie.id : "");
  
  const hoverTimeoutRef = useRef<NodeJS.Timeout>();
  const videoRef = useRef<HTMLVideoElement>(null);

  const isInList = isFavorite(movie.id);

  const handleMouseEnter = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 600);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHovered(false);
  };

  const handleListToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast({
        title: "Faça login",
        description: "Entre na sua conta para salvar filmes na sua lista",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    try {
      await toggleFavorite(movie);
      toast({
        title: isInList ? "Removido da lista" : "Adicionado à lista",
        description: isInList
          ? `${movie.title} foi removido da sua lista`
          : `${movie.title} foi adicionado à sua lista`,
      });
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar sua lista",
        variant: "destructive",
      });
    }
  };

  return (
    <div 
      className="relative group cursor-pointer w-full z-10 hover:z-50"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link to={`/movie/${movie.id}`} className="block">
        <motion.div 
          layout
          className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-900 shadow-lg transition-all duration-300"
          animate={isHovered ? { 
            scale: 1.5,
            y: -50,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)"
          } : { 
            scale: 1,
            y: 0
          }}
        >
          {/* Movie Poster */}
          <img
            src={movie.poster}
            alt={movie.title}
            className={`w-full h-full object-cover transition-opacity duration-300 ${isHovered && movieDetails?.trailerKey ? 'opacity-0' : 'opacity-100'}`}
            loading="lazy"
          />

          {/* Real Video Preview */}
          <AnimatePresence>
            {isHovered && movieDetails?.trailerKey && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black"
              >
                <iframe
                  className="w-full h-full pointer-events-none scale-150"
                  src={`https://www.youtube.com/embed/${movieDetails.trailerKey}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&loop=1&playlist=${movieDetails.trailerKey}&modestbranding=1&rel=0`}
                  allow="autoplay; encrypted-media"
                />
                
                {/* Mute/Unmute Button */}
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsMuted(!isMuted);
                  }}
                  className="absolute bottom-16 right-2 p-1.5 bg-black/50 rounded-full border border-white/20 text-white hover:bg-black/80 transition"
                >
                  {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-2">
            <Link 
              to={`/movie/${movie.id}`}
              className="bg-white text-black p-2 rounded-full hover:bg-white/80 transition-all hover:scale-110 shadow-xl"
            >
              <Play size={14} className="fill-current" />
            </Link>
            <button
              onClick={handleListToggle}
              disabled={isPending}
              className="bg-gray-800/80 backdrop-blur-md text-white p-2 rounded-full hover:bg-gray-700 transition-all hover:scale-110 border border-white/10"
            >
              {isInList ? <Check size={14} className="text-green-500" /> : <Plus size={14} />}
            </button>
            <button
              onClick={handleOpenDetails}
              className="bg-gray-800/80 backdrop-blur-md text-white p-2 rounded-full hover:bg-gray-700 transition-all hover:scale-110 border border-white/10 ml-auto"
            >
              <Info size={14} />
            </button>
          </div>
        </motion.div>
      </Link>
    </div>
  );
};

export default MovieCard;
