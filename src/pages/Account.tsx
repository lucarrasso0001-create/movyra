import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, Shield, CreditCard, Bell, Settings, 
  LogOut, ChevronRight, Star, Clock, Trash2, Edit2,
  Camera, Check, X, Loader2, Key, Smartphone, Globe,
  AlertCircle, Plus, CreditCard as CardIcon
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

const Account = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, isLoading, setProfile } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "security" | "billing">("general");

  // Estados para Modais de Edição
  const [editingField, setEditingField] = useState<string | null>(null);
  const [newValue, setNewValue] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

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

  useEffect(() => {
    if (!user && !isLoading) {
      navigate("/auth");
    }
    if (profile?.display_name) {
      setDisplayName(profile.display_name);
    }
  }, [user, isLoading, navigate, profile]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/auth");
      toast({ title: "Até logo!", description: "Você saiu da sua conta com sucesso." });
    } catch (error) {
      toast({ title: "Erro ao sair", description: "Não foi possível encerrar a sessão.", variant: "destructive" });
    }
  };

  const handleUpdateProfile = async (newAvatarUrl?: string) => {
    if (!user) return;
    if (!newAvatarUrl && !displayName.trim()) {
      toast({ title: "Nome inválido", description: "O nome não pode estar vazio.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const updateData: any = {};
      if (newAvatarUrl) updateData.avatar_url = newAvatarUrl;
      if (displayName.trim()) updateData.display_name = displayName;

      const { data, error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", profile?.id || "")
        .select()
        .single();

      if (error) throw error;
      
      setProfile(data);
      setIsEditing(false);
      setShowAvatarPicker(false);
      toast({ title: "Perfil atualizado!", description: "Suas alterações foram salvas com sucesso." });
    } catch (error) {
      toast({ title: "Erro ao salvar", description: "Não foi possível atualizar o perfil.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!newValue.includes("@")) {
      toast({ title: "E-mail inválido", description: "Por favor, insira um e-mail válido.", variant: "destructive" });
      return;
    }

    setIsActionLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newValue });
      if (error) throw error;
      toast({ 
        title: "Verifique seu e-mail", 
        description: "Enviamos um link de confirmação para o novo endereço de e-mail." 
      });
      setEditingField(null);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Não foi possível atualizar o e-mail.", variant: "destructive" });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newValue.length < 6) {
      toast({ title: "Senha fraca", description: "A senha deve ter pelo menos 6 caracteres.", variant: "destructive" });
      return;
    }

    setIsActionLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newValue });
      if (error) throw error;
      toast({ title: "Senha atualizada!", description: "Sua senha foi alterada com sucesso." });
      setEditingField(null);
      setNewValue("");
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Não foi possível atualizar a senha.", variant: "destructive" });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!user) return;
    
    const confirm = window.confirm("Tem certeza que deseja limpar todo o seu histórico de visualização? Esta ação não pode ser desfeita.");
    if (!confirm) return;

    try {
      toast({ title: "Histórico limpo", description: "Seu histórico de visualização foi apagado." });
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível limpar o histórico.", variant: "destructive" });
    }
  };

  const renderModal = () => (
    <AnimatePresence>
      {showAvatarPicker && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAvatarPicker(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-[2.5rem] p-10 shadow-2xl"
          >
            <button 
              onClick={() => setShowAvatarPicker(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-muted-foreground hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic mb-6">
              Escolher Avatar
            </h3>
            
            <div className="grid grid-cols-4 gap-4">
              {AVATAR_OPTIONS.map((url, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleUpdateProfile(url)}
                  className={`rounded-2xl overflow-hidden border-2 transition-all ${profile?.avatar_url === url ? "border-primary" : "border-transparent"}`}
                >
                  <img src={url} alt={`Avatar ${i}`} className="w-full h-full object-cover" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {editingField && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEditingField(null)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-[2.5rem] p-10 shadow-2xl"
          >
            <button 
              onClick={() => setEditingField(null)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-muted-foreground hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic mb-2">
              {editingField === "email" ? "Alterar E-mail" : "Alterar Senha"}
            </h3>
            <p className="text-muted-foreground text-sm font-bold mb-8">
              {editingField === "email" 
                ? "Insira seu novo endereço de e-mail. Você precisará confirmá-lo." 
                : "Crie uma nova senha forte para proteger sua conta."}
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">
                  {editingField === "email" ? "Novo E-mail" : "Nova Senha"}
                </label>
                <Input 
                  type={editingField === "email" ? "email" : "password"}
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder={editingField === "email" ? "exemplo@email.com" : "••••••••"}
                  className="bg-white/5 border-white/10 h-14 rounded-2xl px-6 font-bold focus:ring-primary/50"
                />
              </div>

              <Button 
                onClick={editingField === "email" ? handleUpdateEmail : handleUpdatePassword}
                disabled={isActionLoading}
                className="w-full bg-primary text-white h-14 rounded-2xl font-black uppercase tracking-tighter italic text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                {isActionLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Confirmar Alteração"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {renderModal()}

      <div className="max-w-6xl mx-auto px-6 py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 uppercase tracking-tighter italic">
            Minha Conta
          </h1>
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">
            Gerencie seu perfil, assinatura e preferências
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Sidebar de Perfil */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white/5 rounded-[2.5rem] border border-white/10 p-10 backdrop-blur-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/20 transition-all" />
              
              <div className="relative flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20 p-1">
                    <img 
                      src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.display_name || user?.email}`} 
                      alt={profile?.display_name || "Avatar"}
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                  <button 
                    onClick={() => setShowAvatarPicker(true)}
                    className="absolute bottom-0 right-0 bg-primary text-white p-2.5 rounded-full shadow-xl hover:scale-110 transition-all border-4 border-background"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                {isEditing ? (
                  <div className="w-full space-y-4">
                    <Input 
                      value={displayName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value)}
                      className="bg-white/5 border-white/10 text-center font-bold h-12 rounded-xl"
                      placeholder="Seu nome"
                    />
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleUpdateProfile()}
                        disabled={isSaving}
                        className="flex-1 bg-primary text-white rounded-xl h-10 font-black uppercase tracking-tighter italic"
                      >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      </Button>
                      <Button 
                        onClick={() => {
                          setIsEditing(false);
                          setDisplayName(profile?.display_name || "");
                        }}
                        variant="outline"
                        className="flex-1 border-white/10 bg-white/5 text-white rounded-xl h-10 font-black uppercase tracking-tighter italic"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic mb-1">
                      {profile?.display_name || "Usuário"}
                    </h2>
                    <p className="text-muted-foreground text-sm font-bold mb-6">{user?.email}</p>
                    <Button 
                      onClick={() => setIsEditing(true)}
                      variant="outline" 
                      className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-2xl h-12 font-black uppercase tracking-tighter italic"
                    >
                      <Edit2 className="w-4 h-4 mr-2" /> Editar Perfil
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="bg-white/5 rounded-[2.5rem] border border-white/10 p-8 backdrop-blur-xl">
              <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-6 ml-2">Assinatura</h3>
              <div className="bg-primary/10 border border-primary/20 rounded-3xl p-6 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-primary font-black uppercase tracking-tighter italic text-lg">Plano Premium</span>
                  <Star className="w-5 h-5 text-primary fill-current" />
                </div>
                <p className="text-white/70 text-xs font-bold">Próxima renovação: 15 Abr 2026</p>
              </div>
              <Button 
                onClick={() => toast({ title: "Em breve", description: "O gerenciamento de assinatura estará disponível em breve." })}
                className="w-full bg-white text-black hover:bg-primary hover:text-white rounded-2xl h-12 font-black uppercase tracking-tighter italic transition-all"
              >
                Gerenciar Plano
              </Button>
            </div>
          </div>

          {/* Configurações e Opções */}
          <div className="lg:col-span-2 space-y-8">
            {/* Tabs de Navegação Interna */}
            <div className="flex gap-4 p-2 bg-white/5 rounded-3xl border border-white/10 w-fit">
              <button 
                onClick={() => setActiveTab("general")}
                className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === "general" ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-white"}`}
              >
                Geral
              </button>
              <button 
                onClick={() => setActiveTab("security")}
                className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === "security" ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-white"}`}
              >
                Segurança
              </button>
              <button 
                onClick={() => setActiveTab("billing")}
                className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === "billing" ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-white"}`}
              >
                Pagamento
              </button>
            </div>

            <div className="bg-white/5 rounded-[2.5rem] border border-white/10 p-10 backdrop-blur-xl min-h-[500px]">
              {activeTab === "general" && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter italic mb-8 flex items-center gap-3">
                    <Settings className="w-6 h-6 text-primary" /> Configurações Gerais
                  </h3>
                  <div className="space-y-4">
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-all">
                      <div className="flex items-center gap-5">
                        <div className="p-3 rounded-2xl bg-white/5 text-primary"><Mail className="w-5 h-5" /></div>
                        <div>
                          <p className="text-white font-black uppercase tracking-tighter italic">E-mail da Conta</p>
                          <p className="text-muted-foreground text-xs font-bold">{user?.email}</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        className="text-primary font-black text-xs uppercase tracking-widest hover:bg-primary/10 px-6 h-10 rounded-xl" 
                        onClick={() => {
                          setEditingField("email");
                          setNewValue(user?.email || "");
                        }}
                      >
                        Alterar
                      </Button>
                    </div>
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-all">
                      <div className="flex items-center gap-5">
                        <div className="p-3 rounded-2xl bg-white/5 text-accent"><Globe className="w-5 h-5" /></div>
                        <div>
                          <p className="text-white font-black uppercase tracking-tighter italic">Idioma do App</p>
                          <p className="text-muted-foreground text-xs font-bold">Português (Brasil)</p>
                        </div>
                      </div>
                      <Button variant="ghost" className="text-accent font-black text-xs uppercase tracking-widest hover:bg-accent/10 px-6 h-10 rounded-xl">Mudar</Button>
                    </div>
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-all">
                      <div className="flex items-center gap-5">
                        <div className="p-3 rounded-2xl bg-white/5 text-blue-400"><Smartphone className="w-5 h-5" /></div>
                        <div>
                          <p className="text-white font-black uppercase tracking-tighter italic">Dispositivos Conectados</p>
                          <p className="text-muted-foreground text-xs font-bold">3 dispositivos ativos</p>
                        </div>
                      </div>
                      <Button variant="ghost" className="text-blue-400 font-black text-xs uppercase tracking-widest hover:bg-blue-400/10 px-6 h-10 rounded-xl">Gerenciar</Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "security" && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter italic mb-8 flex items-center gap-3">
                    <Shield className="w-6 h-6 text-green-400" /> Segurança e Privacidade
                  </h3>
                  <div className="space-y-4">
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-all">
                      <div className="flex items-center gap-5">
                        <div className="p-3 rounded-2xl bg-white/5 text-green-400"><Key className="w-5 h-5" /></div>
                        <div>
                          <p className="text-white font-black uppercase tracking-tighter italic">Senha de Acesso</p>
                          <p className="text-muted-foreground text-xs font-bold">Atualizada recentemente</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        className="text-green-400 font-black text-xs uppercase tracking-widest hover:bg-green-400/10 px-6 h-10 rounded-xl"
                        onClick={() => {
                          setEditingField("password");
                          setNewValue("");
                        }}
                      >
                        Alterar
                      </Button>
                    </div>
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-all">
                      <div className="flex items-center gap-5">
                        <div className="p-3 rounded-2xl bg-white/5 text-orange-400"><Shield className="w-5 h-5" /></div>
                        <div>
                          <p className="text-white font-black uppercase tracking-tighter italic">Autenticação em Duas Etapas</p>
                          <p className="text-muted-foreground text-xs font-bold">Proteção extra para sua conta</p>
                        </div>
                      </div>
                      <Button variant="ghost" className="text-orange-400 font-black text-xs uppercase tracking-widest hover:bg-orange-400/10 px-6 h-10 rounded-xl">Ativar</Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "billing" && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter italic mb-8 flex items-center gap-3">
                    <CreditCard className="w-6 h-6 text-purple-400" /> Pagamento e Faturamento
                  </h3>
                  <div className="space-y-4">
                    <div className="p-8 rounded-[2rem] bg-gradient-to-br from-purple-500/20 to-primary/20 border border-white/10 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-all">
                        <CardIcon className="w-24 h-24" />
                      </div>
                      <div className="relative">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-300 mb-4">Cartão Principal</p>
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-12 h-8 bg-white/10 rounded-md flex items-center justify-center font-bold text-[10px]">VISA</div>
                          <p className="text-xl font-black text-white tracking-widest">•••• •••• •••• 4242</p>
                        </div>
                        <div className="flex gap-3">
                          <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl h-10 font-black uppercase tracking-tighter italic text-xs">Editar</Button>
                          <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl h-10 font-black uppercase tracking-tighter italic text-xs">Remover</Button>
                        </div>
                      </div>
                    </div>
                    
                    <button className="w-full p-6 rounded-3xl bg-white/5 border border-dashed border-white/10 flex items-center justify-center gap-3 hover:bg-white/10 transition-all group">
                      <Plus className="w-5 h-5 text-muted-foreground group-hover:text-white transition-all" />
                      <span className="text-xs font-black uppercase tracking-widest text-muted-foreground group-hover:text-white transition-all">Adicionar Novo Método</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="bg-white/5 rounded-[2.5rem] border border-white/10 p-10 backdrop-blur-xl">
              <h3 className="text-xl font-black text-white uppercase tracking-tighter italic mb-8 flex items-center gap-3">
                <Clock className="w-6 h-6 text-accent" /> Histórico e Dados
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={handleClearHistory}
                  className="flex items-center gap-4 p-6 rounded-3xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all text-left group"
                >
                  <div className="p-3 rounded-2xl bg-white/5 group-hover:bg-accent/20 group-hover:text-accent transition-all">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-white font-black uppercase tracking-tighter italic">Limpar Histórico</p>
                    <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Apagar registros de visualização</p>
                  </div>
                </button>

                <button 
                  onClick={handleSignOut}
                  className="flex items-center gap-4 p-6 rounded-3xl bg-red-500/5 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all text-left group"
                >
                  <div className="p-3 rounded-2xl bg-red-500/10 text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-red-500 font-black uppercase tracking-tighter italic group-hover:text-red-400">Sair da Conta</p>
                    <p className="text-red-500/50 text-[10px] font-bold uppercase tracking-widest">Encerrar sessão em todos os dispositivos</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;
