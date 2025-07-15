import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BrowserMultiFormatReader } from '@zxing/browser';

export default function LeitorNota() {
  const inputRef = useRef();
  const [mensagem, setMensagem] = useState('');
  const [mensagemTipo, setMensagemTipo] = useState('info');
  const [mensagemFluxo, setMensagemFluxo] = useState('');
  const [nota, setNota] = useState(null);
  const [status, setStatus] = useState('');
  const [mostrarBotaoFinalizarPH, setMostrarBotaoFinalizarPH] = useState(false);
  const [mostrarBotaoFinalizarContainer, setMostrarBotaoFinalizarContainer] = useState(false);
  const [leitorAtivo, setLeitorAtivo] = useState(false);
  const videoRef = useRef(null);
  const navigate = useNavigate();

  const usuario = JSON.parse(localStorage.getItem('usuarioLogado'))?.usuario || '';

  useEffect(() => {
    inputRef.current.focus();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('usuarioLogado');
    navigate('/');
  };

  const iniciarLeitorCamera = async () => {
    setLeitorAtivo(true);
    const codeReader = new BrowserMultiFormatReader();

    try {
      const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
      const selectedDeviceId = videoInputDevices[0]?.deviceId;

      if (!selectedDeviceId) {
        setMensagem('❌ Nenhuma câmera encontrada');
        setLeitorAtivo(false);
        return;
      }

      codeReader.decodeFromVideoDevice(selectedDeviceId, videoRef.current, (result, err) => {
        if (result) {
          const texto = result.getText();
          if (texto.length === 44 && /^[0-9]+$/.test(texto)) {
            inputRef.current.value = texto;
            pararLeitorCamera(codeReader);
            const eventoFalso = { key: 'Enter', target: inputRef.current };
            handleLeitura(eventoFalso);
          }
        }
      });
    } catch (error) {
      setMensagem('❌ Erro ao acessar a câmera');
      setLeitorAtivo(false);
    }
  };

  const pararLeitorCamera = (codeReader) => {
    setLeitorAtivo(false);
    codeReader.reset();
  };

  const handleLeitura = async (e) => {
    if (e.key === 'Enter') {
      setMensagem('');
      setMensagemFluxo('');
      setStatus('');
      setNota(null);
      setMostrarBotaoFinalizarPH(false);
      setMostrarBotaoFinalizarContainer(false);

      const chave = e.target.value.trim();
      if (chave.length !== 44) {
        setMensagem('❌ Chave inválida (deve ter 44 dígitos)');
        setMensagemTipo('erro');
        inputRef.current.value = '';
        return;
      }

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

        inputRef.current.value = '';
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

        inputRef.current.value = '';
      }
    }
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
        <p style={{ fontWeight: 'bold' }}><span style={{ color: '#ccc' }}>Usuário:</span> <span style={{ color: '#FFD700' }}>{usuario.toUpperCase()}</span></p>
        <input
          ref={inputRef}
          type="text"
          placeholder="Bipe a nota fiscal"
          onKeyDown={handleLeitura}
          style={styles.input}
        />

        {!leitorAtivo && (
          <button onClick={iniciarLeitorCamera} style={{ ...styles.botaoFinalizar, backgroundColor: '#00cc66', marginTop: 10 }}>
            📷 Ler com a Câmera
          </button>
        )}

        {leitorAtivo && <video ref={videoRef} style={{ width: '100%', marginTop: 12, borderRadius: 10 }} autoPlay muted playsInline />}
