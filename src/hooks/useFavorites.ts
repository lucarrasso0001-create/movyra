import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useFavorites() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: favorites = [] } = useQuery({
    queryKey: ["favorites", profile?.id],
    queryFn: async () => {
      if (!user || !profile) return [];
      const { data, error } = await supabase
        .from("favorites")
        .select("*")
        .eq("profile_id", profile.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!profile,
  });

  const mutation = useMutation({
    mutationFn: async (movie: any) => {
      if (!user || !profile) throw new Error("Not authenticated");
      const existing = favorites.find((f) => f.movie_id === String(movie.id));
      if (existing) {
        await supabase.from("favorites").delete().eq("id", existing.id);
      } else {
        await supabase.from("favorites").insert({
          user_id: user.id,
          profile_id: profile.id,
          movie_id: String(movie.id),
          movie_title: movie.title,
          movie_poster: movie.poster,
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["favorites", profile?.id] }),
  });

  return {
    favorites,
    isFavorite: (movieId: string) => favorites.some((f) => f.movie_id === movieId),
    toggleFavorite: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
}
