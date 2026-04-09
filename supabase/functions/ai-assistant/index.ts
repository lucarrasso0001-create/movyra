import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const TMDB_API_KEY = Deno.env.get("TMDB_API_KEY");

    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader || "" } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, messages, query } = body;

    // ========== CHAT ==========
    if (action === "chat") {
      // Fetch user context
      const { data: watchHistory } = await supabase
        .from("watch_history")
        .select("movie_title, media_type, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(15);

      const { data: favorites } = await supabase
        .from("favorites")
        .select("movie_title")
        .eq("user_id", user.id)
        .limit(20);

      const { data: ratings } = await supabase
        .from("ratings")
        .select("movie_id, rating")
        .eq("user_id", user.id)
        .order("rating", { ascending: false })
        .limit(10);

      const historyContext = watchHistory?.map(h => h.movie_title).join(", ") || "nenhum";
      const favContext = favorites?.map(f => f.movie_title).join(", ") || "nenhum";
      const ratingsContext = ratings?.map(r => `${r.movie_id}(${r.rating}★)`).join(", ") || "nenhum";

      const systemPrompt = `Você é a Movyra AI, a assistente inteligente da plataforma de streaming Movyra. Você é simpática, divertida e extremamente conhecedora de filmes, séries e animes.

CONTEXTO DO USUÁRIO:
- Últimos assistidos: ${historyContext}
- Favoritos: ${favContext}
- Avaliações: ${ratingsContext}

SUAS CAPACIDADES:
1. Recomendar filmes/séries baseado no gosto do usuário
2. Dar informações detalhadas sobre qualquer filme, série ou anime
3. Sugerir filmes por humor, gênero, época, diretor, ator
4. Criar listas temáticas personalizadas
5. Explicar curiosidades e easter eggs de filmes
6. Comparar filmes e ajudar na decisão do que assistir

REGRAS:
- Responda sempre em português brasileiro
- Seja concisa mas informativa
- Use emojis com moderação para tornar a conversa agradável
- Quando recomendar algo, explique brevemente POR QUE o usuário vai gostar
- Formate listas com markdown quando apropriado
- Se não souber algo, admita honestamente`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...(messages || []),
          ],
          stream: true,
        }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) {
          return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (status === 402) {
          return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`AI gateway error: ${status}`);
      }

      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // ========== SMART SEARCH ==========
    if (action === "smart_search") {
      const searchPrompt = `O usuário está em uma plataforma de streaming e pesquisou: "${query}"

Analise a intenção da busca e retorne uma resposta JSON usando a tool fornecida. Identifique:
- Se é uma busca direta por título
- Se é uma busca por critérios (gênero, ano, mood, diretor, etc)
- Extraia palavras-chave TMDB relevantes para busca`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: "Você é um parser de busca para plataforma de streaming. Analise a intenção do usuário e extraia informações estruturadas." },
            { role: "user", content: searchPrompt },
          ],
          tools: [{
            type: "function",
            function: {
              name: "parse_search",
              description: "Parse a natural language search query into structured search parameters",
              parameters: {
                type: "object",
                properties: {
                  intent: { type: "string", enum: ["title_search", "criteria_search", "recommendation"] },
                  keywords: { type: "array", items: { type: "string" }, description: "Keywords to search on TMDB" },
                  genres: { type: "array", items: { type: "number" }, description: "TMDB genre IDs: 28=Action,12=Adventure,16=Animation,35=Comedy,80=Crime,99=Documentary,18=Drama,10751=Family,14=Fantasy,36=History,27=Horror,10402=Music,9648=Mystery,10749=Romance,878=SciFi,53=Thriller,10752=War,37=Western" },
                  year_range: { type: "object", properties: { from: { type: "number" }, to: { type: "number" } } },
                  mood: { type: "string", description: "The mood/vibe the user is looking for" },
                  suggestion: { type: "string", description: "A friendly suggestion message in Portuguese to show the user" },
                },
                required: ["intent", "keywords", "suggestion"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "parse_search" } },
        }),
      });

      if (!response.ok) throw new Error("AI search parse failed");

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      let parsed = { intent: "title_search", keywords: [query], suggestion: "", genres: [], year_range: null };

      if (toolCall?.function?.arguments) {
        try {
          parsed = JSON.parse(toolCall.function.arguments);
        } catch {}
      }

      // Now fetch from TMDB based on parsed intent
      let tmdbResults: any[] = [];

      if (TMDB_API_KEY) {
        const tmdbBase = "https://api.themoviedb.org/3";

        if (parsed.intent === "title_search" && parsed.keywords.length > 0) {
          const searchRes = await fetch(
            `${tmdbBase}/search/multi?api_key=${TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(parsed.keywords.join(" "))}&page=1`
          );
          const searchData = await searchRes.json();
          tmdbResults = (searchData.results || [])
            .filter((r: any) => r.media_type === "movie" || r.media_type === "tv")
            .slice(0, 12);
        } else {
          // Criteria-based discovery
          const params = new URLSearchParams({
            api_key: TMDB_API_KEY,
            language: "pt-BR",
            sort_by: "popularity.desc",
            page: "1",
          });
          if (parsed.genres && parsed.genres.length > 0) {
            params.set("with_genres", parsed.genres.join(","));
          }
          if (parsed.year_range) {
            if (parsed.year_range.from) params.set("primary_release_date.gte", `${parsed.year_range.from}-01-01`);
            if (parsed.year_range.to) params.set("primary_release_date.lte", `${parsed.year_range.to}-12-31`);
          }

          const discoverRes = await fetch(`${tmdbBase}/discover/movie?${params.toString()}`);
          const discoverData = await discoverRes.json();
          tmdbResults = (discoverData.results || []).slice(0, 12);
        }
      }

      // Transform results
      const movies = tmdbResults.map((r: any) => ({
        id: String(r.id),
        title: r.title || r.name,
        poster: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : "/placeholder.svg",
        backdrop: r.backdrop_path ? `https://image.tmdb.org/t/p/w1280${r.backdrop_path}` : undefined,
        rating: Math.round((r.vote_average || 0) * 10) / 10,
        year: (r.release_date || r.first_air_date || "").slice(0, 4),
        genre: "",
        synopsis: r.overview || "",
        language: r.original_language || "en",
        mediaType: r.media_type || "movie",
      }));

      return new Response(JSON.stringify({
        suggestion: parsed.suggestion,
        mood: parsed.mood || null,
        intent: parsed.intent,
        movies,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ========== AI RECOMMENDATIONS ==========
    if (action === "recommendations") {
      const { data: watchHistory } = await supabase
        .from("watch_history")
        .select("movie_title, movie_id, media_type")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(10);

      const { data: favorites } = await supabase
        .from("favorites")
        .select("movie_title, movie_id")
        .eq("user_id", user.id)
        .limit(15);

      const { data: ratings } = await supabase
        .from("ratings")
        .select("movie_id, rating")
        .eq("user_id", user.id)
        .order("rating", { ascending: false })
        .limit(10);

      const context = {
        watched: watchHistory?.map(h => h.movie_title) || [],
        favorites: favorites?.map(f => f.movie_title) || [],
        topRated: ratings?.filter(r => r.rating >= 4).map(r => r.movie_id) || [],
      };

      // Ask AI for recommendations
      const recPrompt = `Baseado neste perfil de usuário de streaming:
- Assistiu recentemente: ${context.watched.join(", ") || "nenhum dado"}
- Favoritos: ${context.favorites.join(", ") || "nenhum dado"}

Sugira exatamente 3 recomendações personalizadas. Para cada uma, forneça um título real de filme ou série e uma razão curta e personalizada.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: "Você recomenda filmes e séries. Use tool calling para retornar dados estruturados." },
            { role: "user", content: recPrompt },
          ],
          tools: [{
            type: "function",
            function: {
              name: "suggest_movies",
              description: "Return personalized movie/series recommendations",
              parameters: {
                type: "object",
                properties: {
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Exact movie/series title for TMDB search" },
                        reason: { type: "string", description: "Short personalized reason in Portuguese" },
                        search_query: { type: "string", description: "TMDB search query" },
                      },
                      required: ["title", "reason", "search_query"],
                    },
                  },
                  section_title: { type: "string", description: "A creative section title in Portuguese like 'Porque você amou X'" },
                },
                required: ["recommendations", "section_title"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "suggest_movies" } },
        }),
      });

      if (!response.ok) throw new Error("AI recommendations failed");

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      let recs = { recommendations: [], section_title: "Recomendado pela IA" };

      if (toolCall?.function?.arguments) {
        try { recs = JSON.parse(toolCall.function.arguments); } catch {}
      }

      // Fetch TMDB data for each recommendation
      const enrichedRecs = [];
      if (TMDB_API_KEY) {
        for (const rec of (recs.recommendations || []).slice(0, 3)) {
          try {
            const searchRes = await fetch(
              `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(rec.search_query || rec.title)}&page=1`
            );
            const searchData = await searchRes.json();
            const match = searchData.results?.find((r: any) => r.media_type === "movie" || r.media_type === "tv");
            if (match) {
              enrichedRecs.push({
                id: String(match.id),
                title: match.title || match.name,
                poster: match.poster_path ? `https://image.tmdb.org/t/p/w500${match.poster_path}` : "/placeholder.svg",
                backdrop: match.backdrop_path ? `https://image.tmdb.org/t/p/w1280${match.backdrop_path}` : undefined,
                rating: Math.round((match.vote_average || 0) * 10) / 10,
                year: (match.release_date || match.first_air_date || "").slice(0, 4),
                genre: "",
                synopsis: match.overview || "",
                language: match.original_language || "en",
                mediaType: match.media_type || "movie",
                reason: rec.reason,
              });
            }
          } catch {}
        }
      }

      return new Response(JSON.stringify({
        section_title: recs.section_title,
        movies: enrichedRecs,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
