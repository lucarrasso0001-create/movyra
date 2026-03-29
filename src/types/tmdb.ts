export interface TMDBMovie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date: string;
  genre_ids: number[];
  overview: string;
  original_language: string;
}

export interface TMDBTVShow {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  first_air_date: string;
  genre_ids: number[];
  overview: string;
  original_language: string;
}

export interface TMDBMovieDetails {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date: string;
  genres: { id: number; name: string }[];
  overview: string;
  original_language: string;
  runtime: number;
  credits?: {
    cast: Array<{ id: number; name: string; character: string; profile_path: string | null }>;
    crew: Array<{ id: number; name: string; job: string }>;
  };
  videos?: {
    results: Array<{ key: string; site: string; type: string }>;
  };
}

export interface TMDBResponse<T> {
  results: T[];
  page: number;
  total_pages: number;
  total_results: number;
}

export interface Movie {
  id: string;
  title: string;
  poster: string;
  backdrop?: string;
  rating: number;
  year: string;
  genre: string;
  synopsis: string;
  language: string;
  mediaType?: "movie" | "tv";
}

const GENRES: Record<number, string> = {
  28: "Ação", 12: "Aventura", 16: "Animação", 35: "Comédia", 80: "Crime",
  99: "Documentário", 18: "Drama", 10751: "Família", 14: "Fantasia", 36: "História",
  27: "Terror", 10402: "Música", 9648: "Mistério", 10749: "Romance",
  878: "Ficção Científica", 53: "Suspense", 10752: "Guerra", 37: "Faroeste",
  10759: "Ação & Aventura", 10762: "Kids", 10763: "News", 10764: "Reality",
  10765: "Sci-Fi & Fantasy", 10766: "Soap", 10767: "Talk", 10768: "War & Politics",
};

export function transformMovie(movie: TMDBMovie): Movie {
  return {
    id: String(movie.id),
    title: movie.title,
    poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : "/placeholder.svg",
    backdrop: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : undefined,
    rating: Math.round(movie.vote_average * 10) / 10,
    year: movie.release_date ? new Date(movie.release_date).getFullYear().toString() : "",
    genre: movie.genre_ids?.map((id) => GENRES[id]).filter(Boolean).join(", ") || "",
    synopsis: movie.overview || "",
    language: movie.original_language,
    mediaType: "movie",
  };
}

export function transformTVShow(show: TMDBTVShow): Movie {
  return {
    id: String(show.id),
    title: show.name,
    poster: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : "/placeholder.svg",
    backdrop: show.backdrop_path ? `https://image.tmdb.org/t/p/w1280${show.backdrop_path}` : undefined,
    rating: Math.round(show.vote_average * 10) / 10,
    year: show.first_air_date ? new Date(show.first_air_date).getFullYear().toString() : "",
    genre: show.genre_ids?.map((id) => GENRES[id]).filter(Boolean).join(", ") || "",
    synopsis: show.overview || "",
    language: show.original_language,
    mediaType: "tv",
  };
}

export function transformMovieDetails(data: TMDBMovieDetails) {
  const director = data.credits?.crew?.find((c) => c.job === "Director")?.name || "";
  const cast = (data.credits?.cast || []).slice(0, 6).map((c) => c.name);
  const castMembers = (data.credits?.cast || []).slice(0, 6).map((c) => ({
    id: c.id,
    name: c.name,
    character: c.character,
    photo: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null,
  }));
  const trailer = data.videos?.results?.find(
    (v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")
  );
  return {
    id: String(data.id),
    title: data.title,
    poster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : "/placeholder.svg",
    backdrop: data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : undefined,
    year: data.release_date ? new Date(data.release_date).getFullYear() : 0,
    rating: Math.round(data.vote_average * 10) / 10,
    duration: data.runtime ? `${data.runtime}min` : "",
    genres: data.genres.map((g) => g.name),
    synopsis: data.overview || "Sinopse não disponível.",
    director,
    cast,
    castMembers,
    language: data.original_language,
    tags: [],
    trailerKey: trailer?.key,
    mediaType: "movie" as const,
  };
}
