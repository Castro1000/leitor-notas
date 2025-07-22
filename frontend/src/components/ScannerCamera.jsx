import { useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";
import "html5-qrcode/minified/html5-qrcode.min.css";


export default function ScannerCamera({ onResult, onClose }) {
  useEffect(() => {
    const scannerId = "scanner";
    const html5QrCode = new Html5Qrcode(scannerId);

    const config = { fps: 10, qrbox: { width: 250, height: 100 } };

    Html5Qrcode.getCameras().then((devices) => {
      if (devices && devices.length) {
        const cameraId = devices[0].id;

        html5QrCode
          .start(
            cameraId,
            config,
            (decodedText) => {
              if (decodedText.length === 44) {
                new Audio("/beep.mp3").play();
                html5QrCode.stop().then(() => {
                  onResult(decodedText);
                });
              }
            },
            (error) => {
              // Ignorar erros de leitura
            }
          )
          .catch((err) => {
            console.error("Erro ao iniciar scanner:", err);
            onClose();
          });
      }
    });

    return () => {
      html5QrCode.stop().catch(() => {});
    };
  }, []);

  return (
    <div style={estilos.overlay}>
      <div id="scanner" style={estilos.video}></div>
      <div style={estilos.mensagem}>📡 Escaneando nota...</div>
      <button style={estilos.botao} onClick={onClose}>
        ❌ Fechar
      </button>
    </div>
  );
}

const estilos = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "#000",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  video: {
    width: "100%",
    maxWidth: "480px",
  },
  mensagem: {
    marginTop: "10px",
    color: "#FFD700",
    fontWeight: "bold",
    fontSize: "18px",
  },
  botao: {
    marginTop: "20px",
    padding: "10px 20px",
    backgroundColor: "#e60000",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    cursor: "pointer",
  },
};
