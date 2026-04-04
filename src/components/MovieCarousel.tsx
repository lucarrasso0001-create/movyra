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
  <div className="flex-none w-[140px] sm:w-[180px] md:w-[220px] lg:w-[260px] px-1.5 md:px-2">
    <Skeleton className="aspect-[2/3] rounded-2xl" />
  </div>
);

const MovieCarousel = ({ title, movies, isLoading = false, categorySlug }: MovieCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const updateArrows = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    // Usamos uma margem de erro de 5px para evitar problemas de arredondamento
    setShowLeftArrow(scrollLeft > 5);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", updateArrows, { passive: true });
      updateArrows();
      // Re-checa após o carregamento inicial e possíveis mudanças de layout
      const timer = setTimeout(updateArrows, 500);
      window.addEventListener("resize", updateArrows);
      
      return () => {
        el.removeEventListener("scroll", updateArrows);
        window.removeEventListener("resize", updateArrows);
        clearTimeout(timer);
      };
    }
  }, [movies, isLoading]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const { clientWidth } = scrollRef.current;
    // Movemos quase uma tela inteira, mas deixamos um card de contexto
    const scrollAmount = direction === "left" ? -clientWidth * 0.85 : clientWidth * 0.85;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  return (
    <section className="relative mb-12 overflow-visible">
      {/* Cabeçalho do Carrossel */}
      <div className="flex items-end justify-between px-6 md:px-14 mb-4 relative z-50">
        <div className="space-y-1">
          <h3 className="text-xl md:text-3xl font-black uppercase tracking-tighter text-white/90 group-hover:text-white transition-colors duration-300">
            {title}
          </h3>
          <div className="h-1 w-12 bg-primary rounded-full" />
        </div>
        
        {categorySlug && (
          <Link 
            to={`/categoria/${categorySlug}`} 
            className="group/link relative z-50 flex items-center gap-2 text-[10px] md:text-xs font-black text-muted-foreground hover:text-primary uppercase tracking-[0.2em] transition-all duration-300"
          >
            Ver Tudo
            <ChevronRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
          </Link>
        )}
      </div>

      {/* Container Principal do Carrossel */}
      <div className="relative group/carousel overflow-visible">
        
        {/* Botão Esquerdo - Visível apenas em Desktop e quando há scroll para a esquerda */}
        {showLeftArrow && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-0 bottom-0 z-40 w-14 md:w-16 hidden md:flex items-center justify-center bg-black/40 hover:bg-black/70 text-white transition-all duration-300 group-hover/carousel:opacity-100 opacity-0"
            aria-label="Rolar para esquerda"
          >
            <ChevronLeft className="w-10 h-10 hover:scale-125 transition-transform" />
          </button>
        )}

        {/* Container de Scroll com Padding Seguro */}
        <div 
          ref={scrollRef}
          className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory px-4 md:px-12 py-8 -my-8 scroll-smooth"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            scrollPaddingLeft: '3rem',
            scrollPaddingRight: '3rem'
          }}
        >
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <MovieCardSkeleton key={i} />)
          ) : (
            movies.map((movie, index) => (
              <div 
                key={`${movie.id}-${title}-${index}`}
                className="flex-none w-[150px] sm:w-[190px] md:w-[230px] lg:w-[270px] snap-start px-1.5 md:px-2.5"
              >
                {/* Wrapper para evitar corte no hover scale */}
                <div className="relative transition-transform duration-500 hover:scale-110 hover:z-50 origin-center">
                  <MovieCard movie={movie} />
                </div>
              </div>
            ))
          )}
          
          {/* Espaçador final para garantir que o último card não fique colado na borda */}
          <div className="flex-none w-4 md:w-12" />
        </div>

        {/* Botão Direito - Visível apenas em Desktop e quando há mais conteúdo */}
        {showRightArrow && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-0 bottom-0 z-40 w-14 md:w-16 hidden md:flex items-center justify-center bg-black/40 hover:bg-black/70 text-white transition-all duration-300 group-hover/carousel:opacity-100 opacity-0"
            aria-label="Rolar para direita"
          >
            <ChevronRight className="w-10 h-10 hover:scale-125 transition-transform" />
          </button>
        )}
      </div>
    </section>
  );
};

export default MovieCarousel;
