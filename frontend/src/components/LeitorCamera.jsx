import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function LeitorCamera({ onScan }) {
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  const iniciarLeitor = () => {
    setScanning(true);
    const html5QrCode = new Html5Qrcode('leitor-camera');
    html5QrCodeRef.current = html5QrCode;

    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length) {
        const cameraId = devices[0].id;
        html5QrCode.start(
          cameraId,
          {
            fps: 10,
            qrbox: 250,
          },
          (decodedText) => {
            html5QrCode.stop().then(() => {
              setScanning(false);
              onScan(decodedText);
            });
          },
          (errorMessage) => {
            console.warn(errorMessage);
          }
        );
      }
    });
  };

  const pararLeitor = () => {
    html5QrCodeRef.current?.stop();
    setScanning(false);
  };

  useEffect(() => {
    return () => pararLeitor();
  }, []);

  return (
    <div>
      {!scanning ? (
        <button onClick={iniciarLeitor} style={{ padding: '10px', marginBottom: '10px' }}>
          📷 Abrir Câmera para Leitura
        </button>
      ) : (
        <button onClick={pararLeitor} style={{ padding: '10px', marginBottom: '10px', backgroundColor: 'red', color: 'white' }}>
          ✖️ Parar Leitura
        </button>
      )}
      <div id="leitor-camera" ref={scannerRef} style={{ width: '100%' }}></div>
    </div>
  );
}
