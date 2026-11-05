import { useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Shield, Settings, LogOut, Clock, Trash2, Edit2, Camera, Check, X, Loader2,
  Key, Smartphone, Globe, Download, SlidersHorizontal, Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";

type Prefs = Record<string, any>;

const DEFAULT_PREFS: Prefs = {
  data_saver: false, video_quality: "auto", audio_language: "pt-BR", subtitle_language: "pt-BR",
  interface_language: "pt-BR", autoplay_trailers: true, autoplay_next_episode: true,
  show_watch_history: true, personalized_recommendations: true, activity_notifications: true,
};

const LANGS = [
  { v: "pt-BR", l: "Português (Brasil)" }, { v: "en-US", l: "English" }, { v: "es-ES", l: "Español" },
];
const SUB_LANGS = [...LANGS, { v: "off", l: "Desligada" }];
const QUALITIES = [{ v: "auto", l: "Automática" }, { v: "1080p", l: "1080p" }, { v: "720p", l: "720p" }];

const AVATAR_OPTIONS = ["Felix", "Aneka", "Mia", "Alex", "Zoe", "Max", "Luna", "Kai", "Pablo", "Nala", "Bear", "Star"]
  .map((s) => `https://api.dicebear.com/9.x/avataaars/svg?seed=${s}`);

const Row = ({ icon, title, sub, action }: { icon: ReactNode; title: string; sub: ReactNode; action: ReactNode }) => (
  <div className="p-6 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-between gap-4 hover:bg-white/10 transition-all">
    <div className="flex items-center gap-5 min-w-0">
      <div className="p-3 rounded-2xl bg-white/5 text-primary shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-white font-black uppercase tracking-tighter italic">{title}</p>
        <div className="text-muted-foreground text-xs font-bold truncate">{sub}</div>
      </div>
    </div>
    <div className="shrink-0">{action}</div>
  </div>
);

const Modal = ({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) => (
  <AnimatePresence>
    {open && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
          className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-[2.5rem] p-10 shadow-2xl max-h-[90vh] overflow-y-auto">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-muted-foreground hover:text-white">
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic mb-6">{title}</h3>
          {children}
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const Select = ({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)}
    className="bg-white/5 border border-white/10 rounded-xl h-10 px-3 text-sm font-bold text-white">
    {options.map((o) => <option key={o.v} value={o.v} className="bg-zinc-900">{o.l}</option>)}
  </select>
);

const Account = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, isLoading, setProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "security" | "prefs">("general");
  const [editingField, setEditingField] = useState<"email" | "password" | "language" | "sessions" | "mfa" | null>(null);
  const [newValue, setNewValue] = useState("");
  const [confirmValue, setConfirmValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaEnroll, setMfaEnroll] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [historyCount, setHistoryCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user && !isLoading) navigate("/auth");
    if (profile?.display_name) setDisplayName(profile.display_name);
  }, [user, isLoading, navigate, profile]);

  useEffect(() => {
    if (!profile) return;
    supabase.from("profiles").select("preferences").eq("id", profile.id).maybeSingle().then(({ data }) => {
      if (data?.preferences) setPrefs({ ...DEFAULT_PREFS, ...(data.preferences as Prefs) });
    });
    supabase.from("watch_history").select("id", { count: "exact", head: true }).eq("profile_id", profile.id)
      .then(({ count }) => setHistoryCount(count ?? 0));
  }, [profile?.id]);

  const loadMfa = async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    const verified = data?.totp?.find((f) => f.status === "verified");
    setMfaFactorId(verified?.id ?? null);
  };
  useEffect(() => { if (user) loadMfa(); }, [user?.id]);

  const fail = (e: any, fallback: string) =>
    toast({ title: "Erro", description: e?.message || fallback, variant: "destructive" });

  const closeModal = () => { setEditingField(null); setNewValue(""); setConfirmValue(""); setMfaCode(""); };

  const savePrefs = async (patch: Prefs) => {
    if (!profile) return;
    const next = { ...prefs, ...patch };
    setPrefs(next);
    const { error } = await supabase.from("profiles").update({ preferences: next }).eq("id", profile.id);
    if (error) fail(error, "Não foi possível salvar.");
    else toast({ title: "Preferência salva" });
  };

  const handleUpdateProfile = async (newAvatarUrl?: string) => {
    if (!profile) return;
    if (!newAvatarUrl && !displayName.trim()) {
      toast({ title: "Nome inválido", description: "O nome não pode estar vazio.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    const updateData: Record<string, string> = newAvatarUrl ? { avatar_url: newAvatarUrl } : { display_name: displayName.trim() };
    const { data, error } = await supabase.from("profiles").update(updateData).eq("id", profile.id)
      .select("id,user_id,display_name,avatar_url,is_kids,max_age_rating,has_pin,theme").single();
    setIsSaving(false);
    if (error) return fail(error, "Não foi possível atualizar o perfil.");
    setProfile(data);
    setIsEditing(false);
    setShowAvatarPicker(false);
    toast({ title: "Perfil atualizado!" });
  };

  const handleUpdateEmail = async () => {
    if (!/^\S+@\S+\.\S+$/.test(newValue)) return fail(null, "Insira um e-mail válido.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ email: newValue.trim() }, { emailRedirectTo: `${window.location.origin}/conta` });
    setBusy(false);
    if (error) return fail(error, "Não foi possível atualizar o e-mail.");
    toast({ title: "Verifique seu e-mail", description: "Enviamos um link de confirmação para o novo endereço." });
    closeModal();
  };

  const handleUpdatePassword = async () => {
    if (newValue.length < 6) return fail(null, "A senha deve ter pelo menos 6 caracteres.");
    if (newValue !== confirmValue) return fail(null, "As senhas não coincidem.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: newValue });
    setBusy(false);
    if (error) return fail(error, "Não foi possível atualizar a senha.");
    toast({ title: "Senha atualizada!" });
    closeModal();
  };

  const handleSignOutOthers = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signOut({ scope: "others" });
    setBusy(false);
    if (error) return fail(error, "Não foi possível desconectar.");
    toast({ title: "Pronto", description: "Todos os outros dispositivos foram desconectados." });
    closeModal();
  };

  const startMfa = async () => {
    setEditingField("mfa");
    if (mfaFactorId) return;
    setBusy(true);
    // remove old unverified factors before enrolling a new one
    const { data: list } = await supabase.auth.mfa.listFactors();
    for (const f of list?.all ?? []) if (f.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: f.id });
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `Movyra ${Date.now()}` });
    setBusy(false);
    if (error) { closeModal(); return fail(error, "Não foi possível iniciar a verificação em duas etapas."); }
    setMfaEnroll({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  };

  const verifyMfa = async () => {
    if (!mfaEnroll || mfaCode.length !== 6) return fail(null, "Digite o código de 6 dígitos.");
    setBusy(true);
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: mfaEnroll.id, code: mfaCode });
    setBusy(false);
    if (error) return fail(error, "Código inválido.");
    toast({ title: "Ativado!", description: "A verificação em duas etapas está ligada." });
    setMfaEnroll(null);
    await loadMfa();
    closeModal();
  };

  const disableMfa = async () => {
    if (!mfaFactorId) return;
    setBusy(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId: mfaFactorId });
    setBusy(false);
    if (error) return fail(error, "Para desativar, entre novamente usando o código do aplicativo.");
    toast({ title: "Desativado", description: "A verificação em duas etapas foi desligada." });
    await loadMfa();
    closeModal();
  };

  const handleClearHistory = async () => {
    if (!profile) return;
    if (!window.confirm("Apagar todo o histórico deste perfil? Esta ação não pode ser desfeita.")) return;
    const { error } = await supabase.from("watch_history").delete().eq("profile_id", profile.id);
    if (error) return fail(error, "Não foi possível limpar o histórico.");
    setHistoryCount(0);
    toast({ title: "Histórico limpo" });
  };

  const handleExport = async () => {
    if (!user) return;
    const [profiles, favorites, history, ratings] = await Promise.all([
      supabase.from("profiles").select("id,display_name,avatar_url,is_kids,max_age_rating,theme,bio,preferences,created_at").eq("user_id", user.id),
      supabase.from("favorites").select("*").eq("user_id", user.id),
      supabase.from("watch_history").select("*").eq("user_id", user.id),
      supabase.from("ratings").select("*").eq("user_id", user.id),
    ]);
    const payload = {
      exported_at: new Date().toISOString(),
      account: { id: user.id, email: user.email, created_at: user.created_at },
      profiles: profiles.data, favorites: favorites.data, watch_history: history.data, ratings: ratings.data,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url; a.download = `movyra-dados-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Download iniciado" });
  };

  const handleSignOut = async (global = false) => {
    if (global) await supabase.auth.signOut({ scope: "global" });
    await signOut();
    navigate("/auth");
    toast({ title: "Até logo!" });
  };

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }

  const actionBtn = (label: string, onClick: () => void) => (
    <Button variant="ghost" onClick={onClick} className="text-primary font-black text-xs uppercase tracking-widest hover:bg-primary/10 px-6 h-10 rounded-xl">{label}</Button>
  );
  const inputCls = "bg-white/5 border-white/10 h-14 rounded-2xl px-6 font-bold";
  const primaryBtn = "w-full bg-primary text-primary-foreground h-14 rounded-2xl font-black uppercase tracking-tighter italic text-lg";
  const langLabel = LANGS.find((l) => l.v === prefs.interface_language)?.l ?? "Português (Brasil)";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <Modal open={showAvatarPicker} onClose={() => setShowAvatarPicker(false)} title="Escolher Avatar">
        <div className="grid grid-cols-4 gap-4">
          {AVATAR_OPTIONS.map((url, i) => (
            <button key={i} onClick={() => handleUpdateProfile(url)} disabled={isSaving}
              className={`rounded-2xl overflow-hidden border-2 hover:scale-110 transition-all ${profile?.avatar_url === url ? "border-primary" : "border-transparent"}`}>
              <img src={url} alt={`Avatar ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </Modal>

      <Modal open={editingField === "email"} onClose={closeModal} title="Alterar E-mail">
        <p className="text-muted-foreground text-sm font-bold mb-6">Você vai receber um link para confirmar o novo e-mail.</p>
        <div className="space-y-4">
          <Input type="email" value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="exemplo@email.com" className={inputCls} />
          <Button onClick={handleUpdateEmail} disabled={busy} className={primaryBtn}>{busy ? <Loader2 className="w-6 h-6 animate-spin" /> : "Confirmar"}</Button>
        </div>
      </Modal>

      <Modal open={editingField === "password"} onClose={closeModal} title="Alterar Senha">
        <div className="space-y-4">
          <Input type="password" value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="Nova senha" className={inputCls} />
          <Input type="password" value={confirmValue} onChange={(e) => setConfirmValue(e.target.value)} placeholder="Repita a nova senha" className={inputCls} />
          <Button onClick={handleUpdatePassword} disabled={busy} className={primaryBtn}>{busy ? <Loader2 className="w-6 h-6 animate-spin" /> : "Confirmar"}</Button>
        </div>
      </Modal>

      <Modal open={editingField === "language"} onClose={closeModal} title="Idioma">
        <div className="space-y-3">
          {LANGS.map((l) => (
            <button key={l.v} onClick={async () => { await savePrefs({ interface_language: l.v }); closeModal(); }}
              className={`w-full p-4 rounded-2xl border text-left font-bold flex justify-between items-center ${prefs.interface_language === l.v ? "border-primary bg-primary/10 text-white" : "border-white/10 bg-white/5 text-muted-foreground hover:text-white"}`}>
              {l.l} {prefs.interface_language === l.v && <Check className="w-4 h-4 text-primary" />}
            </button>
          ))}
        </div>
      </Modal>

      <Modal open={editingField === "sessions"} onClose={closeModal} title="Dispositivos">
        <p className="text-muted-foreground text-sm font-bold mb-6">
          Este aparelho continua conectado. Todos os outros (celulares, TVs, computadores) serão desconectados e precisarão entrar de novo.
        </p>
        <Button onClick={handleSignOutOthers} disabled={busy} className={primaryBtn}>{busy ? <Loader2 className="w-6 h-6 animate-spin" /> : "Desconectar outros"}</Button>
      </Modal>

      <Modal open={editingField === "mfa"} onClose={closeModal} title="Duas Etapas">
        {mfaFactorId ? (
          <>
            <p className="text-muted-foreground text-sm font-bold mb-6">Está ativada. Ao desativar, sua conta volta a pedir só a senha.</p>
            <Button onClick={disableMfa} disabled={busy} variant="destructive" className="w-full h-14 rounded-2xl font-black uppercase">{busy ? <Loader2 className="w-6 h-6 animate-spin" /> : "Desativar"}</Button>
          </>
        ) : !mfaEnroll ? (
          <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm font-bold">Leia o código com Google Authenticator, Authy ou similar e digite os 6 números.</p>
            <div className="bg-white rounded-2xl p-4 flex justify-center"><img src={mfaEnroll.qr} alt="Código QR" className="w-48 h-48" /></div>
            <p className="text-[10px] text-muted-foreground break-all text-center">Chave manual: {mfaEnroll.secret}</p>
            <Input inputMode="numeric" maxLength={6} value={mfaCode} onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000" className={`${inputCls} text-center tracking-[0.5em]`} />
            <Button onClick={verifyMfa} disabled={busy} className={primaryBtn}>{busy ? <Loader2 className="w-6 h-6 animate-spin" /> : "Ativar"}</Button>
          </div>
        )}
      </Modal>

      <div className="max-w-6xl mx-auto px-6 py-32 pb-24">
        <div className="mb-16">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 uppercase tracking-tighter italic">Minha Conta</h1>
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Gerencie seu perfil, segurança e preferências</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white/5 rounded-[2.5rem] border border-white/10 p-10 relative overflow-hidden">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20 p-1">
                    <img src={profile?.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${profile?.display_name || user?.email}`}
                      alt={profile?.display_name || "Avatar"} className="w-full h-full object-cover rounded-full" />
                  </div>
                  <button onClick={() => setShowAvatarPicker(true)} aria-label="Trocar avatar"
                    className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2.5 rounded-full shadow-xl hover:scale-110 transition-all border-4 border-background">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                {isEditing ? (
                  <div className="w-full space-y-4">
                    <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={30}
                      className="bg-white/5 border-white/10 text-center font-bold h-12 rounded-xl" placeholder="Seu nome"
                      onKeyDown={(e) => e.key === "Enter" && handleUpdateProfile()} />
                    <div className="flex gap-2">
                      <Button onClick={() => handleUpdateProfile()} disabled={isSaving} className="flex-1 rounded-xl h-10">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      </Button>
                      <Button onClick={() => { setIsEditing(false); setDisplayName(profile?.display_name || ""); }} variant="outline" className="flex-1 border-white/10 bg-white/5 rounded-xl h-10">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic mb-1">{profile?.display_name || "Usuário"}</h2>
                    <p className="text-muted-foreground text-sm font-bold mb-6">{user?.email}</p>
                    <Button onClick={() => setIsEditing(true)} variant="outline" className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-2xl h-12 font-black uppercase tracking-tighter italic">
                      <Edit2 className="w-4 h-4 mr-2" /> Editar Nome
                    </Button>
                    <Button onClick={() => navigate("/perfis")} variant="ghost" className="w-full mt-3 text-muted-foreground hover:text-white rounded-2xl h-12 font-black uppercase tracking-tighter italic">
                      <Users className="w-4 h-4 mr-2" /> Trocar / Gerenciar Perfis
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <div className="flex flex-wrap gap-2 p-2 bg-white/5 rounded-3xl border border-white/10 w-fit">
              {([["general", "Geral"], ["security", "Segurança"], ["prefs", "Preferências"]] as const).map(([k, l]) => (
                <button key={k} onClick={() => setActiveTab(k)}
                  className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === k ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-white"}`}>
                  {l}
                </button>
              ))}
            </div>

            <div className="bg-white/5 rounded-[2.5rem] border border-white/10 p-6 md:p-10 min-h-[400px]">
              {activeTab === "general" && (
                <div className="space-y-4">
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter italic mb-6 flex items-center gap-3"><Settings className="w-6 h-6 text-primary" /> Configurações Gerais</h3>
                  <Row icon={<Mail className="w-5 h-5" />} title="E-mail da Conta" sub={user?.email}
                    action={actionBtn("Alterar", () => { setEditingField("email"); setNewValue(user?.email || ""); })} />
                  <Row icon={<Globe className="w-5 h-5" />} title="Idioma" sub={langLabel} action={actionBtn("Mudar", () => setEditingField("language"))} />
                  <Row icon={<Smartphone className="w-5 h-5" />} title="Dispositivos Conectados" sub="Desconecte outros aparelhos"
                    action={actionBtn("Gerenciar", () => setEditingField("sessions"))} />
                </div>
              )}

              {activeTab === "security" && (
                <div className="space-y-4">
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter italic mb-6 flex items-center gap-3"><Shield className="w-6 h-6 text-primary" /> Segurança</h3>
                  <Row icon={<Key className="w-5 h-5" />} title="Senha de Acesso" sub="Troque sua senha"
                    action={actionBtn("Alterar", () => setEditingField("password"))} />
                  <Row icon={<Shield className="w-5 h-5" />} title="Verificação em Duas Etapas"
                    sub={mfaFactorId ? "Ativada" : "Desativada"} action={actionBtn(mfaFactorId ? "Gerenciar" : "Ativar", startMfa)} />
                </div>
              )}

              {activeTab === "prefs" && (
                <div className="space-y-4">
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter italic mb-6 flex items-center gap-3"><SlidersHorizontal className="w-6 h-6 text-primary" /> Preferências do Perfil</h3>
                  <Row icon={<SlidersHorizontal className="w-5 h-5" />} title="Qualidade do Vídeo" sub="Padrão ao assistir"
                    action={<Select value={prefs.video_quality} onChange={(v) => savePrefs({ video_quality: v })} options={QUALITIES} />} />
                  <Row icon={<Globe className="w-5 h-5" />} title="Áudio" sub="Idioma preferido"
                    action={<Select value={prefs.audio_language} onChange={(v) => savePrefs({ audio_language: v })} options={LANGS} />} />
                  <Row icon={<Globe className="w-5 h-5" />} title="Legenda" sub="Idioma preferido"
                    action={<Select value={prefs.subtitle_language} onChange={(v) => savePrefs({ subtitle_language: v })} options={SUB_LANGS} />} />
                  {([
                    ["autoplay_next_episode", "Próximo episódio automático", "Começa o próximo episódio sozinho"],
                    ["autoplay_trailers", "Trailers automáticos", "Toca trailers ao passar o mouse"],
                    ["data_saver", "Economia de dados", "Usa qualidade menor no celular"],
                    ["show_watch_history", "Continuar assistindo", "Mostra o que você já começou"],
                    ["personalized_recommendations", "Recomendações personalizadas", "Sugestões com base no que você vê"],
                  ] as const).map(([k, t, s]) => (
                    <Row key={k} icon={<Check className="w-5 h-5" />} title={t} sub={s}
                      action={<Switch checked={!!prefs[k]} onCheckedChange={(v) => savePrefs({ [k]: v })} />} />
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white/5 rounded-[2.5rem] border border-white/10 p-6 md:p-10">
              <h3 className="text-xl font-black text-white uppercase tracking-tighter italic mb-6 flex items-center gap-3"><Clock className="w-6 h-6 text-primary" /> Histórico e Dados</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { icon: <Trash2 className="w-5 h-5" />, t: "Limpar Histórico", s: historyCount === null ? "Apagar registros deste perfil" : `${historyCount} itens neste perfil`, fn: handleClearHistory },
                  { icon: <Download className="w-5 h-5" />, t: "Baixar Meus Dados", s: "Arquivo com perfis, lista e histórico", fn: handleExport },
                  { icon: <LogOut className="w-5 h-5" />, t: "Sair", s: "Encerrar sessão neste aparelho", fn: () => handleSignOut(false) },
                  { icon: <LogOut className="w-5 h-5" />, t: "Sair de Todos", s: "Encerrar sessão em todos os aparelhos", fn: () => handleSignOut(true), danger: true },
                ].map((b) => (
                  <button key={b.t} onClick={b.fn}
                    className={`flex items-center gap-4 p-6 rounded-3xl border border-transparent transition-all text-left ${b.danger ? "bg-destructive/10 hover:bg-destructive/20" : "bg-white/5 hover:bg-white/10 hover:border-white/10"}`}>
                    <div className={`p-3 rounded-2xl ${b.danger ? "bg-destructive/20 text-destructive" : "bg-white/5 text-primary"}`}>{b.icon}</div>
                    <div>
                      <p className={`font-black uppercase tracking-tighter italic ${b.danger ? "text-destructive" : "text-white"}`}>{b.t}</p>
                      <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">{b.s}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;
