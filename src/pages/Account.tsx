import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Mail, Shield, CreditCard, Bell, Settings, 
  LogOut, ChevronRight, Star, Clock, Trash2, Edit2,
  Camera, Check, X, Loader2
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

  useEffect(() => {
    if (!user && !isLoading) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/auth");
      toast({ title: "Até logo!", description: "Você saiu da sua conta com sucesso." });
    } catch (error) {
      toast({ title: "Erro ao sair", description: "Não foi possível encerrar a sessão.", variant: "destructive" });
    }
  };

  const handleUpdateProfile = async () => {
    if (!displayName.trim() || !user) {
      toast({ title: "Nome inválido", description: "O nome não pode estar vazio.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({ display_name: displayName })
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      
      setProfile(data);
      setIsEditing(false);
      toast({ title: "Perfil atualizado!", description: "Suas alterações foram salvas com sucesso." });
    } catch (error) {
      toast({ title: "Erro ao salvar", description: "Não foi possível atualizar o perfil.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

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
                  <button className="absolute bottom-0 right-0 bg-primary text-white p-2.5 rounded-full shadow-xl hover:scale-110 transition-all border-4 border-background">
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
                        onClick={handleUpdateProfile}
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
              <Button className="w-full bg-white text-black hover:bg-primary hover:text-white rounded-2xl h-12 font-black uppercase tracking-tighter italic transition-all">
                Gerenciar Plano
              </Button>
            </div>
          </div>

          {/* Configurações e Opções */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white/5 rounded-[2.5rem] border border-white/10 p-10 backdrop-blur-xl">
              <h3 className="text-xl font-black text-white uppercase tracking-tighter italic mb-8 flex items-center gap-3">
                <Settings className="w-6 h-6 text-primary" /> Configurações Gerais
              </h3>

              <div className="space-y-4">
                {[
                  { icon: Mail, label: "Alterar E-mail", desc: user?.email },
                  { icon: Shield, label: "Segurança e Senha", desc: "Atualizada há 3 meses" },
                  { icon: CreditCard, label: "Métodos de Pagamento", desc: "Visa final 4242" },
                  { icon: Bell, label: "Notificações", desc: "E-mail e Push ativados" },
                ].map((item, i) => (
                  <button 
                    key={i}
                    className="w-full flex items-center justify-between p-6 rounded-3xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all group"
                  >
                    <div className="flex items-center gap-5 text-left">
                      <div className="p-3 rounded-2xl bg-white/5 group-hover:bg-primary/20 group-hover:text-primary transition-all">
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-white font-black uppercase tracking-tighter italic">{item.label}</p>
                        <p className="text-muted-foreground text-xs font-bold">{item.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white/5 rounded-[2.5rem] border border-white/10 p-10 backdrop-blur-xl">
              <h3 className="text-xl font-black text-white uppercase tracking-tighter italic mb-8 flex items-center gap-3">
                <Clock className="w-6 h-6 text-accent" /> Histórico e Dados
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="flex items-center gap-4 p-6 rounded-3xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all text-left group">
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
