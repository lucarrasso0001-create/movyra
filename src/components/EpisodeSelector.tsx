import React, { useState } from "react";
import { useTVSeasons, useTVEpisodes, TVEpisode, TVSeason } from "@/hooks/useTMDB";
import { Play, ChevronDown, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

interface EpisodeSelectorProps {
  tvId: string;
  onEpisodeSelect: (episode: TVEpisode, seasonNumber: number) => void;
  currentEpisodeId?: number;
}

const EpisodeSelector = ({ tvId, onEpisodeSelect, currentEpisodeId }: EpisodeSelectorProps) => {
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [isSeasonOpen, setIsSeasonOpen] = useState(false);

  const { data: seasons, isLoading: loadingSeasons } = useTVSeasons(tvId);
  const { data: episodes, isLoading: loadingEpisodes } = useTVEpisodes(tvId, selectedSeason);

  const filteredSeasons = seasons?.filter(s => s.season_number > 0) || [];

  if (loadingSeasons) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-40 bg-white/5" />
        <div className="grid gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full bg-white/5" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Season Selector */}
      <div className="relative z-20">
        <button
          onClick={() => setIsSeasonOpen(!isSeasonOpen)}
          className="flex items-center gap-3 bg-zinc-900 border border-white/10 px-4 py-2 rounded-lg text-white font-black uppercase tracking-tighter hover:bg-zinc-800 transition-colors"
        >
          Temporada {selectedSeason}
          <ChevronDown className={`w-4 h-4 transition-transform ${isSeasonOpen ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {isSeasonOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full mt-2 left-0 w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden"
            >
              {filteredSeasons.map((season) => (
                <button
                  key={season.id}
                  onClick={() => {
                    setSelectedSeason(season.season_number);
                    setIsSeasonOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm font-bold uppercase tracking-tighter transition-colors hover:bg-white/5 ${
                    selectedSeason === season.season_number ? "text-primary bg-primary/5" : "text-white/60"
                  }`}
                >
                  Temporada {season.season_number}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Episodes List */}
      <div className="grid gap-4">
        {loadingEpisodes ? (
          [1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full bg-white/5 rounded-xl" />)
        ) : (
          episodes?.map((episode) => (
            <button
              key={episode.id}
              onClick={() => onEpisodeSelect(episode, selectedSeason)}
              className={`group flex items-start gap-4 p-4 rounded-xl border transition-all text-left ${
                currentEpisodeId === episode.id
                  ? "bg-primary/10 border-primary/50"
                  : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20"
              }`}
            >
              <div className="relative flex-shrink-0 w-32 md:w-48 aspect-video rounded-lg overflow-hidden bg-zinc-800">
                {episode.still_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w300${episode.still_path}`}
                    alt={episode.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="w-8 h-8 text-white/20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play className="w-10 h-10 text-white fill-current" />
                </div>
                <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/80 rounded text-[10px] font-black text-white uppercase tracking-widest">
                  Ep {episode.episode_number}
                </div>
              </div>

              <div className="flex-1 min-w-0 py-1">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="text-white font-black uppercase tracking-tighter truncate">
                    {episode.name}
                  </h4>
                  {currentEpisodeId === episode.id && (
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                </div>
                <p className="text-white/40 text-xs font-medium line-clamp-2 md:line-clamp-3 leading-relaxed">
                  {episode.overview || "Nenhuma descrição disponível para este episódio."}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default EpisodeSelector;
