# Clutchboard Companion (desktop, v0.1)

Minimal Windows tray app (Electron + TypeScript) that **auto-syncs future
VALORANT matches** so Clutchboard builds per-act history from now on. It does
**not** recover old history.

It does NOT: read game memory, inject DLLs, draw an overlay, use private APIs,
scrape, or store Riot tokens in plain text. It only checks whether VALORANT is
running (via `tasklist`) and calls the existing Clutchboard web endpoints.

## What it does

- Tray icon + small companion window.
- Buttons: open dashboard, sync now, toggle auto-sync, start with Windows, login.
- Detects `VALORANT.exe` / `VALORANT-Win64-Shipping.exe`.
- While VALORANT is running, auto-syncs every 15 min.
- When VALORANT closes (after being open), waits ~2.5 min then syncs once.
- Windows notification when new matches were saved.

## Auth (v0.1)

No native OAuth. "Iniciar sesión en Clutchboard" opens an in-app window to
`/login`. After you log in there, Electron's session holds the httpOnly session
cookie, and API calls (`net.fetch`, `credentials: include`) reuse it. We never
read or store the Riot tokens ourselves.

## Endpoints used

- `GET /api/me` — session check.
- `POST /api/valorant/sync-history` (`{ mode: "recent" }`) — sync.

## Develop

```bash
cd apps/desktop
npm install          # installs electron, esbuild, typescript (separate from the web app)
npm run dev          # bundles + launches Electron
```

Point at a local web server during development:

```bash
CLUTCHBOARD_URL=http://localhost:3000 npm run dev
```

Other scripts: `npm run typecheck`, `npm run build`, `npm run dist` (electron-builder, Windows NSIS).

## Isolation from the web app

This package is self-contained under `apps/desktop` with its own
`package.json`/`tsconfig`/`node_modules`. The web app excludes `apps/**` from its
TypeScript and ESLint config, so `npm run build`/`lint`/`test` at the repo root
are unaffected.
