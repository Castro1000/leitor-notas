import { useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function ScannerCamera({ onResult, onClose }) {
  useEffect(() => {
    const scannerId = "reader";
    const beep = new Audio("/beep.mp3");

    const html5QrCode = new Html5Qrcode(scannerId);
    const config = {
      fps: 10,
      qrbox: { width: 300, height: 150 },
      formatsToSupport: ["CODE_128", "EAN_13", "CODE_39", "ITF"],
    };

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          const cameraId = devices[0].id;
          html5QrCode.start(
            cameraId,
            config,
            (decodedText) => {
              if (decodedText.length === 44) {
                beep.play();
                html5QrCode.stop().then(() => {
                  onResult(decodedText);
                });
              }
            },
            (errorMessage) => {
              // silencioso
            }
          );
        }
      })
      .catch((err) => {
        alert("Erro ao acessar a câmera. Verifique permissões.");
        onClose();
      });

    return () => {
      html5QrCode.stop().catch(() => {});
    };
  }, []);

  return (
    <div style={estilos.overlay}>
      <div id="reader" style={estilos.leitor}></div>
      <button onClick={onClose} style={estilos.botaoFechar}>❌ Fechar</button>
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
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
  },
  leitor: {
    width: "100%",
    maxWidth: "500px",
    height: "350px",
  },
  botaoFechar: {
    marginTop: "20px",
    backgroundColor: "#e60000",
    color: "#fff",
    padding: "10px 20px",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
  },
};
