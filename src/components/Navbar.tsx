import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Menu, X, User, Settings, LogOut, UserCircle } from "lucide-react";
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
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5 md:rounded-none">
      <div className="flex items-center justify-between px-4 md:px-8 h-14 md:h-16">
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
                    className="bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-primary w-48 md:w-64"
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
            <div className="relative">
              <button 
                onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                className="flex items-center gap-2 group"
              >
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border-2 border-white/10 group-hover:border-primary/50 transition-all">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-primary" />
                  )}
                </div>
              </button>

              <AnimatePresence>
                {isAccountMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsAccountMenuOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-56 bg-[#141414] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-white/5 bg-white/5">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Perfil Atual</p>
                        <p className="text-sm font-black text-white truncate">{profile?.display_name || user.email}</p>
                      </div>
                      
                      <div className="p-2">
                        <Link 
                          to="/conta" 
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-white/70 hover:text-white hover:bg-white/5 transition-all"
                          onClick={() => setIsAccountMenuOpen(false)}
                        >
                          <Settings className="w-4 h-4 text-primary" />
                          Configurações da Conta
                        </Link>
                        <Link 
                          to="/profile-select" 
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-white/70 hover:text-white hover:bg-white/5 transition-all"
                          onClick={() => setIsAccountMenuOpen(false)}
                        >
                          <UserCircle className="w-4 h-4 text-primary" />
                          Trocar Perfil
                        </Link>
                      </div>

                      <div className="p-2 border-t border-white/5">
                        <button 
                          onClick={() => {
                            signOut();
                            setIsAccountMenuOpen(false);
                            navigate("/auth");
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                        >
                          <LogOut className="w-4 h-4" />
                          Sair do Movyra
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
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
