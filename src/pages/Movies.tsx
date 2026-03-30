import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import MovieCarousel from "@/components/MovieCarousel";
import { fetchMovies } from "@/hooks/useTMDB";
import { Film } from "lucide-react";
import { motion } from "framer-motion";

const Movies = () => {
  // Buscar diferentes categorias de filmes
  const { data: popularMovies, isLoading: loadingPopular } = useQuery({
    queryKey: ["movies-popular"],
    queryFn: () => fetchMovies("popular"),
  });

  const { data: topRatedMovies, isLoading: loadingTopRated } = useQuery({
    queryKey: ["movies-top-rated"],
    queryFn: () => fetchMovies("top_rated"),
  });

  const { data: upcomingMovies, isLoading: loadingUpcoming } = useQuery({
    queryKey: ["movies-upcoming"],
    queryFn: () => fetchMovies("upcoming"),
  });

  const { data: nowPlayingMovies, isLoading: loadingNowPlaying } = useQuery({
    queryKey: ["movies-now-playing"],
    queryFn: () => fetchMovies("now_playing"),
  });

  // Buscar por gêneros específicos (IDs do TMDB)
  const { data: actionMovies, isLoading: loadingAction } = useQuery({
    queryKey: ["movies-action"],
    queryFn: () => fetchMovies("discover", 1, "28"),
  });

  const { data: comedyMovies, isLoading: loadingComedy } = useQuery({
    queryKey: ["movies-comedy"],
    queryFn: () => fetchMovies("discover", 1, "35"),
  });

  const { data: horrorMovies, isLoading: loadingHorror } = useQuery({
    queryKey: ["movies-horror"],
    queryFn: () => fetchMovies("discover", 1, "27"),
  });

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
            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
              <Film className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic">
                Filmes
              </h1>
              <p className="text-white/40 font-bold tracking-widest uppercase text-xs">
                Explore o melhor do cinema mundial
              </p>
            </div>
          </motion.div>
        </div>

        {/* Seções de Carrosséis */}
        <div className="space-y-4">
          <MovieCarousel 
            title="Em Cartaz nos Cinemas" 
            movies={nowPlayingMovies || []} 
            isLoading={loadingNowPlaying}
            categorySlug="now-playing"
          />

          <MovieCarousel 
            title="Os Mais Populares" 
            movies={popularMovies || []} 
            isLoading={loadingPopular}
            categorySlug="popular"
          />

          <MovieCarousel 
            title="Próximos Lançamentos" 
            movies={upcomingMovies || []} 
            isLoading={loadingUpcoming}
            categorySlug="upcoming"
          />

          <MovieCarousel 
            title="O Melhor da Ação" 
            movies={actionMovies || []} 
            isLoading={loadingAction}
            categorySlug="action"
          />

          <MovieCarousel 
            title="Para Morrer de Rir" 
            movies={comedyMovies || []} 
            isLoading={loadingComedy}
            categorySlug="comedy"
          />

          <MovieCarousel 
            title="Terror e Suspense" 
            movies={horrorMovies || []} 
            isLoading={loadingHorror}
            categorySlug="horror"
          />

          <MovieCarousel 
            title="Aclamados pela Crítica" 
            movies={topRatedMovies || []} 
            isLoading={loadingTopRated}
            categorySlug="top-rated"
          />
        </div>
      </main>
    </div>
  );
};

export default Movies;
