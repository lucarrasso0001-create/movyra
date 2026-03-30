import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import MovieCarousel from "@/components/MovieCarousel";
import { fetchTVShows } from "@/hooks/useTMDB";
import { Tv } from "lucide-react";
import { motion } from "framer-motion";

const Series = () => {
  // Buscar diferentes categorias de séries
  const { data: popularSeries, isLoading: loadingPopular } = useQuery({
    queryKey: ["series-popular"],
    queryFn: () => fetchTVShows("popular"),
  });

  const { data: topRatedSeries, isLoading: loadingTopRated } = useQuery({
    queryKey: ["series-top-rated"],
    queryFn: () => fetchTVShows("top_rated"),
  });

  const { data: onTheAirSeries, isLoading: loadingOnTheAir } = useQuery({
    queryKey: ["series-on-the-air"],
    queryFn: () => fetchTVShows("on_the_air"),
  });

  const { data: airingTodaySeries, isLoading: loadingAiringToday } = useQuery({
    queryKey: ["series-airing-today"],
    queryFn: () => fetchTVShows("airing_today"),
  });

  // Buscar por gêneros específicos (IDs do TMDB para TV)
  const { data: actionAdventureSeries, isLoading: loadingAction } = useQuery({
    queryKey: ["series-action-adventure"],
    queryFn: () => fetchTVShows("discover", 1, "10759"),
  });

  const { data: comedySeries, isLoading: loadingComedy } = useQuery({
    queryKey: ["series-comedy"],
    queryFn: () => fetchTVShows("discover", 1, "35"),
  });

  const { data: sciFiFantasySeries, isLoading: loadingSciFi } = useQuery({
    queryKey: ["series-sci-fi-fantasy"],
    queryFn: () => fetchTVShows("discover", 1, "10765"),
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
              <Tv className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic">
                Séries
              </h1>
              <p className="text-white/40 font-bold tracking-widest uppercase text-xs">
                As melhores produções da TV mundial
              </p>
            </div>
          </motion.div>
        </div>

        {/* Seções de Carrosséis */}
        <div className="space-y-4">
          <MovieCarousel 
            title="Séries em Alta" 
            movies={popularSeries || []} 
            isLoading={loadingPopular}
            categorySlug="popular-tv"
          />

          <MovieCarousel 
            title="Passando Hoje" 
            movies={airingTodaySeries || []} 
            isLoading={loadingAiringToday}
            categorySlug="airing-today"
          />

          <MovieCarousel 
            title="Ação e Aventura" 
            movies={actionAdventureSeries || []} 
            isLoading={loadingAction}
            categorySlug="action-adventure-tv"
          />

          <MovieCarousel 
            title="Ficção Científica e Fantasia" 
            movies={sciFiFantasySeries || []} 
            isLoading={loadingSciFi}
            categorySlug="sci-fi-fantasy-tv"
          />

          <MovieCarousel 
            title="Comédias Imperdíveis" 
            movies={comedySeries || []} 
            isLoading={loadingComedy}
            categorySlug="comedy-tv"
          />

          <MovieCarousel 
            title="Novos Episódios na Semana" 
            movies={onTheAirSeries || []} 
            isLoading={loadingOnTheAir}
            categorySlug="on-the-air"
          />

          <MovieCarousel 
            title="Aclamadas pela Crítica" 
            movies={topRatedSeries || []} 
            isLoading={loadingTopRated}
            categorySlug="top-rated-tv"
          />
        </div>
      </main>
    </div>
  );
};

export default Series;
