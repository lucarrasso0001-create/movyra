import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Plus, Pencil, Check, X, Loader2, Shield, Baby,
  Lock, Eye, EyeOff, Palette, Trash2
} from "lucide-react";
import { useAuth, Profile } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useTheme, AppTheme, THEMES } from "@/contexts/ThemeContext";

const AVATAR_OPTIONS = [
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Aneka",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Mia",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Alex",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Zoe",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Max",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Luna",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Kai",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Pablo",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Nala",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Bear",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Star",
];

const AGE_RATINGS = [
  { label: "Livre", value: 0, color: "hsl(120 60% 45%)" },
  { label: "7+", value: 7, color: "hsl(200 80% 50%)" },
  { label: "10+", value: 10, color: "hsl(45 90% 50%)" },
  { label: "12+", value: 12, color: "hsl(30 90% 55%)" },
  { label: "14+", value: 14, color: "hsl(15 90% 55%)" },
  { label: "16+", value: 16, color: "hsl(0 80% 55%)" },
  { label: "18+", value: 18, color: "hsl(0 85% 40%)" },
];

function hashPin(pin: string): string {
  return btoa(pin + "movyra_salt_2026");
}
function verifyPin(pin: string, hash: string): boolean {
  return hashPin(pin) === hash;
}

type ManageTab = "profile" | "parental" | "theme";

const ProfileSelect = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, setTheme, isKids, setIsKids } = useTheme();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [isManaging, setIsManaging] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ManageTab>("profile");

  const [newName, setNewName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [profileIsKids, setProfileIsKids] = useState(false);
  const [maxAgeRating, setMaxAgeRating] = useState(18);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [pinValue, setPinValue] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);

  const [showPinModal, setShowPinModal] = useState(false);
  const [verifyingProfile, setVerifyingProfile] = useState<Profile | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");

  useEffect(() => {
    if (user) {
      fetchProfiles();
    }
  }, [user]);

  const fetchProfiles = async () => {
    if (!user) return;
    setLoadingProfiles(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      if (data) {
        setProfiles(data);
        // Se não houver perfis, abre automaticamente o modo de criação
        if (data.length === 0) {
          handleOpenCreate();
        }
      }
    } catch (err: any) {
      console.error("Erro ao buscar perfis:", err);
      toast({ title: "Erro ao carregar", description: "Não foi possível carregar os perfis.", variant: "destructive" });
    } finally {
      setLoadingProfiles(false);
    }
  };

  const handleSelectProfile = (p: Profile) => {
    if (isManaging) {
      handleOpenEdit(p);
      return;
    }

    if (p.pin_hash && !isKids) {
      setVerifyingProfile(p);
      setShowPinModal(true);
      return;
    }
    
    setIsKids(p.is_kids);
    navigate("/");
  };

  const handlePinSubmit = () => {
    if (!verifyingProfile?.pin_hash) return;
    if (verifyPin(pinInput, verifyingProfile.pin_hash)) {
      setIsKids(verifyingProfile.is_kids);
      navigate("/");
    } else {
      setPinError("PIN incorreto. Tente novamente.");
      setPinInput("");
    }
  };

  const handleOpenEdit = (p: Profile) => {
    setEditingProfileId(p.id);
    setNewName(p.display_name || "");
    setSelectedAvatar(p.avatar_url);
    setProfileIsKids(p.is_kids);
    setMaxAgeRating(p.max_age_rating);
    setPinEnabled(!!p.pin_hash);
    setPinValue("");
    setConfirmPin("");
    setActiveTab("profile");
    setIsManaging(true);
  };

  const handleOpenCreate = () => {
    if (profiles.length >= 4) {
      toast({ title: "Limite atingido", description: "Você pode ter no máximo 4 perfis.", variant: "destructive" });
      return;
    }
    setEditingProfileId("new");
    setNewName("");
    setSelectedAvatar(AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)]);
    setProfileIsKids(false);
    setMaxAgeRating(18);
    setPinEnabled(false);
    setPinValue("");
    setConfirmPin("");
    setActiveTab("profile");
    setIsManaging(true);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    const safeName = newName.trim().slice(0, 30);
    if (!safeName) {
      toast({ title: "Nome inválido", description: "O nome não pode estar vazio.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      let pinHashToSave: string | null = null;
      
      // Se estiver editando, mantém o PIN atual a menos que seja alterado
      if (editingProfileId) {
        const currentProfile = profiles.find(p => p.id === editingProfileId);
        pinHashToSave = currentProfile?.pin_hash || null;
      }

      if (pinEnabled) {
        if (pinValue) {
          if (!/^\d{4}$/.test(pinValue)) {
            toast({ title: "PIN inválido", description: "O PIN deve ter exatamente 4 dígitos.", variant: "destructive" });
            setIsSaving(false);
            return;
          }
          if (pinValue !== confirmPin) {
            toast({ title: "PINs diferentes", description: "Os PINs não coincidem.", variant: "destructive" });
            setIsSaving(false);
            return;
          }
          pinHashToSave = hashPin(pinValue);
        }
      } else {
        pinHashToSave = null;
      }

      const profileData = {
        display_name: safeName,
        avatar_url: selectedAvatar,
        is_kids: profileIsKids,
        max_age_rating: profileIsKids ? Math.min(maxAgeRating, 10) : maxAgeRating,
        pin_hash: pinHashToSave,
        theme: theme,
        user_id: user.id,
      };

      if (editingProfileId && editingProfileId !== "new") {
        const { error } = await supabase
          .from("profiles")
          .update(profileData)
          .eq("id", editingProfileId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("profiles")
          .insert([profileData]);
        if (error) throw error;
      }

      toast({ 
        title: editingProfileId && editingProfileId !== "new" ? "Perfil atualizado!" : "Perfil criado!", 
        description: "Suas alterações foram salvas com sucesso no banco de dados." 
      });
      
      setIsManaging(false);
      setEditingProfileId(null);
      // Recarrega os perfis para garantir que o estado local reflita exatamente o banco de dados
      await fetchProfiles();
    } catch (err: any) {
      console.error("Erro detalhado ao salvar perfil:", err);
      toast({ 
        title: "Erro ao salvar", 
        description: err.message || "Tente novamente mais tarde.", 
        variant: "destructive" 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!editingProfileId || profiles.length <= 1) {
      toast({ title: "Não permitido", description: "Você deve ter pelo menos um perfil.", variant: "destructive" });
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", editingProfileId);

      if (error) throw error;

      toast({ title: "Perfil excluído", description: "O perfil foi removido com sucesso." });
      setIsManaging(false);
      setEditingProfileId(null);
      await fetchProfiles();
    } catch (err: any) {
      toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const themeGradient = THEMES[theme].gradient;

  if (loadingProfiles && profiles.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: "hsl(var(--background))", color: "hsl(var(--foreground))" }}
    >
      <div className="absolute inset-0" style={{ background: themeGradient }} />

      {isKids && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {["⭐", "🌈", "🎈", "🦄", "🎨", "🌟"].map((emoji, i) => (
            <motion.div
              key={i}
              className="absolute text-4xl"
              style={{ left: `${10 + i * 15}%`, top: `${10 + (i % 3) * 25}%` }}
              animate={{ y: [0, -20, 0], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut" }}
            >
              {emoji}
            </motion.div>
          ))}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-8 left-8"
      >
        <span className="text-2xl font-black tracking-tighter text-gradient">Movyra</span>
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={signOut}
        className="absolute top-8 right-8 text-sm transition-colors"
        style={{ color: "hsl(var(--muted-foreground))" }}
      >
        Sair
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-10 z-10 px-4 w-full max-w-2xl"
      >
        <h1 className={`font-bold text-center ${isKids ? "text-4xl md:text-5xl" : "text-3xl md:text-4xl lg:text-5xl"}`}
          style={{ color: "hsl(var(--foreground))" }}>
          {isManaging 
            ? (editingProfileId ? "Editar Perfil" : "Selecione um perfil para editar") 
            : "Quem está assistindo?"}
        </h1>

        <div className="flex flex-wrap gap-8 justify-center">
          {profiles.map((p) => (
            <motion.div
              key={p.id}
              whileHover={!isManaging ? { scale: 1.08 } : {}}
              whileTap={!isManaging ? { scale: 0.96 } : {}}
              className="flex flex-col items-center gap-3 cursor-pointer group"
              onClick={() => handleSelectProfile(p)}
            >
              <div className="relative">
                <motion.div
                  className="w-32 h-32 md:w-40 md:h-40 rounded-xl overflow-hidden border-2 transition-all duration-300"
                  style={{
                    borderColor: isManaging && editingProfileId === p.id ? "hsl(var(--primary))" : "transparent",
                    background: "hsl(var(--secondary))",
                  }}
                >
                  <img
                    src={p.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${p.display_name}`}
                    alt={p.display_name || ""}
                    className="w-full h-full object-cover"
                  />
                  {isManaging && (
                    <div className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity ${editingProfileId === p.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                      <Pencil className="w-8 h-8 text-white" />
                    </div>
                  )}
                </motion.div>

                {p.is_kids && !isManaging && (
                  <div className="absolute -top-2 -right-2 bg-orange-400 rounded-full p-1" title="Perfil Kids">
                    <Baby className="w-4 h-4 text-white" />
                  </div>
                )}

                {!!p.pin_hash && !isManaging && (
                  <div className="absolute -bottom-2 -right-2 rounded-full p-1"
                    style={{ background: "hsl(var(--primary))" }}>
                    <Lock className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              <span className="text-base md:text-lg font-medium transition-colors"
                style={{ color: "hsl(var(--muted-foreground))" }}>
                {p.display_name}
              </span>
            </motion.div>
          ))}

          {!isManaging && profiles.length < 4 && (
            <motion.div
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.96 }}
              className="flex flex-col items-center gap-3 cursor-pointer group"
              onClick={handleOpenCreate}
            >
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-xl border-2 border-dashed flex items-center justify-center transition-all group-hover:border-foreground/40 group-hover:bg-secondary/40"
                style={{ borderColor: "hsl(var(--muted-foreground) / 0.4)", background: "hsl(var(--secondary) / 0.3)" }}>
                <Plus className="w-10 h-10" style={{ color: "hsl(var(--muted-foreground) / 0.6)" }} />
              </div>
              <span className="text-base" style={{ color: "hsl(var(--muted-foreground) / 0.6)" }}>Adicionar</span>
            </motion.div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {isManaging && editingProfileId && (
            <motion.div
              key="manage-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full rounded-2xl border overflow-hidden shadow-xl"
              style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}
            >
              <div className="flex border-b" style={{ borderColor: "hsl(var(--border))" }}>
                {([
                  { id: "profile", icon: Pencil, label: "Perfil" },
                  { id: "parental", icon: Shield, label: "Parental" },
                ] as { id: ManageTab; icon: React.ElementType; label: string }[]).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors"
                    style={{
                      color: activeTab === tab.id ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                      borderBottom: activeTab === tab.id ? "2px solid hsl(var(--primary))" : "2px solid transparent",
                    }}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6 space-y-5">
                {activeTab === "profile" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block" style={{ color: "hsl(var(--muted-foreground))" }}>
                        Nome de exibição
                      </label>
                      <input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Nome do perfil"
                        maxLength={30}
                        className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all"
                        style={{
                          background: "hsl(var(--secondary))",
                          border: "1px solid hsl(var(--border))",
                          color: "hsl(var(--foreground))",
                        }}
                      />
                    </div>

                    <button
                      onClick={() => setShowAvatarPicker(true)}
                      className="w-full flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors"
                      style={{ background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))" }}
                    >
                      <img src={selectedAvatar || ""} alt="" className="w-8 h-8 rounded-lg" />
                      <span style={{ color: "hsl(var(--foreground))" }}>Trocar avatar</span>
                      <Pencil className="w-4 h-4 ml-auto" style={{ color: "hsl(var(--muted-foreground))" }} />
                    </button>
                  </motion.div>
                )}

                {activeTab === "parental" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                    <div className="flex items-center justify-between rounded-lg p-4"
                      style={{ background: "hsl(var(--secondary))" }}>
                      <div className="flex items-center gap-3">
                        <Baby className="w-5 h-5 text-orange-400" />
                        <div>
                          <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
                            Perfil Infantil
                          </p>
                          <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                            Apenas conteúdo para crianças
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setProfileIsKids(!profileIsKids)}
                        className="relative w-12 h-6 rounded-full transition-colors"
                        style={{ background: profileIsKids ? "hsl(var(--primary))" : "hsl(var(--muted))" }}
                      >
                        <span
                          className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform"
                          style={{ transform: profileIsKids ? "translateX(24px)" : "translateX(0)" }}
                        />
                      </button>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-3 block" style={{ color: "hsl(var(--muted-foreground))" }}>
                        Classificação máxima
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {AGE_RATINGS.map(r => (
                          <button
                            key={r.value}
                            onClick={() => setMaxAgeRating(r.value)}
                            disabled={profileIsKids && r.value > 10}
                            className="rounded-lg py-2 text-sm font-bold transition-all disabled:opacity-30"
                            style={{
                              background: maxAgeRating === r.value ? r.color : "hsl(var(--secondary))",
                              color: maxAgeRating === r.value ? "white" : "hsl(var(--muted-foreground))",
                              border: "1px solid",
                              borderColor: maxAgeRating === r.value ? r.color : "hsl(var(--border))",
                            }}
                          >
                            {r.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-lg p-4"
                        style={{ background: "hsl(var(--secondary))" }}>
                        <div className="flex items-center gap-3">
                          <Lock className="w-5 h-5" style={{ color: "hsl(var(--primary))" }} />
                          <div>
                            <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>PIN de acesso</p>
                            <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                              Proteger perfil com PIN de 4 dígitos
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setPinEnabled(!pinEnabled)}
                          className="relative w-12 h-6 rounded-full transition-colors"
                          style={{ background: pinEnabled ? "hsl(var(--primary))" : "hsl(var(--muted))" }}
                        >
                          <span
                            className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform"
                            style={{ transform: pinEnabled ? "translateX(24px)" : "translateX(0)" }}
                          />
                        </button>
                      </div>

                      {pinEnabled && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="grid grid-cols-2 gap-3"
                        >
                          <div className="relative">
                            <input
                              type={showPin ? "text" : "password"}
                              value={pinValue}
                              onChange={(e) => setPinValue(e.target.value.replace(/\D/g, "").slice(0, 4))}
                              placeholder="Novo PIN"
                              maxLength={4}
                              className="w-full rounded-lg px-4 py-2.5 text-sm pr-10 focus:outline-none"
                              style={{
                                background: "hsl(var(--secondary))",
                                border: "1px solid hsl(var(--border))",
                                color: "hsl(var(--foreground))",
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPin(!showPin)}
                              className="absolute right-3 top-1/2 -translate-y-1/2"
                              style={{ color: "hsl(var(--muted-foreground))" }}
                            >
                              {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          <input
                            type={showPin ? "text" : "password"}
                            value={confirmPin}
                            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                            placeholder="Confirmar PIN"
                            maxLength={4}
                            className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none"
                            style={{
                              background: "hsl(var(--secondary))",
                              border: "1px solid hsl(var(--border))",
                              color: "hsl(var(--foreground))",
                            }}
                          />
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}


              </div>

              <div className="flex gap-3 p-4 border-t" style={{ borderColor: "hsl(var(--border))" }}>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                  style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editingProfileId && editingProfileId !== "new" ? "Salvar" : "Criar"}
                </button>
                
                {editingProfileId && editingProfileId !== "new" && profiles.length > 1 && (
                  <button
                    onClick={handleDeleteProfile}
                    disabled={isDeleting}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-all border border-destructive/50 text-destructive hover:bg-destructive hover:text-white"
                  >
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                )}

                <button
                  onClick={() => { setIsManaging(false); setEditingProfileId(null); }}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm transition-all border"
                  style={{
                    borderColor: "hsl(var(--border))",
                    color: "hsl(var(--muted-foreground))",
                  }}
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
              </div>
            </motion.div>
          )}

          {!isManaging && (
            <motion.button
              key="manage-btn"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setIsManaging(true);
                setEditingProfileId(null); // Garante que comece sem nenhum perfil selecionado para edição
              }}
              className="py-3 px-10 rounded-lg text-sm font-medium tracking-wide border transition-all"
              style={{
                borderColor: "hsl(var(--border) / 0.6)",
                color: "hsl(var(--muted-foreground))",
              }}
            >
              Gerenciar Perfis
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {showAvatarPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
            onClick={() => setShowAvatarPicker(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl border"
              style={{
                background: "hsl(var(--card))",
                borderColor: "hsl(var(--border))",
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Escolher Avatar</h3>
                <button onClick={() => setShowAvatarPicker(false)}
                  style={{ color: "hsl(var(--muted-foreground))" }}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {AVATAR_OPTIONS.map((url, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setSelectedAvatar(url); setShowAvatarPicker(false); }}
                    className="rounded-lg overflow-hidden border-2 transition-all"
                    style={{
                      borderColor: selectedAvatar === url ? "hsl(var(--primary))" : "transparent",
                    }}
                  >
                    <img src={url} alt={`Avatar ${i + 1}`}
                      className="w-full aspect-square object-cover"
                      style={{ background: "hsl(var(--secondary))" }}
                    />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="rounded-2xl p-8 max-w-sm w-full shadow-2xl border text-center"
              style={{
                background: "hsl(var(--card))",
                borderColor: "hsl(var(--border))",
              }}
            >
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: "hsl(var(--primary) / 0.15)" }}>
                  <Lock className="w-7 h-7" style={{ color: "hsl(var(--primary))" }} />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-1">PIN de acesso</h3>
              <p className="text-sm mb-6" style={{ color: "hsl(var(--muted-foreground))" }}>
                Digite seu PIN de 4 dígitos para continuar
              </p>

              <input
                type="password"
                value={pinInput}
                onChange={(e) => { setPinInput(e.target.value.replace(/\D/g, "").slice(0, 4)); setPinError(""); }}
                onKeyDown={(e) => e.key === "Enter" && pinInput.length === 4 && handlePinSubmit()}
                placeholder="••••"
                maxLength={4}
                autoFocus
                className="w-full text-center text-2xl tracking-widest rounded-lg px-4 py-3 mb-2 focus:outline-none"
                style={{
                  background: "hsl(var(--secondary))",
                  border: pinError ? "1px solid hsl(var(--destructive))" : "1px solid hsl(var(--border))",
                  color: "hsl(var(--foreground))",
                }}
              />
              {pinError && (
                <p className="text-xs mb-3" style={{ color: "hsl(var(--destructive))" }}>{pinError}</p>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => { setShowPinModal(false); setPinInput(""); setPinError(""); setVerifyingProfile(null); }}
                  className="flex-1 py-2.5 rounded-lg text-sm border transition-all"
                  style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handlePinSubmit}
                  disabled={pinInput.length !== 4}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                  style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
                >
                  Entrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileSelect;
