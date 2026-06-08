import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, X, User, Settings, LogOut, UserCircle, Home, Film, Tv, TrendingUp, Heart, Radio } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";

interface NavbarProps {
  onSearchChange?: (query: string) => void;
}

const Navbar = ({ onSearchChange }: NavbarProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user, signOut, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5">
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
              <Link to="/aovivo" className="hover:text-white transition-colors">Ao Vivo</Link>
              <Link to="/my-list" className="hover:text-white transition-colors">Minha Lista</Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onSearchChange && (
              <div className="relative">
                {isSearchOpen ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Buscar..."
                      onChange={(e) => onSearchChange(e.target.value)}
                      className="bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-primary w-40 md:w-64"
                      autoFocus
                    />
                    <button onClick={() => { setIsSearchOpen(false); onSearchChange(""); }}>
                      <X className="w-5 h-5 text-white/60" />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsSearchOpen(true)}
                    className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                  >
                    <Search className="w-4 h-4 text-white/60" />
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
                        className="absolute right-0 mt-2 w-56 bg-[#141414] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                      >
                        <div className="p-4 border-b border-white/5 bg-white/5">
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Perfil Atual</p>
                          <p className="text-sm font-black text-white truncate">{profile?.display_name || user.email}</p>
                        </div>
                        
                        <div className="p-2">
                          <Link 
                            to="/conta" 
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-white/70 hover:text-white hover:bg-white/5 transition-all"
                            onClick={() => setIsAccountMenuOpen(false)}
                          >
                            <Settings className="w-4 h-4 text-primary" />
                            Configurações da Conta
                          </Link>
                          <Link 
                            to="/profile-select" 
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-white/70 hover:text-white hover:bg-white/5 transition-all"
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
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
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
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/90 backdrop-blur-xl border-t border-white/5 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16 px-2">
          {[
            { path: "/", icon: Home, label: "Início" },
            { path: "/filmes", icon: Film, label: "Filmes" },
            { path: "/series", icon: Tv, label: "Séries" },
            { path: "/bombando", icon: TrendingUp, label: "Bombando" },
            { path: "/aovivo", icon: Radio, label: "Ao Vivo" },
            { path: "/my-list", icon: Heart, label: "Lista" },
          ].map(({ path, icon: Icon, label }) => (
            <Link 
              key={path} 
              to={path}
              className={`flex flex-col items-center gap-1 min-w-[56px] py-1 rounded-2xl transition-all ${
                isActive(path) 
                  ? "text-primary" 
                  : "text-white/40 active:text-white/60"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-bold tracking-wide">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};

export default Navbar;
