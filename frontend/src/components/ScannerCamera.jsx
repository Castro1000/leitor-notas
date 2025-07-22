import { useEffect, useRef } from "react";
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from "@zxing/library";

export default function ScannerCamera({ onResult, onClose }) {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const bip = useRef(new Audio("/beep.mp3"));

  useEffect(() => {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.CODE_128,
      BarcodeFormat.ITF,
      BarcodeFormat.CODE_39,
      BarcodeFormat.EAN_13
    ]);

    const reader = new BrowserMultiFormatReader(hints);
    readerRef.current = reader;

    let scanning = true;

    const startCamera = async () => {
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

          reader.decodeFromVideoElementContinuously(videoRef.current, (result, err) => {
            if (!scanning) return;

            if (result?.text && result.text.length === 44) {
              scanning = false;
              bip.current.play();
              stopCamera();
              onResult(result.text);
            }
          });
        }
      } catch (error) {
        console.error("Erro ao acessar câmera:", error);
        alert("Erro ao acessar a câmera.");
        stopCamera();
        onClose();
      }
    };

    const stopCamera = () => {
      reader.reset();
      const stream = videoRef.current?.srcObject;
      stream?.getTracks().forEach((track) => track.stop());
    };

    startCamera();

    return () => {
      scanning = false;
      stopCamera();
    };
  }, []);

  return (
    <div style={estilos.overlay}>
      <video ref={videoRef} style={estilos.video} />
      <div style={estilos.barra}></div>
      <div style={estilos.info}>📡 Escaneando código de barras da nota...</div>
      <button style={estilos.fechar} onClick={onClose}>❌ Fechar</button>
    </div>
  );
}

const estilos = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "#000",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  video: {
    width: "100vw",
    height: "100vh",
    objectFit: "cover",
  },
  barra: {
    position: "absolute",
    top: "calc(50% - 40px)",
    left: "10%",
    width: "80%",
    height: "80px",
    border: "3px dashed #FFD700",
    borderRadius: "12px",
    pointerEvents: "none",
  },
  info: {
    position: "absolute",
    bottom: "70px",
    color: "#FFD700",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: "10px 20px",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "bold",
  },
  fechar: {
    position: "absolute",
    top: 20,
    right: 20,
    padding: "10px 14px",
    fontSize: "16px",
    backgroundColor: "#e60000",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
};
