import { useMemo } from "react";
import { useTopRatedMovies } from "@/hooks/useTMDB";
import type { Movie } from "@/types/tmdb";

export function useRecommendations() {
  const { data: topRated, isLoading } = useTopRatedMovies();

  const recommendations = useMemo(() => {
    return topRated?.slice(0, 10) || [];
  }, [topRated]);

  return {
    recommendations,
    isLoading,
    hasRecommendations: recommendations.length > 0,
  };
}
