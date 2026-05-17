"use client";
import { useState, useRef } from "react";
import FloorPlanCanvas from "./FloorPlanCanvas";
import { createZoneId } from "../lib/zones";
import styles from "./RoomSetup.module.css";

export default function RoomSetup({ zonesData, onSaved, onStatus }) {
  const [floorPlan, setFloorPlan] = useState(zonesData?.floorPlan || "");
  const [zones, setZones] = useState(zonesData?.zones || []);
  const [selectedId, setSelectedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const selected = zones.find((z) => z.id === selectedId);

  async function uploadFloorPlan(file) {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/room", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setFloorPlan(data.filename);
      onStatus?.("Floor plan uploaded");
    } catch (err) {
      onStatus?.(err.message, true);
    } finally {
      setUploading(false);
    }
  }

  function addZoneAt(x, y) {
    const id = createZoneId("new-zone");
    const next = {
      id,
      label: `Zone ${zones.length + 1}`,
      markerId: zones.length + 1,
      x,
      y,
    };
    setZones((z) => [...z, next]);
    setSelectedId(id);
  }

  function updateZone(id, patch) {
    setZones((list) =>
      list.map((z) => (z.id === id ? { ...z, ...patch } : z))
    );
  }

  function removeZone(id) {
    setZones((list) => list.filter((z) => z.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  async function saveZones() {
    setSaving(true);
    try {
      const res = await fetch("/api/zones", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ floorPlan, zones }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      onSaved?.(data);
      onStatus?.("Room layout saved");
    } catch (err) {
      onStatus?.(err.message, true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.setup}>
      <div className={styles.toolbar}>
        <label className={styles.btn}>
          {uploading ? "Uploading…" : "Upload floor plan"}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className={styles.hiddenInput}
            onChange={(e) => {
              uploadFloorPlan(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
        <button
          type="button"
          className={styles.btn}
          onClick={() => addZoneAt(0.5, 0.5)}
        >
          Add zone
        </button>
        <a
          className={styles.btn}
          href="/api/markers/generate?ids=1,2,3,4,5,6"
          download="aruco-markers.pdf"
          target="_blank"
          rel="noreferrer"
        >
          Print markers
        </a>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={saveZones}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save layout"}
        </button>
      </div>

      <p className={styles.hint}>
        Click the floor plan to place a new zone pin. Drag pins to reposition. Assign each zone an ArUco marker ID that matches your printed tags (DICT_4X4_50).
      </p>

      <div className={styles.layout}>
        <FloorPlanCanvas
          floorPlanFilename={floorPlan}
          zones={zones}
          selectedZoneId={selectedId}
          onSelectZone={setSelectedId}
          onZoneMove={(id, x, y) => updateZone(id, { x, y })}
          onCanvasClick={(norm) => addZoneAt(norm.x, norm.y)}
        />

        <aside className={styles.sidebar}>
          {selected ? (
            <>
              <div className={styles.zoneCard}>
                <label>Zone name</label>
                <input
                  className={styles.input}
                  value={selected.label}
                  onChange={(e) => updateZone(selected.id, { label: e.target.value })}
                />
                <label>ArUco marker ID</label>
                <input
                  className={styles.input}
                  type="number"
                  min="0"
                  value={selected.markerId ?? ""}
                  onChange={(e) =>
                    updateZone(selected.id, {
                      markerId: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />
                <button
                  type="button"
                  className={styles.btnDanger}
                  onClick={() => removeZone(selected.id)}
                >
                  Remove zone
                </button>
              </div>
            </>
          ) : (
            <p className={styles.hint}>Select a pin to edit its label and marker ID.</p>
          )}

          <div className={styles.zoneList}>
            {zones.map((z) => (
              <button
                key={z.id}
                type="button"
                className={`${styles.zoneCard} ${selectedId === z.id ? styles.zoneCardActive : ""}`}
                onClick={() => setSelectedId(z.id)}
              >
                <strong>{z.label}</strong>
                <span style={{ fontSize: 12, opacity: 0.7 }}>
                  Marker #{z.markerId ?? "—"}
                </span>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
