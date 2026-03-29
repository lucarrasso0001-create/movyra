import { useState, useEffect } from "react";
import { useInfiniteMovies } from "@/hooks/useTMDB";
import Navbar from "@/components/Navbar";
import MovieCard from "@/components/MovieCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useInView } from "react-intersection-observer";
import { motion } from "framer-motion";
import { Film, Filter } from "lucide-react";

const CATEGORIES = [
  { id: "popular", label: "Populares" },
  { id: "top_rated", label: "Mais Avaliados" },
  { id: "now_playing", label: "Em Exibição" },
  { id: "upcoming", label: "Em Breve" },
];

const Movies = () => {
  const [category, setCategory] = useState<"popular" | "top_rated" | "upcoming" | "now_playing">("popular");
  const { ref, inView } = useInView();
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError
  } = useInfiniteMovies(category);

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  const allMovies = data?.pages.flatMap((page) => page.movies) || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-12 px-4 md:px-8 lg:px-12">
        {/* Header & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Film className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase">Filmes</h1>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-full border border-white/10">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id as any)}
                  className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                    category === cat.id 
                      ? "bg-primary text-white shadow-lg shadow-primary/20" 
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-xl overflow-hidden">
                <Skeleton className="w-full h-full bg-white/5" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-white/60 mb-4 font-medium">Ocorreu um erro ao carregar os filmes.</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-primary text-white font-bold rounded-full hover:bg-primary/80 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {allMovies.map((movie, index) => (
                <motion.div
                  key={`${movie.id}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (index % 12) * 0.05 }}
                >
                  <MovieCard movie={movie} />
                </motion.div>
              ))}
            </div>

            {/* Infinite Scroll Trigger */}
            <div ref={ref} className="flex justify-center mt-12 py-8">
              {isFetchingNextPage && (
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <span className="text-white/60 text-sm font-bold animate-pulse">Carregando mais...</span>
                </div>
              )}
              {!hasNextPage && allMovies.length > 0 && (
                <p className="text-white/30 text-sm font-medium">Você chegou ao fim da lista.</p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Movies;
