"use client";
import { useState, useEffect, useCallback } from "react";
import Scanner from "./components/Scanner";
import InventoryItemRow from "./components/InventoryItemRow";
import styles from "./page.module.css";

const UI_SCALE_MIN = 0.9;
const UI_SCALE_MAX = 1.5;
const UI_SCALE_STEP = 0.1;
const UI_SCALE_DEFAULT = 1.2;
const UI_SCALE_STORAGE_KEY = "vision-ui-scale";

function clampScale(value) {
  return Math.min(UI_SCALE_MAX, Math.max(UI_SCALE_MIN, Math.round(value * 100) / 100));
}

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("scan");
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [uiScale, setUiScale] = useState(UI_SCALE_DEFAULT);

  function toggleItemExpanded(id) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const loadInventory = useCallback(async () => {
    try {
      const res = await fetch("/api/inventory");
      const data = await res.json();
      if (Array.isArray(data)) setInventory(data);
    } catch (err) {
      console.error("Failed to load inventory:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadInventory(); }, [loadInventory]);

  useEffect(() => {
    const saved = localStorage.getItem(UI_SCALE_STORAGE_KEY);
    if (saved) {
      const parsed = parseFloat(saved);
      if (Number.isFinite(parsed)) setUiScale(clampScale(parsed));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(UI_SCALE_STORAGE_KEY, String(uiScale));
    document.documentElement.style.setProperty("--ui-scale", String(uiScale));
  }, [uiScale]);

  function decreaseUiScale() {
    setUiScale((s) => clampScale(s - UI_SCALE_STEP));
  }

  function increaseUiScale() {
    setUiScale((s) => clampScale(s + UI_SCALE_STEP));
  }

  function showStatus(msg, duration = 3000) {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(""), duration);
  }

  function handleScanResult(result) {
    setScanResult(result);
    const matchedItem =
      result.match_id != null
        ? inventory.find((it) => String(it.id) === String(result.match_id))
        : null;
    setQuantity(matchedItem ? matchedItem.quantity : 1);
  }

  function handleScanReset() {
    setScanResult(null);
    setScanning(false);
  }

  function adjustQuantity(delta) {
    setQuantity((q) => Math.max(1, (parseInt(q) || 1) + delta));
  }

  async function saveToInventory() {
    if (!scanResult) return;
    setSaving(true);
    const isMatch =
      scanResult.match_id != null &&
      inventory.some((it) => String(it.id) === String(scanResult.match_id));
    try {
      if (isMatch) {
        await fetch("/api/inventory", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: scanResult.match_id, quantity }),
        });
        showStatus(`Updated "${scanResult.name}" — quantity set to ${quantity}`);
      } else {
        await fetch("/api/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: String(Date.now()),
            name: scanResult.name,
            type: scanResult.type,
            color: scanResult.color,
            traits: scanResult.traits,
            description: scanResult.description,
            quantity,
            added_at: new Date().toISOString(),
            thumbnail: scanResult.thumbnail || "",
          }),
        });
        showStatus(`"${scanResult.name}" added to inventory`);
      }
      await loadInventory();
      setScanResult(null);
    } catch (err) {
      showStatus("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(id, name) {
    if (!confirm(`Remove "${name}" from inventory?`)) return;
    try {
      await fetch("/api/inventory", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      showStatus(`"${name}" removed`);
      await loadInventory();
    } catch (err) {
      showStatus("Delete failed: " + err.message);
    }
  }

  function exportCSV() {
    if (inventory.length === 0) { showStatus("Nothing to export yet"); return; }
    const header = "id,name,type,color,traits,description,quantity,added_at";
    const rows = inventory.map((it) =>
      [it.id, it.name, it.type, it.color, it.traits, it.description, it.quantity, it.added_at]
        .map((v) => { const s = String(v ?? ""); return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s; })
        .join(",")
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "inventory.csv"; a.click();
    URL.revokeObjectURL(url);
    showStatus(`Exported ${inventory.length} items`);
  }

  const matchedItem = scanResult?.match_id != null
    ? inventory.find((it) => String(it.id) === String(scanResult.match_id))
    : null;
  const isMatch = !!matchedItem;

  const filteredInventory = searchQuery
    ? inventory.filter((it) =>
        it.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        it.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        it.color.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (it.traits || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (it.description || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : inventory;

  const totalQty = inventory.reduce((a, b) => a + (parseInt(b.quantity) || 1), 0);
  const scalePercent = Math.round(uiScale * 100);

  return (
    <div className={styles.scaleShell}>
      <div className={styles.scaleInner} style={{ "--ui-scale": uiScale }}>
        <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}><EyeIcon size={22} /></div>
          <div>
            <h1 className={styles.headerTitle}>Vision Inventory</h1>
            <p className={styles.headerSub}>AI-powered object detection &amp; tracking</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.scaleControl} role="group" aria-label="Display size">
            <button
              type="button"
              className={styles.scaleBtn}
              onClick={decreaseUiScale}
              disabled={uiScale <= UI_SCALE_MIN}
              aria-label="Decrease display size"
              title="Smaller"
            >
              A−
            </button>
            <span className={styles.scaleValue} aria-live="polite">
              {scalePercent}%
            </span>
            <button
              type="button"
              className={styles.scaleBtn}
              onClick={increaseUiScale}
              disabled={uiScale >= UI_SCALE_MAX}
              aria-label="Increase display size"
              title="Larger"
            >
              A+
            </button>
          </div>
          <button className={styles.btnOutline} onClick={exportCSV}>
            <DownloadIcon /> Export CSV
          </button>
        </div>
      </header>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${activeTab === "scan" ? styles.tabActive : ""}`} onClick={() => setActiveTab("scan")}>
          <CameraIcon /> Scan
        </button>
        <button className={`${styles.tab} ${activeTab === "inventory" ? styles.tabActive : ""}`} onClick={() => setActiveTab("inventory")}>
          <BoxIcon /> Inventory
          {inventory.length > 0 && <span className={styles.badge}>{inventory.length}</span>}
        </button>
      </div>

      {activeTab === "scan" && (
        <div className={styles.scanView}>
          <div className={styles.scanCameraCol}>
            <Scanner
              onResult={handleScanResult}
              onScanningChange={setScanning}
              onReset={handleScanReset}
              inventory={inventory}
            />
          </div>

          <aside className={styles.scanPanel} aria-live="polite">
            {scanning && (
              <div className={styles.panelLoading}>
                <div className={styles.panelLoadingRing} />
                <p className={styles.panelLoadingTitle}>Analysing object</p>
                <p className={styles.panelLoadingSub}>AI is reading type, color, and traits…</p>
                <div className={styles.skeletonStack}>
                  <div className={styles.skeletonLine} />
                  <div className={`${styles.skeletonLine} ${styles.skeletonShort}`} />
                  <div className={`${styles.skeletonLine} ${styles.skeletonShorter}`} />
                </div>
              </div>
            )}

            {!scanning && scanResult && (
              <div
                className={`${styles.resultCard} ${isMatch ? styles.resultMatch : styles.resultNew} ${styles.resultVisible}`}
              >
                {scanResult.thumbnail && (
                  <div className={styles.resultThumb}>
                    <img src={scanResult.thumbnail} alt="" />
                  </div>
                )}
                <div className={styles.resultHeader}>
                  <span className={`${styles.resultBadge} ${isMatch ? styles.badgeMatch : styles.badgeNew}`}>
                    {isMatch ? "✓ Recognised" : "New object"}
                  </span>
                </div>
                <h2 className={styles.resultName}>{scanResult.name}</h2>
                <div className={styles.resultMeta}>
                  <div className={styles.metaItem}>
                    <label>Type</label>
                    <span>{scanResult.type}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <label>Color</label>
                    <span>{scanResult.color}</span>
                  </div>
                </div>
                {scanResult.description && (
                  <p className={styles.resultDesc}>{scanResult.description}</p>
                )}
                {isMatch && matchedItem && (
                  <div className={styles.matchInfo}>
                    Matches &ldquo;<strong>{matchedItem.name}</strong>&rdquo; in inventory (
                    {matchedItem.quantity} in stock)
                    {scanResult.match_reason && ` — ${scanResult.match_reason}`}
                  </div>
                )}
                <div className={styles.traitList}>
                  {(scanResult.traits || "")
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean)
                    .map((t, i) => (
                      <span key={i} className={styles.trait}>
                        {t}
                      </span>
                    ))}
                </div>
                <div className={styles.saveRow}>
                  <span className={styles.qtyLabel}>Quantity</span>
                  <div className={styles.qtyStepper}>
                    <button
                      type="button"
                      className={styles.qtyBtn}
                      onClick={() => adjustQuantity(-1)}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className={styles.qtyInput}
                    />
                    <button
                      type="button"
                      className={styles.qtyBtn}
                      onClick={() => adjustQuantity(1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className={styles.panelActions}>
                  <button
                    className={styles.btnPrimary}
                    onClick={saveToInventory}
                    disabled={saving}
                  >
                    {saving ? "Saving…" : isMatch ? "Update quantity" : "Add to inventory"}
                  </button>
                  <button className={styles.btnOutline} onClick={handleScanReset}>
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {!scanning && !scanResult && (
              <div className={styles.panelEmpty}>
                <div className={styles.panelEmptyIcon}>
                  <SparkleIcon />
                </div>
                <p className={styles.panelEmptyTitle}>Scan results appear here</p>
                <p className={styles.panelEmptySub}>
                  Point your camera at an object or upload a photo. Details will show up
                  beside the viewfinder.
                </p>
                <ul className={styles.panelTips}>
                  <li>Good lighting helps accuracy</li>
                  <li>Centre the object in the frame</li>
                  <li>Known items update stock automatically</li>
                </ul>
              </div>
            )}
          </aside>
        </div>
      )}

      {activeTab === "inventory" && (
        <div className={styles.inventoryView}>
          <div className={styles.statsRow}>
            <div className={styles.stat}><label>Total items</label><span>{inventory.length}</span></div>
            <div className={styles.stat}><label>Total quantity</label><span>{totalQty}</span></div>
          </div>
          <input type="text" placeholder="Search by name, type, color…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={styles.searchInput} />
          {loading ? (
            <p className={styles.loadingMsg}>Loading inventory…</p>
          ) : filteredInventory.length === 0 ? (
            <div className={styles.emptyState}>
              <BoxIcon size={40} />
              <p>{inventory.length === 0 ? "No items yet — scan your first object" : "No items match your search"}</p>
            </div>
          ) : (
            <div className={styles.itemsList}>
              {[...filteredInventory].reverse().map((item) => (
                <InventoryItemRow
                  key={item.id}
                  item={item}
                  expanded={expandedIds.has(item.id)}
                  onToggle={() => toggleItemExpanded(item.id)}
                  onDelete={() => deleteItem(item.id, item.name)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {statusMsg && <div className={styles.statusBar}>{statusMsg}</div>}
        </main>
      </div>
    </div>
  );
}

function EyeIcon({ size = 22 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
}
function CameraIcon({ size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>;
}
function BoxIcon({ size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
}
function DownloadIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
}
function TrashIcon({ size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
}
function SparkleIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z" />
      <path d="M19 15l.75 2.25L22 18l-2.25.75L19 21l-.75-2.25L16 18l2.25-.75L19 15z" />
    </svg>
  );
}
