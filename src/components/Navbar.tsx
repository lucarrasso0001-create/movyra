import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Menu, X, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";

interface NavbarProps {
  onSearchChange?: (query: string) => void;
}

const Navbar = ({ onSearchChange }: NavbarProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut, profile } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5">
      <div className="flex items-center justify-between px-4 md:px-8 h-16">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-primary font-black text-2xl tracking-tighter">
            MOVYRA
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-bold uppercase tracking-widest text-white/60">
            <Link to="/" className="hover:text-white transition-colors">Início</Link>
            <Link to="/filmes" className="hover:text-white transition-colors">Filmes</Link>
            <Link to="/series" className="hover:text-white transition-colors">Séries</Link>
            <Link to="/bombando" className="hover:text-white transition-colors">Bombando</Link>
            <Link to="/my-list" className="hover:text-white transition-colors">Minha Lista</Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {onSearchChange && (
            <div className="relative">
              {isSearchOpen ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Buscar..."
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-primary w-48 md:w-64"
                    autoFocus
                  />
                  <button onClick={() => { setIsSearchOpen(false); onSearchChange(""); }}>
                    <X className="w-5 h-5 text-white/60" />
                  </button>
                </div>
              ) : (
                <button onClick={() => setIsSearchOpen(true)}>
                  <Search className="w-5 h-5 text-white/60 hover:text-white transition-colors" />
                </button>
              )}
            </div>
          )}

          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/perfis" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center overflow-hidden">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-primary" />
                  )}
                </div>
              </Link>
            </div>
          ) : (
            <Link to="/auth" className="text-sm font-bold text-white hover:text-primary transition-colors">
              Entrar
            </Link>
          )}

          <button className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <Menu className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
