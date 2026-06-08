import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { Radio, X, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

interface Channel {
  id: string;
  name: string;
  logo_url: string;
  embed_url: string;
  category: string;
}

const Live = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("Todos");
  const [playing, setPlaying] = useState<Channel | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("warez-channels");
        if (error) throw error;
        if (!cancelled) setChannels((data?.data || []) as Channel[]);
      } catch (e) {
        console.error("Erro ao carregar canais:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
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

          {/* Busca */}
          <div className="relative max-w-md mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar canal..."
              className="w-full pl-11 pr-4 h-12 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-primary"
            />
          </div>

          {/* Categorias */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-4 h-9 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                  activeCategory === cat
                    ? "bg-primary text-white"
                    : "bg-white/5 text-white/60 hover:bg-white/10"
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
                      <img
                        src={ch.logo_url}
                        alt={ch.name}
                        loading="lazy"
                        className="w-full h-12 object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.2"; }}
                      />
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
              <span className="font-black text-white uppercase tracking-tight italic truncate">{playing.name}</span>
              <span className="hidden md:inline text-xs font-bold text-white/40 uppercase tracking-widest">{playing.category}</span>
            </div>
            <button
              onClick={() => setPlaying(null)}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 bg-black">
            <iframe
              src={playing.embed_url}
              className="w-full h-full"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Live;
