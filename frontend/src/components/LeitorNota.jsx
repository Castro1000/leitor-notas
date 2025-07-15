import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BrowserMultiFormatReader } from '@zxing/library';

export default function LeitorNota() {
  const inputRef = useRef();
  const videoRef = useRef();
  const [mensagem, setMensagem] = useState('');
  const [mensagemTipo, setMensagemTipo] = useState('info');
  const [mensagemFluxo, setMensagemFluxo] = useState('');
  const [nota, setNota] = useState(null);
  const [status, setStatus] = useState('');
  const [mostrarBotaoFinalizarPH, setMostrarBotaoFinalizarPH] = useState(false);
  const [mostrarBotaoFinalizarContainer, setMostrarBotaoFinalizarContainer] = useState(false);
  const [cameraAtiva, setCameraAtiva] = useState(false);
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuarioLogado'))?.usuario || '';

  const bip = new Audio('/beep.mp3');

  useEffect(() => {
    inputRef.current.focus();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('usuarioLogado');
    navigate('/');
  };

  const processarChave = async (chave) => {
    const numeroNota = chave.slice(29, 35).replace(/^0+/, '').slice(0, 5);
    try {
      const { data } = await axios.post('/api/gravar-nota', {
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

      bip.play();

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

        if (notaRecebida.status === 'FINALIZADA') {
          setMensagem(`✅ NF-e nº ${notaRecebida.numero_nota} foi FINALIZADA em ${dt} às ${hr}`);
          setMensagemFluxo('✅ Nota encerrada.');
          setMensagemTipo('finalizada');
        } else if (notaRecebida.status === 'CONTAINER FINALIZADO') {
          setMensagem(`✅ NF-e nº ${notaRecebida.numero_nota} foi gravada em ${dt} às ${hr}`);
          setMensagemFluxo('🔵 Aguardando PH finalizar.');
          if (usuario === 'ph') setMostrarBotaoFinalizarPH(true);
        } else if (notaRecebida.status === 'CONTAINER SENDO OVADO') {
          setMensagem(`✅ NF-e nº ${notaRecebida.numero_nota} foi gravada em ${dt} às ${hr}`);
          setMensagemFluxo('🔵 Aguardando LOGÍSTICA finalizar container.');
          if (usuario === 'logistica') setMostrarBotaoFinalizarContainer(true);
        } else if (notaRecebida.status === 'EM ANDAMENTO') {
          setMensagem(`✅ NF-e nº ${notaRecebida.numero_nota} foi gravada em ${dt} às ${hr}`);
          setMensagemFluxo('🟡 Aguardando setor de LOGÍSTICA bipar a nota.');
        }

      } else if (data?.message) {
        setMensagem(`⚠️ ${data.message}`);
        setMensagemTipo('erro');
        setMensagemFluxo('');
      } else {
        setMensagem('❌ Erro ao processar a chave');
        setMensagemTipo('erro');
        setMensagemFluxo('');
      }
    }
  };

  const handleLeitura = async (e) => {
    if (e.key === 'Enter') {
      const chave = e.target.value.trim();
      inputRef.current.value = '';
      if (chave.length === 44) processarChave(chave);
      else {
        setMensagem('❌ Chave inválida (deve ter 44 dígitos)');
        setMensagemTipo('erro');
      }
    }
  };

      const iniciarCamera = async () => {
      setCameraAtiva(true);
      const codeReader = new BrowserMultiFormatReader();

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
          });

      videoRef.current.srcObject = stream;
      videoRef.current.setAttribute('playsinline', true);
      await videoRef.current.play();

      codeReader.decodeFromVideoElement(videoRef.current, (result, err) => {
        if (result) {
          const text = result.getText();
          if (text.length === 44) {
            bip.play();
            pararCamera();
            processarChave(text);
          }
        }
      });
    } catch (err) {
      console.error('Erro ao acessar câmera:', err);
      setCameraAtiva(false);
    }
  };


  const pararCamera = () => {
    setCameraAtiva(false);
    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const finalizarNota = async () => {
    if (!nota?.id) return;
    await axios.put(`/api/finalizar-nota/${nota.id}`);
    setStatus('FINALIZADA');
    setMostrarBotaoFinalizarPH(false);
    setMensagem('✅ Nota finalizada com sucesso!');
    setMensagemFluxo('✅ Nota encerrada.');
    setMensagemTipo('finalizada');
  };

  const finalizarContainer = async () => {
    if (!nota?.id) return;
    await axios.put(`/api/finalizar-container/${nota.id}`);
    setStatus('CONTAINER FINALIZADO');
    setMostrarBotaoFinalizarContainer(false);
    setMensagemFluxo('🔵 Aguardando PH finalizar.');
  };

  return (
    <div style={styles.wrapper}>
      {cameraAtiva ? (
        <div style={styles.cameraTelaCheia}>
          <video ref={videoRef} style={styles.video} />
          <button onClick={pararCamera} style={styles.botaoFechar}>❌ Fechar Câmera</button>
        </div>
      ) : (
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
          <button onClick={iniciarCamera} style={styles.botaoCamera}>📷 Ler com Câmera</button>

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
              <strong>Status:</strong>{' '}
              <span style={styles.statusTexto}>{status}</span>
            </div>
          )}

          {mostrarBotaoFinalizarPH && usuario === 'ph' && (
            <button style={styles.botaoFinalizar} onClick={finalizarNota}>✅ Finalizar Nota</button>
          )}

          {mostrarBotaoFinalizarContainer && usuario === 'logistica' && (
            <button style={styles.botaoFinalizar} onClick={finalizarContainer}>📦 Finalizar Container</button>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: { height: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  container: { background: '#222831', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '480px', color: '#fff' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  logoutButton: { backgroundColor: '#e60000', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px' },
  input: { fontSize: '20px', padding: '14px', width: '100%', borderRadius: '10px', marginTop: '10px', backgroundColor: '#393e46', color: '#fff' },
  botaoCamera: { width: '100%', padding: '12px', backgroundColor: '#FFD700', color: '#000', fontWeight: 'bold', marginTop: '12px', borderRadius: '10px', fontSize: '16px', cursor: 'pointer' },
  mensagem: { marginTop: '20px', padding: '12px', borderRadius: '10px', textAlign: 'center', fontWeight: 'bold' },
  fluxoBox: { marginTop: '12px', textAlign: 'center', background: '#101820', padding: '10px', borderRadius: '8px', fontSize: '16px', color: '#FFD700' },
  statusBox: { marginTop: '18px', padding: '12px', background: '#000', borderRadius: '8px', fontSize: '17px' },
  statusTexto: { marginLeft: 10, color: '#00FF99', fontWeight: 'bold' },
  botaoFinalizar: { marginTop: 20, width: '100%', padding: '14px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '17px', cursor: 'pointer' },
  cameraTelaCheia: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: '#000', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  video: { width: '100%', height: '100%', objectFit: 'cover' },
  botaoFechar: { position: 'absolute', top: 20, right: 20, padding: '12px', backgroundColor: '#e60000', color: '#fff', fontSize: '18px', borderRadius: '10px', border: 'none', fontWeight: 'bold' },
};


// teste ajuste