import { useEffect, useRef } from "react";
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from "@zxing/library";

export default function ScannerCamera({ onResult, onClose }) {
  const videoRef = useRef(null);
  const beep = useRef(new Audio("/beep.mp3"));

  useEffect(() => {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.CODE_128,
      BarcodeFormat.ITF,
      BarcodeFormat.EAN_13,
      BarcodeFormat.CODE_39
    ]);

    const codeReader = new BrowserMultiFormatReader(hints);
    let isScanning = true;

    const startScanner = async () => {
      try {
        const constraints = {
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", true);
          await videoRef.current.play();

          codeReader.decodeFromVideoElementContinuously(videoRef.current, (result, err) => {
            if (!isScanning) return;
            if (result?.text?.length === 44) {
              isScanning = false;
              beep.current.play();
              stopScanner();
              onResult(result.text);
            }
          });
        }
      } catch (err) {
        console.error("Erro ao acessar câmera:", err);
        alert("Erro ao acessar a câmera. Verifique as permissões.");
        onClose();
      }
    };

    const stopScanner = () => {
      codeReader.reset();
      const stream = videoRef.current?.srcObject;
      stream?.getTracks().forEach(track => track.stop());
    };

    startScanner();
    return () => {
      isScanning = false;
      stopScanner();
    };
  }, []);

  return (
    <div style={estilos.overlay}>
      <video ref={videoRef} style={estilos.video} />
      <div style={estilos.barra}></div>
      <div style={estilos.texto}>📡 Escaneando código de barras...</div>
      <button style={estilos.botao} onClick={onClose}>❌ Fechar</button>
    </div>
  );
}

const estilos = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "#000",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
    zIndex: 9999
  },
  video: {
    width: "100vw",
    height: "100vh",
    objectFit: "cover"
  },
  barra: {
    position: "absolute",
    top: "calc(50% - 40px)",
    left: "10%",
    width: "80%",
    height: "80px",
    border: "3px dashed #FFD700",
    borderRadius: "10px",
    pointerEvents: "none"
  },
  texto: {
    position: "absolute",
    bottom: "80px",
    color: "#FFD700",
    fontWeight: "bold",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: "10px 20px",
    borderRadius: "12px",
    fontSize: "18px"
  },
  botao: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "#e60000",
    color: "#fff",
    border: "none",
    padding: "10px 14px",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer"
  }
};
