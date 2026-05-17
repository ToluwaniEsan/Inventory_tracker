"use client";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import FloorPlanCanvas from "./FloorPlanCanvas";
import RoomSetup from "./RoomSetup";
import styles from "./MapView.module.css";

const RoomPreview3D = dynamic(() => import("./RoomPreview3D"), { ssr: false });

export default function MapView({
  zonesData,
  inventory,
  mapMode,
  onMapModeChange,
  onZonesSaved,
  onStatus,
  onItemClick,
}) {
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [view3d, setView3d] = useState(false);

  const itemCounts = useMemo(() => {
    const counts = {};
    for (const item of inventory) {
      if (item.location_zone_id) {
        counts[item.location_zone_id] =
          (counts[item.location_zone_id] || 0) + (parseInt(item.quantity) || 1);
      }
    }
    return counts;
  }, [inventory]);

  const zoneItems = useMemo(() => {
    if (!selectedZoneId) return [];
    return inventory.filter((it) => it.location_zone_id === selectedZoneId);
  }, [inventory, selectedZoneId]);

  const selectedZone = zonesData?.zones?.find((z) => z.id === selectedZoneId);

  if (mapMode === "setup") {
    return (
      <RoomSetup
        zonesData={zonesData}
        onSaved={onZonesSaved}
        onStatus={onStatus}
      />
    );
  }

  return (
    <>
      <div className={styles.modeBar}>
        <button
          type="button"
          className={`${styles.modeBtn} ${!view3d ? styles.modeBtnActive : ""}`}
          onClick={() => setView3d(false)}
        >
          2D map
        </button>
        <button
          type="button"
          className={`${styles.modeBtn} ${view3d ? styles.modeBtnActive : ""}`}
          onClick={() => setView3d(true)}
          disabled={!zonesData?.floorPlan}
        >
          3D preview
        </button>
        <button
          type="button"
          className={styles.modeBtn}
          onClick={() => onMapModeChange("setup")}
        >
          Edit layout
        </button>
      </div>

      {view3d ? (
        <div className={styles.view3dWrap}>
          <RoomPreview3D zones={zonesData?.zones || []} floorPlan={zonesData?.floorPlan} />
        </div>
      ) : (
        <div className={styles.mapView}>
          <FloorPlanCanvas
            floorPlanFilename={zonesData?.floorPlan}
            zones={zonesData?.zones || []}
            selectedZoneId={selectedZoneId}
            onSelectZone={setSelectedZoneId}
            readOnly
            itemCounts={itemCounts}
          />

          <aside className={styles.panel}>
            {selectedZone ? (
              <>
                <h3 className={styles.panelTitle}>{selectedZone.label}</h3>
                <p className={styles.panelEmpty} style={{ opacity: 1 }}>
                  {zoneItems.length === 0
                    ? "No items stored at this location."
                    : `${zoneItems.length} item type(s) here`}
                </p>
                <div className={styles.itemList}>
                  {zoneItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={styles.itemRow}
                      onClick={() => onItemClick?.(item)}
                    >
                      <div className={styles.itemThumb}>
                        {item.thumbnail ? (
                          <img src={item.thumbnail} alt="" />
                        ) : null}
                      </div>
                      <div className={styles.itemInfo}>
                        <p className={styles.itemName}>{item.name}</p>
                        <p className={styles.itemSub}>
                          ×{item.quantity} · {item.type}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className={styles.panelEmpty}>
                Click a pin on the map to see items stored at that location.
              </p>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
