import { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { Radio, X, Search, Loader2, AlertTriangle, Maximize2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { LIVE_CHANNEL_OVERRIDES } from "@/data/liveChannelOverrides";
import Hls from "hls.js";

interface Channel {
  id: string;
  name: string;
  logo_url: string | null;
  stream_url: string;
  category: string;
  quality?: string | null;
}

const PROXY_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hls-proxy`;
const proxied = (u: string) => `${PROXY_BASE}?url=${encodeURIComponent(u)}`;

const Live = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("Todos");
  const [playing, setPlaying] = useState<Channel | null>(null);
  const [playerState, setPlayerState] = useState<"loading" | "playing" | "error">("loading");
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("live-channels");
        if (error) throw error;
        if (cancelled) return;
        const base: Channel[] = (data?.data || []) as Channel[];

        // Aplicar overrides manuais (substitui por id, ou adiciona)
        const map = new Map<string, Channel>();
        for (const c of base) map.set(c.id, c);
        for (const o of LIVE_CHANNEL_OVERRIDES) {
          const existing = map.get(o.id);
          map.set(o.id, {
            id: o.id,
            name: o.name || existing?.name || o.id,
            logo_url: o.logo_url ?? existing?.logo_url ?? null,
            stream_url: o.stream_url,
            category: o.category || existing?.category || "Outros",
            quality: o.quality ?? existing?.quality ?? null,
          });
        }
        setChannels(Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name)));
      } catch (e) {
        console.error("Erro ao carregar canais:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    channels.forEach((c) => c.category && set.add(c.category));
    return ["Todos", ...Array.from(set).sort()];
  }, [channels]);

  const filtered = useMemo(() => {
    return channels.filter((c) => {
      if (activeCategory !== "Todos" && c.category !== activeCategory) return false;
      if (query && !c.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [channels, query, activeCategory]);

  const grouped = useMemo(() => {
    const map = new Map<string, Channel[]>();
    filtered.forEach((c) => {
      const k = c.category || "Outros";
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(c);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  // Player HLS
  useEffect(() => {
    if (!playing || !videoRef.current) return;
    const video = videoRef.current;
    const src = proxied(playing.stream_url);
    setPlayerState("loading");

    // Cleanup
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    let cancelled = false;
    const onPlaying = () => !cancelled && setPlayerState("playing");
    const onError = () => !cancelled && setPlayerState("error");
    video.addEventListener("playing", onPlaying);
    video.addEventListener("error", onError);

    if (Hls.isSupported()) {
      const hls = new Hls({
        lowLatencyMode: true,
        liveSyncDurationCount: 3,
        maxBufferLength: 20,
        manifestLoadingMaxRetry: 3,
        fragLoadingMaxRetry: 4,
      });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) {
          console.error("[HLS]", data);
          setPlayerState("error");
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari/iOS — native HLS
      video.src = src;
      video.play().catch(() => {});
    } else {
      setPlayerState("error");
    }

    return () => {
      cancelled = true;
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("error", onError);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.removeAttribute("src");
      video.load();
    };
  }, [playing]);

  const enterFullscreen = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.requestFullscreen) v.requestFullscreen();
    // @ts-ignore Safari
    else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 pb-24 md:pb-12">
        <div className="px-6 md:px-12 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-6"
          >
            <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
              <Radio className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic">
                Ao Vivo
              </h1>
              <p className="text-white/40 font-bold tracking-widest uppercase text-xs">
                {loading ? "Carregando canais..." : `${channels.length} canais disponíveis`}
              </p>
            </div>
          </motion.div>

          <div className="relative max-w-md mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar canal..."
              className="w-full pl-11 pr-4 h-12 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-4 h-9 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                  activeCategory === cat ? "bg-primary text-white" : "bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 md:px-12 space-y-10">
          {loading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {Array.from({ length: 16 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-2xl" />
              ))}
            </div>
          ) : grouped.length === 0 ? (
            <div className="text-center py-20 text-white/40 font-bold">Nenhum canal encontrado</div>
          ) : (
            grouped.map(([cat, list]) => (
              <section key={cat}>
                <h2 className="text-lg font-black text-white uppercase tracking-tight italic mb-4">
                  {cat} <span className="text-white/30 text-sm ml-2">{list.length}</span>
                </h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {list.map((ch) => (
                    <button
                      key={ch.id}
                      onClick={() => setPlaying(ch)}
                      className="group relative aspect-square rounded-2xl bg-white/5 border border-white/10 hover:border-primary hover:bg-white/10 transition-all p-3 flex flex-col items-center justify-center gap-2 active:scale-95"
                    >
                      {ch.logo_url ? (
                        <img
                          src={ch.logo_url}
                          alt={ch.name}
                          loading="lazy"
                          className="w-full h-12 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.opacity = "0.2";
                          }}
                        />
                      ) : (
                        <Radio className="w-8 h-8 text-white/30" />
                      )}
                      <span className="text-[10px] font-bold text-white/70 text-center line-clamp-2 group-hover:text-white">
                        {ch.name}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </main>

      {/* Player Modal */}
      {playing && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col">
          <div className="flex items-center justify-between px-4 md:px-8 h-16 border-b border-white/10">
            <div className="flex items-center gap-3 min-w-0">
              <Radio className="w-5 h-5 text-red-500 shrink-0 animate-pulse" />
              <span className="font-black text-white uppercase tracking-tight italic truncate">
                {playing.name}
              </span>
              <span className="hidden md:inline text-xs font-bold text-white/40 uppercase tracking-widest">
                {playing.category}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={enterFullscreen}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                aria-label="Tela cheia"
                title="Tela cheia"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPlaying(null)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 bg-black relative flex items-center justify-center">
            <video
              ref={videoRef}
              className="w-full h-full"
              controls
              autoPlay
              playsInline
              poster={playing.logo_url || undefined}
            />

            {playerState === "loading" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 pointer-events-none">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-white/60 text-xs font-bold uppercase tracking-widest">
                    Carregando stream...
                  </p>
                </div>
              </div>
            )}

            {playerState === "error" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/85 px-6 text-center">
                <div className="flex flex-col items-center gap-3 max-w-md">
                  <AlertTriangle className="w-10 h-10 text-red-500" />
                  <p className="text-white font-black uppercase tracking-tight">
                    Canal indisponível
                  </p>
                  <p className="text-white/50 text-sm">
                    Este stream pode estar offline ou bloqueado pela fonte. Tente outro canal ou
                    adicione um override manual em <code className="text-white/70">src/data/liveChannelOverrides.ts</code>.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Live;
