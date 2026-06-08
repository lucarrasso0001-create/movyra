import { Toaster as UIToaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ModalProvider } from "@/contexts/ModalContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import MovieDetail from "./pages/MovieDetail";
import MyList from "./pages/MyList";
import Auth from "./pages/Auth";
import Movies from "./pages/Movies";
import Series from "./pages/Series";
import CategoryPage from "./pages/CategoryPage";
import NotFound from "./pages/NotFound";
import ProfileSelect from "./pages/ProfileSelect";
import Trending from "./pages/Trending";
import Account from "./pages/Account";
import Live from "./pages/Live";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <ModalProvider>
          <TooltipProvider>
            <UIToaster />
            <SonnerToaster />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                <Route path="/index" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                <Route path="/profile-select" element={<ProtectedRoute><ProfileSelect /></ProtectedRoute>} />
                <Route path="/perfis" element={<ProtectedRoute><ProfileSelect /></ProtectedRoute>} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/filmes" element={<ProtectedRoute><Movies /></ProtectedRoute>} />
                <Route path="/series" element={<ProtectedRoute><Series /></ProtectedRoute>} />
                <Route path="/bombando" element={<ProtectedRoute><Trending /></ProtectedRoute>} />
                <Route path="/aovivo" element={<ProtectedRoute><Live /></ProtectedRoute>} />
                <Route path="/categoria/:slug" element={<ProtectedRoute><CategoryPage /></ProtectedRoute>} />
                <Route path="/movie/:id" element={<ProtectedRoute><MovieDetail /></ProtectedRoute>} />
                <Route path="/my-list" element={<ProtectedRoute><MyList /></ProtectedRoute>} />
                <Route path="/conta" element={<ProtectedRoute><Account /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ModalProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
