import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Plus, Star, Clock, Calendar, Globe, User, Check } from "lucide-react";
import StarRating from "@/components/StarRating";
import { useMovieDetails } from "@/hooks/useTMDB";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import TrailerModal from "@/components/TrailerModal";
import PlayerFrame from "@/components/PlayerFrame";
import EpisodeSelector from "@/components/EpisodeSelector";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatePresence } from "framer-motion";
import { TVEpisode } from "@/hooks/useTMDB";

const MovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite, isPending } = useFavorites();
  const { data: movie, isLoading, error } = useMovieDetails(id || "");
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [watching, setWatching] = useState(false);
  const [currentEpisode, setCurrentEpisode] = useState<{episode: TVEpisode, season: number} | null>(null);

  const handleEpisodeSelect = (episode: TVEpisode, season: number) => {
    setCurrentEpisode({ episode, season });
    setWatching(true);
  };

  if (isLoading) {
    return <div className="min-h-screen bg-background">
        <Navbar />
        <div className="relative h-[60vh] md:h-[70vh] overflow-hidden">
          <Skeleton className="absolute inset-0" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          <div className="relative z-10 flex items-end h-full px-4 md:px-12 pb-8">
            <div className="flex gap-6 md:gap-8 items-end max-w-5xl w-full">
              <Skeleton className="hidden sm:block w-40 md:w-52 aspect-[2/3] rounded-lg" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-12 w-3/4" />
                <div className="flex gap-3">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <div className="flex gap-3">
                  <Skeleton className="h-12 w-40" />
                  <Skeleton className="h-12 w-32" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>;
  }

  if (error || !movie) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Filme não encontrado</h1>
          <Link to="/" className="text-primary hover:underline">
            Voltar ao início
          </Link>
        </div>
      </div>;
  }

  return <div className="min-h-screen bg-background">
      <Navbar />

      {/* Parallax Header */}
      <div className="relative h-[60vh] md:h-[70vh] overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{
        backgroundImage: `url(${movie.backdrop || movie.poster})`,
        backgroundAttachment: "fixed"
      }} />
        <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

        <div className="relative z-10 flex items-end h-full px-4 md:px-12 pb-8">
          <div className="flex gap-6 md:gap-8 items-end max-w-5xl animate-fade-in">
            <img src={movie.poster} alt={movie.title} className="hidden sm:block w-40 md:w-52 rounded-lg shadow-2xl border border-white/10" />

            <div className="flex-1">
              <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Voltar
              </Link>

              <h1 className="text-4xl md:text-6xl font-black mb-3 uppercase tracking-tighter leading-none">{movie.title}</h1>

              <div className="flex items-center gap-3 flex-wrap text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1 text-accent font-black">
                  <Star className="w-4 h-4 fill-current" /> {movie.rating}
                </span>
                <span className="flex items-center gap-1 font-bold">
                  <Calendar className="w-4 h-4" /> {movie.year}
                </span>
                {movie.duration && <span className="flex items-center gap-1 font-bold">
                    <Clock className="w-4 h-4" /> {movie.duration}
                  </span>}
                <span className="flex items-center gap-1 font-bold">
                  <Globe className="w-4 h-4" /> {movie.language.toUpperCase()}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap mb-6">
                {movie.genres.map(g => <span key={g} className="text-[10px] font-black uppercase tracking-widest bg-white/10 text-white px-3 py-1 rounded-full border border-white/10">
                    {g}
                  </span>)}
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setWatching(true)}
                  className="flex items-center gap-2 bg-white text-black font-black uppercase tracking-tighter px-8 py-4 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-xl"
                >
                  <Play className="w-5 h-5 fill-current" /> Assistir Agora
                </button>
                {movie.trailerKey && (
                  <button
                    onClick={() => setTrailerOpen(true)}
                    className="flex items-center gap-2 bg-zinc-800/80 backdrop-blur-md hover:bg-zinc-700 text-white font-black uppercase tracking-tighter px-8 py-4 rounded-xl transition-all hover:scale-105 active:scale-95 border border-white/10"
                  >
                    <Play className="w-5 h-5" /> Trailer
                  </button>
                )}
                <button
                  onClick={async () => {
                    if (!user) {
                      toast({ title: "Faça login", description: "Entre na sua conta para salvar filmes", variant: "destructive" });
                      navigate("/auth");
                      return;
                    }
                    try {
                      await toggleFavorite(movie);
                    } catch {
                      toast({ title: "Erro", description: "Não foi possível atualizar sua lista", variant: "destructive" });
                    }
                  }}
                  disabled={isPending}
                  className={`p-4 rounded-xl transition-all disabled:opacity-50 border border-white/10 ${isFavorite(movie.id) ? "bg-primary text-primary-foreground" : "bg-zinc-800/80 backdrop-blur-md hover:bg-zinc-700 text-white"}`}
                >
                  {isFavorite(movie.id) ? <Check className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-12 py-12 max-w-5xl">
        <section className="mb-12">
          <h2 className="text-xl font-black uppercase tracking-tighter mb-4 border-l-4 border-primary pl-4">Sinopse</h2>
          <p className="text-white/70 text-lg leading-relaxed font-medium">{movie.synopsis}</p>
          
          <div className="mt-8 pt-8 border-t border-white/5">
            <StarRating movieId={id || ""} />
          </div>
        </section>

        {movie.director && <section className="mb-12">
            <h2 className="text-xl font-black uppercase tracking-tighter mb-4 border-l-4 border-primary pl-4">Direção</h2>
            <p className="text-white/70 text-lg font-bold">{movie.director}</p>
          </section>}

          {movie.mediaType === "tv" && (
            <section className="mb-16">
              <h3 className="text-white font-black uppercase tracking-tighter text-2xl mb-8 flex items-center gap-4">
                <Play className="w-6 h-6 text-primary" /> Episódios
              </h3>
              <EpisodeSelector 
                tvId={movie.id} 
                onEpisodeSelect={handleEpisodeSelect}
                currentEpisodeId={currentEpisode?.episode.id}
              />
            </section>
          )}

          {movie.castMembers && movie.castMembers.length > 0 && <section className="mb-16">
              <h3 className="text-white font-black uppercase tracking-tighter text-2xl mb-8 flex items-center gap-4">
                <User className="w-6 h-6 text-primary" /> Elenco Principal
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {movie.castMembers.map(actor => <div key={actor.id} className="group bg-white/5 border border-white/5 rounded-2xl overflow-hidden transition-all hover:bg-white/10 hover:border-white/20 hover:-translate-y-2">
                  <div className="aspect-[2/3] overflow-hidden bg-zinc-800">
                    {actor.photo ? <img src={actor.photo} alt={actor.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" /> : <div className="w-full h-full flex items-center justify-center">
                        <User className="w-12 h-12 text-white/10" />
                      </div>}
                  </div>
                  <div className="p-4">
                    <p className="font-black text-sm truncate uppercase tracking-tighter">{actor.name}</p>
                    <p className="text-xs text-white/40 font-bold truncate">{actor.character}</p>
                  </div>
                </div>)}
            </div>
          </section>}
      </div>ter className="py-12 px-4 md:px-12 border-t border-white/5 bg-black/20">
        <p className="text-white/20 text-xs font-black uppercase tracking-widest">© 2026 Movyra. Todos os direitos reservados.</p>
      </footer>

      <AnimatePresence>
        {watching && (
          <PlayerFrame 
            movie={currentEpisode ? {
              ...movie,
              title: `${movie.title} - T${currentEpisode.season}E${currentEpisode.episode.episode_number}: ${currentEpisode.episode.name}`,
              id: `${movie.id}-s${currentEpisode.season}e${currentEpisode.episode.episode_number}`
            } : movie} 
            onClose={() => setWatching(false)} 
          />
        )}
      </AnimatePresence>

      <TrailerModal isOpen={trailerOpen} onClose={() => setTrailerOpen(false)} videoKey={movie.trailerKey || null} title={movie.title} />
    </div>;
};

export default MovieDetail;
