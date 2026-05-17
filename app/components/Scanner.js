"use client";
import { useRef, useState, useEffect } from "react";
import styles from "./Scanner.module.css";

export default function Scanner({ onResult, onScanningChange, onReset, inventory }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [previewSrc, setPreviewSrc] = useState(null);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  async function startCamera() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
      setPreviewSrc(null);
    } catch {
      setError("Camera access denied — use the upload option instead.");
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }

  function captureFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.85);
  }

  async function handleScan(dataUrl) {
    if (!dataUrl) return;
    setScanning(true);
    onScanningChange?.(true);
    setPreviewSrc(dataUrl);
    stopCamera();

    const base64 = dataUrl.split(",")[1];

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          existingInventory: inventory,
        }),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);

      // Generate small thumbnail
      const thumb = await generateThumbnail(dataUrl);
      onResult({ ...result, thumbnail: thumb, rawDataUrl: dataUrl });
    } catch (err) {
      setError("Scan failed: " + err.message);
    } finally {
      setScanning(false);
      onScanningChange?.(false);
    }
  }

  function scanFromCamera() {
    const dataUrl = captureFrame();
    handleScan(dataUrl);
  }

  function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => handleScan(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function generateThumbnail(dataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = 80;
        c.height = 80;
        c.getContext("2d").drawImage(img, 0, 0, 80, 80);
        resolve(c.toDataURL("image/jpeg", 0.6));
      };
      img.onerror = () => resolve("");
      img.src = dataUrl;
    });
  }

  function reset() {
    setPreviewSrc(null);
    setError("");
    onReset?.();
  }

  return (
    <div className={styles.scanner}>
      <div className={`${styles.viewfinder} ${cameraActive ? styles.viewfinderLive : ""}`}>
        {/* Live camera */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`${styles.video} ${cameraActive ? styles.visible : ""}`}
        />

        {/* Captured frame preview */}
        {previewSrc && (
          <img src={previewSrc} alt="Captured frame" className={styles.preview} />
        )}

        {/* Idle placeholder */}
        {!cameraActive && !previewSrc && (
          <div className={styles.placeholder}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            <p>Start camera or upload an image</p>
          </div>
        )}

        {/* Scanning overlay */}
        {scanning && (
          <div className={styles.scanOverlay}>
            <div className={styles.scanLine} />
            <div className={styles.scanRing} />
            <span className={styles.scanLabel}>Analysing with AI…</span>
          </div>
        )}

        {/* Camera scan corners */}
        {cameraActive && !scanning && (
          <div className={styles.corners}>
            <span /><span /><span /><span />
          </div>
        )}

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.controls}>
        {!cameraActive && !scanning && (
          <>
            <button className={styles.btnPrimary} onClick={startCamera}>
              <CameraIcon /> Start camera
            </button>
            <label className={styles.btn}>
              <UploadIcon /> Upload image
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                style={{ display: "none" }}
              />
            </label>
          </>
        )}

        {cameraActive && !scanning && (
          <>
            <button className={styles.btnPrimary} onClick={scanFromCamera}>
              <ScanIcon /> Scan object
            </button>
            <button className={styles.btn} onClick={stopCamera}>
              Stop camera
            </button>
          </>
        )}

        {scanning && (
          <div className={styles.scanningMsg}>
            <span className={styles.dots}>
              <span /><span /><span />
            </span>
            AI is identifying the object…
          </div>
        )}

        {previewSrc && !scanning && (
          <button className={styles.btn} onClick={reset}>
            Scan another
          </button>
        )}
      </div>
    </div>
  );
}

function CameraIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  );
}
function ScanIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="4 7 4 4 7 4"/><polyline points="20 7 20 4 17 4"/>
      <polyline points="4 17 4 20 7 20"/><polyline points="20 17 20 20 17 20"/>
      <line x1="9" y1="12" x2="15" y2="12"/>
    </svg>
  );
}
function UploadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
    </svg>
  );
}
