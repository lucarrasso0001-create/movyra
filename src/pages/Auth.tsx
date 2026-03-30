import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Mail, Lock, User, ArrowRight, Loader2, ArrowLeft } from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      const from = (location.state as any)?.from?.pathname || "/profile-select";
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast({ title: "Bem-vindo de volta!", description: "Login realizado com sucesso." });
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;
        toast({ title: "Conta criada!", description: "Verifique seu e-mail para confirmar o cadastro." });
      }
    } catch (error: any) {
      toast({
        title: "Erro na autenticação",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden p-4">
      {/* Background Decorativo */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] animate-pulse" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="bg-white/5 backdrop-blur-2xl p-8 md:p-12 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
          {/* Botão Voltar */}
          <button 
            onClick={() => navigate("/")}
            className="absolute top-6 left-6 text-muted-foreground hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Logo */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="inline-block mb-4"
            >
              <span className="text-4xl font-black tracking-tighter text-white uppercase italic">
                Movyra<span className="text-primary">.</span>
              </span>
            </motion.div>
            <h2 className="text-xl font-bold text-muted-foreground uppercase tracking-widest text-[10px]">
              {isLogin ? "Acesse sua conta premium" : "Crie sua conta gratuita"}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Nome Completo</Label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="name"
                      placeholder="Seu nome"
                      value={fullName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
                      className="pl-12 bg-white/5 border-white/10 h-14 rounded-2xl focus:ring-primary focus:border-primary transition-all"
                      required={!isLogin}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">E-mail</Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="exemplo@email.com"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  className="pl-12 bg-white/5 border-white/10 h-14 rounded-2xl focus:ring-primary focus:border-primary transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Senha</Label>
                {isLogin && (
                  <button type="button" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Esqueceu?</button>
                )}
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  className="pl-12 bg-white/5 border-white/10 h-14 rounded-2xl focus:ring-primary focus:border-primary transition-all"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-2xl bg-white text-black hover:bg-primary hover:text-white font-black uppercase tracking-tighter text-lg transition-all active:scale-95 shadow-xl group"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  {isLogin ? "Entrar" : "Cadastrar"}
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-10 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm font-bold text-muted-foreground hover:text-white transition-colors"
            >
              {isLogin ? (
                <>Não tem uma conta? <span className="text-primary font-black uppercase tracking-tighter italic ml-1">Cadastre-se agora</span></>
              ) : (
                <>Já possui uma conta? <span className="text-primary font-black uppercase tracking-tighter italic ml-1">Faça login</span></>
              )}
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-50">
          Ao continuar, você concorda com nossos <br /> Termos de Serviço e Política de Privacidade.
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
