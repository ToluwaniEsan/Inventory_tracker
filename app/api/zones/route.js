import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const ZONES_PATH = path.join(process.cwd(), "data", "zones.json");

const DEFAULT_ZONES = {
  version: 1,
  floorPlan: "",
  zones: [],
};

function ensureZones() {
  const dir = path.dirname(ZONES_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(ZONES_PATH)) {
    fs.writeFileSync(ZONES_PATH, JSON.stringify(DEFAULT_ZONES, null, 2), "utf8");
  }
}

function readZones() {
  ensureZones();
  const raw = fs.readFileSync(ZONES_PATH, "utf8");
  const data = JSON.parse(raw);
  return {
    version: data.version ?? 1,
    floorPlan: data.floorPlan ?? "",
    zones: Array.isArray(data.zones) ? data.zones : [],
  };
}

function writeZones(data) {
  ensureZones();
  const payload = {
    version: 1,
    floorPlan: data.floorPlan ?? "",
    zones: Array.isArray(data.zones) ? data.zones : [],
  };
  fs.writeFileSync(ZONES_PATH, JSON.stringify(payload, null, 2), "utf8");
  return payload;
}

export async function GET() {
  try {
    return NextResponse.json(readZones());
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const zones = body.zones ?? [];

    for (const z of zones) {
      if (!z.id || !z.label) {
        return NextResponse.json(
          { error: "Each zone requires id and label" },
          { status: 400 }
        );
      }
    }

    const markerIds = zones
      .map((z) => z.markerId)
      .filter((id) => id != null && id !== "");
    const unique = new Set(markerIds);
    if (unique.size !== markerIds.length) {
      return NextResponse.json(
        { error: "Duplicate marker IDs are not allowed" },
        { status: 400 }
      );
    }

    const saved = writeZones({
      floorPlan: body.floorPlan ?? "",
      zones: zones.map((z) => ({
        id: String(z.id),
        markerId: z.markerId != null && z.markerId !== "" ? Number(z.markerId) : null,
        label: String(z.label),
        x: typeof z.x === "number" ? z.x : 0.5,
        y: typeof z.y === "number" ? z.y : 0.5,
      })),
    });

    return NextResponse.json(saved);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
