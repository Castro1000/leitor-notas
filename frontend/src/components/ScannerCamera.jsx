import { useEffect, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';

export default function ScannerCamera({ onResult, onClose }) {
  const videoRef = useRef(null);
  const beep = useRef(new Audio('/beep.mp3'));
  const codeReader = useRef(null);

  useEffect(() => {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.CODE_128,
      BarcodeFormat.ITF,
      BarcodeFormat.EAN_13,
      BarcodeFormat.CODE_39
    ]);

    const reader = new BrowserMultiFormatReader(hints);
    codeReader.current = reader;

    let scanning = true;

    const start = async () => {
      try {
        const constraints = {
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', true);
          await videoRef.current.play();

          reader.decodeFromVideoElementContinuously(videoRef.current, (result, err) => {
            if (!scanning) return;
            if (result?.text && result.text.length === 44) {
              scanning = false;
              beep.current.play();
              stop();
              onResult(result.text);
            }
          });
        }
      } catch (err) {
        console.error('Erro ao iniciar câmera:', err);
        alert('Erro ao acessar a câmera. Verifique permissões.');
        onClose();
      }
    };

    const stop = () => {
      reader.reset();
      const stream = videoRef.current?.srcObject;
      stream?.getTracks().forEach(track => track.stop());
    };

    start();

    return () => {
      scanning = false;
      stop();
    };
  }, []);

  return (
    <div style={estilos.overlay}>
      <video ref={videoRef} style={estilos.video} />

      <div style={estilos.barraLeitura}></div>
      <div style={estilos.mensagemEscaneando}>📡 Escaneando nota...</div>
      <button onClick={onClose} style={estilos.botaoFechar}>❌ Fechar</button>
    </div>
  );
}

const estilos = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: '#000',
    zIndex: 9999,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column'
  },
  video: {
    width: '100vw',
    height: '100vh',
    objectFit: 'cover'
  },
  barraLeitura: {
    position: 'absolute',
    top: 'calc(50% - 45px)',
    left: '10%',
    width: '80%',
    height: '90px',
    border: '3px dashed #FFD700',
    borderRadius: '12px',
    pointerEvents: 'none'
  },
  mensagemEscaneando: {
    position: 'absolute',
    bottom: '80px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#FFD700',
    padding: '10px 20px',
    borderRadius: '10px',
    fontSize: '18px',
    fontWeight: 'bold',
    zIndex: 10
  },
  botaoFechar: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: '10px 14px',
    fontSize: '16px',
    backgroundColor: '#e60000',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    zIndex: 10000
  }
};
