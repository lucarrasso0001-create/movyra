import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useInView } from "react-intersection-observer";
import MovieCard from "./MovieCard";
import MovieCardSkeleton from "./MovieCardSkeleton";
import type { Movie } from "@/types/tmdb";

interface MovieCarouselProps {
  title: string;
  movies: Movie[];
  isLoading?: boolean;
  categorySlug?: string;
  autoplay?: boolean;
}

const MovieCarousel = ({ title, movies, isLoading = false, categorySlug, autoplay = false }: MovieCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const { ref: inViewRef, inView } = useInView({ triggerOnce: true, rootMargin: "200px" });

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 20);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
  };

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 500;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  // Autoplay Logic
  useEffect(() => {
    if (!autoplay || !inView || movies.length === 0) return;

    const interval = setInterval(() => {
      if (!scrollRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      
      if (scrollLeft + clientWidth >= scrollWidth - 10) {
        scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        scrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [autoplay, inView, movies.length]);

  return (
    <section
      ref={inViewRef}
      className="relative group mb-12 overflow-visible"
    >
      <div className="flex items-center justify-between px-6 md:px-12 mb-4">
        <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-white/90 group-hover:text-white transition-colors">
          {title}
        </h3>
        {categorySlug && (
          <Link 
            to={`/categoria/${categorySlug}`}
            className="text-[10px] md:text-xs font-black text-primary hover:text-white uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all duration-300"
          >
            Explorar Tudo
          </Link>
        )}
      </div>

      <div className="relative group/row">
        {/* Left Arrow */}
        <button
          onClick={() => scroll("left")}
          className={`absolute left-0 top-0 bottom-0 z-30 w-12 md:w-16 flex items-center justify-center bg-black/80 opacity-0 group-hover/row:opacity-100 transition-all duration-300 disabled:hidden ${!showLeftArrow && 'hidden'}`}
        >
          <ChevronLeft className="text-white w-8 h-8 hover:scale-125 transition-transform" />
        </button>

        {/* Scrollable Row */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto scrollbar-hide px-6 md:px-12 py-6"
        >
          {!inView || isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <MovieCardSkeleton key={i} />
              ))
            : movies.map((movie) => (
                <div key={movie.id + title} className="min-w-[160px] md:min-w-[200px]">
                  <MovieCard movie={movie} />
                </div>
              ))}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scroll("right")}
          className={`absolute right-0 top-0 bottom-0 z-30 w-12 md:w-16 flex items-center justify-center bg-black/80 opacity-0 group-hover/row:opacity-100 transition-all duration-300 disabled:hidden ${!showRightArrow && 'hidden'}`}
        >
          <ChevronRight className="text-white w-8 h-8 hover:scale-125 transition-transform" />
        </button>
      </div>
    </section>
  );
};

export default MovieCarousel;
