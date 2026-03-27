import { useState } from "react";
import { Play, Info, Star, Plus, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import type { Movie } from "@/types/tmdb";
import { useFavorites } from "@/hooks/useFavorites";
import { useToast } from "@/hooks/use-toast";
import TrailerModal from "./TrailerModal";
import { Button } from "./ui/button";

interface HeroSectionProps {
  movie: Movie;
}

const HeroSection = ({ movie }: HeroSectionProps) => {
  const [trailerOpen, setTrailerOpen] = useState(false);
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { toast } = useToast();
  const favorited = isFavorite(movie.id);

  const handlePlayClick = (e: React.MouseEvent) => {
    if (movie.trailerKey) {
      e.preventDefault();
      setTrailerOpen(true);
    } else {
      navigate(`/movie/${movie.id}`);
    }
  };

  const handleToggleFavorite = async () => {
    const result = await toggleFavorite(movie);
    if (result) {
      toast({
        title: favorited ? "Removido da lista" : "Adicionado à lista",
        description: `${movie.title} foi ${favorited ? "removido de" : "adicionado à"} sua lista.`,
      });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <>
      <section className="relative w-full h-[80vh] md:h-[90vh] overflow-hidden flex items-end">
        {/* Background Image with enhanced effects */}
        <div className="absolute inset-0">
          <img
            src={movie.backdrop || movie.poster}
            alt=""
            className="w-full h-full object-cover scale-105"
          />

          {/* Multi-layer gradient overlays for cinematic effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
        </div>

        {/* Content */}
        <motion.div
          className="relative z-10 p-6 md:p-12 max-w-3xl mb-12 md:mb-20"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.div className="space-y-6" variants={itemVariants}>
            {/* Title - Premium Typography */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[0.9] text-white drop-shadow-2xl uppercase">
              {movie.title}
            </h1>

            {/* Info Tags */}
            <div className="flex items-center gap-4 text-sm md:text-base font-bold">
              <span className="text-green-500">{movie.rating.toFixed(1)} ★</span>
              <span className="text-white/80">{movie.year}</span>
              <span className="px-2 py-0.5 border border-white/40 rounded text-[10px] text-white/80 uppercase tracking-widest">HD</span>
              {movie.genres.slice(0, 2).map(g => (
                <span key={g} className="text-white/60 hidden md:inline">• {g}</span>
              ))}
            </div>

            {/* Synopsis */}
            <p className="text-gray-200 text-lg md:text-xl max-w-xl leading-relaxed line-clamp-3 drop-shadow-md font-medium">
              {movie.synopsis}
            </p>

            {/* Action Buttons - Merged Style */}
            <div className="flex flex-wrap gap-4 pt-4">
              <Button 
                onClick={handlePlayClick}
                className="bg-white text-black hover:bg-white/90 px-8 py-7 rounded-md font-black text-lg transition-all hover:scale-105 flex items-center gap-2 shadow-xl"
              >
                <Play className="fill-current" size={24} />
                ASSISTIR
              </Button>

              <Button 
                onClick={handleToggleFavorite}
                variant="secondary"
                className="bg-gray-500/30 backdrop-blur-md text-white hover:bg-gray-500/50 px-8 py-7 rounded-md font-black text-lg transition-all hover:scale-105 flex items-center gap-2 border border-white/10 shadow-xl"
              >
                {favorited ? <Check size={24} className="text-green-500" /> : <Plus size={24} />}
                MINHA LISTA
              </Button>
              
              <Button 
                onClick={() => navigate(`/movie/${movie.id}`)}
                variant="outline"
                className="bg-transparent border-white/20 text-white hover:bg-white/10 px-6 py-7 rounded-md font-black text-lg hidden md:flex items-center gap-2"
              >
                <Info size={24} />
                SAIBA MAIS
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <TrailerModal
        isOpen={trailerOpen}
        onClose={() => setTrailerOpen(false)}
        videoKey={movie.trailerKey || null}
        title={movie.title}
      />
    </>
  );
};

export default HeroSection;
