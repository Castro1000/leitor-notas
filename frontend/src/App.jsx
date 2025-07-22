import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import LeitorNota from "./components/LeitorNota";
import HistoricoNotas from "./pages/HistoricoNotas";
import Relatorio from "./pages/Relatorio";
import AdminPainel from "./pages/AdminPainel";
import RotaProtegida from "./components/RotaProtegida";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota pública */}
        <Route path="/" element={<Login />} />

        {/* Rotas protegidas */}
        <Route
          path="/leitor"
          element={
            <RotaProtegida>
              <LeitorNota />
            </RotaProtegida>
          }
        />
        <Route
          path="/historico"
          element={
            <RotaProtegida>
              <HistoricoNotas />
            </RotaProtegida>
          }
        />
        <Route
          path="/relatorio"
          element={
            <RotaProtegida>
              <Relatorio />
            </RotaProtegida>
          }
        />
        <Route
          path="/admin"
          element={
            <RotaProtegida>
              <AdminPainel />
            </RotaProtegida>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
