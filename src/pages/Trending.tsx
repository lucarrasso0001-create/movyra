import { usePopularMovies, usePopularTV, useTopRatedMovies, useTopRatedTV } from "@/hooks/useTMDB";
import Navbar from "@/components/Navbar";
import MovieCard from "@/components/MovieCard";
import MovieCarousel from "@/components/MovieCarousel";
import { TrendingUp, Flame, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";

const Trending = () => {
  // Buscar fontes de dados de forma independente para que o React Query gerencie o cache
  const { data: popularMovies, isLoading: loadingMovies } = usePopularMovies();
  const { data: popularTV, isLoading: loadingTV } = usePopularTV();
  const { data: topMovies, isLoading: loadingTopMovies } = useTopRatedMovies();
  const { data: topTV, isLoading: loadingTopTV } = useTopRatedTV();

  // Criar o Top 10 da Semana (Mix de Filmes e Séries Populares)
  // Usamos useMemo para evitar reprocessamento desnecessário
  const top10 = useMemo(() => {
    const combined = [...(popularMovies || []), ...(popularTV || [])];
    return combined
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 10);
  }, [popularMovies, popularTV]);

  const isLoading = loadingMovies || loadingTV;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-12">
        {/* Header da Página */}
        <div className="px-6 md:px-12 mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-4"
          >
            <div className="p-3 bg-orange-500/10 rounded-2xl border border-orange-500/20">
              <Flame className="w-8 h-8 text-orange-500" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic">
                Bombando
              </h1>
              <p className="text-white/40 font-bold tracking-widest uppercase text-xs">
                O que o mundo está assistindo agora
              </p>
            </div>
          </motion.div>
        </div>

        {/* Top 10 da Semana (Destaque com Ranking Visual) */}
        <section className="mb-16">
          <div className="px-6 md:px-12 flex items-center gap-2 mb-8">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h2 className="text-2xl font-black text-white uppercase tracking-tight italic">Top 10 da Semana</h2>
          </div>

          <div className="flex gap-8 overflow-x-auto px-6 md:px-12 pb-12 scrollbar-hide">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="min-w-[240px] aspect-[2/3]">
                  <Skeleton className="w-full h-full rounded-2xl bg-white/5" />
                </div>
              ))
            ) : (
              top10.map((item, index) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative min-w-[240px] group"
                >
                  {/* Número do Ranking Estilizado */}
                  <div className="absolute -left-6 -bottom-6 z-10 select-none pointer-events-none">
                    <span className="text-[160px] font-black leading-none text-white/10 group-hover:text-primary/30 transition-all duration-500 italic tracking-tighter stroke-text">
                      {index + 1}
                    </span>
                  </div>
                  <div className="relative z-20 transform group-hover:scale-105 transition-transform duration-500">
                    <MovieCard movie={item} />
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </section>

        {/* Seções de Carrosséis - Carregamento Progressivo */}
        <div className="space-y-4">
          <MovieCarousel 
            title="Filmes em Alta" 
            movies={popularMovies || []} 
            isLoading={loadingMovies}
            categorySlug="popular-movies"
          />

          <MovieCarousel 
            title="Séries que Todos Amam" 
            movies={popularTV || []} 
            isLoading={loadingTV}
            categorySlug="popular-tv"
          />

          {/* Carrosséis secundários carregam apenas se os dados estiverem prontos */}
          {(topMovies || loadingTopMovies) && (
            <MovieCarousel 
              title="Aclamados pela Crítica" 
              movies={topMovies || []} 
              isLoading={loadingTopMovies}
              categorySlug="top-rated-movies"
            />
          )}

          {(topTV || loadingTopTV) && (
            <MovieCarousel 
              title="Séries Imperdíveis" 
              movies={topTV || []} 
              isLoading={loadingTopTV}
              categorySlug="top-rated-tv"
            />
          )}
        </div>

        {/* Grid Final de Tendências */}
        <section className="mt-16 px-6 md:px-12">
          <div className="flex items-center gap-2 mb-8">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-black text-white uppercase tracking-tight italic">Mais Tendências</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {[...(popularMovies || []), ...(popularTV || [])]
              .slice(10, 22)
              .map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (index % 12) * 0.05 }}
                >
                  <MovieCard movie={item} />
                </motion.div>
              ))}
          </div>
        </section>
      </main>

      <style>{`
        .stroke-text {
          -webkit-text-stroke: 2px rgba(255, 255, 255, 0.1);
          text-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
        }
      `}</style>
    </div>
  );
};

export default Trending;
