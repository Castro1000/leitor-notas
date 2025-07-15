import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function ScannerHtml5Qr({ onResult, onClose }) {
  const scannerRef = useRef(null);
  const divId = 'html5qr-code-fullscreen';
  const beep = useRef(new Audio('/beep.mp3'));

  useEffect(() => {
    const iniciarScanner = async () => {
      const config = {
        fps: 10,
        qrbox: { width: 300, height: 100 },
        aspectRatio: 16 / 9,
        disableFlip: false,
        rememberLastUsedCamera: true
      };

      scannerRef.current = new Html5Qrcode(divId);

      try {
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          const backCamera = cameras.find(cam =>
            cam.label.toLowerCase().includes('back') || cam.label.toLowerCase().includes('traseira')
          ) || cameras[0];

          await scannerRef.current.start(
            { deviceId: backCamera.id },
            config,
            (decodedText) => {
              beep.current.play();
              scannerRef.current.stop().then(() => {
                onResult(decodedText);
              });
            },
            (errorMsg) => {
              // erros de leitura ignorados
            }
          );
        } else {
          alert('Nenhuma câmera encontrada');
          onClose();
        }
      } catch (err) {
        console.error('Erro ao iniciar scanner:', err);
        alert('Erro ao acessar a câmera');
        onClose();
      }
    };

    iniciarScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, []);

  return (
    <div style={estilo.container}>
      <div id={divId} style={estilo.videoContainer}></div>
      <button style={estilo.botaoFechar} onClick={onClose}>
        ❌ Fechar Câmera
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
    backgroundColor: '#000',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    width: '100%',
    maxWidth: '100vw',
    height: '100vh',
  },
  botaoFechar: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: '12px 18px',
    fontSize: '16px',
    fontWeight: 'bold',
    backgroundColor: '#e60000',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    zIndex: 10000,
  }
};
