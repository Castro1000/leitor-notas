import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./AdminPainel.css";
import ModalUsuarios from "./ModalUsuarios";

export default function AdminPainel() {
  const [notas, setNotas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [dataFiltro, setDataFiltro] = useState(() => {
    const hojeManaus = new Date().toLocaleDateString("pt-BR", {
      timeZone: "America/Manaus",
    }).split("/").reverse().join("-");
    return hojeManaus;
  });

  const [ordenarPor, setOrdenarPor] = useState("data_registro");
  const [buscaNumero, setBuscaNumero] = useState("");
  const [mostrarExportar, setMostrarExportar] = useState(false);
  const [abrirConfig, setAbrirConfig] = useState(false);
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
    return () => intervalo && clearInterval(intervalo);
  }, [dataFiltro, buscaNumero]);

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
        mapearStatus(n.status),
        formatarData(n.data_registro),
        formatarData(n.data_entrega),
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
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text("Relatório de Notas", 14, 15);
    const tableData = notas.map((n) => [
      n.numero_nota,
      mapearStatus(n.status),
      formatarData(n.data_registro),
      formatarData(n.data_entrega),
      calcularTempo(n.data_registro, n.data_entrega),
    ]);
    autoTable(doc, {
      head: [["Número", "Status", "Hora de Entrada", "Finalizada", "Tempo Total"]],
      body: tableData,
      startY: 20,
    });
    doc.save(`relatorio_${dataFiltro}.pdf`);
    setMostrarExportar(false);
  };

  const formatarData = (data) =>
    data ? new Date(data).toLocaleString("pt-BR", { timeZone: "America/Manaus", hour12: false }) : "";

  const mapearStatus = (status) => {
    switch (status) {
      case "CONTAINER SENDO OVADO": return "NF-e sendo carregada";
      case "CONTAINER FINALIZADO": return "NF-e CARREGADA NO VEÍCULO";
      default: return status;
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "FINALIZADA": return "verde";
      case "EM ANDAMENTO": return "amarelo";
      case "CONTAINER SENDO OVADO":
      case "CONTAINER FINALIZADO": return "azul";
      case "ATRASADA": return "vermelho";
      default: return "";
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
    <div className="painel-container">
      <div className="painel-header">
        <h2>📊 Painel do Administrador</h2>
        <div className="botoes-header">
          <button onClick={() => setAbrirConfig(true)}>⚙️</button>
          <button onClick={handleLogout} className="sair">Sair</button>
        </div>
      </div>

      <div className="filtros">
        <input type="date" value={dataFiltro} onChange={(e) => setDataFiltro(e.target.value)} />
        <input type="text" placeholder="Buscar nº nota" value={buscaNumero} onChange={(e) => setBuscaNumero(e.target.value)} />
        <div className="exportar-container">
          <button onClick={() => setMostrarExportar(!mostrarExportar)}>📁 Exportar</button>
          {mostrarExportar && (
            <div className="exportar-opcoes">
              <button onClick={exportarPDF}>📄 PDF</button>
              <button onClick={exportarExcel}>📊 Excel</button>
            </div>
          )}
        </div>
      </div>

      <div className="resumo">
        Total: {statusResumo.total} | EM ANDAMENTO: {statusResumo["EM ANDAMENTO"] || 0} | CONTAINER: {(statusResumo["CONTAINER SENDO OVADO"] || 0) + (statusResumo["CONTAINER FINALIZADO"] || 0)} | FINALIZADAS: {statusResumo["FINALIZADA"] || 0}
      </div>

      {carregando ? (
        <p className="info">Carregando notas...</p>
      ) : (
        <div className="tabela-wrapper">
          <table>
            <thead>
              <tr>
                <th>Número</th>
                <th>Status</th>
                <th>Hora de Entrada</th>
                <th>Finalizada</th>
                <th onClick={() => setOrdenarPor("tempo")}>Tempo Total</th>
              </tr>
            </thead>
            <tbody>
              {[...notas].sort(ordenarNotas).map((nota) => (
                <tr key={nota.id}>
                  <td>{nota.numero_nota}</td>
                  <td className={getStatusStyle(nota.status)}>{mapearStatus(nota.status)}</td>
                  <td>{nota.data_registro && new Date(nota.data_registro).toLocaleTimeString()}</td>
                  <td>{nota.status === "FINALIZADA" && nota.data_entrega ? new Date(nota.data_entrega).toLocaleString() : "⏳"}</td>
                  <td>{calcularTempo(nota.data_registro, nota.data_entrega)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {abrirConfig && <ModalUsuarios aberto={abrirConfig} aoFechar={() => setAbrirConfig(false)} />}
    </div>
  );
}
