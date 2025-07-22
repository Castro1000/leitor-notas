import { useState } from "react";
import api from "../services/api";

export default function ModalEditarUsuario({ usuario, aoFechar, aoAtualizar }) {
  const [novoUsuario, setNovoUsuario] = useState(usuario.usuario || "");
  const [novaSenha, setNovaSenha] = useState("");
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    if (!novoUsuario.trim()) {
      alert("Usuário não pode estar em branco");
      return;
    }

    setSalvando(true);
    try {
      await api.put(`/api/usuarios/${usuario.id}`, {
        usuario: novoUsuario,
        senha: novaSenha || undefined,
      });
      alert("Usuário atualizado com sucesso!");
      aoAtualizar(); // Recarrega lista no modal pai
      aoFechar();    // Fecha o modal
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      alert("Erro ao atualizar usuário");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div style={estilos.overlay}>
      <div style={estilos.modal}>
        <h3 style={estilos.titulo}>Editar Usuário</h3>

        <label style={estilos.label}>Usuário</label>
        <input
          value={novoUsuario}
          onChange={(e) => setNovoUsuario(e.target.value)}
          style={estilos.input}
        />

        <label style={estilos.label}>Nova Senha</label>
        <input
          type="password"
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
          style={estilos.input}
        />

        <div style={estilos.botoes}>
          <button onClick={aoFechar} style={estilos.cancelar}>Cancelar</button>
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
    backgroundColor: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10000,
  },
  modal: {
    background: "#222",
    padding: 20,
    borderRadius: 10,
    width: "320px",
    color: "#fff",
    boxShadow: "0 0 10px #000",
  },
  titulo: {
    color: "#FFD700",
    marginBottom: 15,
    textAlign: "center",
  },
  label: {
    display: "block",
    marginTop: 10,
    marginBottom: 4,
    color: "#ccc",
    fontWeight: "bold",
  },
  input: {
    width: "100%",
    padding: "8px",
    backgroundColor: "#333",
    color: "#fff",
    border: "1px solid #555",
    borderRadius: 4,
  },
  botoes: {
    marginTop: 20,
    display: "flex",
    justifyContent: "space-between",
  },
  salvar: {
    backgroundColor: "#28a745",
    color: "#fff",
    padding: "8px 16px",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
  cancelar: {
    backgroundColor: "#e60000",
    color: "#fff",
    padding: "8px 16px",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
};
