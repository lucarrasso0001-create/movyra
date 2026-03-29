import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import MovieCard from "./MovieCard";
import type { Movie } from "@/types/tmdb";
import { Skeleton } from "./ui/skeleton";

interface MovieCarouselProps {
  title: string;
  movies: Movie[];
  isLoading?: boolean;
  categorySlug?: string;
  autoplay?: boolean;
}

const MovieCardSkeleton = () => (
  <div className="min-w-[160px] md:min-w-[200px]">
    <Skeleton className="aspect-[2/3] rounded-lg" />
  </div>
);

const MovieCarousel = ({ title, movies, isLoading = false, categorySlug, autoplay = false }: MovieCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 20);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
  };

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: direction === "left" ? -500 : 500, behavior: "smooth" });
  };

  return (
    <section className="relative group mb-12 overflow-visible">
      <div className="flex items-center justify-between px-6 md:px-12 mb-4">
        <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-foreground/90 group-hover:text-foreground transition-colors">
          {title}
        </h3>
        {categorySlug && (
          <Link to={`/categoria/${categorySlug}`} className="text-[10px] md:text-xs font-black text-primary hover:text-foreground uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all duration-300">
            Explorar Tudo
          </Link>
        )}
      </div>

      <div className="relative group/row">
        <button
          onClick={() => scroll("left")}
          className={`absolute left-0 top-0 bottom-0 z-30 w-12 md:w-16 flex items-center justify-center bg-black/80 opacity-0 group-hover/row:opacity-100 transition-all duration-300 ${!showLeftArrow && 'hidden'}`}
        >
          <ChevronLeft className="text-white w-8 h-8 hover:scale-125 transition-transform" />
        </button>

        <div ref={scrollRef} onScroll={handleScroll} className="flex gap-4 overflow-x-auto scrollbar-hide px-6 md:px-12 py-6">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <MovieCardSkeleton key={i} />)
            : movies.map((movie) => (
                <div key={movie.id + title} className="min-w-[160px] md:min-w-[200px]">
                  <MovieCard movie={movie} />
                </div>
              ))}
        </div>

        <button
          onClick={() => scroll("right")}
          className={`absolute right-0 top-0 bottom-0 z-30 w-12 md:w-16 flex items-center justify-center bg-black/80 opacity-0 group-hover/row:opacity-100 transition-all duration-300 ${!showRightArrow && 'hidden'}`}
        >
          <ChevronRight className="text-white w-8 h-8 hover:scale-125 transition-transform" />
        </button>
      </div>
    </section>
  );
};

export default MovieCarousel;
