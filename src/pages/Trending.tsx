import { usePopularMovies, usePopularTV } from "@/hooks/useTMDB";
import Navbar from "@/components/Navbar";
import MovieCard from "@/components/MovieCard";
import { TrendingUp, Flame, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

const Trending = () => {
  // Usar hooks que já estão validados e funcionando em outras partes do site
  const { data: popularMovies, isLoading: loadingMovies } = usePopularMovies();
  const { data: popularTV, isLoading: loadingTV } = usePopularTV();

  // Combinar e embaralhar para simular tendências gerais
  const trendingAll = [...(popularMovies || []), ...(popularTV || [])]
    .sort(() => Math.random() - 0.5)
    .slice(0, 20);

  const isLoading = loadingMovies || loadingTV;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-12 px-6 md:px-12">
        {/* Header da Página */}
        <div className="mb-12">
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

        {/* Top 10 da Semana (Destaque) */}
        <section className="mb-16">
          <div className="flex items-center gap-2 mb-8">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Top 10 da Semana</h2>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="min-w-[200px] aspect-[2/3]">
                  <Skeleton className="w-full h-full rounded-2xl bg-white/5" />
                </div>
              ))
            ) : (
              trendingAll.slice(0, 10).map((item, index) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative min-w-[200px] group"
                >
                  {/* Número do Ranking */}
                  <div className="absolute -left-4 -bottom-4 z-10 select-none pointer-events-none">
                    <span className="text-[120px] font-black leading-none text-white/10 group-hover:text-primary/20 transition-colors italic tracking-tighter">
                      {index + 1}
                    </span>
                  </div>
                  <div className="relative z-20">
                    <MovieCard movie={item} />
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </section>

        {/* Tendências de Hoje (Grid) */}
        <section>
          <div className="flex items-center gap-2 mb-8">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Bombando Hoje</h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-[2/3]">
                  <Skeleton className="w-full h-full rounded-2xl bg-white/5" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {trendingAll.slice(10).map((item, index) => (
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
          )}
        </section>
      </main>
    </div>
  );
};

export default Trending;
