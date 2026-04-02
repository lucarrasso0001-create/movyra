import { useFavorites } from "@/hooks/useFavorites";
import Navbar from "@/components/Navbar";
import MovieCard from "@/components/MovieCard";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, Heart, Play } from "lucide-react";
import { Link } from "react-router-dom";

const MyList = () => {
  const { favorites, isPending } = useFavorites();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20 pb-24 md:pb-12 px-4 md:px-8 lg:px-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <div className="p-2 bg-pink-500/10 rounded-lg">
            <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase">Minha Lista</h1>
            <p className="text-white/40 text-sm font-bold">
              {favorites?.length || 0} títulos salvos para assistir depois
            </p>
          </div>
        </div>

        {/* Grid */}
        {isPending ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-xl overflow-hidden">
                <Skeleton className="w-full h-full bg-white/5" />
              </div>
            ))}
          </div>
        ) : favorites?.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32 text-center"
          >
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
              <Bookmark className="w-8 h-8 text-white/20" />
            </div>
            <h2 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Sua lista está vazia</h2>
            <p className="text-white/40 max-w-xs mb-8 font-medium">
              Adicione filmes e séries à sua lista para encontrá-los facilmente aqui.
            </p>
            <Link 
              to="/"
              className="flex items-center gap-2 px-8 py-3 bg-white text-black font-black rounded-full hover:bg-white/90 transition-all uppercase tracking-tighter"
            >
              <Play className="w-4 h-4 fill-black" />
              Explorar Catálogo
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            <AnimatePresence mode="popLayout">
              {favorites?.map((movie, index) => (
                <motion.div
                  key={movie.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <MovieCard movie={{
                    id: movie.movie_id,
                    title: movie.movie_title,
                    poster: movie.movie_poster || "/placeholder.svg",
                    rating: 0,
                    year: "",
                    genre: "",
                    synopsis: "",
                    language: ""
                  }} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
};

export default MyList;
