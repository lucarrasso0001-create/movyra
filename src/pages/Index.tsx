import { useState, useMemo, useEffect } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import HeroSkeleton from "@/components/HeroSkeleton";
import MovieCarousel from "@/components/MovieCarousel";
import MovieCard from "@/components/MovieCard";
import { 
  useTrendingMovies, 
  usePopularMovies, 
  useTopRatedMovies, 
  useNowPlayingMovies, 
  useUpcomingMovies, 
  useMoviesByGenre, 
  useSearchMovies, 
  useDebounce 
} from "@/hooks/useTMDB";
import { useRecommendations } from "@/hooks/useRecommendations";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { useAuth } from "@/hooks/useAuth";
import type { Movie } from "@/types/tmdb";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const { data: watchHistory } = useWatchHistory();
  const { profile } = useAuth();
  
  // Explicitly define variables to avoid ReferenceError
  const isKidsMode = profile?.is_kids ?? false;
  const userMaxAge = profile?.max_age_rating ?? 18;

  // Data fetching
  const { data: trendingMovies, isLoading: loadingTrending } = useTrendingMovies();
  const { data: popularMovies, isLoading: loadingPopular } = usePopularMovies();
  const { data: topRatedMovies, isLoading: loadingTopRated } = useTopRatedMovies();
  const { data: nowPlayingMovies, isLoading: loadingNowPlaying } = useNowPlayingMovies();
  const { data: upcomingMovies, isLoading: loadingUpcoming } = useUpcomingMovies();
  
  // Genres
  const { data: actionMovies, isLoading: loadingAction } = useMoviesByGenre(28);
  const { data: animationMovies, isLoading: loadingAnimation } = useMoviesByGenre(16);
  const { data: familyMovies, isLoading: loadingFamily } = useMoviesByGenre(10751);
  const { data: comedyMovies, isLoading: loadingComedy } = useMoviesByGenre(35);
  const { data: horrorMovies, isLoading: loadingHorror } = useMoviesByGenre(27);
  const { data: sciFiMovies, isLoading: loadingSciFi } = useMoviesByGenre(878);
  const { data: documentaryMovies, isLoading: loadingDocumentary } = useMoviesByGenre(99);
  const { data: historyMovies, isLoading: loadingHistory } = useMoviesByGenre(36);
  const { data: warMovies, isLoading: loadingWar } = useMoviesByGenre(10752);
  const { data: musicalMovies, isLoading: loadingMusical } = useMoviesByGenre(10402);
  const { data: westernMovies, isLoading: loadingWestern } = useMoviesByGenre(37);
  const { data: thrillerMovies, isLoading: loadingThriller } = useMoviesByGenre(53);
  const { data: crimeMovies, isLoading: loadingCrime } = useMoviesByGenre(80);

  const { recommendations, isLoading: loadingRecommendations, hasRecommendations } = useRecommendations();
  const { data: searchResults, isLoading: loadingSearch } = useSearchMovies(debouncedSearch);

  const featuredMovie = useMemo(() => {
    if (trendingMovies && trendingMovies.length > 0) {
      return trendingMovies.find(m => m.backdrop) || trendingMovies[0];
    }
    return null;
  }, [trendingMovies]);

  const continueWatchingMovies = useMemo(() => {
    if (!watchHistory || watchHistory.length === 0) return [];
    return watchHistory
      .filter(item => {
        const progress = item.progress_seconds;
        const duration = item.duration_seconds;
        if (progress < 30) return false;
        if (duration && progress / duration > 0.95) return false;
        return true;
      })
      .map(item => ({
        id: item.movie_id,
        title: item.movie_title,
        poster: item.movie_poster || "/placeholder.svg",
        backdrop: item.movie_poster || "/placeholder.svg",
        rating: 0,
        year: "",
        genre: "",
        synopsis: "",
        language: "pt",
      }));
  }, [watchHistory]);

  // --- LOGICA DE FILMES UNICOS ---
  // Esta lógica garante que um filme não apareça em mais de uma categoria na Home.
  const uniqueCategories = useMemo(() => {
    const seenIds = new Set<string>();
    
    // Se houver um filme em destaque (Hero), ele é o primeiro a ser "visto"
    if (featuredMovie) seenIds.add(featuredMovie.id);
    
    // Filmes que o usuário está assistindo também não devem repetir nas categorias abaixo
    continueWatchingMovies.forEach(m => seenIds.add(m.id));

    const filterUnique = (movies: Movie[] | undefined) => {
      if (!movies) return [];
      const filtered = movies.filter(m => !seenIds.has(m.id));
      filtered.forEach(m => seenIds.add(m.id));
      return filtered;
    };

    // "Em Alta" e "Nos Cinemas" NÃO participam da filtragem de unicidade,
    // permitindo que grandes sucessos apareçam nessas categorias mesmo que já existam em outras.
    const passthrough = (movies: Movie[] | undefined) => movies || [];

    return {
      recommendations: filterUnique(recommendations || []),
      trending: passthrough(trendingMovies || []),
      popular: filterUnique(popularMovies || []),
      nowPlaying: passthrough(nowPlayingMovies || []),
      action: filterUnique(actionMovies || []),
      animation: filterUnique(animationMovies || []),
      sciFi: filterUnique(sciFiMovies || []),
      upcoming: filterUnique(upcomingMovies || []),
      topRated: filterUnique(topRatedMovies || []),
      horror: filterUnique(horrorMovies || []),
      thriller: filterUnique(thrillerMovies || []),
      crime: filterUnique(crimeMovies || []),
      documentary: filterUnique(documentaryMovies || []),
      history: filterUnique(historyMovies || []),
      war: filterUnique(warMovies || []),
      musical: filterUnique(musicalMovies || []),
      western: filterUnique(westernMovies || []),
      family: filterUnique(familyMovies || []),
      comedy: filterUnique(comedyMovies || []),
    };
  }, [
    featuredMovie, continueWatchingMovies, recommendations, trendingMovies, 
    popularMovies, nowPlayingMovies, actionMovies, animationMovies, 
    sciFiMovies, upcomingMovies, topRatedMovies, horrorMovies, 
    thrillerMovies, crimeMovies, documentaryMovies, historyMovies, 
    warMovies, musicalMovies, westernMovies, familyMovies, comedyMovies
  ]);

  const isSearching = debouncedSearch.trim().length > 1;
  const showResults = isSearching && searchResults;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar onSearchChange={setSearchQuery} />

      {!showResults ? (
        <>
          {/* Featured Hero Section */}
          {!isKidsMode && (loadingTrending || !featuredMovie ? (
            <HeroSkeleton />
          ) : (
            <HeroSection movie={featuredMovie} />
          ))}

          <div className={`relative z-10 ${!isKidsMode ? "-mt-20 md:-mt-32" : "pt-24"} pt-4 pb-20`}>
            {/* Continue Watching */}
            {continueWatchingMovies.length > 0 && (
              <MovieCarousel
                title="Continuar Assistindo"
                movies={continueWatchingMovies as unknown as Movie[]}
                isLoading={false}
              />
            )}

            {isKidsMode ? (
              <>
                <MovieCarousel title="Animação" movies={uniqueCategories.animation} isLoading={loadingAnimation} />
                <MovieCarousel title="Para Toda a Família" movies={uniqueCategories.family} isLoading={loadingFamily} />
                <MovieCarousel title="Comédias" movies={uniqueCategories.comedy} isLoading={loadingComedy} />
              </>
            ) : (
              <>
                {hasRecommendations && uniqueCategories.recommendations.length > 0 && (
                  <MovieCarousel title="Recomendado para Você" movies={uniqueCategories.recommendations} isLoading={loadingRecommendations} />
                )}
                <MovieCarousel title="Em Alta no Movyra" movies={uniqueCategories.trending} isLoading={loadingTrending} categorySlug="em-alta" />
                <MovieCarousel title="Mais Populares" movies={uniqueCategories.popular} isLoading={loadingPopular} categorySlug="populares" />
                <MovieCarousel title="Nos Cinemas" movies={uniqueCategories.nowPlaying} isLoading={loadingNowPlaying} categorySlug="nos-cinemas" />
                <MovieCarousel title="Ação & Aventura" movies={uniqueCategories.action} isLoading={loadingAction} categorySlug="acao" />
                <MovieCarousel title="Animação" movies={uniqueCategories.animation} isLoading={loadingAnimation} categorySlug="animacao" />
                <MovieCarousel title="Ficção Científica" movies={uniqueCategories.sciFi} isLoading={loadingSciFi} categorySlug="ficcao-cientifica" />
                <MovieCarousel title="Em Breve" movies={uniqueCategories.upcoming} isLoading={loadingUpcoming} categorySlug="em-breve" />
                <MovieCarousel title="Mais Bem Avaliados" movies={uniqueCategories.topRated} isLoading={loadingTopRated} categorySlug="mais-avaliados" />
              </>
            )}

            {userMaxAge >= 16 && !isKidsMode && (
              <>
                <MovieCarousel title="Terror & Suspense" movies={uniqueCategories.horror} isLoading={loadingHorror} categorySlug="terror" />
                <MovieCarousel title="Suspense & Mistério" movies={uniqueCategories.thriller} isLoading={loadingThriller} categorySlug="suspense" />
                <MovieCarousel title="Investigação Policial" movies={uniqueCategories.crime} isLoading={loadingCrime} categorySlug="crime" />
              </>
            )}

            {!isKidsMode && (
              <>
                <MovieCarousel title="Documentários" movies={uniqueCategories.documentary} isLoading={loadingDocumentary} categorySlug="documentario" />
                <MovieCarousel title="Épicos & Históricos" movies={uniqueCategories.history} isLoading={loadingHistory} categorySlug="historia" />
                <MovieCarousel title="Guerra" movies={uniqueCategories.war} isLoading={loadingWar} categorySlug="guerra" />
                <MovieCarousel title="Musical" movies={uniqueCategories.musical} isLoading={loadingMusical} categorySlug="musical" />
                <MovieCarousel title="Faroeste" movies={uniqueCategories.western} isLoading={loadingWestern} categorySlug="faroeste" />
              </>
            )}
          </div>
        </>
      ) : (
        <div className="pt-28 px-6 md:px-12">
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-8">
            {loadingSearch
              ? `Buscando "${debouncedSearch}"...`
              : searchResults && searchResults.length > 0
                ? `Resultados para "${debouncedSearch}"`
                : `Nenhum resultado para "${debouncedSearch}"`}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {searchResults?.map((movie: Movie) => (
              <div key={movie.id} className="w-full">
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>
        </div>
      )}

      <footer className="py-16 px-6 md:px-12 border-t border-white/5 bg-black/20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <p className="text-primary font-black text-3xl tracking-tighter mb-2">MOVYRA</p>
            <p className="text-white/40 text-sm font-medium">© 2026 Movyra. A melhor experiência de streaming.</p>
          </div>
          <div className="flex gap-8 text-white/60 text-sm font-bold uppercase tracking-widest">
            <a href="#" className="hover:text-white transition-colors">Privacidade</a>
            <a href="#" className="hover:text-white transition-colors">Termos</a>
            <a href="#" className="hover:text-white transition-colors">Ajuda</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
