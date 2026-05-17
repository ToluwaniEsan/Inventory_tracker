import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const ROOM_DIR = path.join(process.cwd(), "data", "room");
const ALLOWED_EXT = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

function ensureRoomDir() {
  if (!fs.existsSync(ROOM_DIR)) fs.mkdirSync(ROOM_DIR, { recursive: true });
}

function contentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const map = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
  };
  return map[ext] || "application/octet-stream";
}

// GET ?file=floorplan.jpg — serve room image
export async function GET(request) {
  try {
    ensureRoomDir();
    const { searchParams } = new URL(request.url);
    const file = searchParams.get("file");
    if (!file) {
      return NextResponse.json({ error: "file query param required" }, { status: 400 });
    }

    const safeName = path.basename(file);
    if (safeName !== file || safeName.includes("..")) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    const filePath = path.join(ROOM_DIR, safeName);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const buffer = fs.readFileSync(filePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType(safeName),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST multipart — upload floor plan (field: file)
export async function POST(request) {
  try {
    ensureRoomDir();
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const originalName = file.name || "floorplan.jpg";
    const ext = path.extname(originalName).toLowerCase() || ".jpg";
    if (!ALLOWED_EXT.includes(ext)) {
      return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
    }

    const filename = `floorplan${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(path.join(ROOM_DIR, filename), bytes);

    return NextResponse.json({ filename });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
