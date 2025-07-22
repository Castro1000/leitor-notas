import { useEffect, useState } from "react";
import api from "../services/api";
import ModalEditarUsuario from "./ModalEditarUsuario";

export default function ModalUsuarios({ aberto, aoFechar }) {
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);

  useEffect(() => {
    if (aberto) {
      api.get("/api/usuarios")
        .then((res) => setUsuarios(res.data))
        .catch(console.error);
    }
  }, [aberto]);

  const abrirEditar = (usuario) => {
    setUsuarioSelecionado(usuario);
  };

  const fecharEditar = () => {
    setUsuarioSelecionado(null);
  };

  const atualizarLista = async () => {
    try {
      const res = await api.get("/api/usuarios");
      setUsuarios(res.data);
    } catch (err) {
      console.error("Erro ao atualizar lista de usuários");
    }
  };

  if (!aberto) return null;

  return (
    <div style={estilos.overlay}>
      <div style={estilos.modal}>
        <h2 style={estilos.titulo}>Usuários</h2>
        <table style={estilos.tabela}>
          <thead>
            <tr>
              <th>Código</th>
              <th>Usuário</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.usuario}</td>
                <td>
                  <button onClick={() => abrirEditar(u)} style={estilos.botaoEditar}>Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={aoFechar} style={estilos.fechar}>Fechar</button>
      </div>
      {usuarioSelecionado && (
        <ModalEditarUsuario
          usuario={usuarioSelecionado}
          aoFechar={fecharEditar}
          aoSalvar={atualizarLista}
        />
      )}
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
  },
  modal: {
    background: "#222",
    padding: 20,
    borderRadius: 10,
    minWidth: 500,
    maxHeight: "80vh",
    overflowY: "auto",
    color: "#fff",
  },
  titulo: {
    color: "#FFD700",
    marginBottom: 10,
    textAlign: "center",
  },
  tabela: {
    width: "100%",
    borderCollapse: "collapse",
    marginBottom: 20,
  },
  botaoEditar: {
    padding: "6px 12px",
    backgroundColor: "#28a745",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
  },
  fechar: {
    backgroundColor: "#e60000",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    borderRadius: 6,
    cursor: "pointer",
    display: "block",
    margin: "0 auto",
  },
};
