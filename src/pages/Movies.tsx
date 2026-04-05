import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import MovieCarousel from "@/components/MovieCarousel";
import { fetchMovies } from "@/hooks/useTMDB";
import { Film } from "lucide-react";
import { motion } from "framer-motion";
import type { Movie } from "@/types/tmdb";

const Movies = () => {
  // Categorias curadas (NÃO participam da deduplicação)
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

  // Gêneros (participam da deduplicação)
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
  const { data: dramaMovies, isLoading: loadingDrama } = useQuery({
    queryKey: ["movies-drama"],
    queryFn: () => fetchMovies("discover", 1, "18"),
  });
  const { data: romanceMovies, isLoading: loadingRomance } = useQuery({
    queryKey: ["movies-romance"],
    queryFn: () => fetchMovies("discover", 1, "10749"),
  });
  const { data: sciFiMovies, isLoading: loadingSciFi } = useQuery({
    queryKey: ["movies-sci-fi"],
    queryFn: () => fetchMovies("discover", 1, "878"),
  });
  const { data: animationMovies, isLoading: loadingAnimation } = useQuery({
    queryKey: ["movies-animation"],
    queryFn: () => fetchMovies("discover", 1, "16"),
  });
  const { data: thrillerMovies, isLoading: loadingThriller } = useQuery({
    queryKey: ["movies-thriller"],
    queryFn: () => fetchMovies("discover", 1, "53"),
  });
  const { data: documentaryMovies, isLoading: loadingDocumentary } = useQuery({
    queryKey: ["movies-documentary"],
    queryFn: () => fetchMovies("discover", 1, "99"),
  });
  const { data: adventureMovies, isLoading: loadingAdventure } = useQuery({
    queryKey: ["movies-adventure"],
    queryFn: () => fetchMovies("discover", 1, "12"),
  });
  const { data: crimeMovies, isLoading: loadingCrime } = useQuery({
    queryKey: ["movies-crime"],
    queryFn: () => fetchMovies("discover", 1, "80"),
  });
  const { data: fantasyMovies, isLoading: loadingFantasy } = useQuery({
    queryKey: ["movies-fantasy"],
    queryFn: () => fetchMovies("discover", 1, "14"),
  });
  const { data: warMovies, isLoading: loadingWar } = useQuery({
    queryKey: ["movies-war"],
    queryFn: () => fetchMovies("discover", 1, "10752"),
  });
  const { data: familyMovies, isLoading: loadingFamily } = useQuery({
    queryKey: ["movies-family"],
    queryFn: () => fetchMovies("discover", 1, "10751"),
  });
  const { data: mysteryMovies, isLoading: loadingMystery } = useQuery({
    queryKey: ["movies-mystery"],
    queryFn: () => fetchMovies("discover", 1, "9648"),
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
      action: filterUnique(actionMovies),
      drama: filterUnique(dramaMovies),
      comedy: filterUnique(comedyMovies),
      romance: filterUnique(romanceMovies),
      sciFi: filterUnique(sciFiMovies),
      horror: filterUnique(horrorMovies),
      animation: filterUnique(animationMovies),
      thriller: filterUnique(thrillerMovies),
      adventure: filterUnique(adventureMovies),
      fantasy: filterUnique(fantasyMovies),
      documentary: filterUnique(documentaryMovies),
      crime: filterUnique(crimeMovies),
      war: filterUnique(warMovies),
      family: filterUnique(familyMovies),
      mystery: filterUnique(mysteryMovies),
    };
  }, [actionMovies, dramaMovies, comedyMovies, romanceMovies, sciFiMovies, horrorMovies, animationMovies, thrillerMovies, adventureMovies, fantasyMovies, documentaryMovies, crimeMovies, warMovies, familyMovies, mysteryMovies]);

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

        <div className="space-y-4">
          {/* Categorias curadas */}
          <MovieCarousel title="Em Cartaz nos Cinemas" movies={nowPlayingMovies || []} isLoading={loadingNowPlaying} categorySlug="now-playing" />
          <MovieCarousel title="Os Mais Populares" movies={popularMovies || []} isLoading={loadingPopular} categorySlug="popular" />
          <MovieCarousel title="Próximos Lançamentos" movies={upcomingMovies || []} isLoading={loadingUpcoming} categorySlug="upcoming" />

          {/* Gêneros (deduplicados) */}
          <MovieCarousel title="Ação" movies={uniqueGenres.action} isLoading={loadingAction} categorySlug="action" />
          <MovieCarousel title="Drama" movies={uniqueGenres.drama} isLoading={loadingDrama} categorySlug="drama" />
          <MovieCarousel title="Comédia" movies={uniqueGenres.comedy} isLoading={loadingComedy} categorySlug="comedy" />
          <MovieCarousel title="Romance" movies={uniqueGenres.romance} isLoading={loadingRomance} categorySlug="romance" />
          <MovieCarousel title="Ficção Científica" movies={uniqueGenres.sciFi} isLoading={loadingSciFi} categorySlug="ficcao-cientifica" />
          <MovieCarousel title="Terror" movies={uniqueGenres.horror} isLoading={loadingHorror} categorySlug="horror" />
          <MovieCarousel title="Animação" movies={uniqueGenres.animation} isLoading={loadingAnimation} categorySlug="animacao" />
          <MovieCarousel title="Suspense" movies={uniqueGenres.thriller} isLoading={loadingThriller} categorySlug="suspense" />
          <MovieCarousel title="Aventura" movies={uniqueGenres.adventure} isLoading={loadingAdventure} categorySlug="aventura" />
          <MovieCarousel title="Fantasia" movies={uniqueGenres.fantasy} isLoading={loadingFantasy} categorySlug="fantasia" />
          <MovieCarousel title="Documentários" movies={uniqueGenres.documentary} isLoading={loadingDocumentary} categorySlug="documentario" />
          <MovieCarousel title="Crime" movies={uniqueGenres.crime} isLoading={loadingCrime} categorySlug="crime" />
          <MovieCarousel title="Guerra" movies={uniqueGenres.war} isLoading={loadingWar} categorySlug="guerra" />
          <MovieCarousel title="Família" movies={uniqueGenres.family} isLoading={loadingFamily} categorySlug="familia" />
          <MovieCarousel title="Mistério" movies={uniqueGenres.mystery} isLoading={loadingMystery} categorySlug="misterio" />

          {/* Curada */}
          <MovieCarousel title="Aclamados pela Crítica" movies={topRatedMovies || []} isLoading={loadingTopRated} categorySlug="top-rated" />
        </div>
      </main>
    </div>
  );
};

export default Movies;
