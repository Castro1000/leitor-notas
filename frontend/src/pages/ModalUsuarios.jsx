import { useEffect, useState } from "react";
import api from "../services/api";

export default function ModalUsuarios({ aberto, aoFechar }) {
  const [usuarios, setUsuarios] = useState([]);
  const [editando, setEditando] = useState({});
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (aberto) {
      api.get("/api/usuarios")
        .then((res) => setUsuarios(res.data))
        .catch(console.error);
    }
  }, [aberto]);

  const salvar = async (id) => {
    setSalvando(true);
    try {
      const dados = editando[id];
      await api.put(`/api/usuarios/${id}`, dados);
      alert("Usuário atualizado com sucesso!");
    } catch (err) {
      alert("Erro ao atualizar usuário");
    } finally {
      setSalvando(false);
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
              <th style={estilos.th}>Código</th>
              <th style={estilos.th}>Usuário</th>
              <th style={estilos.th}>Senha</th>
              <th style={estilos.th}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td style={estilos.td}>{u.id}</td>
                <td style={estilos.td}>
                  <input
                    value={editando[u.id]?.usuario ?? u.usuario}
                    onChange={(e) =>
                      setEditando((prev) => ({
                        ...prev,
                        [u.id]: {
                          ...prev[u.id],
                          usuario: e.target.value,
                        },
                      }))
                    }
                    style={estilos.input}
                  />
                </td>
                <td style={estilos.td}>
                  <input
                    type="password"
                    placeholder="Nova senha"
                    value={editando[u.id]?.senha ?? ""}
                    onChange={(e) =>
                      setEditando((prev) => ({
                        ...prev,
                        [u.id]: {
                          ...prev[u.id],
                          senha: e.target.value,
                        },
                      }))
                    }
                    style={estilos.input}
                  />
                </td>
                <td style={estilos.td}>
                  <button
                    onClick={() => salvar(u.id)}
                    disabled={salvando}
                    style={estilos.botao}
                  >
                    Salvar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={aoFechar} style={estilos.fechar}>Fechar</button>
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
    marginBottom: 16,
    textAlign: "center",
  },
  tabela: {
    width: "100%",
    borderCollapse: "collapse",
    marginBottom: 20,
  },
  th: {
    color: "#FFD700",
    textAlign: "left",
    paddingBottom: 8,
  },
  td: {
    padding: "6px 0",
  },
  input: {
    width: "100%",
    padding: 6,
    backgroundColor: "#333",
    color: "#fff",
    border: "1px solid #555",
    borderRadius: 4,
  },
  botao: {
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
