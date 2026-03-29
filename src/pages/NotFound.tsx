import { Link } from "react-router-dom";
const NotFound = () => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center">
    <h1 className="text-6xl font-black text-primary mb-4">404</h1>
    <p className="text-white/60 mb-8">Página não encontrada</p>
    <Link to="/" className="text-primary hover:underline font-bold">Voltar ao início</Link>
  </div>
);
export default NotFound;
