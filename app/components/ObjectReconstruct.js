"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import styles from "./ObjectReconstruct.module.css";

const ObjectModelViewer = dynamic(() => import("./ObjectModelViewer"), { ssr: false });

export default function ObjectReconstruct({ itemId, onModelSaved }) {
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleReconstruct(e) {
    const files = e.target.files;
    if (!files || files.length < 3) {
      setError("Select front, back, and side images");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [front, back, side] = await Promise.all([
        fileToBase64(files[0]),
        fileToBase64(files[1]),
        fileToBase64(files[2]),
      ]);
      const res = await fetch("/api/scan/reconstruct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: { front, back, side } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reconstruction failed");
      setModel(data);
      onModelSaved?.(itemId, data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  }

  return (
    <div className={styles.wrap}>
      <label className={styles.btn}>
        {loading ? "Building 3D model…" : "Upload front, back, side (3 files)"}
        <input
          type="file"
          accept="image/*"
          multiple
          className={styles.hidden}
          onChange={handleReconstruct}
          disabled={loading}
        />
      </label>
      {error && <p className={styles.error}>{error}</p>}
      {model && (
        <>
          <p className={styles.notes}>{model.shapeNotes}</p>
          <ObjectModelViewer model={model} />
        </>
      )}
    </div>
  );
}
