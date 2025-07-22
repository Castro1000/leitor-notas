import { useEffect, useRef } from "react";
import { BrowserMultiFormatReader, BarcodeFormat } from "@zxing/library";

export default function ScannerCamera({ onResult, onClose }) {
  const videoRef = useRef(null);
  const codeReader = useRef(null);
  const bip = new Audio("/beep.mp3");

  useEffect(() => {
    codeReader.current = new BrowserMultiFormatReader();

    const iniciarLeitura = async () => {
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (devices.length === 0) throw new Error("Nenhuma câmera encontrada");

        const selectedDeviceId = devices[0].deviceId;

        codeReader.current.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current,
          (result, err) => {
            if (result) {
              const texto = result.getText().trim();
              if (texto.length === 44) {
                bip.play();
                codeReader.current.reset();
                onResult(texto);
              }
            }
          }
        );
      } catch (error) {
        console.error("Erro ao iniciar scanner:", error);
        onClose();
      }
    };

    iniciarLeitura();

    return () => {
      codeReader.current?.reset();
    };
  }, [onResult, onClose]);

  return (
    <div style={styles.overlay}>
      <div style={styles.area}>
        <video ref={videoRef} style={styles.video} />
        <div style={styles.mira} />
        <button onClick={onClose} style={styles.fechar}>❌ Fechar</button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0, left: 0,
    width: "100vw", height: "100vh",
    backgroundColor: "rgba(0,0,0,0.9)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  area: {
    position: "relative",
    width: "100%",
    maxWidth: "480px",
    aspectRatio: "4/3",
    overflow: "hidden",
    borderRadius: "12px",
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  mira: {
    position: "absolute",
    top: "50%", left: "50%",
    width: "80%", height: "80px",
    transform: "translate(-50%, -50%)",
    border: "3px dashed #FFD700",
    borderRadius: "8px",
  },
  fechar: {
    position: "absolute",
    top: 10, right: 10,
    backgroundColor: "#e60000",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
  },
};
