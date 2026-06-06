import { useState } from "react";
import { Search, Sparkles, Loader2 } from "lucide-react";
import MovieCard from "@/components/MovieCard";
import type { Movie } from "@/types/tmdb";
import { supabase } from "@/integrations/supabase/client";

const SEARCH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

interface SearchResult {
  suggestion: string;
  mood: string | null;
  intent: string;
  movies: Movie[];
}

export default function AISmartSearch() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    const text = query.trim();
    if (!text || isSearching) return;
    setIsSearching(true);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const resp = await fetch(SEARCH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ action: "smart_search", query: text }),
      });

      if (!resp.ok) throw new Error("Search failed");
      const data = await resp.json();
      setResult(data);
    } catch {
      setResult({ suggestion: "Não consegui buscar agora. Tente novamente.", mood: null, intent: "error", movies: [] });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="px-6 md:px-12 mb-8">
      {/* Search bar */}
      <div className="max-w-2xl mx-auto mb-6">
        <form
          onSubmit={e => { e.preventDefault(); handleSearch(); }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <div className="relative flex items-center bg-card/80 backdrop-blur-sm border border-border rounded-2xl overflow-hidden">
            <div className="pl-4">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder='Busca inteligente — ex: "filmes de terror dos anos 80" ou "algo leve pra assistir com a família"'
              className="flex-1 bg-transparent px-3 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <button
              type="submit"
              disabled={!query.trim() || isSearching}
              className="px-4 py-2 mr-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 hover:bg-primary/80 transition-colors flex items-center gap-1.5"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Buscar
            </button>
          </div>
        </form>
      </div>

      {/* Results */}
      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-2">
          {result.suggestion && (
            <div className="flex items-start gap-2 mb-4 max-w-2xl mx-auto">
              <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">{result.suggestion}</p>
            </div>
          )}
          {result.movies.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {result.movies.map(movie => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
