import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import {
  TMDBMovie,
  TMDBTVShow,
  TMDBMovieDetails,
  TMDBResponse,
  transformMovie,
  transformTVShow,
  transformMovieDetails,
  Movie,
} from "@/types/tmdb";

// Generic fetch function that calls our edge function
async function fetchTMDB<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  try {
    console.log(`[TMDB] Chamando endpoint: ${endpoint}`, params);
    const { data, error } = await supabase.functions.invoke("tmdb", {
      body: { endpoint, params },
    });

    if (error) {
      console.error("[TMDB] Erro na Edge Function:", error);
      if (error.message?.includes("401") || error.message?.includes("Authentication")) {
        console.warn("[TMDB] Erro de autenticação. Verifique se o usuário está logado.");
      }
      throw new Error(error.message || "Failed to fetch from TMDB");
    }

    if (!data) {
      console.warn(`[TMDB] Nenhum dado retornado para o endpoint: ${endpoint}`);
      throw new Error("No data returned from TMDB");
    }

    return data as T;
  } catch (err) {
    console.error(`[TMDB] Erro crítico ao buscar ${endpoint}:`, err);
    throw err;
  }
}

/**
 * Captura o link direto (.mp4) de um provedor (ex: Fembed) via Edge Function.
 * Esta função simula o comportamento de uma extensão de navegador.
 */
export async function fetchDirectVideoLink(providerUrl: string): Promise<string | null> {
  try {
    console.log(`[VideoCapture] Tentando capturar link direto para: ${providerUrl}`);
    
    // Chamamos a mesma Edge Function 'tmdb', mas com um endpoint especial 'capture'
    // que deve ser tratado na lógica da função no Supabase.
    const { data, error } = await supabase.functions.invoke("tmdb", {
      body: { 
        endpoint: "capture", 
        params: { url: providerUrl } 
      },
    });

    if (error) {
      console.error("[VideoCapture] Erro ao capturar link:", error);
      return null;
    }

    return data?.directUrl || null;
  } catch (err) {
    console.error("[VideoCapture] Erro crítico na captura:", err);
    return null;
  }
}

// Helper to get age rating filter params
const getCertificationParams = (maxAge: number, type: "movie" | "tv"): Record<string, string> => {
  if (maxAge >= 18) return {};
  
  return {
    certification_country: "BR",
    "certification.lte": String(maxAge),
  };
};

// ==================== MOVIE HOOKS ====================

export function useTrendingMovies() {
  const { profile } = useAuth();
  const maxAge = profile?.max_age_rating ?? 18;

  return useQuery({
    queryKey: ["tmdb", "trending", maxAge],
    queryFn: async () => {
      if (maxAge < 18) {
        const data = await fetchTMDB<TMDBResponse<TMDBMovie>>("/discover/movie", {
          sort_by: "popularity.desc",
          ...getCertificationParams(maxAge, "movie")
        });
        return data.results.map(transformMovie);
      }
      const data = await fetchTMDB<TMDBResponse<TMDBMovie>>("/trending/movie/week");
      return data.results.map(transformMovie);
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function usePopularMovies() {
  const { profile } = useAuth();
  const maxAge = profile?.max_age_rating ?? 18;

  return useQuery({
    queryKey: ["tmdb", "popular", maxAge],
    queryFn: async () => {
      if (maxAge < 18) {
        const data = await fetchTMDB<TMDBResponse<TMDBMovie>>("/discover/movie", {
          sort_by: "popularity.desc",
          ...getCertificationParams(maxAge, "movie")
        });
        return data.results.map(transformMovie);
      }
      const data = await fetchTMDB<TMDBResponse<TMDBMovie>>("/movie/popular");
      return data.results.map(transformMovie);
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useTopRatedMovies() {
  const { profile } = useAuth();
  const maxAge = profile?.max_age_rating ?? 18;

  return useQuery({
    queryKey: ["tmdb", "top_rated", maxAge],
    queryFn: async () => {
      if (maxAge < 18) {
        const data = await fetchTMDB<TMDBResponse<TMDBMovie>>("/discover/movie", {
          sort_by: "vote_average.desc",
          ...getCertificationParams(maxAge, "movie")
        });
        return data.results.map(transformMovie);
      }
      const data = await fetchTMDB<TMDBResponse<TMDBMovie>>("/movie/top_rated");
      return data.results.map(transformMovie);
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useNowPlayingMovies() {
  const { profile } = useAuth();
  const maxAge = profile?.max_age_rating ?? 18;

  return useQuery({
    queryKey: ["tmdb", "now_playing", maxAge],
    queryFn: async () => {
      if (maxAge < 18) {
        const data = await fetchTMDB<TMDBResponse<TMDBMovie>>("/discover/movie", {
          sort_by: "popularity.desc",
          ...getCertificationParams(maxAge, "movie")
        });
        return data.results.map(transformMovie);
      }
      const data = await fetchTMDB<TMDBResponse<TMDBMovie>>("/movie/now_playing");
      return data.results.map(transformMovie);
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpcomingMovies() {
  const { profile } = useAuth();
  const maxAge = profile?.max_age_rating ?? 18;

  return useQuery({
    queryKey: ["tmdb", "upcoming", maxAge],
    queryFn: async () => {
      if (maxAge < 18) {
        const data = await fetchTMDB<TMDBResponse<TMDBMovie>>("/discover/movie", {
          sort_by: "release_date.desc",
          ...getCertificationParams(maxAge, "movie")
        });
        return data.results.map(transformMovie);
      }
      const data = await fetchTMDB<TMDBResponse<TMDBMovie>>("/movie/upcoming");
      return data.results.map(transformMovie);
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useMoviesByGenre(genreId: number) {
  const { profile } = useAuth();
  const maxAge = profile?.max_age_rating ?? 18;

  return useQuery({
    queryKey: ["tmdb", "genre", genreId, maxAge],
    queryFn: async () => {
      const data = await fetchTMDB<TMDBResponse<TMDBMovie>>("/discover/movie", {
        with_genres: String(genreId),
        sort_by: "popularity.desc",
        ...getCertificationParams(maxAge, "movie")
      });
      return data.results.map(transformMovie);
    },
    staleTime: 1000 * 60 * 5,
    enabled: genreId > 0,
  });
}

export function useMovieDetails(movieId: string, mediaType?: "movie" | "tv") {
  return useQuery({
    queryKey: ["tmdb", "details", movieId, mediaType],
    queryFn: async () => {
      const fetchAsTV = async () => {
        const data = await fetchTMDB<any>(`/tv/${movieId}`, {
          append_to_response: "credits,videos",
        });
        const year = data.first_air_date ? new Date(data.first_air_date).getFullYear() : 0;
        const genres = (data.genres || []).map((g: any) => g.name);
        const director = data.created_by?.[0]?.name || "";
        const cast = (data.credits?.cast || []).slice(0, 6).map((c: any) => c.name);
        const castMembers = (data.credits?.cast || []).slice(0, 6).map((c: any) => ({
          id: c.id,
          name: c.name,
          character: c.character,
          photo: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null,
        }));
        const trailer = data.videos?.results?.find(
          (v: any) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")
        );
        return {
          id: String(data.id),
          title: data.name,
          poster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : "/placeholder.svg",
          backdrop: data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : undefined,
          year,
          rating: Math.round(data.vote_average * 10) / 10,
          duration: data.episode_run_time?.[0] ? `${data.episode_run_time[0]}min/ep` : "",
          genres,
          synopsis: data.overview || "Sinopse não disponível.",
          director,
          cast,
          castMembers,
          language: data.original_language,
          tags: [],
          trailerKey: trailer?.key,
          mediaType: "tv" as const,
        };
      };

      const fetchAsMovie = async () => {
        const data = await fetchTMDB<TMDBMovieDetails>(`/movie/${movieId}`, {
          append_to_response: "credits,videos",
        });
        return transformMovieDetails(data);
      };

      // If media type is known, fetch directly
      if (mediaType === "tv") return fetchAsTV();
      if (mediaType === "movie") return fetchAsMovie();

      // Auto-detect: try movie first (most items are movies),
      // then fallback to TV
      try {
        return await fetchAsMovie();
      } catch {
        return await fetchAsTV();
      }
    },
    staleTime: 1000 * 60 * 10,
    enabled: !!movieId,
  });
}

export function useSearchMovies(query: string) {
  const { profile } = useAuth();
  const maxAge = profile?.max_age_rating ?? 18;

  return useQuery({
    queryKey: ["tmdb", "search", query, maxAge],
    queryFn: async () => {
      if (!query.trim()) return [];
      const data = await fetchTMDB<TMDBResponse<any>>("/search/multi", {
        query: query.trim(),
        include_adult: maxAge >= 18 ? "true" : "false",
      });
      
      return data.results
        .filter((item: any) => item.media_type === "movie" || item.media_type === "tv")
        .map((item: any) => {
          if (item.media_type === "movie") {
            return transformMovie(item as TMDBMovie);
          } else {
            return transformTVShow(item as TMDBTVShow);
          }
        });
    },
    staleTime: 1000 * 60 * 2,
    enabled: query.trim().length > 1,
  });
}

export function useInfiniteMovies(category: "popular" | "top_rated" | "upcoming" | "now_playing" = "popular") {
  const { profile } = useAuth();
  const maxAge = profile?.max_age_rating ?? 18;

  return useInfiniteQuery({
    queryKey: ["tmdb", "infinite", category, maxAge],
    queryFn: async ({ pageParam = 1 }) => {
      let data;
      if (maxAge < 18) {
        const sortMap = {
          popular: "popularity.desc",
          top_rated: "vote_average.desc",
          upcoming: "release_date.desc",
          now_playing: "popularity.desc",
        };
        data = await fetchTMDB<TMDBResponse<TMDBMovie>>("/discover/movie", {
          page: String(pageParam),
          sort_by: sortMap[category],
          ...getCertificationParams(maxAge, "movie")
        });
      } else {
        data = await fetchTMDB<TMDBResponse<TMDBMovie>>(`/movie/${category}`, {
          page: String(pageParam),
        });
      }
      return {
        movies: data.results.map(transformMovie),
        page: data.page,
        totalPages: data.total_pages,
      };
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5,
  });
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ==================== TV SHOW HOOKS ====================

export function useTrendingTV() {
  const { profile } = useAuth();
  const maxAge = profile?.max_age_rating ?? 18;

  return useQuery({
    queryKey: ["tmdb", "tv", "trending", maxAge],
    queryFn: async () => {
      if (maxAge < 18) {
        const data = await fetchTMDB<TMDBResponse<TMDBTVShow>>("/discover/tv", {
          sort_by: "popularity.desc",
          ...getCertificationParams(maxAge, "tv")
        });
        return data.results.map(transformTVShow);
      }
      const data = await fetchTMDB<TMDBResponse<TMDBTVShow>>("/trending/tv/week");
      return data.results.map(transformTVShow);
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function usePopularTV() {
  const { profile } = useAuth();
  const maxAge = profile?.max_age_rating ?? 18;

  return useQuery({
    queryKey: ["tmdb", "tv", "popular", maxAge],
    queryFn: async () => {
      if (maxAge < 18) {
        const data = await fetchTMDB<TMDBResponse<TMDBTVShow>>("/discover/tv", {
          sort_by: "popularity.desc",
          ...getCertificationParams(maxAge, "tv")
        });
        return data.results.map(transformTVShow);
      }
      const data = await fetchTMDB<TMDBResponse<TMDBTVShow>>("/tv/popular");
      return data.results.map(transformTVShow);
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useTopRatedTV() {
  const { profile } = useAuth();
  const maxAge = profile?.max_age_rating ?? 18;

  return useQuery({
    queryKey: ["tmdb", "tv", "top_rated", maxAge],
    queryFn: async () => {
      if (maxAge < 18) {
        const data = await fetchTMDB<TMDBResponse<TMDBTVShow>>("/discover/tv", {
          sort_by: "vote_average.desc",
          ...getCertificationParams(maxAge, "tv")
        });
        return data.results.map(transformTVShow);
      }
      const data = await fetchTMDB<TMDBResponse<TMDBTVShow>>("/tv/top_rated");
      return data.results.map(transformTVShow);
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useTVByGenre(genreId: number) {
  const { profile } = useAuth();
  const maxAge = profile?.max_age_rating ?? 18;

  return useQuery({
    queryKey: ["tmdb", "tv", "genre", genreId, maxAge],
    queryFn: async () => {
      const data = await fetchTMDB<TMDBResponse<TMDBTVShow>>("/discover/tv", {
        with_genres: String(genreId),
        sort_by: "popularity.desc",
        ...getCertificationParams(maxAge, "tv")
      });
      return data.results.map(transformTVShow);
    },
    staleTime: 1000 * 60 * 5,
    enabled: genreId > 0,
  });
}

export function useOnTheAirTV() {
  const { profile } = useAuth();
  const maxAge = profile?.max_age_rating ?? 18;

  return useQuery({
    queryKey: ["tmdb", "tv", "on_the_air", maxAge],
    queryFn: async () => {
      if (maxAge < 18) {
        const data = await fetchTMDB<TMDBResponse<TMDBTVShow>>("/discover/tv", {
          sort_by: "popularity.desc",
          ...getCertificationParams(maxAge, "tv")
        });
        return data.results.map(transformTVShow);
      }
      const data = await fetchTMDB<TMDBResponse<TMDBTVShow>>("/tv/on_the_air");
      return data.results.map(transformTVShow);
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useAiringTodayTV() {
  const { profile } = useAuth();
  const maxAge = profile?.max_age_rating ?? 18;

  return useQuery({
    queryKey: ["tmdb", "tv", "airing_today", maxAge],
    queryFn: async () => {
      if (maxAge < 18) {
        const data = await fetchTMDB<TMDBResponse<TMDBTVShow>>("/discover/tv", {
          sort_by: "popularity.desc",
          ...getCertificationParams(maxAge, "tv")
        });
        return data.results.map(transformTVShow);
      }
      const data = await fetchTMDB<TMDBResponse<TMDBTVShow>>("/tv/airing_today");
      return data.results.map(transformTVShow);
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSearchTV(query: string) {
  const { profile } = useAuth();
  const maxAge = profile?.max_age_rating ?? 18;

  return useQuery({
    queryKey: ["tmdb", "tv", "search", query, maxAge],
    queryFn: async () => {
      if (!query.trim()) return [];
      const data = await fetchTMDB<TMDBResponse<TMDBTVShow>>("/search/tv", {
        query: query.trim(),
        include_adult: maxAge >= 18 ? "true" : "false",
      });
      return data.results.map(transformTVShow);
    },
    staleTime: 1000 * 60 * 2,
    enabled: query.trim().length > 1,
  });
}

// ==================== MEDIA SOURCE HOOKS ====================

export interface MediaSource {
  id: string;
  movie_id: string;
  media_type: string;
  url: string;
  quality: string;
  language: string;
  is_dubbed: boolean;
  has_subtitles: boolean;
  provider: string;
}

// Media sources hook disabled - table not yet created
export function useMediaSources(_movieId: string, _mediaType: "movie" | "tv" = "movie") {
  return useQuery({
    queryKey: ["media_sources", _movieId, _mediaType],
    queryFn: async () => {
      return [] as MediaSource[];
    },
    enabled: false,
  });
}

export interface TVSeason {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  poster_path: string | null;
}

export interface TVEpisode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  still_path: string | null;
  air_date: string;
}

export function useTVSeasons(tvId: string) {
  return useQuery({
    queryKey: ["tmdb", "tv", tvId, "seasons"],
    queryFn: async () => {
      const data = await fetchTMDB<any>(`/tv/${tvId}`);
      return data.seasons as TVSeason[];
    },
    enabled: !!tvId,
  });
}

export function useTVEpisodes(tvId: string, seasonNumber: number) {
  return useQuery({
    queryKey: ["tmdb", "tv", tvId, "season", seasonNumber, "episodes"],
    queryFn: async () => {
      const data = await fetchTMDB<any>(`/tv/${tvId}/season/${seasonNumber}`);
      return data.episodes as TVEpisode[];
    },
    enabled: !!tvId && seasonNumber !== undefined,
  });
}
