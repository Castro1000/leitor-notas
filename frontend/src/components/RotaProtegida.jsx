import { Navigate } from "react-router-dom";

export default function RotaProtegida({ children }) {
  const usuarioLogado = localStorage.getItem("usuarioLogado");
  return usuarioLogado ? children : <Navigate to="/" />;
}
