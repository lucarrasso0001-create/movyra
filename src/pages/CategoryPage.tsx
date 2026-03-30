import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchMovies, fetchTVShows } from "@/hooks/useTMDB";
import { Movie } from "@/types/tmdb";
import Navbar from "@/components/Navbar";
import MovieCard from "@/components/MovieCard";
import { ArrowLeft, Filter, LayoutGrid, List } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

// Mapeamento de slugs para nomes amigáveis e parâmetros de busca
const CATEGORY_MAP: Record<string, { title: string; type: "movie" | "tv"; endpoint: any; genreId?: number }> = {
  "now-playing": { title: "Em Exibição", type: "movie", endpoint: "now_playing" },
  "popular": { title: "Filmes Populares", type: "movie", endpoint: "popular" },
  "upcoming": { title: "Em Breve", type: "movie", endpoint: "upcoming" },
  "top-rated-movies": { title: "Melhores Filmes", type: "movie", endpoint: "top_rated" },
  "action": { title: "Ação", type: "movie", endpoint: "discover", genreId: 28 },
  "comedy": { title: "Comédia", type: "movie", endpoint: "discover", genreId: 35 },
  "horror": { title: "Terror", type: "movie", endpoint: "discover", genreId: 27 },
  "popular-tv": { title: "Séries Populares", type: "tv", endpoint: "popular" },
  "airing-today": { title: "Passando Hoje", type: "tv", endpoint: "airing_today" },
  "on-the-air": { title: "No Ar", type: "tv", endpoint: "on_the_air" },
  "top-rated-tv": { title: "Melhores Séries", type: "tv", endpoint: "top_rated" },
  "action-adventure-tv": { title: "Ação e Aventura", type: "tv", endpoint: "discover", genreId: 10759 },
  "sci-fi-fantasy-tv": { title: "Ficção e Fantasia", type: "tv", endpoint: "discover", genreId: 10765 },
  "comedy-tv": { title: "Comédia (TV)", type: "tv", endpoint: "discover", genreId: 35 },
};

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  const category = slug ? CATEGORY_MAP[slug] : null;
  const title = category?.title || "Categoria";

  const { data, isLoading, error } = useQuery({
    queryKey: ["category", slug],
    queryFn: async () => {
      if (!category) return { results: [] as Movie[] };
      const params: any = {};
      if (category.genreId) {
        params.with_genres = category.genreId.toString();
      }
      
      const result = category.type === "movie" 
        ? await fetchMovies(category.endpoint, params)
        : await fetchTVShows(category.endpoint, params);
      
      return result;
    },
    enabled: !!slug && !!category,
  });

  const movies = (data as any)?.results || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-12 px-6 md:px-12">
        {/* Header da Categoria */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Link 
              to={category?.type === "tv" ? "/series" : "/filmes"}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4 text-sm font-bold uppercase tracking-widest"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Link>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic leading-none">
              {title}
            </h1>
          </motion.div>

          <div className="flex items-center gap-4">
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
              <button 
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-white"}`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-white"}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
            <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2.5 rounded-xl border border-white/10 transition-all font-bold text-sm uppercase tracking-wider">
              <Filter className="w-4 h-4" /> Filtros
            </button>
          </div>
        </div>

        {/* Grid de Conteúdo */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[2/3]">
                <Skeleton className="w-full h-full rounded-2xl bg-white/5" />
              </div>
            ))}
          </div>
        ) : error || movies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
              <LayoutGrid className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Nenhum título encontrado</h2>
            <p className="text-muted-foreground max-w-md">
              Não conseguimos encontrar filmes ou séries nesta categoria no momento. Tente novamente mais tarde.
            </p>
          </div>
        ) : (
          <div className={viewMode === "grid" 
            ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
            : "flex flex-col gap-4"
          }>
            {movies.map((movie: Movie, index: number) => (
              <motion.div
                key={movie.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (index % 12) * 0.05 }}
              >
                {viewMode === "grid" ? (
                  <MovieCard movie={movie} />
                ) : (
                  <Link 
                    to={`/movie/${movie.id}?type=${category?.type || 'movie'}`}
                    className="flex gap-6 bg-white/5 hover:bg-white/10 p-4 rounded-2xl border border-white/5 transition-all group"
                  >
                    <img 
                      src={movie.poster} 
                      alt={movie.title} 
                      className="w-24 aspect-[2/3] object-cover rounded-lg shadow-lg group-hover:scale-105 transition-transform"
                    />
                    <div className="flex-1 py-2">
                      <h3 className="text-xl font-black text-white mb-2 group-hover:text-primary transition-colors uppercase italic tracking-tight">
                        {movie.title}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3 font-bold">
                        <span className="text-accent">{movie.rating} ★</span>
                        <span>{movie.year}</span>
                        <span className="uppercase tracking-widest text-[10px] bg-white/10 px-2 py-0.5 rounded">{movie.language}</span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 max-w-2xl">
                        {movie.synopsis}
                      </p>
                    </div>
                  </Link>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Paginação (Simulada) */}
        {!isLoading && movies.length > 0 && (
          <div className="mt-16 flex justify-center">
            <button className="bg-white text-black font-black uppercase tracking-tighter px-12 py-4 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-xl">
              Carregar Mais
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default CategoryPage;
