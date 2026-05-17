import { NextResponse } from "next/server";

// DICT_4X4_50 bit patterns (ids 0–9); extend as needed for printing
const MARKER_BITS = {
  0: [
    [1, 0, 1, 1],
    [1, 1, 0, 1],
    [0, 1, 1, 0],
    [1, 0, 1, 1],
  ],
  1: [
    [1, 1, 0, 1],
    [0, 1, 1, 0],
    [1, 0, 1, 1],
    [0, 1, 0, 1],
  ],
  2: [
    [0, 1, 1, 0],
    [1, 0, 1, 1],
    [1, 1, 0, 1],
    [1, 0, 0, 1],
  ],
  3: [
    [1, 0, 0, 1],
    [1, 1, 1, 0],
    [0, 1, 0, 1],
    [1, 1, 0, 1],
  ],
  4: [
    [0, 1, 0, 1],
    [1, 1, 0, 0],
    [1, 0, 1, 1],
    [0, 1, 1, 1],
  ],
  5: [
    [1, 1, 1, 0],
    [0, 1, 0, 1],
    [1, 0, 0, 1],
    [0, 1, 1, 0],
  ],
  6: [
    [1, 0, 1, 0],
    [0, 0, 1, 1],
    [1, 1, 0, 1],
    [1, 0, 1, 1],
  ],
  7: [
    [0, 0, 1, 1],
    [1, 0, 1, 0],
    [0, 1, 1, 1],
    [1, 1, 0, 0],
  ],
  8: [
    [1, 1, 0, 0],
    [0, 1, 1, 1],
    [1, 0, 0, 1],
    [0, 1, 0, 1],
  ],
  9: [
    [0, 1, 1, 1],
    [1, 0, 0, 0],
    [0, 1, 0, 1],
    [1, 1, 1, 0],
  ],
};

function markerSvg(id, bits, size = 200) {
  const cell = size / 6;
  const inner = bits
    .map((row, yi) =>
      row
        .map((bit, xi) => {
          const fill = bit ? "#000" : "#fff";
          return `<rect x="${(xi + 1) * cell}" y="${(yi + 1) * cell}" width="${cell}" height="${cell}" fill="${fill}"/>`;
        })
        .join("")
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="#fff"/>
    <rect width="${size}" height="${cell}" fill="#000"/>
    <rect width="${size}" height="${cell}" y="${size - cell}" fill="#000"/>
    <rect width="${cell}" height="${size}" fill="#000"/>
    <rect width="${cell}" height="${size}" x="${size - cell}" fill="#000"/>
    ${inner}
    <text x="${size / 2}" y="${size - 8}" text-anchor="middle" font-size="14" font-family="sans-serif">ID ${id}</text>
  </svg>`;
}

function fallbackBits(id) {
  const seed = id * 7919;
  return Array.from({ length: 4 }, (_, y) =>
    Array.from({ length: 4 }, (_, x) => ((seed >> (y * 4 + x)) & 1) === 1)
  );
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get("ids") || "1,2,3,4,5,6";
  const ids = idsParam
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n >= 0 && n < 50);

  const cards = ids
    .map((id) => {
      const bits = MARKER_BITS[id] || fallbackBits(id);
      const svg = markerSvg(id, bits);
      const b64 = Buffer.from(svg).toString("base64");
      return `<div class="card"><img src="data:image/svg+xml;base64,${b64}" alt="Marker ${id}"/><p>ArUco ID ${id} — DICT_4X4_50</p></div>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>ArUco Markers</title>
<style>
body{font-family:system-ui,sans-serif;padding:24px;}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:20px;}
.card{border:1px solid #ccc;padding:12px;text-align:center;border-radius:8px;}
.card img{width:180px;height:180px;}
@media print{.card{page-break-inside:avoid;}}
</style></head>
<body>
<h1>Print ArUco markers (DICT_4X4_50)</h1>
<p>Cut out and tape to walls. Match each ID to a zone in Room Setup.</p>
<p><strong>Note:</strong> For production, generate markers with the same dictionary via 
<a href="https://chev.me/arucogen/">chev.me/arucogen</a> (4x4, 50 markers) and use those IDs.</p>
<div class="grid">${cards}</div>
<script>window.onload=()=>window.print()</script>
</body></html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
