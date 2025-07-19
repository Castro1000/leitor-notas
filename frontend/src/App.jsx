import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import LeitorNota from "./components/LeitorNota";
import HistoricoNotas from "./pages/HistoricoNotas";
import Relatorio from "./pages/Relatorio";
import AdminPainel from "./pages/AdminPainel";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/leitor" element={<LeitorNota />} />
        <Route path="/historico" element={<HistoricoNotas />} />
        <Route path="/relatorio" element={<Relatorio />} />
        <Route path="/admin" element={<AdminPainel />} />{" "}
        {/* ✅ ESSA LINHA É FUNDAMENTAL */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
