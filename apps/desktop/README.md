# Clutchboard Companion (desktop, v0.1)

Minimal Windows tray app (Electron + TypeScript) that **auto-syncs future
VALORANT matches** so Clutchboard builds per-act history from now on. It does
**not** recover old history.

It does NOT: read game memory, inject DLLs, draw an overlay, touch Vanguard,
use private APIs, scrape, or store Riot tokens in plain text. It only checks
whether VALORANT is running (via `tasklist`) and calls the existing Clutchboard
web endpoints.

## What it does

- Tray icon + small companion window.
- Status: session (Conectado/No conectado), account, VALORANT (Detectado/No
  detectado), Riot client (secondary hint), last sync time, new matches saved,
  matchlist returned, and a clear error line when something fails.
- Buttons: open dashboard, sync now, toggle auto-sync, start with Windows, login.
- Detects `VALORANT.exe` / `VALORANT-Win64-Shipping.exe` as the game signal;
  `RiotClientServices.exe` is only a secondary "launcher open" hint.
- While VALORANT runs: auto-sync at most every 15 min.
- When VALORANT closes (after being open): waits ~2.5 min then syncs once.
- Anti-spam cooldown of 5 min between automatic syncs ("Sincronizar ahora" is
  always available and ignores the cooldown).
- Windows notification when new matches were saved.

## Errors

- Not logged in (`/api/me` → not authenticated, or sync → 401): shows
  "Inicia sesión en Clutchboard" + the login button.
- Sync fails: shows a clear message, never crashes.
- Rate limited (429): shows "Riot limitó temporalmente las peticiones. Prueba
  más tarde." and stops retrying (cooldown).

## Auth (v0.1)

No native OAuth. "Iniciar sesión en Clutchboard" opens an in-app window to
`/login`. After you log in there, Electron's session holds the httpOnly session
cookie, and API calls (`net.fetch`, `credentials: include`) reuse it. We never
read or store Riot tokens.

## Endpoints used

- `GET /api/me` — session check.
- `POST /api/valorant/sync-history` (`{ mode: "recent" }`) — sync.

## Logs

Plain, secret-free event log at `%APPDATA%/Clutchboard Companion/companion.log`
(and the console): `app_started`, `valorant_detected`, `valorant_closed`,
`sync_started`, `sync_success`, `sync_failed`, `sync_skipped_cooldown`,
`open_dashboard`, `login_opened`. Never logs tokens, cookies, DATABASE_URL,
Riot API key or any secret.

## Develop

```bash
cd apps/desktop
npm install            # electron, esbuild, typescript (separate from the web app)
npm run dev            # bundle + launch Electron
npm run typecheck      # tsc --noEmit
npm run build          # typecheck + esbuild bundle -> dist/
npm run dist           # electron-builder -> Windows installer + portable .exe
```

Point at a local web server during development:

```bash
CLUTCHBOARD_URL=http://localhost:3000 npm run dev
```

### Testing VALORANT detection without playing

Detection is by process name. To simulate, rename any small executable to
`VALORANT-Win64-Shipping.exe` and run it (or just launch VALORANT). The
companion flips "VALORANT: Detectado" within ~30s and arms the auto-sync /
close-sync logic. Killing the process triggers `valorant_closed` and a sync
~2.5 min later.

### `npm run dist` note

`electron-builder` extracts a code-signing toolchain that contains symlinks. On
Windows this needs **Developer Mode enabled** (Settings → Privacy & security →
For developers) or an **elevated terminal**; otherwise extraction fails with
"Cannot create symbolic link". `npm run build` (bundle) does not need this.

## v0.1 limitations

- Windows only (process detection via `tasklist`).
- Only syncs *future* matches Riot returns in the matchlist; does not recover
  old history.
- No native OAuth (login via in-app web window).
- No overlay, no in-game features.

## Isolation from the web app

Self-contained under `apps/desktop` with its own `package.json`/`tsconfig`/
`node_modules`. The web app excludes `apps/**` from its TypeScript and ESLint
config, so the root `npm run build` / `lint` / `test` are unaffected.
