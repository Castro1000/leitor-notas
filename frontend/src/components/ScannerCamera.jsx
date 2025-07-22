import { useEffect, useRef } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";

export default function ScannerCamera({ onResult, onClose }) {
  const videoRef = useRef(null);
  const reader = useRef(new BrowserMultiFormatReader());
  const bip = useRef(new Audio("/beep.mp3"));
  let scanning = true;

  useEffect(() => {
    startCamera();

    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          facingMode: { exact: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          focusMode: "continuous",
          advanced: [{ focusMode: "continuous" }],
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", true);
        await videoRef.current.play();

        reader.current.decodeFromVideoElementContinuously(
          videoRef.current,
          (result, err) => {
            if (!scanning) return;
            if (result?.text && result.text.length === 44) {
              scanning = false;
              bip.current.play();
              stopCamera();
              onResult(result.text);
            }
          }
        );
      }
    } catch (error) {
      console.error("Erro ao acessar câmera:", error);
      alert("Erro ao acessar a câmera.");
      stopCamera();
      onClose();
    }
  };

  const stopCamera = () => {
    reader.current.reset();
    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  return (
    <div style={estilos.overlay}>
      <video ref={videoRef} style={estilos.video} />
      <div style={estilos.barra} />
      <button style={estilos.botaoFechar} onClick={() => {
        stopCamera();
        onClose();
      }}>
        ✖ Fechar
      </button>
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
    backgroundColor: "#000",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  barra: {
    position: "absolute",
    top: "40%",
    left: "10%",
    width: "80%",
    height: "80px",
    border: "3px dashed #FFD700",
    borderRadius: "8px",
    pointerEvents: "none",
  },
  botaoFechar: {
    position: "absolute",
    top: 20,
    right: 20,
    padding: "10px 18px",
    fontSize: "16px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#e60000",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
    zIndex: 10000,
  },
};
