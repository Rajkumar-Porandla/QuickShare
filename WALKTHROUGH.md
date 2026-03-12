# 🎮 DexPop — Project Walkthrough

> **Instant text & file sharing. No accounts. No friction.**
> A full-stack Node.js app with a retro NES terminal aesthetic.

---

## Table of Contents

1. [What is DexPop?](#1-what-is-dexpop)
2. [Project Evolution — V1 → V2](#2-project-evolution--v1--v2)
3. [Architecture Overview](#3-architecture-overview)
4. [File Structure](#4-file-structure)
5. [Backend Deep Dive — server.js](#5-backend-deep-dive--serverjs)
6. [Frontend Deep Dive](#6-frontend-deep-dive)
7. [Design System — The Retro Aesthetic](#7-design-system--the-retro-aesthetic)
8. [Data Flow Walkthrough](#8-data-flow-walkthrough)
9. [Deployment — Vercel Config](#9-deployment--vercel-config)
10. [What We Built & Why](#10-what-we-built--why)

---

## 1. What is DexPop?

**DexPop** (formerly **Quick Share**) is a zero-signup, ephemeral sharing tool. You can:

| Feature       | How it Works                                              |
|---------------|-----------------------------------------------------------|
| 📝 Share Text  | Paste text → get a 6-char code → share it                |
| 🖼 Share Image | Upload image → get a code → recipient sees a preview     |
| 📁 Share File  | Upload any file (≤10MB) → get a code → recipient downloads |
| ⏱ Auto-expiry | All data deletes itself after **30 minutes**              |

Everything runs on a **single Node.js Express server** that hosts both the API and the static frontend.

---

## 2. Project Evolution — V1 → V2

### V1: Quick Share (`/QuickShare`)
The original version — clean, functional, minimal.

- **Font**: Google Inter (modern, clean)
- **Theme**: Light neutral UI
- **Name**: "Quick Share"
- **Style**: Basic CSS, utilitarian design
- **Server**: No Vercel support, no inline preview endpoint, simpler multer config

```
QuickShare/
├── server.js         ← Basic Express API (multer v1)
├── public/
│   ├── index.html    ← Inter font, plain UI
│   ├── style.css     ← ~5KB minimal CSS
│   └── app.js        ← Core JS logic
└── test_simulation.js ← Manual API test script
```

### V2: DexPop (`/quick-share`) ← **Current Production**
A complete visual overhaul + backend hardening.

**What changed:**

| Area             | V1 Quick Share           | V2 DexPop                          |
|------------------|--------------------------|------------------------------------|
| **Name**         | Quick Share              | DexPop                             |
| **Font**         | Inter (Google Fonts)     | Press Start 2P (pixel/retro)       |
| **Theme**        | Neutral clean UI         | NES Terminal — phosphor green + gold |
| **CSS size**     | ~5KB                     | ~20KB (full design system)         |
| **CSS tokens**   | None                     | Fibonacci spacing + golden ratio type scale |
| **Toast system** | Browser `alert()`        | Custom pixel-art toast with progress bar |
| **Image preview**| No inline preview        | `/preview` endpoint streams inline |
| **File info**    | Not available            | `/info` endpoint returns metadata  |
| **Upload dir**   | Always `./uploads`       | `/tmp/uploads` on Vercel, `./uploads` locally |
| **Vercel support**| No                      | Yes — `vercel.json` + conditional export |
| **multer version**| v1.4.x               | v2.0.0                             |
| **Favicon**      | None                     | Custom pixel art favicon.png       |
| **Scanlines**    | None                     | CSS `body::after` overlay          |
| **Responsive**   | Basic                    | `@media ≤ 500px` with adjusted type |

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                          BROWSER                             │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  index.html + style.css              │    │
│  │              (Press Start 2P · Retro UI)             │    │
│  │                                                      │    │
│  │   ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │    │
│  │   │ TEXT tab │  │IMAGE tab │  │   FILE tab       │  │    │
│  │   └──────────┘  └──────────┘  └──────────────────┘  │    │
│  │                    app.js                            │    │
│  └──────────────────────┬──────────────────────────────┘    │
│                         │ fetch() API calls                  │
└─────────────────────────┼───────────────────────────────────┘
                          │ HTTP / REST
┌─────────────────────────▼───────────────────────────────────┐
│                     NODE.JS SERVER                           │
│                  Express — server.js                         │
│                                                              │
│   ┌────────────────────────────────────────────────────┐    │
│   │                  MIDDLEWARE STACK                   │    │
│   │  cors()  →  express.json()  →  express.static()    │    │
│   └────────────────────────────────────────────────────┘    │
│                                                              │
│   ┌─────────────────────┐   ┌──────────────────────────┐   │
│   │   TEXT ENDPOINTS    │   │   FILE ENDPOINTS         │   │
│   │                     │   │                          │   │
│   │ POST /api/share/text│   │ POST /api/share/file     │   │
│   │ GET  /api/share/    │   │ GET  /api/share/file/:id │   │
│   │      text/:code     │   │ GET  /api/share/file/:id │   │
│   └─────────────────────┘   │      /info               │   │
│                              │ GET  /api/share/file/:id │   │
│                              │      /preview            │   │
│                              └──────────────────────────┘   │
│                                                              │
│   ┌─────────────────┐    ┌────────────────────────────┐    │
│   │  IN-MEMORY STORE│    │   DISK STORAGE (multer)    │    │
│   │                 │    │                            │    │
│   │ Map: textStorage│    │  /uploads (local)          │    │
│   │ Map: fileMetadata    │  /tmp/uploads (Vercel)     │    │
│   │                 │    │                            │    │
│   │  code → {       │    │  UUID-named files          │    │
│   │    text,        │    │  Max 10MB per file         │    │
│   │    expiresAt    │    │                            │    │
│   │  }              │    └────────────────────────────┘    │
│   └─────────────────┘                                       │
│                                                              │
│   ┌────────────────────────────────────────────────────┐    │
│   │       CLEANUP JOB — runs every 60 seconds          │    │
│   │  Sweeps textStorage + fileMetadata for expired     │    │
│   │  entries; deletes files from disk automatically    │    │
│   └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. File Structure

```
quick-share/                      ← V2 DexPop (production)
├── server.js                     ← Express backend (all API logic)
├── package.json                  ← Dependencies + npm scripts
├── vercel.json                   ← Vercel serverless deployment config
├── .gitignore
├── uploads/                      ← Temp file storage (auto-cleaned)
└── public/                       ← Static frontend (served by Express)
    ├── index.html                ← App shell + tab structure
    ├── style.css                 ← Full retro design system (~753 lines)
    ├── app.js                    ← All frontend logic (~300 lines)
    └── favicon.png               ← Custom pixel art icon

QuickShare/                       ← V1 Quick Share (original)
├── server.js                     ← Simpler backend
├── package.json
├── test_simulation.js            ← API test runner
├── uploads/
└── public/
    ├── index.html                ← Inter font, plain UI
    ├── style.css                 ← Minimal CSS
    └── app.js                    ← Core JS (no toast, fewer endpoints)
```

---

## 5. Backend Deep Dive — `server.js`

### 5.1 Dependencies

```js
const express = require('express');  // Web framework
const cors    = require('cors');     // Cross-origin requests
const multer  = require('multer');   // Multipart file upload
const { v4: uuidv4 } = require('uuid'); // Unique file names
const path    = require('path');     // Cross-platform paths
const fs      = require('fs');       // File system ops
```

### 5.2 In-Memory Storage

The app uses two JavaScript `Map` objects — no database needed:

```js
const textStorage  = new Map(); // code → { text, expiresAt }
const fileMetadata = new Map(); // code → { filename, originalName, mimeType, size, expiresAt }
```

**Why a Map?** Fast O(1) lookups by code. Perfectly sized for ephemeral data.
**Tradeoff:** Data is lost on server restart (fine for 30-min ephemeral sharing).

### 5.3 Upload Directory Logic

```js
const UPLOAD_DIR = process.env.VERCEL
  ? '/tmp/uploads'           // Vercel: only /tmp is writable
  : path.join(__dirname, 'uploads'); // Local: project folder
```

This conditional ensures the app works in **both local dev and Vercel serverless** environments.

### 5.4 Code Generation

```js
function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
// Example output: "A3XK9P"
```

Produces a **6-character alphanumeric** code. Simple, human-typeable, collision probability is extremely low for short-live data.

### 5.5 Auto-Cleanup Job

```js
setInterval(() => {
  const now = Date.now();
  // Sweep text entries
  for (const [code, data] of textStorage.entries()) {
    if (now > data.expiresAt) textStorage.delete(code);
  }
  // Sweep file entries + delete from disk
  for (const [code, data] of fileMetadata.entries()) {
    if (now > data.expiresAt) {
      deleteFile(data.filename);
      fileMetadata.delete(code);
    }
  }
}, 60 * 1000); // Every 60 seconds
```

### 5.6 API Endpoints Summary

| Method | Route                          | Description                        |
|--------|--------------------------------|------------------------------------|
| POST   | `/api/share/text`              | Store text, return code            |
| GET    | `/api/share/text/:code`        | Retrieve text by code              |
| POST   | `/api/share/file`              | Upload file, return code           |
| GET    | `/api/share/file/:code`        | Download file (triggers download)  |
| GET    | `/api/share/file/:code/info`   | Get file metadata (no download)    |
| GET    | `/api/share/file/:code/preview`| Stream file inline (for images)    |
| GET    | `*`                            | Serve `index.html` (SPA fallback)  |

### 5.7 Vercel Serverless Export

```js
if (process.env.VERCEL) {
  module.exports = app;  // Export as serverless function handler
} else {
  app.listen(PORT, () => { ... }); // Run as traditional server locally
}
```

---

## 6. Frontend Deep Dive

### 6.1 `index.html` — Structure

Three-tab layout, each section independently handles its own share + retrieve flow:

```
body
└── .app-container
    ├── <header>         ← "DexPop" title + tagline
    ├── <nav.tabs>       ← TEXT | IMAGE | FILE tab buttons
    └── <main>
        ├── #text-tab    ← Textarea → Generate Code → Retrieve section
        ├── #image-tab   ← Drop zone → Upload → Preview → Retrieve
        └── #file-tab    ← Drop zone → Upload → File info → Retrieve
```

### 6.2 `app.js` — Frontend Logic Sections

| Section              | Lines    | What it does                                    |
|----------------------|----------|-------------------------------------------------|
| Toast System         | 1–27     | IIFE that injects `#toast-container` into body  |
| Tab Switching        | 29–40    | Click handlers that toggle `.active` class      |
| Text Sharing         | 42–107   | POST text, show code, retrieve text by code     |
| Image Sharing        | 109–168  | Upload image, show code, retrieve image preview |
| File Sharing         | 170–229  | Upload file, show code, retrieve file info      |
| Utilities            | 231–299  | `setupDragAndDrop`, `uploadFile`, `setLoading`, `formatBytes`, copy buttons |

### 6.3 Toast Notification System

Custom retro toast — no libraries:

```js
window.showToast = function(message, type = 'info') {
  // Creates a div with class toast toast-{type}
  // Adds a data-prefix (// info, // ok, // err)
  // Appends animated progress bar
  // Auto-removes after 3000ms with fade
};
```

Toast types:
- `info` → gold left border + `// info` prefix
- `success` → green left border + `// ok` prefix
- `error` → red left border + `// err` prefix

### 6.4 Drag-and-Drop Upload

```js
function setupDragAndDrop(zone, input) {
  zone.addEventListener('click', () => input.click());   // Trigger file picker
  zone.addEventListener('dragover', ...);                 // Highlight zone
  zone.addEventListener('dragleave', ...);                // Un-highlight
  zone.addEventListener('drop', (e) => {
    input.files = e.dataTransfer.files;                  // Inject dragged files
    input.dispatchEvent(new Event('change'));             // Trigger listener
  });
}
```

---

## 7. Design System — The Retro Aesthetic

### Design Philosophy
> "1990s NES Terminal / Phosphor CRT"
> 4 colors. Zero border-radius. Fibonacci spacing. Pixel font.

### Color Palette (4 colors)

| Token          | Value     | Use                          |
|----------------|-----------|------------------------------|
| `--c-void`     | `#0C0C0C` | Background — near black      |
| `--c-surface`  | `#161616` | Card / panel surface         |
| `--c-border`   | `#2A2A2A` | Quiet borders                |
| `--c-text`     | `#D0CCB8` | Warm phosphor off-white      |
| `--c-dim`      | `#545046` | Muted secondary text         |
| `--c-green`    | `#4D7A5A` | NES muted forest green       |
| `--c-green-hi` | `#6A9C78` | Active/hover green           |
| `--c-gold`     | `#B89840` | Amber arcade gold (headings) |
| `--c-gold-hi`  | `#D4B050` | Hover gold                   |

### Fibonacci Spacing Scale

```css
--s1: 5px;   --s2: 8px;   --s3: 13px;
--s4: 21px;  --s5: 34px;  --s6: 55px;
```

Every margin, padding, and gap is a Fibonacci number — creates harmonic rhythm.

### Golden Ratio Type Scale

```
Base 10px × 1.618 (φ) = 16px × 1.618 = 26px
```

```css
--t-xs: 9px;    /* labels, footer        */
--t-sm: 10px;    /* body, inputs          */
--t-md: 11px;    /* section text          */
--t-lg: 13px;    /* section heads         */
--t-xl: 16px;    /* code display          */
--t-2xl: 22px;   /* hero title            */
--t-code: 26px;  /* share code digits     */
```

### Special Visual Effects

```css
/* CRT Scanlines overlay */
body::after {
  background: repeating-linear-gradient(
    to bottom,
    transparent 0, transparent 3px,
    rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px
  );
  position: fixed; inset: 0;
  pointer-events: none; z-index: 9999;
}

/* Blinking footer text */
.footer-text {
  animation: blink 1.4s step-end infinite;
}

/* Press-down button feel */
.primary-btn:active {
  top: 3px;
  border-bottom-width: 0;
}
```

---

## 8. Data Flow Walkthrough

### Sharing Text

```
User types text → clicks "Generate Code"
    ↓
app.js: POST /api/share/text  { text: "Hello World" }
    ↓
server.js:
  → generates code "A3XK9P"
  → stores in textStorage Map: "A3XK9P" → { text, expiresAt: now+30min }
  → returns { code: "A3XK9P", expiresAt }
    ↓
app.js: displays code in gold pixel font
```

### Retrieving Text

```
User enters code "A3XK9P" → clicks "Get Text"
    ↓
app.js: GET /api/share/text/A3XK9P
    ↓
server.js:
  → looks up textStorage.get("A3XK9P")
  → if found and not expired → returns { text: "Hello World" }
    ↓
app.js: displays text in retrieved box
```

### Uploading & Sharing a File

```
User drops file on zone
    ↓
app.js: POST /api/share/file (FormData with file)
    ↓
server.js (multer):
  → saves file as UUID filename e.g. "a1b2c3d4.jpg"
  → stores metadata in fileMetadata Map
  → returns { code: "X9KPQ2", originalName }
    ↓
Recipient: GET /api/share/file/X9KPQ2/info → get metadata
           GET /api/share/file/X9KPQ2/preview → view image inline
           GET /api/share/file/X9KPQ2 → download file
```

---

## 9. Deployment — Vercel Config

```json
{
  "version": 2,
  "rewrites": [
    { "source": "/(.*)", "destination": "/server.js" }
  ]
}
```

All routes are rewritten to `server.js`, which is treated as a **serverless function** on Vercel. The `module.exports = app` line (when `process.env.VERCEL` is set) enables this.

**Key Vercel constraint handled:**
- Only `/tmp` is writable on Vercel → `UPLOAD_DIR` switches to `/tmp/uploads` automatically

---

## 10. What We Built & Why

### Phase 1 — Core MVP (`QuickShare` V1)
- Built the Express backend with text + file sharing APIs
- In-memory storage with auto-expiry (no database overhead)
- Multer for multipart uploads, UUID for unique filenames
- Clean minimal frontend with Inter font
- Added `/api/share/file/:code/info` endpoint so the UI could show metadata without forcing a download

### Phase 2 — DexPop Retro Redesign (`quick-share` V2)
- **Complete UI overhaul** to a retro NES terminal aesthetic
- Implemented `Press Start 2P` pixel font throughout
- Created a full design system with CSS custom properties:
  - Fibonacci spacing scale
  - Golden ratio type scale
  - 4-color phosphor palette
- Added CRT scanline overlay via `body::after` pseudo-element
- Built custom pixel-art toast notification system (replaced browser alerts)
- Added `/api/share/file/:code/preview` endpoint for inline image streaming
- Added Vercel serverless deployment support (`vercel.json` + conditional `module.exports`)
- Upgraded multer to `v2.0.0`
- Added compression dependency
- Created custom pixel art `favicon.png`
- Added blinking footer text animation
- Added press-down button animation (3px `border-bottom` shadow)
- Renamed app to **DexPop**

### Phase 3 — Bug Fix & Launch
- Diagnosed `EADDRINUSE: port 3000` error (orphan process from previous crash)
- Killed zombie process with `lsof -ti :3000 | xargs kill -9`
- Successfully relaunched server
- Confirmed UI loads in Chrome at `http://localhost:3000`

---

## Quick Start

```bash
# Install dependencies
cd quick-share
npm install

# Run locally
node server.js
# → Server running on http://localhost:3000

# Or with auto-reload
npm run dev
```

**App runs at:** [http://localhost:3000](http://localhost:3000)

---

*Built with Node.js · Express · Multer · Vanilla JS · CSS — No frameworks, no database, no signup.*
