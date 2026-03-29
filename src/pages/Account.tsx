import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { User, Settings, Shield, LogOut, CreditCard, Bell, HelpCircle, ChevronRight, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Account = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Sessão encerrada com sucesso!");
      navigate("/auth");
    } catch (error) {
      toast.error("Erro ao encerrar sessão.");
    }
  };

  const menuItems = [
    { icon: User, label: "Dados Pessoais", desc: "Nome, e-mail e telefone", color: "text-blue-500" },
    { icon: Shield, label: "Segurança", desc: "Senha e autenticação", color: "text-green-500" },
    { icon: CreditCard, label: "Assinatura", desc: "Plano Premium Ativo", color: "text-purple-500" },
    { icon: Bell, label: "Notificações", desc: "Alertas e e-mails", color: "text-yellow-500" },
    { icon: HelpCircle, label: "Ajuda", desc: "Suporte e FAQ", color: "text-white/40" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-12 px-4 md:px-8 lg:px-12 max-w-4xl mx-auto">
        {/* Profile Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-8 md:p-12 mb-10"
        >
          <div className="absolute top-0 right-0 p-6">
            <div className="flex items-center gap-2 px-4 py-1.5 bg-primary/20 border border-primary/30 rounded-full">
              <Star className="w-4 h-4 text-primary fill-primary" />
              <span className="text-primary text-xs font-black uppercase tracking-widest">Premium</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20 group-hover:border-primary/40 transition-all">
                <img 
                  src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-white text-black rounded-full shadow-xl hover:scale-110 transition-transform">
                <Settings className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center md:text-left">
              <h1 className="text-3xl font-black text-white tracking-tight uppercase mb-1">
                {profile?.full_name || "Usuário Movyra"}
              </h1>
              <p className="text-white/40 font-bold mb-4">{user?.email}</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <div className="px-4 py-1 bg-white/5 rounded-full text-xs font-bold text-white/60 border border-white/10">
                  ID: {user?.id?.slice(0, 8)}
                </div>
                <div className="px-4 py-1 bg-white/5 rounded-full text-xs font-bold text-white/60 border border-white/10">
                  Membro desde {new Date(user?.created_at || "").getFullYear()}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {menuItems.map((item, index) => (
            <motion.button
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group text-left"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-white/5 ${item.color}`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-white font-black uppercase tracking-tight text-sm">{item.label}</h3>
                  <p className="text-white/40 text-xs font-bold">{item.desc}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </motion.button>
          ))}
        </div>

        {/* Danger Zone */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col items-center"
        >
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-3 px-10 py-4 bg-red-500/10 border border-red-500/20 text-red-500 font-black rounded-full hover:bg-red-500 hover:text-white transition-all uppercase tracking-widest text-sm"
          >
            <LogOut className="w-5 h-5" />
            Encerrar Sessão
          </button>
          <p className="mt-6 text-white/20 text-[10px] font-bold uppercase tracking-[0.2em]">
            Movyra Streaming — Versão 2.0.4
          </p>
        </motion.div>
      </main>
    </div>
  );
};

export default Account;
