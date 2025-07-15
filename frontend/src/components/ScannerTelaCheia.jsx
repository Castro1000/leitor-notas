// ScannerTelaCheia.jsx
import { useEffect, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import beepSound from './beep.mp3';

export default function ScannerTelaCheia({ onClose, onResult }) {
  const videoRef = useRef();
  const codeReader = useRef(new BrowserMultiFormatReader());
  const beep = useRef(new Audio(beepSound));

  useEffect(() => {
    const startScanner = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputDevices = devices.filter(device => device.kind === 'videoinput');
        const backCamera = videoInputDevices.find(device => device.label.toLowerCase().includes('back')) || videoInputDevices[0];

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: backCamera.deviceId },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', true);
          videoRef.current.play();
        }

        codeReader.current.decodeFromVideoDevice(backCamera.deviceId, videoRef.current, (result, err) => {
          if (result) {
            beep.current.play();
            codeReader.current.reset();
            stopStream();
            onResult(result.getText());
          }
        });
      } catch (err) {
        alert('Erro ao acessar a câmera: ' + err.message);
        onClose();
      }
    };

    startScanner();

    return () => {
      codeReader.current.reset();
      stopStream();
    };
  }, []);

  const stopStream = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <div style={estilo.container}>
      <video ref={videoRef} style={estilo.video} autoPlay muted />
      <button style={estilo.botaoFechar} onClick={() => {
        codeReader.current.reset();
        stopStream();
        onClose();
      }}>
        Fechar
      </button>
    </div>
  );
}

const estilo = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'black',
    zIndex: 9999,
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  botaoFechar: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: '10px 16px',
    background: '#e60000',
    color: 'white',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    zIndex: 10000,
  },
};
