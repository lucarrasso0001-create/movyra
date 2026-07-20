import { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Play, Plus, Star, Clock, Calendar, Globe, User, Check, Info, Share2, LayoutGrid, Loader2 } from "lucide-react";
import { useMovieDetails, usePopularMovies, TVEpisode } from "@/hooks/useTMDB";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import TrailerModal from "@/components/TrailerModal";
import PlayerFrame from "@/components/PlayerFrame";
import EpisodeSelector from "@/components/EpisodeSelector";
import MovieCarousel from "@/components/MovieCarousel";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

const MovieDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const mediaTypeParam = searchParams.get("type") as "movie" | "tv" | null;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite, isPending } = useFavorites();
  const { data: movie, isLoading, error } = useMovieDetails(id || "", mediaTypeParam || undefined);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [watching, setWatching] = useState(false);
  const [currentEpisode, setCurrentEpisode] = useState<{ episode: TVEpisode; season: number } | null>(null);

  // Recomendações (Simuladas com populares para preencher a página)
  const { data: recommendations } = usePopularMovies();

  const handleEpisodeSelect = (episode: TVEpisode, season: number) => {
    setCurrentEpisode({ episode, season });
    setWatching(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="relative h-[70vh] overflow-hidden">
          <Skeleton className="absolute inset-0" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-xl">
          <h1 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter italic">Conteúdo não encontrado</h1>
          <p className="text-muted-foreground mb-8">O filme ou série que você procura não está disponível no momento.</p>
          <Link to="/" className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-black uppercase tracking-tighter transition-all hover:scale-105">
            Voltar ao Início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section com Player Integrado */}
      <div className="relative min-h-[70vh] md:h-[85vh] overflow-hidden">
        <AnimatePresence mode="wait">
          {watching ? (
            <motion.div 
              key="player"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black"
            >
              <PlayerFrame 
                movieId={movie.id.toString()}
                movieTitle={currentEpisode ? `${movie.title} - S${currentEpisode.season}E${currentEpisode.episode.episode_number}` : movie.title}
                mediaType={movie.mediaType}
                seasonNumber={currentEpisode?.season}
                episodeNumber={currentEpisode?.episode.episode_number}
                onClose={() => setWatching(false)}
              />
            </motion.div>
          ) : (
            <motion.div 
              key="hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
                style={{ backgroundImage: `url(${movie.backdrop || movie.poster})` }}
              />
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent" />

              <div className="relative z-10 flex items-end h-full px-6 md:px-16 pb-16">
                <div className="max-w-4xl animate-fade-in">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <span className="bg-primary/20 text-primary px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest border border-primary/30">
                        {movie.mediaType === 'movie' ? 'Filme' : 'Série'}
                      </span>
                      {movie.rating && (
                        <span className="flex items-center gap-1 text-accent font-black text-sm">
                          <Star className="w-4 h-4 fill-current" /> {movie.rating}
                        </span>
                      )}
                    </div>

                    <h1 className="text-5xl md:text-8xl font-black text-white mb-6 uppercase tracking-tighter italic leading-[0.9]">
                      {movie.title}
                    </h1>

                    <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground mb-8 font-bold">
                      <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {movie.year}</span>
                      {movie.duration && <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {movie.duration}</span>}
                      <span className="flex items-center gap-1 uppercase"><Globe className="w-4 h-4" /> {movie.language}</span>
                    </div>

                    <p className="text-lg md:text-xl text-muted-foreground mb-10 line-clamp-3 max-w-2xl font-medium leading-relaxed">
                      {movie.synopsis}
                    </p>

                    <div className="flex items-center gap-4 flex-wrap">
                      <button
                        onClick={() => setWatching(true)}
                        className="flex items-center gap-3 bg-white text-black font-black uppercase tracking-tighter px-10 py-5 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-2xl group"
                      >
                        <Play className="w-6 h-6 fill-current group-hover:scale-110 transition-transform" /> Assistir Agora
                      </button>
                      
                      {movie.trailerKey && (
                        <button
                          onClick={() => setTrailerOpen(true)}
                          className="flex items-center gap-3 bg-white/10 backdrop-blur-xl hover:bg-white/20 text-white font-black uppercase tracking-tighter px-10 py-5 rounded-2xl transition-all hover:scale-105 active:scale-95 border border-white/10"
                        >
                          <Play className="w-6 h-6" /> Trailer
                        </button>
                      )}

                      <button
                        onClick={async () => {
                          if (!user) {
                            toast({ title: "Faça login", description: "Entre na sua conta para salvar filmes", variant: "destructive" });
                            navigate("/auth");
                            return;
                          }
                          await toggleFavorite(movie);
                        }}
                        disabled={isPending}
                        className={`p-5 rounded-2xl transition-all border border-white/10 ${
                          isFavorite(movie.id) ? "bg-primary text-primary-foreground" : "bg-white/10 backdrop-blur-xl hover:bg-white/20 text-white"
                        }`}
                      >
                        {isFavorite(movie.id) ? <Check className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                      </button>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Detalhes e Conteúdo Extra */}
      <div className="px-6 md:px-16 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* Coluna Principal */}
          <div className="lg:col-span-2">
            {movie.mediaType === "tv" && (
              <section className="mb-20">
                <div className="flex items-center justify-between mb-10">
                  <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic flex items-center gap-4">
                    <LayoutGrid className="w-8 h-8 text-primary" /> Episódios
                  </h2>
                </div>
                <div className="bg-white/5 rounded-3xl border border-white/10 p-6 backdrop-blur-sm">
                  <EpisodeSelector
                    tvId={movie.id}
                    onEpisodeSelect={handleEpisodeSelect}
                    currentEpisodeId={currentEpisode?.episode.id}
                  />
                </div>
              </section>
            )}

            <section className="mb-20">
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic mb-8 flex items-center gap-4">
                <Info className="w-8 h-8 text-primary" /> Sobre a Obra
              </h2>
              <div className="bg-white/5 rounded-3xl border border-white/10 p-8 backdrop-blur-sm">
                <p className="text-xl text-muted-foreground leading-relaxed mb-10 font-medium">
                  {movie.synopsis}
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 pt-8 border-t border-white/10">
                  {movie.director && (
                    <div>
                      <span className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Direção</span>
                      <span className="text-white font-bold">{movie.director}</span>
                    </div>
                  )}
                  <div>
                    <span className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Gêneros</span>
                    <div className="flex flex-wrap gap-2">
                      {movie.genres.map((g: any) => (
                        <span key={typeof g === 'string' ? g : g.id} className="text-white font-bold">
                          {typeof g === 'string' ? g : g.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Idioma Original</span>
                    <span className="text-white font-bold uppercase">{movie.language}</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Recomendações */}
        {recommendations && recommendations.length > 0 && (
          <div className="mt-32">
            <MovieCarousel 
              title="Quem assistiu também gostou" 
              movies={recommendations.slice(0, 12)} 
            />
          </div>
        )}
      </div>

      {/* Trailer Modal */}
      <TrailerModal 
        isOpen={trailerOpen}
        onClose={() => setTrailerOpen(false)}
        videoKey={movie.trailerKey}
        title={movie.title}
      />
    </div>
  );
};

export default MovieDetail;
