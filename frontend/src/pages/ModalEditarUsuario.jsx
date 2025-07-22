import { useState } from "react";
import api from "../services/api";

export default function ModalEditarUsuario({ usuario, aoFechar, aoSalvar }) {
  const [form, setForm] = useState({
    usuario: usuario.usuario || "",
    senha: "",
  });
  const [salvando, setSalvando] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const salvar = async () => {
    setSalvando(true);
    try {
      await api.put(`/api/usuarios/${usuario.id}`, form);
      alert("Usuário atualizado com sucesso!");
      aoSalvar();
    } catch (err) {
      alert("Erro ao atualizar usuário");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div style={estilos.overlay}>
      <div style={estilos.modal}>
        <h3 style={estilos.titulo}>Editar Usuário</h3>

        <div style={estilos.campo}>
          <label style={estilos.label}>Usuário</label>
          <input
            name="usuario"
            value={form.usuario}
            onChange={handleChange}
            style={estilos.input}
          />
        </div>

        <div style={estilos.campo}>
          <label style={estilos.label}>Nova Senha</label>
          <input
            type="password"
            name="senha"
            value={form.senha}
            onChange={handleChange}
            style={estilos.input}
          />
        </div>

        <div style={estilos.botoes}>
          <button onClick={aoFechar} style={estilos.cancelar}>
            Cancelar
          </button>
          <button onClick={salvar} disabled={salvando} style={estilos.salvar}>
            {salvando ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

const estilos = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px",
    zIndex: 9999,
  },
  modal: {
    backgroundColor: "#222",
    padding: "20px",
    borderRadius: "10px",
    width: "100%",
    maxWidth: "400px",
    color: "#fff",
    boxSizing: "border-box",
  },
  titulo: {
    marginBottom: "16px",
    textAlign: "center",
    fontSize: "20px",
    color: "#FFD700",
  },
  campo: {
    marginBottom: "16px",
  },
  label: {
    display: "block",
    marginBottom: "6px",
    color: "#ccc",
  },
  input: {
    width: "100%",
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #555",
    backgroundColor: "#333",
    color: "#fff",
    boxSizing: "border-box",
  },
  botoes: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    flexWrap: "wrap",
  },
  cancelar: {
    backgroundColor: "#e60000",
    color: "#fff",
    padding: "10px 16px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    flex: 1,
    minWidth: "45%",
  },
  salvar: {
    backgroundColor: "#28a745",
    color: "#fff",
    padding: "10px 16px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    flex: 1,
    minWidth: "45%",
  },
};
