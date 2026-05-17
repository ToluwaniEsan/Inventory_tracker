import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CSV_PATH = path.join(process.cwd(), "data", "inventory.csv");
const CSV_HEADER =
  "id,name,type,color,traits,description,quantity,added_at,thumbnail,location_zone_id,location_label\n";

function ensureCSV() {
  const dir = path.dirname(CSV_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(CSV_PATH)) {
    fs.writeFileSync(CSV_PATH, CSV_HEADER, "utf8");
    return;
  }
  const raw = fs.readFileSync(CSV_PATH, "utf8");
  const firstLine = raw.split("\n")[0] || "";
  if (!firstLine.includes("location_zone_id")) {
    const lines = raw.trim().split("\n");
    const header = CSV_HEADER.trim();
    const body = lines.slice(1).map((line) => {
      if (!line.trim()) return line;
      return `${line},,`;
    });
    fs.writeFileSync(CSV_PATH, [header, ...body].join("\n") + "\n", "utf8");
  }
}

function parseCSV(raw) {
  const lines = raw.trim().split("\n");
  if (lines.length < 2) return [];
  // skip header
  return lines.slice(1).map((line) => {
    // Handle quoted fields properly
    const cols = [];
    let inQuote = false;
    let cur = "";
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"' && !inQuote) { inQuote = true; continue; }
      if (ch === '"' && inQuote) {
        if (line[i + 1] === '"') { cur += '"'; i++; } // escaped quote
        else inQuote = false;
        continue;
      }
      if (ch === "," && !inQuote) { cols.push(cur); cur = ""; continue; }
      cur += ch;
    }
    cols.push(cur);
    return {
      id: cols[0] || "",
      name: cols[1] || "",
      type: cols[2] || "",
      color: cols[3] || "",
      traits: cols[4] || "",
      description: cols[5] || "",
      quantity: parseInt(cols[6]) || 1,
      added_at: cols[7] || "",
      thumbnail: cols[8] || "",
      location_zone_id: cols[9] || "",
      location_label: cols[10] || "",
    };
  }).filter((r) => r.id);
}

function escapeCSVField(val) {
  const str = String(val ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowToCSV(item) {
  return [
    item.id,
    item.name,
    item.type,
    item.color,
    item.traits,
    item.description,
    item.quantity,
    item.added_at,
    item.thumbnail || "",
    item.location_zone_id || "",
    item.location_label || "",
  ]
    .map(escapeCSVField)
    .join(",");
}

function writeCSV(items) {
  const body = items.map(rowToCSV).join("\n");
  fs.writeFileSync(CSV_PATH, CSV_HEADER + body, "utf8");
}

// GET — return all inventory items
export async function GET() {
  try {
    ensureCSV();
    const raw = fs.readFileSync(CSV_PATH, "utf8");
    const items = parseCSV(raw);
    return NextResponse.json(items);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST — add a new item
export async function POST(request) {
  try {
    ensureCSV();
    const newItem = await request.json();
    const raw = fs.readFileSync(CSV_PATH, "utf8");
    const items = parseCSV(raw);

    const item = {
      id: newItem.id || String(Date.now()),
      name: newItem.name || "Unknown",
      type: newItem.type || "",
      color: newItem.color || "",
      traits: newItem.traits || "",
      description: newItem.description || "",
      quantity: parseInt(newItem.quantity) || 1,
      added_at: newItem.added_at || new Date().toISOString(),
      thumbnail: newItem.thumbnail || "",
      location_zone_id: newItem.location_zone_id || "",
      location_label: newItem.location_label || "",
    };

    items.push(item);
    writeCSV(items);
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH — update quantity of an existing item
export async function PATCH(request) {
  try {
    ensureCSV();
    const body = await request.json();
    const { id, quantity, location_zone_id, location_label } = body;
    const raw = fs.readFileSync(CSV_PATH, "utf8");
    const items = parseCSV(raw);

    const idx = items.findIndex((it) => it.id === String(id));
    if (idx === -1) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (quantity != null) {
      items[idx].quantity = parseInt(quantity) || items[idx].quantity;
    }
    if (location_zone_id !== undefined) {
      items[idx].location_zone_id = location_zone_id || "";
    }
    if (location_label !== undefined) {
      items[idx].location_label = location_label || "";
    }
    writeCSV(items);
    return NextResponse.json(items[idx]);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE — remove an item by id
export async function DELETE(request) {
  try {
    ensureCSV();
    const { id } = await request.json();
    const raw = fs.readFileSync(CSV_PATH, "utf8");
    const items = parseCSV(raw);

    const filtered = items.filter((it) => it.id !== String(id));
    if (filtered.length === items.length) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    writeCSV(filtered);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
