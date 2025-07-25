LeitorNota.jsx

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ScannerCamera from "./ScannerCamera";
import api from "../services/api";

export default function LeitorNota() {
  const inputRef = useRef();
  const [mensagem, setMensagem] = useState("");
  const [mensagemTipo, setMensagemTipo] = useState("info");
  const [mensagemFluxo, setMensagemFluxo] = useState("");
  const [nota, setNota] = useState(null);
  const [status, setStatus] = useState("");
  const [mostrarBotaoFinalizarPH, setMostrarBotaoFinalizarPH] = useState(false);
  const [mostrarBotaoFinalizarContainer, setMostrarBotaoFinalizarContainer] =
    useState(false);
  const [scannerAberto, setScannerAberto] = useState(false);
  const navigate = useNavigate();
  const usuario =
    JSON.parse(localStorage.getItem("usuarioLogado"))?.usuario || "";
  const bip = new Audio("/beep.mp3");

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("usuarioLogado");
    navigate("/");
  };

  const processarChave = async (chave) => {
    const numeroNota = chave.slice(25, 34).replace(/^0+/, '');
    try {
      const { data } = await api.post("/api/gravar-nota", {
        chave_acesso: chave,
        numero_nota: numeroNota,
        emitente_nome: "Emitente Padrão",
        emitente_cnpj: "00000000000000",
        destinatario_nome: "Cliente Padrão",
        destinatario_cnpj: "00000000000",
        data_emissao: new Date().toISOString().slice(0, 10),
        valor_total: 0,
        usuario_logado: usuario.toLowerCase(),
      });

      bip.play();
      const registro = new Date(data.nota?.data_registro);
      const dataFormatada = registro.toLocaleDateString();
      const horaFormatada = registro.toLocaleTimeString();

      setNota(data.nota);
      setStatus(data.status);

      if (data.status === "EM ANDAMENTO") {
        setMensagem(
          `✅ NF-e nº ${numeroNota} foi gravada em ${dataFormatada} às ${horaFormatada}`
        );
        setMensagemFluxo("🟡 Aguardando setor de LOGÍSTICA bipar a nota.");
      } else if (data.status === "CONTAINER SENDO OVADO") {
        setMensagem(
          `✅ NF-e nº ${numeroNota} foi gravada em ${dataFormatada} às ${horaFormatada}`
        );
        setMensagemFluxo("🔵 Aguardando LOGÍSTICA finalizar container.");
        if (usuario === "logistica") setMostrarBotaoFinalizarContainer(true);
      } else if (data.status === "CONTAINER FINALIZADO") {
        setMensagem(
          `✅ NF-e nº ${numeroNota} foi gravada em ${dataFormatada} às ${horaFormatada}`
        );
        setMensagemFluxo("🔵 Aguardando PH finalizar.");
        if (usuario === "ph") setMostrarBotaoFinalizarPH(true);
      } else if (data.status === "FINALIZADA") {
        const finalizada = new Date(
          data.nota?.data_entrega || data.nota?.data_registro
        );
        setMensagem(
          `✅ NF-e nº ${numeroNota} foi FINALIZADA em ${finalizada.toLocaleDateString()} às ${finalizada.toLocaleTimeString()}`
        );
        setMensagemFluxo("✅ Nota encerrada.");
        setMensagemTipo("finalizada");
      }
    } catch (error) {
      const data = error.response?.data;
      if (data?.nota) {
        const notaRecebida = data.nota;
        setNota(notaRecebida);
        setStatus(notaRecebida.status);
        const finalizada = new Date(
          notaRecebida?.data_entrega || notaRecebida?.data_registro
        );
        const dt = finalizada.toLocaleDateString();
        const hr = finalizada.toLocaleTimeString();

        if (notaRecebida.status === "FINALIZADA") {
          setMensagem(
            `✅ NF-e nº ${notaRecebida.numero_nota} foi FINALIZADA em ${dt} às ${hr}`
          );
          setMensagemFluxo("✅ Nota encerrada.");
          setMensagemTipo("finalizada");
        } else if (notaRecebida.status === "CONTAINER FINALIZADO") {
          setMensagem(
            `✅ NF-e nº ${notaRecebida.numero_nota} foi gravada em ${dt} às ${hr}`
          );
          setMensagemFluxo("🔵 Aguardando PH finalizar.");
          if (usuario === "ph") setMostrarBotaoFinalizarPH(true);
        } else if (notaRecebida.status === "CONTAINER SENDO OVADO") {
          setMensagem(
            `✅ NF-e nº ${notaRecebida.numero_nota} foi gravada em ${dt} às ${hr}`
          );
          setMensagemFluxo("🔵 Aguardando LOGÍSTICA finalizar container.");
          if (usuario === "logistica") setMostrarBotaoFinalizarContainer(true);
        } else if (notaRecebida.status === "EM ANDAMENTO") {
          setMensagem(
            `✅ NF-e nº ${notaRecebida.numero_nota} foi gravada em ${dt} às ${hr}`
          );
          setMensagemFluxo("🟡 Aguardando setor de LOGÍSTICA bipar a nota.");
        }
      } else {
        setMensagem(
          data?.message ? `⚠️ ${data.message}` : "❌ Erro ao processar a chave"
        );
        setMensagemTipo("erro");
        setMensagemFluxo("");
      }
    }
  };

  const handleLeitura = (e) => {
    if (e.key === "Enter") {
      const chave = e.target.value.trim();
      inputRef.current.value = "";
      if (chave.length === 44) processarChave(chave);
      else {
        setMensagem("❌ Chave inválida (deve ter 44 dígitos)");
        setMensagemTipo("erro");
      }
    }
  };

  const finalizarNota = async () => {
    if (!nota?.id) return;
    await api.put(`/api/finalizar-nota/${nota.id}`);
    setStatus("FINALIZADA");
    setMostrarBotaoFinalizarPH(false);
    setMensagem("✅ Nota finalizada com sucesso!");
    setMensagemFluxo("✅ Nota encerrada.");
    setMensagemTipo("finalizada");
  };

  const finalizarContainer = async () => {
    if (!nota?.id) return;
    await api.put(`/api/finalizar-container/${nota.id}`);
    setStatus("CONTAINER FINALIZADO");
    setMostrarBotaoFinalizarContainer(false);
    setMensagemFluxo("🔵 Aguardando PH finalizar.");
  };

  return (
    <div style={styles.wrapper}>
      {scannerAberto && (
        <ScannerCamera
          onResult={(codigo) => {
            setScannerAberto(false);
            processarChave(codigo);
          }}
          onClose={() => setScannerAberto(false)}
        />
      )}

      <div style={styles.container}>
        <div style={styles.topBar}>
          <h2 style={{ color: "#FFD700" }}>📦 Leitor de Notas Fiscais</h2>
          <button onClick={handleLogout} style={styles.logoutButton}>
            🚪 Sair
          </button>
        </div>
        <p>
          <span style={{ color: "#ccc" }}>Usuário:</span>{" "}
          <span style={{ color: "#FFD700" }}>{usuario.toUpperCase()}</span>
        </p>
        <input
          ref={inputRef}
          type="text"
          placeholder="Bipe ou escaneie a nota fiscal"
          onKeyDown={handleLeitura}
          style={styles.input}
        />
        {/* <button
          onClick={() => setScannerAberto(true)}
          style={styles.botaoCamera}
        >
          📷 Ler com Câmera
        </button> */}

        {mensagem && (
          <div
            style={{
              ...styles.mensagem,
              backgroundColor:
                mensagemTipo === "erro"
                  ? "#800000"
                  : mensagemTipo === "finalizada"
                  ? "#004d00"
                  : "#333",
              color: mensagemTipo === "finalizada" ? "#00FF99" : "#FFD700",
            }}
          >
            {mensagem}
          </div>
        )}

        {mensagemFluxo && <div style={styles.fluxoBox}>{mensagemFluxo}</div>}

        {status && (
          <div style={styles.statusBox}>
            <strong>Status:</strong>{" "}
            <span style={styles.statusTexto}>{status}</span>
          </div>
        )}

        {mostrarBotaoFinalizarPH && usuario === "ph" && (
          <button style={styles.botaoFinalizar} onClick={finalizarNota}>
            ✅ Finalizar Nota
          </button>
        )}

        {mostrarBotaoFinalizarContainer && usuario === "logistica" && (
          <button style={styles.botaoFinalizar} onClick={finalizarContainer}>
            📦 Finalizar Container
          </button>
        )}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    height: "100vh",
    background: "#0a0a0a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    background: "#222831",
    padding: "30px",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "480px",
    color: "#fff",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
  },
  logoutButton: {
    backgroundColor: "#e60000",
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: "8px",
  },
  input: {
    fontSize: "20px",
    padding: "14px",
    width: "100%",
    borderRadius: "10px",
    marginTop: "10px",
    backgroundColor: "#393e46",
    color: "#fff",
  },
  botaoCamera: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#FFD700",
    color: "#000",
    fontWeight: "bold",
    marginTop: "12px",
    borderRadius: "10px",
    fontSize: "16px",
    cursor: "pointer",
  },
  mensagem: {
    marginTop: "20px",
    padding: "12px",
    borderRadius: "10px",
    textAlign: "center",
    fontWeight: "bold",
  },
  fluxoBox: {
    marginTop: "12px",
    textAlign: "center",
    background: "#101820",
    padding: "10px",
    borderRadius: "8px",
    fontSize: "16px",
    color: "#FFD700",
  },
  statusBox: {
    marginTop: "18px",
    padding: "12px",
    background: "#000",
    borderRadius: "8px",
    fontSize: "17px",
  },
  statusTexto: { marginLeft: 10, color: "#00FF99", fontWeight: "bold" },
  botaoFinalizar: {
    marginTop: 20,
    width: "100%",
    padding: "14px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontWeight: "bold",
    fontSize: "17px",
    cursor: "pointer",
  },
};
