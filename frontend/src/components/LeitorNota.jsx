import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function LeitorNota() {
  const inputRef = useRef();
  const [mensagem, setMensagem] = useState('');
  const [mensagemTipo, setMensagemTipo] = useState('info');
  const [mensagemFluxo, setMensagemFluxo] = useState('');
  const [nota, setNota] = useState(null);
  const [status, setStatus] = useState('');
  const [mostrarBotaoFinalizarPH, setMostrarBotaoFinalizarPH] = useState(false);
  const [mostrarBotaoFinalizarContainer, setMostrarBotaoFinalizarContainer] = useState(false);
  const [scannerAtivo, setScannerAtivo] = useState(false);
  const navigate = useNavigate();

  const usuario = JSON.parse(localStorage.getItem('usuarioLogado'))?.usuario || '';

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('usuarioLogado');
    navigate('/');
  };

  const processarChave = async (chave) => {
    setMensagem('');
    setMensagemFluxo('');
    setStatus('');
    setNota(null);
    setMostrarBotaoFinalizarPH(false);
    setMostrarBotaoFinalizarContainer(false);

    const numeroNota = chave.slice(29, 35).replace(/^0+/, '').slice(0, 5);

    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/gravar-nota`, {
        chave_acesso: chave,
        numero_nota: numeroNota,
        emitente_nome: 'Emitente Padrão',
        emitente_cnpj: '00000000000000',
        destinatario_nome: 'Cliente Padrão',
        destinatario_cnpj: '00000000000',
        data_emissao: new Date().toISOString().slice(0, 10),
        valor_total: 0,
        usuario_logado: usuario.toLowerCase()
      });

      const registro = new Date(data.nota?.data_registro);
      const dataFormatada = registro.toLocaleDateString();
      const horaFormatada = registro.toLocaleTimeString();

      setNota(data.nota);
      setStatus(data.status);

      if (data.status === 'EM ANDAMENTO') {
        setMensagem(`✅ NF-e nº ${numeroNota} foi gravada em ${dataFormatada} às ${horaFormatada}`);
        setMensagemFluxo('🟡 Aguardando setor de LOGÍSTICA bipar a nota.');
      } else if (data.status === 'CONTAINER SENDO OVADO') {
        setMensagem(`✅ NF-e nº ${numeroNota} foi gravada em ${dataFormatada} às ${horaFormatada}`);
        setMensagemFluxo('🔵 Aguardando LOGÍSTICA finalizar container.');
        if (usuario === 'logistica') setMostrarBotaoFinalizarContainer(true);
      } else if (data.status === 'CONTAINER FINALIZADO') {
        setMensagem(`✅ NF-e nº ${numeroNota} foi gravada em ${dataFormatada} às ${horaFormatada}`);
        setMensagemFluxo('🔵 Aguardando PH finalizar.');
        if (usuario === 'ph') setMostrarBotaoFinalizarPH(true);
      } else if (data.status === 'FINALIZADA') {
        const finalizada = new Date(data.nota?.data_entrega || data.nota?.data_registro);
        const dt = finalizada.toLocaleDateString();
        const hr = finalizada.toLocaleTimeString();
        setMensagem(`✅ NF-e nº ${numeroNota} foi FINALIZADA em ${dt} às ${hr}`);
        setMensagemFluxo('✅ Nota encerrada.');
        setMensagemTipo('finalizada');
      }
    } catch (error) {
      const data = error.response?.data;
      if (data?.nota) {
        const notaRecebida = data.nota;
        setNota(notaRecebida);
        setStatus(notaRecebida.status);
        const finalizada = new Date(notaRecebida?.data_entrega || notaRecebida?.data_registro);
        const dt = finalizada.toLocaleDateString();
        const hr = finalizada.toLocaleTimeString();
        setMensagem(`⚠️ ${data.message}`);
        setMensagemFluxo(notaRecebida.status === 'FINALIZADA'
          ? '✅ Nota encerrada.'
          : notaRecebida.status === 'CONTAINER FINALIZADO'
            ? '🔵 Aguardando PH finalizar.'
            : '🟡 Aguardando setor de LOGÍSTICA bipar a nota.');
        if (notaRecebida.status === 'FINALIZADA') setMensagemTipo('finalizada');
      } else {
        setMensagem('❌ Erro ao processar a chave');
        setMensagemTipo('erro');
        setMensagemFluxo('');
      }
    }
  };

  const handleLeitura = (e) => {
    if (e.key === 'Enter') {
      const chave = e.target.value.trim();
      if (chave.length === 44) {
        processarChave(chave);
        inputRef.current.value = '';
      } else {
        setMensagem('❌ Chave inválida (deve ter 44 dígitos)');
        setMensagemTipo('erro');
      }
    }
  };

  const iniciarCamera = () => {
    if (scannerAtivo) return;
    const scanner = new Html5QrcodeScanner('leitor-camera', { fps: 10, qrbox: 250 });
    scanner.render(
      (decodedText) => {
        scanner.clear();
        setScannerAtivo(false);
        document.getElementById('leitor-camera').innerHTML = '';
        if (decodedText.length === 44) {
          processarChave(decodedText);
        } else {
          setMensagem('⚠️ Código inválido lido pela câmera');
          setMensagemTipo('erro');
        }
      },
      (err) => console.warn(err)
    );
    setScannerAtivo(true);
  };

  const finalizarNota = async () => {
    if (!nota?.id) return;
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/finalizar-nota/${nota.id}`);
      setStatus('FINALIZADA');
      setMostrarBotaoFinalizarPH(false);
      setMensagem('✅ Nota finalizada com sucesso!');
      setMensagemFluxo('✅ Nota encerrada.');
      setMensagemTipo('finalizada');
    } catch (err) {
      console.error('Erro ao finalizar a nota:', err);
      setMensagemTipo('erro');
      setMensagemFluxo('');
    }
  };

  const finalizarContainer = async () => {
    if (!nota?.id) return;
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/finalizar-container/${nota.id}`);
      setStatus('CONTAINER FINALIZADO');
      setMostrarBotaoFinalizarContainer(false);
      setMensagemFluxo('🔵 Aguardando PH finalizar.');
    } catch (err) {
      console.error('Erro ao finalizar container:', err);
      setMensagemTipo('erro');
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <div style={styles.topBar}>
          <h2 style={{ color: '#FFD700' }}>📦 Leitor de Notas Fiscais</h2>
          <button onClick={handleLogout} style={styles.logoutButton}>🚪 Sair</button>
        </div>
        <p><span style={{ color: '#ccc' }}>Usuário:</span> <span style={{ color: '#FFD700' }}>{usuario.toUpperCase()}</span></p>

        <input
          ref={inputRef}
          type="text"
          placeholder="Bipe ou escaneie a nota fiscal"
          onKeyDown={handleLeitura}
          style={styles.input}
        />

        <button onClick={iniciarCamera} style={styles.cameraButton}>📷 Ler com Câmera</button>
        <div id="leitor-camera" style={{ marginTop: 20 }} />

        {mensagem && (
          <div style={{
            ...styles.mensagem,
            backgroundColor:
              mensagemTipo === 'erro' ? '#800000' :
              mensagemTipo === 'finalizada' ? '#004d00' : '#333',
            color: mensagemTipo === 'finalizada' ? '#00FF99' : '#FFD700'
          }}>
            {mensagem}
          </div>
        )}

        {mensagemFluxo && <div style={styles.fluxoBox}>{mensagemFluxo}</div>}

        {status && (
          <div style={styles.statusBox}>
            <strong style={{ color: '#FFF' }}>Status:</strong>{' '}
            <span style={styles.statusTexto}>
              {status === 'EM ANDAMENTO' && '🟡 EM ANDAMENTO'}
              {status === 'CONTAINER SENDO OVADO' && '🔵 CONTAINER SENDO OVADO'}
              {status === 'CONTAINER FINALIZADO' && '🔵 CONTAINER FINALIZADO'}
              {status === 'FINALIZADA' && '✅ FINALIZADA'}
            </span>
          </div>
        )}

        {mostrarBotaoFinalizarPH && usuario === 'ph' && (
          <button style={styles.botaoFinalizar} onClick={finalizarNota}>
            ✅ Finalizar Nota
          </button>
        )}

        {mostrarBotaoFinalizarContainer && usuario === 'logistica' && (
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
    height: '100vh',
    background: 'linear-gradient(to bottom, #0a0a0a, #1e1e1e)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  container: {
    background: '#222831',
    padding: '30px',
    borderRadius: '16px',
    boxShadow: '0 0 25px rgba(255,255,0,0.2)',
    width: '100%',
    maxWidth: '480px',
    color: '#fff',
    fontFamily: 'Segoe UI, sans-serif',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
  },
  logoutButton: {
    backgroundColor: '#e60000',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 14px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  input: {
    fontSize: '20px',
    padding: '14px',
    width: '100%',
    borderRadius: '10px',
    border: '1px solid #ccc',
    outline: 'none',
    boxSizing: 'border-box',
    marginTop: '10px',
    backgroundColor: '#393e46',
    color: '#fff',
  },
  cameraButton: {
    marginTop: 12,
    width: '100%',
    padding: '12px',
    backgroundColor: '#FFD700',
    color: '#000',
    border: 'none',
    borderRadius: '10px',
    fontWeight: 'bold',
    fontSize: '16px',
    cursor: 'pointer',
  },
  mensagem: {
    marginTop: '20px',
    padding: '12px',
    textAlign: 'center',
    borderRadius: '10px',
    fontWeight: 'bold',
  },
  fluxoBox: {
    marginTop: '12px',
    textAlign: 'center',
    background: '#101820',
    padding: '10px',
    borderRadius: '8px',
    fontSize: '16px',
    color: '#FFD700'
  },
  statusBox: {
    marginTop: '18px',
    padding: '12px',
    background: '#000',
    borderRadius: '8px',
    fontSize: '17px',
  },
  statusTexto: {
    marginLeft: 10,
    color: '#00FF99',
    fontWeight: 'bold'
  },
  botaoFinalizar: {
    marginTop: 20,
    width: '100%',
    padding: '14px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontWeight: 'bold',
    fontSize: '17px',
    cursor: 'pointer',
  },
};
