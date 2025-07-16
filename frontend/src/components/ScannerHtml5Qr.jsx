import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function ScannerHtml5Qr({ onResult, onClose }) {
  const scannerRef = useRef(null);
  const divId = 'html5qr-code-area';
  const beep = useRef(new Audio('/beep.mp3'));

  useEffect(() => {
    const iniciarScanner = async () => {
      const config = {
        fps: 10,
        qrbox: { width: 320, height: 90 }, // Faixa horizontal como leitores de boleto
        aspectRatio: 1.7777778, // 16:9
        disableFlip: true,
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
              if (decodedText.length === 44) {
                beep.current.play();
                scannerRef.current.stop().then(() => {
                  onResult(decodedText);
                });
              }
            },
            (errorMsg) => {
              // Ignore read errors
            }
          );
        } else {
          alert('Nenhuma câmera encontrada.');
          onClose();
        }
      } catch (err) {
        console.error('Erro ao iniciar scanner:', err);
        alert('Erro ao acessar a câmera.');
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
    <div style={estilos.overlay}>
      <div style={estilos.centralizar}>
        <div style={estilos.borda}>
          <div id={divId} style={estilos.areaVideo}></div>
          <div style={estilos.retangulo}></div>
        </div>
      </div>
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
  },
  centralizar: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh'
  },
  borda: {
    position: 'relative',
    width: '90vw',
    maxWidth: '600px',
    height: '60vh',
  },
  areaVideo: {
    width: '100%',
    height: '100%',
  },
  retangulo: {
    border: '3px dashed #FFD700',
    position: 'absolute',
    top: 'calc(50% - 45px)',
    left: '10%',
    width: '80%',
    height: '90px',
    pointerEvents: 'none',
    boxSizing: 'border-box',
    borderRadius: '12px'
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
