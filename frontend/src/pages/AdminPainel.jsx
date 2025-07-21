import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AdminPainel() {
  const [notas, setNotas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [dataFiltro, setDataFiltro] = useState(() => new Date().toISOString().slice(0, 10));
  const [ordenarPor, setOrdenarPor] = useState("data_registro");
  const [buscaNumero, setBuscaNumero] = useState("");
  const [mostrarExportar, setMostrarExportar] = useState(false);
  const [abrirConfig, setAbrirConfig] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [editar, setEditar] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const buscarNotas = async () => {
      try {
        const { data } = await api.get("/api/listar-notas");
        const filtradas = data.filter((nota) => {
          const porNumero = buscaNumero ? nota.numero_nota?.includes(buscaNumero) : true;
          const porData = buscaNumero ? true : nota.data_registro?.startsWith(dataFiltro);
          return porData && porNumero;
        });
        setNotas(filtradas);
      } catch (error) {
        console.error("Erro ao buscar notas:", error);
      } finally {
        setCarregando(false);
      }
    };

    buscarNotas();

    const hoje = new Date().toISOString().slice(0, 10);
    let intervalo;
    if (dataFiltro === hoje && !buscaNumero) {
      intervalo = setInterval(buscarNotas, 5000);
    }
    return () => {
      if (intervalo) clearInterval(intervalo);
    };
  }, [dataFiltro, buscaNumero]);

  useEffect(() => {
    if (abrirConfig) {
      const buscarUsuarios = async () => {
        try {
          const { data } = await api.get("/api/usuarios");
          setUsuarios(data);
        } catch (error) {
          console.error("Erro ao buscar usuários:", error);
        }
      };
      buscarUsuarios();
    }
  }, [abrirConfig]);

  const handleLogout = () => {
    localStorage.removeItem("usuarioLogado");
    navigate("/");
  };

  const calcularTempo = (inicio, fim) => {
    if (!inicio || !fim) return "-";
    const diff = new Date(fim) - new Date(inicio);
    const minutos = Math.floor(diff / 60000);
    const dias = Math.floor(minutos / 1440);
    const horas = Math.floor((minutos % 1440) / 60);
    const restoMin = minutos % 60;
    let resultado = "";
    if (dias > 0) resultado += `${dias} dia${dias > 1 ? "s" : ""} `;
    if (horas > 0) resultado += `${horas}h `;
    if (restoMin > 0 || (!dias && !horas)) resultado += `${restoMin}min`;
    return resultado.trim();
  };

  const exportarExcel = () => {
    const wsData = [
      ["Número", "Status", "Hora de Entrada", "Finalizada", "Tempo Total"],
      ...notas.map((n) => [
        n.numero_nota,
        n.status,
        n.data_registro ? new Date(n.data_registro).toLocaleString("pt-BR", { timeZone: "America/Manaus", hour12: false }) : "",
        n.data_entrega ? new Date(n.data_entrega).toLocaleString("pt-BR", { timeZone: "America/Manaus", hour12: false }) : "",
        calcularTempo(n.data_registro, n.data_entrega),
      ])
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Notas");
    XLSX.writeFile(wb, `relatorio_${dataFiltro}.xlsx`);
    setMostrarExportar(false);
  };

  const exportarPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(12);
      doc.text("Relatório de Notas", 14, 15);
      const tableData = notas.map((n) => [
        n.numero_nota,
        n.status,
        n.data_registro ? new Date(n.data_registro).toLocaleString("pt-BR", { timeZone: "America/Manaus", hour12: false }) : "",
        n.data_entrega ? new Date(n.data_entrega).toLocaleString("pt-BR", { timeZone: "America/Manaus", hour12: false }) : "",
        calcularTempo(n.data_registro, n.data_entrega),
      ]);
      autoTable(doc, {
        head: [["Número", "Status", "Hora de Entrada", "Finalizada", "Tempo Total"]],
        body: tableData,
        startY: 20,
      });
      doc.save(`relatorio_${dataFiltro}.pdf`);
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
    } finally {
      setMostrarExportar(false);
    }
  };

  const salvarUsuario = async (id) => {
    try {
      await api.put(`/api/usuarios/${id}`, editar[id]);
      alert("Usuário atualizado!");
    } catch (error) {
      alert("Erro ao atualizar usuário");
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "FINALIZADA": return "🟢";
      case "EM ANDAMENTO": return "🟡";
      case "CONTAINER SENDO OVADO":
      case "CONTAINER FINALIZADO": return "🔵";
      case "ATRASADA": return "🔴";
      default: return "⚪";
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "FINALIZADA": return { color: "#00FF99", fontWeight: "bold" };
      case "EM ANDAMENTO": return { color: "#FFD700", fontWeight: "bold" };
      case "CONTAINER SENDO OVADO":
      case "CONTAINER FINALIZADO": return { color: "#66ccff", fontWeight: "bold" };
      case "ATRASADA": return { color: "#FF4444", fontWeight: "bold" };
      default: return { color: "#ccc" };
    }
  };

  const statusResumo = notas.reduce((acc, nota) => {
    acc.total++;
    acc[nota.status] = (acc[nota.status] || 0) + 1;
    return acc;
  }, { total: 0 });

  const ordenarNotas = (a, b) => {
    if (ordenarPor === "tempo") {
      const ta = new Date(a.data_entrega) - new Date(a.data_registro);
      const tb = new Date(b.data_entrega) - new Date(b.data_registro);
      return ta - tb;
    }
    return new Date(b[ordenarPor]) - new Date(a[ordenarPor]);
  };

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <h2 style={styles.titulo}>📊 Painel do Administrador</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => setAbrirConfig(true)} style={styles.botaoConfig}>⚙️</button>
          <button onClick={handleLogout} style={styles.botaoSair}>Sair</button>
        </div>
      </div>

      <div style={styles.filtros}>
        <input type="date" value={dataFiltro} onChange={(e) => setDataFiltro(e.target.value)} style={styles.inputData} />
        <input type="text" placeholder="Buscar nº nota" value={buscaNumero} onChange={(e) => setBuscaNumero(e.target.value)} style={styles.inputBusca} />

        <div style={{ position: "relative" }}>
          <button onClick={() => setMostrarExportar(!mostrarExportar)} style={styles.botaoExportar}>📁 Exportar</button>
          {mostrarExportar && (
            <div style={styles.menuExportar}>
              <button onClick={exportarPDF} style={styles.itemExportar}>📄 PDF</button>
              <button onClick={exportarExcel} style={styles.itemExportar}>📊 Excel</button>
            </div>
          )}
        </div>
      </div>

      <div style={styles.resumo}>
        <span>Total: {statusResumo.total}</span>
        <span> | EM ANDAMENTO: {statusResumo["EM ANDAMENTO"] || 0}</span>
        <span> | CONTAINER: {(statusResumo["CONTAINER SENDO OVADO"] || 0) + (statusResumo["CONTAINER FINALIZADO"] || 0)}</span>
        <span> | FINALIZADAS: {statusResumo["FINALIZADA"] || 0}</span>
      </div>

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
                <th style={styles.th} onClick={() => setOrdenarPor("tempo")}>Tempo Total</th>
              </tr>
            </thead>
            <tbody>
              {[...notas].sort(ordenarNotas).map((nota) => (
                <tr key={nota.id}>
                  <td style={styles.td}>{nota.numero_nota}</td>
                  <td style={{ ...styles.td, ...getStatusStyle(nota.status) }}>{getStatusIcon(nota.status)} {nota.status}</td>
                  <td style={styles.td}>{nota.data_registro && new Date(nota.data_registro).toLocaleTimeString()}</td>
                  <td style={styles.td}>{nota.status === "FINALIZADA" && nota.data_entrega ? (<div>{new Date(nota.data_entrega).toLocaleString()}</div>) : (<div style={{ color: "#888" }}>⏳</div>)}</td>
                  <td style={styles.td}>{calcularTempo(nota.data_registro, nota.data_entrega)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {abrirConfig && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3>Editar Usuários</h3>
            <button onClick={() => setAbrirConfig(false)} style={styles.botaoFechar}>X</button>
            <div>
              {usuarios.map((usuario) => (
                <div key={usuario.id} style={{ marginBottom: "12px" }}>
                  <input
                    type="text"
                    value={editar[usuario.id]?.nome || usuario.nome}
                    onChange={(e) =>
                      setEditar({ ...editar, [usuario.id]: { ...editar[usuario.id], nome: e.target.value } })
                    }
                    placeholder="Nome"
                    style={{ marginRight: "10px" }}
                  />
                  <input
                    type="password"
                    placeholder="Nova Senha"
                    onChange={(e) =>
                      setEditar({ ...editar, [usuario.id]: { ...editar[usuario.id], senha: e.target.value } })
                    }
                  />
                  <button onClick={() => salvarUsuario(usuario.id)} style={{ marginLeft: "10px" }}>Salvar</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: "30px", backgroundColor: "#111", color: "#fff", minHeight: "100vh" },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  titulo: { fontSize: "28px", color: "#FFD700", textTransform: "uppercase" },
  botaoSair: { padding: "8px 14px", backgroundColor: "#e60000", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" },
  botaoConfig: { padding: "8px 14px", backgroundColor: "#FFD700", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" },
  filtros: { display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px" },
  inputData: { padding: "8px", fontSize: "16px", borderRadius: "6px" },
  inputBusca: { padding: "8px", fontSize: "16px", borderRadius: "6px" },
  botaoExportar: { padding: "8px 14px", backgroundColor: "#FFD700", color: "#000", fontWeight: "bold", border: "none", borderRadius: "6px", cursor: "pointer" },
  menuExportar: { position: "absolute", top: "40px", right: 0, background: "#222", border: "1px solid #444", borderRadius: "8px", zIndex: 10 },
  itemExportar: { padding: "10px 16px", display: "block", background: "none", color: "#fff", border: "none", cursor: "pointer", width: "100%", textAlign: "left" },
  resumo: { marginBottom: "16px", fontSize: "16px", color: "#ccc", textAlign: "center" },
  info: { color: "#ccc", textAlign: "center" },
  tabelaWrapper: { overflowX: "auto" },
  tabela: { width: "100%", borderCollapse: "collapse", backgroundColor: "#1e1e1e", borderRadius: "10px", overflow: "hidden" },
  th: { padding: "12px", backgroundColor: "#222", color: "#FFD700", fontWeight: "bold", borderBottom: "2px solid #444", textAlign: "left" },
  td: { padding: "10px", borderBottom: "1px solid #333", textAlign: "left" },
  modalOverlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 999 },
  modal: { backgroundColor: "#fff", color: "#000", padding: "20px", borderRadius: "8px", width: "90%", maxWidth: "500px", position: "relative" },
  botaoFechar: { position: "absolute", top: "10px", right: "10px", background: "none", border: "none", fontSize: "16px", cursor: "pointer" }
};
