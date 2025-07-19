import { useEffect, useState } from "react";
import api from "../services/api";

export default function AdminPainel() {
  const [notas, setNotas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const buscarNotas = async () => {
      try {
        const { data } = await api.get("/api/listar-notas");

        const hoje = new Date();
        const diaAtual = hoje.toISOString().slice(0, 10);

        const filtradas = data.filter((nota) => {
          return nota.data_registro && nota.data_registro.startsWith(diaAtual);
        });

        setNotas(filtradas);
      } catch (error) {
        console.error("Erro ao buscar notas:", error);
      } finally {
        setCarregando(false);
      }
    };

    buscarNotas();
  }, []);

  const calcularTempo = (inicio, fim) => {
    if (!inicio || !fim) return "-";
    const diff = new Date(fim) - new Date(inicio);
    const minutos = Math.floor(diff / 60000);
    return `${minutos} min`;
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.titulo}>📊 Painel do Administrador</h2>
      {carregando ? (
        <p style={styles.info}>Carregando notas...</p>
      ) : (
        <div style={styles.tabelaWrapper}>
          <table style={styles.tabela}>
            <thead>
              <tr>
                <th style={styles.th}>Número</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Hora de Entrada</th>
                <th style={styles.th}>Finalizada</th>
                <th style={styles.th}>Tempo Total</th>
              </tr>
            </thead>
            <tbody>
              {notas.map((nota) => (
                <tr key={nota.id}>
                  <td style={styles.td}>{nota.numero_nota}</td>
                  <td style={styles.td}>{nota.status}</td>
                  <td style={styles.td}>
                    {nota.data_registro
                      ? new Date(nota.data_registro).toLocaleTimeString()
                      : "-"}
                  </td>
                  <td style={styles.td}>
                    {nota.status === "FINALIZADA" && nota.data_entrega ? (
                      <div style={{ fontSize: "13px" }}>
                        {new Date(nota.data_entrega).toLocaleString()}
                      </div>
                    ) : (
                      <div style={{ color: "#888" }}>⏳</div>
                    )}
                  </td>
                  <td style={styles.td}>
                    {calcularTempo(nota.data_registro, nota.data_entrega)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "30px",
    backgroundColor: "#111",
    color: "#fff",
    minHeight: "100vh",
  },
  titulo: {
    fontSize: "28px",
    marginBottom: "20px",
    color: "#FFD700",
    textAlign: "center",
    textTransform: "uppercase",
  },
  info: {
    color: "#ccc",
    textAlign: "center",
  },
  tabelaWrapper: {
    overflowX: "auto",
  },
  tabela: {
    width: "100%",
    borderCollapse: "collapse",
    backgroundColor: "#1e1e1e",
    borderRadius: "10px",
    overflow: "hidden",
  },
  th: {
    padding: "12px",
    backgroundColor: "#222",
    color: "#FFD700",
    fontWeight: "bold",
    borderBottom: "2px solid #444",
    textAlign: "left",
  },
  td: {
    padding: "10px",
    borderBottom: "1px solid #333",
    textAlign: "left",
  },
};
