# Vision Inventory

An AI-powered inventory tracker that uses Claude's vision to scan, identify, and track objects — with spatial storage mapping via floor plans, ArUco markers, and a 2D/3D map view.

## Features

- **Camera scanning** — point at any object and hit Scan
- **Image upload** — works with photo uploads too
- **AI object detection** — identifies name, type, color, and unique traits
- **Smart recognition** — matches returning objects by type, color, and traits
- **Spatial mapping** — upload a floor plan, place zone pins, link ArUco marker IDs
- **ArUco location** — scans detect visible markers and attach storage zones automatically
- **Map tab** — view items by zone on the floor plan; optional 3D room preview
- **3D object models (stretch)** — upload front/back/side photos to generate a simple box model
- **Local CSV database** — inventory in `data/inventory.csv`, zones in `data/zones.json`
- **Export** — download inventory CSV including location columns

## Getting Started

### 1. Clone and install

```bash
npm install
```

### 2. Set your API key

Copy `.env.local.example` to `.env.local` and add your Anthropic API key:

```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxx
```

Get a key at https://console.anthropic.com

### 3. Run locally

```bash
npm run dev
```

Open http://localhost:3000

## Room setup & markers

1. Open the **Map** tab → **Edit layout**
2. Upload a floor plan image
3. Click the plan to place zone pins; set labels and ArUco marker IDs
4. Use **Print markers** to open a printable sheet (DICT_4X4_50). For best detection, also generate markers at [chev.me/arucogen](https://chev.me/arucogen) (4×4, 50 markers) and use matching IDs in zone setup
5. Tape markers on walls in the storage room
6. When scanning, keep a marker visible in frame for automatic location, or pick a zone manually

## Project Structure

```
app/
  page.js                     # Main UI — Scan, Inventory, Map tabs
  components/
    Scanner.js                # Camera / upload + ArUco detection
    FloorPlanCanvas.js        # Interactive floor plan pins
    RoomSetup.js              # Zone & floor plan configuration
    MapView.js                # Map view + 3D preview toggle
    RoomPreview3D.js          # Three.js room preview
    ObjectReconstruct.js      # 3D box model from 3 photos
  api/
    scan/route.js             # Claude Vision object ID
    scan/reconstruct/route.js # Claude Vision dimensions + textures
    inventory/route.js        # CSV CRUD (includes location columns)
    zones/route.js            # zones.json CRUD
    room/route.js             # Floor plan image upload/serve
    markers/generate/route.js   # Printable ArUco marker sheet
  lib/
    arucoDetect.js            # OpenCV.js ArUco (browser)
    zones.js                  # Zone lookup helpers

data/
  inventory.csv               # Items + location_zone_id, location_label
  zones.json                  # Floor plan filename + zone pins
  room/                       # Uploaded floor plan images
```

## Deploying to Vercel

Add `ANTHROPIC_API_KEY` in Vercel project settings.

**Persistence:** Inventory, zones, and room images are stored on the server filesystem. On Vercel (serverless), writes are **ephemeral** and reset between deployments. For production, migrate to [Supabase](https://supabase.com) (Postgres + Storage) or Vercel Blob.

## How the AI matching works

Every scan sends the image to Claude with the full inventory list. Claude identifies the object and returns a `match_id` when it recognises the same item (type + color + traits). Location comes from **ArUco markers** or **manual zone selection**, not from Claude.
