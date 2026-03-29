import { useState } from "react";
import { Play, Info, Plus, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import type { Movie } from "@/types/tmdb";
import { useFavorites } from "@/hooks/useFavorites";
import TrailerModal from "./TrailerModal";

interface HeroSectionProps {
  movie: Movie;
}

const HeroSection = ({ movie }: HeroSectionProps) => {
  const [trailerOpen, setTrailerOpen] = useState(false);
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useFavorites();
  const favorited = isFavorite(movie.id);
  const linkPath = movie.mediaType === "tv" ? `/movie/${movie.id}?type=tv` : `/movie/${movie.id}`;

  return (
    <>
      <section className="relative w-full h-[80vh] md:h-[90vh] overflow-hidden flex items-end">
        <div className="absolute inset-0">
          <img src={movie.backdrop || movie.poster} alt="" className="w-full h-full object-cover scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
        </div>

        <motion.div
          className="relative z-10 p-6 md:p-12 max-w-3xl mb-12 md:mb-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[0.9] text-white drop-shadow-2xl uppercase">
              {movie.title}
            </h1>

            <div className="flex items-center gap-4 text-sm md:text-base font-bold">
              <span className="text-green-500">{movie.rating.toFixed(1)} ★</span>
              <span className="text-white/80">{movie.year}</span>
              <span className="px-2 py-0.5 border border-white/40 rounded text-[10px] text-white/80 uppercase tracking-widest">HD</span>
            </div>

            <p className="text-white/80 text-lg md:text-xl max-w-xl leading-relaxed line-clamp-3 drop-shadow-md font-medium">
              {movie.synopsis}
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <button 
                onClick={() => navigate(linkPath)}
                className="bg-white text-black hover:bg-white/90 px-8 py-4 rounded-md font-black text-lg transition-all hover:scale-105 flex items-center gap-2 shadow-xl"
              >
                <Play className="fill-current" size={24} />
                ASSISTIR
              </button>

              <button 
                onClick={() => toggleFavorite(movie)}
                className="bg-white/10 backdrop-blur-md text-white hover:bg-white/20 px-8 py-4 rounded-md font-black text-lg transition-all hover:scale-105 flex items-center gap-2 border border-white/10 shadow-xl"
              >
                {favorited ? <Check size={24} className="text-green-500" /> : <Plus size={24} />}
                MINHA LISTA
              </button>
              
              <button 
                onClick={() => navigate(linkPath)}
                className="bg-transparent border border-white/20 text-white hover:bg-white/10 px-6 py-4 rounded-md font-black text-lg hidden md:flex items-center gap-2"
              >
                <Info size={24} />
                SAIBA MAIS
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      <TrailerModal isOpen={trailerOpen} onClose={() => setTrailerOpen(false)} videoKey={null} title={movie.title} />
    </>
  );
};

export default HeroSection;
