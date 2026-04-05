import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import MovieCarousel from "@/components/MovieCarousel";
import { fetchTVShows } from "@/hooks/useTMDB";
import { Tv } from "lucide-react";
import { motion } from "framer-motion";
import type { Movie } from "@/types/tmdb";

const Series = () => {
  // Categorias curadas (NÃO participam da deduplicação)
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

  // Gêneros (participam da deduplicação) - IDs de gênero TV do TMDB
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
  const { data: dramaSeries, isLoading: loadingDrama } = useQuery({
    queryKey: ["series-drama"],
    queryFn: () => fetchTVShows("discover", 1, "18"),
  });
  const { data: crimeSeries, isLoading: loadingCrime } = useQuery({
    queryKey: ["series-crime"],
    queryFn: () => fetchTVShows("discover", 1, "80"),
  });
  const { data: mysterySeries, isLoading: loadingMystery } = useQuery({
    queryKey: ["series-mystery"],
    queryFn: () => fetchTVShows("discover", 1, "9648"),
  });
  const { data: animationSeries, isLoading: loadingAnimation } = useQuery({
    queryKey: ["series-animation"],
    queryFn: () => fetchTVShows("discover", 1, "16"),
  });
  const { data: documentarySeries, isLoading: loadingDocumentary } = useQuery({
    queryKey: ["series-documentary"],
    queryFn: () => fetchTVShows("discover", 1, "99"),
  });
  const { data: familySeries, isLoading: loadingFamily } = useQuery({
    queryKey: ["series-family"],
    queryFn: () => fetchTVShows("discover", 1, "10751"),
  });
  const { data: warPoliticsSeries, isLoading: loadingWarPolitics } = useQuery({
    queryKey: ["series-war-politics"],
    queryFn: () => fetchTVShows("discover", 1, "10768"),
  });
  const { data: realitySeries, isLoading: loadingReality } = useQuery({
    queryKey: ["series-reality"],
    queryFn: () => fetchTVShows("discover", 1, "10764"),
  });

  // --- DEDUPLICAÇÃO DE GÊNEROS ---
  const uniqueGenres = useMemo(() => {
    const seenIds = new Set<string>();
    const filterUnique = (movies: Movie[] | undefined) => {
      if (!movies) return [];
      const filtered = movies.filter(m => !seenIds.has(m.id));
      filtered.forEach(m => seenIds.add(m.id));
      return filtered;
    };

    return {
      actionAdventure: filterUnique(actionAdventureSeries),
      drama: filterUnique(dramaSeries),
      comedy: filterUnique(comedySeries),
      sciFiFantasy: filterUnique(sciFiFantasySeries),
      crime: filterUnique(crimeSeries),
      mystery: filterUnique(mysterySeries),
      animation: filterUnique(animationSeries),
      documentary: filterUnique(documentarySeries),
      family: filterUnique(familySeries),
      warPolitics: filterUnique(warPoliticsSeries),
      reality: filterUnique(realitySeries),
    };
  }, [actionAdventureSeries, dramaSeries, comedySeries, sciFiFantasySeries, crimeSeries, mysterySeries, animationSeries, documentarySeries, familySeries, warPoliticsSeries, realitySeries]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20 pb-24 md:pb-12">
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

        <div className="space-y-4">
          {/* Categorias curadas */}
          <MovieCarousel title="Séries em Alta" movies={popularSeries || []} isLoading={loadingPopular} categorySlug="popular-tv" />
          <MovieCarousel title="Passando Hoje" movies={airingTodaySeries || []} isLoading={loadingAiringToday} categorySlug="airing-today" />

          {/* Gêneros (deduplicados) */}
          <MovieCarousel title="Ação e Aventura" movies={uniqueGenres.actionAdventure} isLoading={loadingAction} categorySlug="action-adventure-tv" />
          <MovieCarousel title="Drama" movies={uniqueGenres.drama} isLoading={loadingDrama} categorySlug="drama-tv" />
          <MovieCarousel title="Comédia" movies={uniqueGenres.comedy} isLoading={loadingComedy} categorySlug="comedy-tv" />
          <MovieCarousel title="Ficção Científica e Fantasia" movies={uniqueGenres.sciFiFantasy} isLoading={loadingSciFi} categorySlug="sci-fi-fantasy-tv" />
          <MovieCarousel title="Crime" movies={uniqueGenres.crime} isLoading={loadingCrime} categorySlug="crime-tv" />
          <MovieCarousel title="Mistério" movies={uniqueGenres.mystery} isLoading={loadingMystery} categorySlug="mystery-tv" />
          <MovieCarousel title="Animação" movies={uniqueGenres.animation} isLoading={loadingAnimation} categorySlug="animation-tv" />
          <MovieCarousel title="Documentários" movies={uniqueGenres.documentary} isLoading={loadingDocumentary} categorySlug="documentary-tv" />
          <MovieCarousel title="Família" movies={uniqueGenres.family} isLoading={loadingFamily} categorySlug="family-tv" />
          <MovieCarousel title="Guerra e Política" movies={uniqueGenres.warPolitics} isLoading={loadingWarPolitics} categorySlug="war-politics-tv" />
          <MovieCarousel title="Reality Shows" movies={uniqueGenres.reality} isLoading={loadingReality} categorySlug="reality-tv" />

          {/* Curadas */}
          <MovieCarousel title="Novos Episódios na Semana" movies={onTheAirSeries || []} isLoading={loadingOnTheAir} categorySlug="on-the-air" />
          <MovieCarousel title="Aclamadas pela Crítica" movies={topRatedSeries || []} isLoading={loadingTopRated} categorySlug="top-rated-tv" />
        </div>
      </main>
    </div>
  );
};

export default Series;
