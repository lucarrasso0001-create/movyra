import { useTrendingMovies } from "@/hooks/useTMDB";
import Navbar from "@/components/Navbar";
import MovieCard from "@/components/MovieCard";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Flame, TrendingUp } from "lucide-react";

const Trending = () => {
  const { data: trending, isLoading, isError } = useTrendingMovies();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-12 px-4 md:px-8 lg:px-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <div className="p-2 bg-orange-500/10 rounded-lg">
            <Flame className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase">Bombando</h1>
            <p className="text-white/40 text-sm font-bold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              O que todo mundo está assistindo esta semana
            </p>
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
            <p className="text-white/60 mb-4 font-medium">Ocorreu um erro ao carregar as tendências.</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-primary text-white font-bold rounded-full hover:bg-primary/80 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {trending?.map((movie, index) => (
              <motion.div
                key={movie.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="relative group"
              >
                {/* Rank Badge */}
                <div className="absolute -top-2 -left-2 z-10 w-8 h-8 bg-primary text-white flex items-center justify-center rounded-lg font-black text-sm shadow-xl border border-white/10 group-hover:scale-110 transition-transform">
                  {index + 1}
                </div>
                <MovieCard movie={movie} />
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Trending;
