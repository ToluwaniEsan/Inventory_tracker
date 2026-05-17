"use client";
import { useRef, useCallback } from "react";
import { floorPlanUrl } from "../lib/zones";
import styles from "./FloorPlanCanvas.module.css";

export default function FloorPlanCanvas({
  floorPlanFilename,
  zones = [],
  selectedZoneId = null,
  onSelectZone,
  onZoneMove,
  onCanvasClick,
  readOnly = false,
  itemCounts = {},
}) {
  const dragRef = useRef(null);
  const innerRef = useRef(null);

  const imageUrl = floorPlanUrl(floorPlanFilename);

  const getNormFromEvent = useCallback((clientX, clientY) => {
    const el = innerRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return null;
    return { x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000 };
  }, []);

  function handleOverlayClick(e) {
    if (readOnly || dragRef.current) return;
    if (e.target !== e.currentTarget) return;
    const norm = getNormFromEvent(e.clientX, e.clientY);
    if (norm) onCanvasClick?.(norm);
  }

  function startDrag(zoneId, e) {
    if (readOnly) return;
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = zoneId;
    onSelectZone?.(zoneId);

    function onMove(ev) {
      const norm = getNormFromEvent(ev.clientX, ev.clientY);
      if (norm) onZoneMove?.(zoneId, norm.x, norm.y);
    }

    function onUp() {
      dragRef.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  if (!floorPlanFilename) {
    return (
      <div className={`${styles.wrap} ${styles.empty}`}>
        <p>No floor plan uploaded yet</p>
        <p style={{ fontSize: "0.85rem" }}>Upload an image in Setup mode</p>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div ref={innerRef} className={styles.inner}>
        {imageUrl && (
          <img src={imageUrl} alt="Floor plan" className={styles.img} draggable={false} />
        )}
        <div
          className={`${styles.overlay} ${readOnly ? styles.overlayReadOnly : ""}`}
          onClick={handleOverlayClick}
        >
          {zones.map((zone) => {
            const count = itemCounts[zone.id] || 0;
            const isSelected = selectedZoneId === zone.id;
            return (
              <button
                key={zone.id}
                type="button"
                className={`${styles.pin} ${isSelected ? styles.pinSelected : ""} ${count > 0 ? styles.pinOccupied : ""}`}
                style={{ left: `${zone.x * 100}%`, top: `${zone.y * 100}%` }}
                onPointerDown={(e) => startDrag(zone.id, e)}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectZone?.(zone.id);
                }}
                aria-label={`${zone.label}${count ? `, ${count} items` : ""}`}
              >
                <span className={styles.dot} />
                {count > 0 && <span className={styles.countBadge}>{count}</span>}
                <span className={styles.pinLabel}>{zone.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
