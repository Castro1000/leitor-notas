import { Navigate } from "react-router-dom";

export default function RotaProtegida({ children }) {
  const usuarioLogado = localStorage.getItem("usuarioLogado");

  if (!usuarioLogado) {
    return <Navigate to="/" replace />;
  }

  return children;
}
