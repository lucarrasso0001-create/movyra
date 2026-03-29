import { X, Play, Plus, Check, Star, Clock, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useModal } from "@/contexts/ModalContext";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const MovieModal = () => {
  const { selectedMovie, closeModal } = useModal();
  const { isFavorite, toggleFavorite, isPending } = useFavorites();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!selectedMovie) return null;

  const isInList = isFavorite(selectedMovie.id);

  const handleListToggle = async () => {
    if (!user) {
      toast({
        title: "Faça login",
        description: "Entre na sua conta para salvar filmes na sua lista",
        variant: "destructive",
      });
      closeModal();
      navigate("/auth");
      return;
    }

    try {
      await toggleFavorite(selectedMovie);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePlay = () => {
    closeModal();
    navigate(`/movie/${selectedMovie.id}`);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/90 backdrop-blur-sm"
        onClick={closeModal}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-4xl bg-zinc-950 rounded-2xl overflow-hidden shadow-2xl border border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white transition-colors"
          >
            <X size={20} />
          </button>

          <div className="flex flex-col md:flex-row">
            {/* Backdrop / Poster Area */}
            <div className="relative w-full md:w-1/2 aspect-video md:aspect-auto">
              <img
                src={selectedMovie.backdrop || selectedMovie.poster}
                alt={selectedMovie.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent md:bg-gradient-to-r" />
            </div>

            {/* Info Area */}
            <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className="px-2 py-0.5 bg-green-500/20 text-green-500 text-[10px] font-black rounded uppercase tracking-wider">
                  {Math.round(selectedMovie.rating * 10)}% Relevante
                </span>
                <span className="flex items-center gap-1 text-white/60 text-xs font-bold">
                  <Calendar size={12} /> {selectedMovie.year}
                </span>
                {(selectedMovie as any).duration && (
                  <span className="flex items-center gap-1 text-white/60 text-xs font-bold">
                    <Clock size={12} /> {(selectedMovie as any).duration}
                  </span>
                )}
              </div>

              <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-4 leading-none">
                {selectedMovie.title}
              </h2>

              <p className="text-white/70 text-sm md:text-base leading-relaxed mb-8 line-clamp-4 md:line-clamp-6 font-medium">
                {selectedMovie.synopsis || "Nenhuma sinopse disponível para este título."}
              </p>

              <div className="flex items-center gap-4">
                <button
                  onClick={handlePlay}
                  className="flex-1 flex items-center justify-center gap-2 bg-white text-black py-3 rounded-lg font-black uppercase tracking-tighter hover:bg-white/90 transition-transform active:scale-95"
                >
                  <Play size={18} className="fill-current" /> Assistir
                </button>
                <button
                  onClick={handleListToggle}
                  disabled={isPending}
                  className="p-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg border border-white/10 transition-transform active:scale-95"
                  title={isInList ? "Remover da lista" : "Adicionar à lista"}
                >
                  {isInList ? <Check size={20} className="text-green-500" /> : <Plus size={20} />}
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <Star size={14} className="text-yellow-500 fill-current" />
                  <span className="text-white font-black text-sm">{selectedMovie.rating.toFixed(1)}</span>
                  <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest ml-2">TMDB Rating</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MovieModal;
