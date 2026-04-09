import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import MovieCard from "@/components/MovieCard";
import type { Movie } from "@/types/tmdb";

interface AIRec extends Movie {
  reason?: string;
}

interface RecData {
  section_title: string;
  movies: AIRec[];
}

const REC_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

export default function AIRecommendations() {
  const [data, setData] = useState<RecData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchRecs() {
      try {
        const resp = await fetch(REC_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ action: "recommendations" }),
        });

        if (!resp.ok) throw new Error("Failed");
        const result = await resp.json();
        if (!cancelled) setData(result);
      } catch {
        // Silently fail - AI recs are non-critical
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchRecs();
    return () => { cancelled = true; };
  }, []);

  if (loading || !data || data.movies.length === 0) return null;

  return (
    <div className="px-6 md:px-12 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-primary" />
        <h2 className="text-lg md:text-xl font-bold text-foreground">{data.section_title}</h2>
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">IA</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-3xl">
        {data.movies.map(movie => (
          <div key={movie.id} className="space-y-2">
            <MovieCard movie={movie} />
            {movie.reason && (
              <p className="text-xs text-muted-foreground line-clamp-2 px-1">
                <Sparkles className="w-3 h-3 inline mr-1 text-primary" />
                {movie.reason}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
