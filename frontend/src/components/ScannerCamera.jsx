import { useEffect, useRef } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";

export default function ScannerCamera({ onResult, onClose }) {
  const videoRef = useRef(null);
  const beep = useRef(new Audio("/beep.mp3"));
  const codeReader = useRef(null);

  useEffect(() => {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.ITF,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.EAN_13
    ]);

    const reader = new BrowserMultiFormatReader(hints);
    codeReader.current = reader;
    let scanning = true;

    const start = async () => {
      try {
        const constraints = {
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
            focusMode: "continuous",
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", true);
          await videoRef.current.play();

          reader.decodeFromVideoElementContinuously(videoRef.current, (result, err) => {
            if (!scanning) return;
            if (result?.text && result.text.length >= 40) {
              scanning = false;
              beep.current.play();
              stop();
              onResult(result.text.trim());
            }
          });
        }
      } catch (err) {
        console.error("Erro ao acessar a câmera:", err);
        alert("Erro ao acessar a câmera. Verifique permissões.");
        onClose();
      }
    };

    const stop = () => {
      reader.reset();
      const stream = videoRef.current?.srcObject;
      stream?.getTracks().forEach((track) => track.stop());
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
      <div style={estilos.barra}></div>
      <div style={estilos.mensagem}>📡 Escaneando código de barras...</div>
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
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center"
  },
  video: {
    width: "100vw",
    height: "100vh",
    objectFit: "cover",
  },
  barra: {
    position: "absolute",
    top: "calc(50% - 50px)",
    left: "10%",
    width: "80%",
    height: "100px",
    border: "3px dashed yellow",
    borderRadius: "12px",
    pointerEvents: "none",
  },
  mensagem: {
    position: "absolute",
    bottom: 80,
    backgroundColor: "rgba(0,0,0,0.6)",
    color: "#FFD700",
    padding: "10px 20px",
    borderRadius: "10px",
    fontWeight: "bold",
    fontSize: "18px"
  },
  botaoFechar: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "red",
    color: "white",
    fontSize: "16px",
    padding: "8px 12px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer"
  }
};
