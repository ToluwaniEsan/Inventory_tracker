# Vision Inventory

An AI-powered inventory tracker that uses Claude's vision to scan, identify, and track objects — with a local CSV as the database.

## Features

- **Camera scanning** — point at any object and hit Scan
- **Image upload** — works with photo uploads too
- **AI object detection** — identifies name, type, color, and unique traits
- **Smart recognition** — if you scan the same object again, it matches it to the existing record by comparing characteristics (color, type, traits)
- **Local CSV database** — all data lives in `data/inventory.csv`, no cloud needed
- **Export** — download your inventory as a CSV at any time

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

## Project Structure

```
app/
  page.js                   # Main UI — scan + inventory tabs
  layout.js                 # App shell
  globals.css               # Base styles
  page.module.css           # Main page styles
  components/
    Scanner.js              # Camera / upload / capture component
    Scanner.module.css
  api/
    scan/route.js           # POST — calls Claude Vision API (server-side)
    inventory/route.js      # GET / POST / PATCH / DELETE — reads/writes CSV

data/
  inventory.csv             # Local inventory database
```

## How the AI matching works

Every scan sends the image to Claude with the full inventory list. Claude:
1. Identifies the object (name, type, color, 2–4 unique traits, description)
2. Compares against every existing item and returns a `match_id` if it recognises the same object

Matching looks at type + color + traits together — so a red apple and a green apple remain separate records.

## Deploying to Vercel

Add `ANTHROPIC_API_KEY` as an environment variable in your Vercel project settings, then push to GitHub as normal. Note: the CSV file is written to the server filesystem — on Vercel (serverless) this resets between deployments. For persistent production use, swap the CSV for a database like Supabase or PlanetScale.
