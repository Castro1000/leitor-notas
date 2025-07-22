import { useEffect, useState } from "react";
import ModalEditarUsuario from "./ModalEditarUsuario";
import api from "../services/api";

export default function ModalUsuarios({ aberto, aoFechar }) {
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);

  useEffect(() => {
    if (aberto) {
      api.get("/api/usuarios").then((res) => setUsuarios(res.data)).catch(console.error);
    }
  }, [aberto]);

  const atualizarLista = async () => {
    try {
      const res = await api.get("/api/usuarios");
      setUsuarios(res.data);
    } catch (error) {
      console.error("Erro ao atualizar lista de usuários:", error);
    }
  };

  if (!aberto) return null;

  return (
    <div style={estilos.overlay}>
      <div style={estilos.modal}>
        <h2 style={estilos.titulo}>Usuários</h2>
        <div style={estilos.scroll}>
          <table style={estilos.tabela}>
            <thead>
              <tr>
                <th style={estilos.th}>Código</th>
                <th style={estilos.th}>Usuário</th>
                <th style={estilos.th}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td style={estilos.td}>{u.id}</td>
                  <td style={estilos.td}>{u.usuario}</td>
                  <td style={estilos.td}>
                    <button style={estilos.botaoEditar} onClick={() => setUsuarioSelecionado(u)}>
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button style={estilos.botaoFechar} onClick={aoFechar}>Fechar</button>

        {usuarioSelecionado && (
          <ModalEditarUsuario
            usuario={usuarioSelecionado}
            aoFechar={() => setUsuarioSelecionado(null)}
            aoSalvar={() => {
              setUsuarioSelecionado(null);
              atualizarLista();
            }}
          />
        )}
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
    zIndex: 9999,
    padding: "10px",
  },
  modal: {
    background: "#222",
    padding: "20px",
    borderRadius: "10px",
    color: "#fff",
    width: "100%",
    maxWidth: "600px",
    boxSizing: "border-box",
  },
  titulo: {
    color: "#FFD700",
    marginBottom: "16px",
    textAlign: "center",
    fontSize: "20px",
  },
  scroll: {
    overflowX: "auto",
  },
  tabela: {
    width: "100%",
    borderCollapse: "collapse",
    marginBottom: "16px",
  },
  th: {
    padding: "8px",
    backgroundColor: "#333",
    color: "#FFD700",
    borderBottom: "1px solid #555",
    textAlign: "left",
  },
  td: {
    padding: "8px",
    borderBottom: "1px solid #444",
  },
  botaoEditar: {
    padding: "6px 12px",
    backgroundColor: "#28a745",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    width: "100%",
  },
  botaoFechar: {
    backgroundColor: "#e60000",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    display: "block",
    margin: "0 auto",
    fontWeight: "bold",
  },
};
