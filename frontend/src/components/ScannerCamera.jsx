// ScannerCamera.jsx
import { useEffect, useRef } from "react";
import { BrowserMultiFormatReader, BarcodeFormat, NotFoundException } from "@zxing/library";

export default function ScannerCamera({ onResult, onClose }) {
  const videoRef = useRef();
  const codeReader = useRef();

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    codeReader.current = reader;

    reader.listVideoInputDevices().then((videoInputDevices) => {
      const backCamera = videoInputDevices.find(device => device.label.toLowerCase().includes('back')) || videoInputDevices[0];

      if (!backCamera) {
        alert("Nenhuma câmera encontrada.");
        onClose();
        return;
      }

      reader.decodeFromVideoDevice(backCamera.deviceId, videoRef.current, (result, err) => {
        if (result) {
          const text = result.getText();
          if (text.length === 44 && /^\d{44}$/.test(text)) {
            reader.reset();
            onResult(text);
          }
        }
        if (err && !(err instanceof NotFoundException)) {
          console.error("Erro de leitura:", err);
        }
      });
    }).catch((err) => {
      alert("Erro ao acessar a câmera. Verifique permissões.");
      onClose();
    });

    return () => {
      reader.reset();
    };
  }, [onResult, onClose]);

  return (
    <div style={estilos.overlay}>
      <div style={estilos.boxCamera}>
        <video ref={videoRef} style={estilos.video} autoPlay muted playsInline />
        <div style={estilos.borda}></div>
        <p style={estilos.mensagem}>📡 Escaneando código de barras...</p>
        <button style={estilos.botaoFechar} onClick={onClose}>❌ Fechar</button>
      </div>
    </div>
  );
}

const estilos = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.8)",
    zIndex: 9999,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
  },
  boxCamera: {
    position: "relative",
    width: "95vw",
    maxWidth: "480px",
    border: "4px dashed #FFD700",
    borderRadius: "12px",
    overflow: "hidden",
  },
  video: {
    width: "100%",
    height: "auto",
  },
  borda: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    border: "4px dashed #FFD700",
    pointerEvents: "none",
  },
  mensagem: {
    position: "absolute",
    bottom: 10,
    width: "100%",
    textAlign: "center",
    fontSize: "18px",
    fontWeight: "bold",
    color: "#FFD700",
    background: "#000",
    padding: "8px 0",
  },
  botaoFechar: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#c00",
    color: "#fff",
    border: "none",
    padding: "6px 10px",
    borderRadius: "8px",
    fontWeight: "bold",
  },
};
