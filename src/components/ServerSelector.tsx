import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Volume2, Subtitles, Server, Zap } from "lucide-react";

export type AudioType = "dub" | "leg";
export type ServerType = "principal" | "alternativo";

interface ServerSelectorProps {
  open: boolean;
  movieTitle: string;
  onClose: () => void;
  onSelect: (audio: AudioType, server: ServerType) => void;
}

const ServerSelector = ({ open, movieTitle, onClose, onSelect }: ServerSelectorProps) => {
  // Step 0: audio, Step 1: server
  const [audio, setAudio] = useState<AudioType | null>(null);

  useEffect(() => {
    if (!open) setAudio(null);
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between px-6 h-16 border-b border-white/10">
              <div className="min-w-0">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">
                  {audio === null ? "Selecione o áudio" : "Selecione o servidor"}
                </p>
                <p className="text-white font-bold truncate text-sm">{movieTitle}</p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              {audio === null ? (
                <>
                  <button
                    onClick={() => setAudio("dub")}
                    className="w-full flex items-center gap-4 p-5 rounded-2xl bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary transition-all group active:scale-[0.98]"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                      <Volume2 className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-white font-black uppercase tracking-tight">Dublado</p>
                      <p className="text-white/40 text-xs font-bold uppercase tracking-widest">
                        Áudio em português
                      </p>
                    </div>
                    <Play className="w-5 h-5 text-white/40 group-hover:text-white transition" />
                  </button>

                  <button
                    onClick={() => setAudio("leg")}
                    className="w-full flex items-center gap-4 p-5 rounded-2xl bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary transition-all group active:scale-[0.98]"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                      <Subtitles className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-white font-black uppercase tracking-tight">Legendado</p>
                      <p className="text-white/40 text-xs font-bold uppercase tracking-widest">
                        Áudio original + legendas
                      </p>
                    </div>
                    <Play className="w-5 h-5 text-white/40 group-hover:text-white transition" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => onSelect(audio, "principal")}
                    className="w-full flex items-center gap-4 p-5 rounded-2xl bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary transition-all group active:scale-[0.98]"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                      <Zap className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-white font-black uppercase tracking-tight">Principal</p>
                      <p className="text-white/40 text-xs font-bold uppercase tracking-widest">
                        Servidor recomendado · Maior qualidade
                      </p>
                    </div>
                    <Play className="w-5 h-5 text-white/40 group-hover:text-white transition" />
                  </button>

                  <button
                    onClick={() => onSelect(audio, "alternativo")}
                    className="w-full flex items-center gap-4 p-5 rounded-2xl bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary transition-all group active:scale-[0.98]"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                      <Server className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-white font-black uppercase tracking-tight">Alternativo</p>
                      <p className="text-white/40 text-xs font-bold uppercase tracking-widest">
                        Servidor reserva · Use se o principal falhar
                      </p>
                    </div>
                    <Play className="w-5 h-5 text-white/40 group-hover:text-white transition" />
                  </button>

                  <button
                    onClick={() => setAudio(null)}
                    className="w-full text-center text-white/40 hover:text-white text-xs font-black uppercase tracking-widest pt-3 transition"
                  >
                    ← Voltar ao áudio
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ServerSelector;
