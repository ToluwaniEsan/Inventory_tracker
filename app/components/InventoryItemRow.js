import styles from "./InventoryItemRow.module.css";

export default function InventoryItemRow({ item, expanded, onToggle, onDelete }) {
  const traits = parseTraits(item.traits);
  const addedLabel = formatAddedAt(item.added_at);

  return (
    <article className={`${styles.card} ${expanded ? styles.cardExpanded : ""}`}>
      <button
        type="button"
        className={styles.header}
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={`item-details-${item.id}`}
      >
        <div className={styles.thumb}>
          {item.thumbnail ? (
            <img src={item.thumbnail} alt="" />
          ) : (
            <BoxIcon size={20} />
          )}
        </div>
        <div className={styles.info}>
          <p className={styles.name}>{item.name}</p>
          <p className={styles.sub}>
            {item.type}
            {item.color ? ` · ${item.color}` : ""}
            {traits[0] ? ` · ${traits[0]}` : ""}
          </p>
        </div>
        <span className={styles.qty}>×{item.quantity}</span>
        <span className={`${styles.chevron} ${expanded ? styles.chevronOpen : ""}`} aria-hidden>
          <ChevronIcon />
        </span>
      </button>
      <button
        type="button"
        className={styles.deleteBtn}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        aria-label={`Delete ${item.name}`}
      >
        <TrashIcon />
      </button>
      <div
        id={`item-details-${item.id}`}
        className={`${styles.details} ${expanded ? styles.detailsOpen : ""}`}
        aria-hidden={!expanded}
      >
        <div className={styles.detailsInner}>
          <div className={styles.hero}>
            <div className={styles.media}>
              {item.thumbnail ? (
                <img src={item.thumbnail} alt={item.name} />
              ) : (
                <div className={styles.placeholder}>
                  <BoxIcon size={36} />
                </div>
              )}
            </div>
            <div className={styles.intro}>
              <span className={styles.storedLabel}>Stored as</span>
              <h3 className={styles.detailName}>{item.name}</h3>
              {item.description ? (
                <p className={styles.desc}>{item.description}</p>
              ) : (
                <p className={styles.descMuted}>
                  No description recorded — characteristics below were captured at scan time.
                </p>
              )}
              {addedLabel && (
                <p className={styles.date}>
                  <ClockIcon size={14} />
                  Added {addedLabel}
                </p>
              )}
            </div>
          </div>
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Characteristics</h4>
            <div className={styles.metaGrid}>
              <div className={styles.metaItem}>
                <label>Type</label>
                <span>{item.type || "—"}</span>
              </div>
              <div className={styles.metaItem}>
                <label>Color</label>
                <span className={styles.colorMeta}>
                  {item.color && (
                    <span
                      className={styles.colorSwatch}
                      style={{ background: colorToCss(item.color) }}
                      aria-hidden
                    />
                  )}
                  {item.color || "—"}
                </span>
              </div>
              <div className={`${styles.metaItem} ${styles.metaWide}`}>
                <label>In stock</label>
                <span>
                  {item.quantity} unit{item.quantity !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
            {traits.length > 0 && (
              <div className={styles.traitsBlock}>
                <label className={styles.traitsHeading}>Identifying traits</label>
                <div className={styles.traitList}>
                  {traits.map((t, i) => (
                    <span key={i} className={styles.trait}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function parseTraits(traits) {
  return (traits || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function formatAddedAt(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const COLOR_MAP = {
  red: "#dc2626",
  orange: "#ea580c",
  yellow: "#ca8a04",
  green: "#16a34a",
  blue: "#2563eb",
  purple: "#9333ea",
  pink: "#db2777",
  brown: "#92400e",
  black: "#1a1a1a",
  white: "#e5e5e5",
  gray: "#6b7280",
  grey: "#6b7280",
  silver: "#9ca3af",
  gold: "#d97706",
  beige: "#d4b896",
  cream: "#f5f0e1",
};

function colorToCss(colorText) {
  const lower = (colorText || "").toLowerCase();
  for (const [name, hex] of Object.entries(COLOR_MAP)) {
    if (lower.includes(name)) return hex;
  }
  return "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)";
}

function BoxIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function ClockIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}
