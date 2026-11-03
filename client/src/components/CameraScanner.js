import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CameraOff, AlertCircle } from "lucide-react";

export default function CameraScanner({ onScan, onClose }) {
  const [error, setError] = useState("");
  const scannerRef = useRef(null);
  const qrRegionId = "infinity-camera-scanner-view";

  useEffect(() => {
    let html5QrCode = null;

    const startScanner = async () => {
      try {
        html5QrCode = new Html5Qrcode(qrRegionId);
        scannerRef.current = html5QrCode;

        const config = {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0,
        };

        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            // Found QR Code!
            try {
              // Try parsing JSON if qrData is {"userId":"..."}
              const parsed = JSON.parse(decodedText);
              if (parsed.userId) {
                stopScanner().then(() => onScan(parsed.userId));
                return;
              }
            } catch {
              // Raw string
            }
            stopScanner().then(() => onScan(decodedText.trim()));
          },
          () => {
            // Scanning frame (no error)
          }
        );
      } catch (err) {
        setError("Camera permission denied or camera not found on this device.");
      }
    };

    const stopScanner = async () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        try {
          await scannerRef.current.stop();
          scannerRef.current.clear();
        } catch {
          // ignore
        }
      }
    };

    startScanner();

    return () => {
      stopScanner();
    };
  }, []);

  const handleManualClose = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // ignore
      }
    }
    if (onClose) onClose();
  };

  return (
    <div style={{
      padding: "16px",
      background: "rgba(15, 23, 42, 0.95)",
      borderRadius: "16px",
      border: "1px solid rgba(255, 255, 255, 0.15)",
      marginBottom: "20px",
      textAlign: "center"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
          <Camera size={16} /> LIVE CAMERA SCANNER
        </span>
        <button
          type="button"
          onClick={handleManualClose}
          style={{
            background: "rgba(239, 68, 68, 0.2)",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            color: "#ef4444",
            padding: "4px 10px",
            borderRadius: "8px",
            fontSize: "0.75rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px"
          }}
        >
          <CameraOff size={14} /> Close Camera
        </button>
      </div>

      {error ? (
        <div style={{ padding: "16px", color: "var(--color-error)", display: "flex", alignItems: "center", gap: "8px", justifyContent: "center", fontSize: "0.85rem" }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      ) : (
        <div>
          <div id={qrRegionId} style={{ width: "100%", maxWidth: "280px", margin: "0 auto", overflow: "hidden", borderRadius: "12px" }}></div>
          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "10px" }}>
            Point your device camera directly at your printed or screen QR Access Pass
          </p>
        </div>
      )}
    </div>
  );
}
