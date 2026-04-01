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
}

const MovieCardSkeleton = () => (
  <div className="flex-none w-[140px] sm:w-[180px] md:w-[220px] lg:w-[260px]">
    <Skeleton className="aspect-[2/3] rounded-xl" />
  </div>
);

const MovieCarousel = ({ title, movies, isLoading = false, categorySlug }: MovieCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const updateArrows = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 10);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", updateArrows);
      updateArrows();
      const timer = setTimeout(updateArrows, 500);
      return () => {
        el.removeEventListener("scroll", updateArrows);
        clearTimeout(timer);
      };
    }
  }, [movies, isLoading]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const { clientWidth } = scrollRef.current;
    const scrollAmount = direction === "left" ? -clientWidth * 0.8 : clientWidth * 0.8;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  return (
    <section className="relative mb-12 group/section overflow-visible">
      <div className="flex items-end justify-between px-4 md:px-12 mb-6">
        <div className="space-y-1">
          <h3 className="text-xl md:text-3xl font-black uppercase tracking-tighter text-white/90 group-hover/section:text-white transition-colors duration-500">
            {title}
          </h3>
          <div className="h-1 w-12 bg-primary rounded-full scale-x-0 group-hover/section:scale-x-100 transition-transform duration-500 origin-left" />
        </div>
        
        {categorySlug && (
          <Link 
            to={`/categoria/${categorySlug}`} 
            className="group/link flex items-center gap-2 text-[10px] md:text-xs font-black text-muted-foreground hover:text-primary uppercase tracking-[0.2em] transition-all duration-300"
          >
            Ver Tudo
            <ChevronRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
          </Link>
        )}
      </div>

      <div className="relative group/carousel px-0 md:px-4 overflow-visible">
        {/* Botão Esquerdo */}
        {showLeftArrow && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-4 md:left-12 top-1/2 -translate-y-1/2 z-40 w-12 h-12 md:w-14 md:h-14 flex items-center justify-center bg-black/60 hover:bg-primary backdrop-blur-md rounded-full border border-white/10 text-white shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 group/btn hidden md:flex"
          >
            <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 group-hover/btn:-translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Container de Scroll */}
        <div 
          ref={scrollRef}
          className="flex gap-3 md:gap-5 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-4 md:px-12 py-4 scroll-smooth"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <MovieCardSkeleton key={i} />)
          ) : (
            movies.map((movie, index) => (
              <div 
                key={`${movie.id}-${title}-${index}`}
                className="flex-none w-[140px] sm:w-[180px] md:w-[220px] lg:w-[260px] snap-start"
              >
                <div className="transform transition-all duration-500 hover:scale-[1.05] hover:z-50">
                  <MovieCard movie={movie} />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Botão Direito */}
        {showRightArrow && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2 z-40 w-12 h-12 md:w-14 md:h-14 flex items-center justify-center bg-black/60 hover:bg-primary backdrop-blur-md rounded-full border border-white/10 text-white shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 group/btn hidden md:flex"
          >
            <ChevronRight className="w-6 h-6 md:w-8 md:h-8 group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>
    </section>
  );
};

export default MovieCarousel;
