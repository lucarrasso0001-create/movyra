import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useWatchHistory() {
  const { user, profile } = useAuth();

  return useQuery({
    queryKey: ["watch_history", profile?.id],
    queryFn: async () => {
      if (!user || !profile) return [];
      const { data, error } = await supabase
        .from("watch_history")
        .select("*")
        .eq("profile_id", profile.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!profile,
  });
}

export function useUpdateProgress() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      mediaId,
      currentTime,
      duration,
      mediaType = "movie",
      seasonNumber,
      episodeNumber,
      episodeTitle,
      movieTitle,
      moviePoster,
    }: {
      mediaId: string;
      currentTime: number;
      duration: number;
      mediaType?: string;
      seasonNumber?: number;
      episodeNumber?: number;
      episodeTitle?: string;
      movieTitle?: string;
      moviePoster?: string;
    }) => {
      if (!user || !profile) return;

      const { error } = await supabase.from("watch_history").upsert(
        {
          user_id: user.id,
          profile_id: profile.id,
          movie_id: mediaId,
          movie_title: movieTitle || mediaId,
          movie_poster: moviePoster,
          progress_seconds: Math.floor(currentTime),
          duration_seconds: Math.floor(duration),
          media_type: mediaType,
          season_number: seasonNumber,
          episode_number: episodeNumber,
          episode_title: episodeTitle,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "profile_id,movie_id" }
      );

      if (error) console.error("Error updating progress:", error);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["watch_history", profile?.id] }),
  });
}
