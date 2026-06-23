# Clutchboard

Clutchboard is a full-stack personal VALORANT analytics app built around a single player account, prepared for Riot RSO, official VALORANT APIs, and a realistic demo/mock mode while production approval is pending.

## Stack

- Next.js 16 App Router + TypeScript
- Tailwind CSS v4 + shadcn/ui
- PostgreSQL + Prisma
- Redis / Upstash for caching and rate limiting
- TanStack Query
- Recharts
- Zod
- Vitest + Playwright

## Structure

```text
src/
  app/                 App Router routes and API endpoints
  components/          Shell, charts, and reusable UI
  features/            Product-facing domain modules
  lib/                 Env, logger, redis, rate-limit, providers
  server/              Auth, repositories, services, and API helpers
  integrations/riot/   Riot client, DTOs, validation, and mock/real adapters
  analytics/           Derived formulas and improvement engine
  database/            Lazy Prisma client
  types/               Domain and Riot types
tests/
  unit/
  integration/
  e2e/
prisma/
  schema.prisma
```

## Requirements

- Node.js 20+
- npm 10+
- PostgreSQL if you want real persistence
- Redis/Upstash optionally for distributed cache and shared rate limiting
- Riot production credentials if you want real RSO mode

## Environment variables

Use `.env.example` as your template.

Main keys:

- `ENABLE_MOCK_RIOT=true`: enables demo mode with a coherent fake dataset
- `APP_SESSION_SECRET`: secret used to sign the app session
- `DATABASE_URL`: PostgreSQL connection string
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`: cache and rate limit
- `RIOT_API_KEY`: official Riot API key
- `RIOT_RSO_CLIENT_ID`, `RIOT_RSO_CLIENT_SECRET`, `RIOT_RSO_REDIRECT_URI`: RSO
- `RIOT_RSO_POST_LOGOUT_REDIRECT_URI`: where users return after logout
- `RIOT_REGION`, `RIOT_PLATFORM`: Riot routing

Security notes:

- Never commit `.env`, `.env.local`, API keys, client secrets, or tokens.
- If a key was exposed in terminal logs, rotate it immediately in Riot Developer Portal.
- Use `.env.example` as a placeholder-only template.

## Riot RSO submission URLs

Use your own app domain for legal pages and callbacks (never auth.riotgames.com URLs):

- Privacy Policy URL: `https://clutchboard-alpha-ten.vercel.app/privacidad`
- Terms of Service URL: `https://clutchboard-alpha-ten.vercel.app/terms`
- Redirect URI: `https://clutchboard-alpha-ten.vercel.app/api/auth/riot/callback`
- Post-logout redirect URI: `https://clutchboard-alpha-ten.vercel.app/login`

Local development URIs (optional extra entries in Riot console):

- `http://localhost:3000/api/auth/riot/callback`
- `http://localhost:3000/login`

Checklist before requesting/finishing RSO approval:

- Pages `/privacidad` and `/terms` are publicly reachable.
- Login page shows a visible opt-in policy notice.
- `ENABLE_MOCK_RIOT=false` in real mode.
- `RIOT_RSO_REDIRECT_URI` exactly matches a registered callback.

Behavior while RSO Client is pending approval:

- App loads normally.
- Login page remains accessible.
- Mock mode works with `ENABLE_MOCK_RIOT=true`.
- Real login path degrades with a clear `rso_not_configured` message when missing `RIOT_RSO_CLIENT_ID` or `RIOT_RSO_CLIENT_SECRET`.

## Local setup

```bash
npm install
npm run prisma:generate
npm run dev
```

With PostgreSQL:

```bash
npm run db:push
```

## Riot authentication flow

### Real mode

1. The user clicks "Iniciar sesion con Riot".
2. `/api/auth/riot/login` generates `state` and redirects to `https://auth.riotgames.com/authorize`.
3. Riot returns to `/api/auth/riot/callback`.
4. The app validates `state`.
5. The app exchanges `code` for tokens.
6. The app calls `/riot/account/v1/accounts/me` with `Bearer access_token`.
7. The app creates its own signed session and optionally stores it in the database.

### Mock mode

1. The user enters through `/api/auth/riot/login`.
2. The app uses the mock adapter.
3. The app creates a secure local session.
4. The app loads the demo dataset and derived analytics.

## How to enable mock mode

```env
ENABLE_MOCK_RIOT=true
APP_SESSION_SECRET=dev-secret
```

Optional for auto-demo flows:

```env
DEMO_AUTO_LOGIN=true
```

## Useful scripts

```bash
npm run dev
npm run build
npm run lint
npm run test
npm run test:e2e
npm run prisma:generate
npm run db:push
```

## Deploy

### Vercel

- Configure all required environment variables.
- Add managed PostgreSQL and Redis if needed.
- Make sure the Riot redirect URI points to your final domain.

Quick start:

```bash
npm i -g vercel
vercel login
vercel
```

Production deploy:

```bash
vercel --prod
```

Minimum variables for an online demo:

- `NEXT_PUBLIC_APP_URL`
- `APP_SESSION_SECRET`
- `ENABLE_MOCK_RIOT=true`

Minimum variables for real Riot mode:

- `NEXT_PUBLIC_APP_URL`
- `APP_SESSION_SECRET`
- `ENABLE_MOCK_RIOT=false`
- `RIOT_API_KEY`
- `RIOT_RSO_CLIENT_ID`
- `RIOT_RSO_CLIENT_SECRET`
- `RIOT_RSO_REDIRECT_URI`

Healthcheck:

- `GET /api/health`

### Docker

- Use `npm run build` followed by `npm run start`.
- Inject secrets through environment variables.
- Keep Prisma and Redis outside the container if you want stable persistence.

Build and run:

```bash
docker build -t clutchboard .
docker run -p 3000:3000 --env-file .env.local clutchboard
```

## Current limitations

- Real mode requires a Riot `Production API Key` and RSO approval.
- Refresh token rotation is not implemented yet as a dedicated worker.
- Match persistence is not yet a complete ETL into every Prisma table; demo mode is still the most robust path for UI and analytics.
- Some advanced metrics depend on `roundResults` and do not always allow perfect tactical reconstruction.

## Recommended next steps

- Add a real incremental sync queue by PUUID.
- Persist snapshots and cached responses after each sync.
- Implement RSO token refresh and coordinated expiration.
- Add advanced filters by date, map, agent, and queue.
- Complete observability with tracing and OpenTelemetry.

## REAL API LIMITATIONS AND PRODUCT DECISIONS

### What data is official

- `RSO/OAuth`: player authentication through Riot Sign On
- `/riot/account/v1/accounts/me`: official authenticated account identity
- `VAL-CONTENT-V1`: official agents, maps, acts, and metadata
- `VAL-MATCH-V1`: matchlist by `puuid` and match detail
- `VAL-RANKED-V1`: leaderboard by act
- `VAL-STATUS-V1`: platform status

### What data is derived

- `ACS estimate`
- `headshot %`
- `clutches`
- `comfort picks`
- `consistency score`
- `impact score`
- `momentum`
- `recent delta vs baseline`
- `fatigue score`
- `agent pool concentration`
- `stability score`
- `improvement score`
- every insight in the "Mejora" section

Each derived metric is calculated from normalized match data and documented in `src/analytics/formulas.ts`.

### What depends on RSO and production approval

- Real Riot login
- Real access to personal VALORANT player data
- Use of RSO client ID and client secret
- Public launch for real player accounts

### Riot policy boundaries in this product

Allowed:

- Personal player analytics.
- Own-match history and post-match insights.
- Coaching recommendations between matches.
- Data visibility only for opted-in/registered users.

Not allowed:

- Pre-match opponent scouting.
- Real-time overlays that give in-game advantage.
- Live tactical assistance during matches.
- Private player data exposure without consent.

Riot documents that VALORANT apps working with personal player data must use `RSO`, and that this access requires `Production Level API Keys` and official RSO client approval.

### What cannot be known precisely

- A player's true absolute impact on the match result
- Exact tactical quality of utility usage, spacing, timing, or trade discipline
- Real psychological tilt; the app can only infer progressive performance degradation
- Perfect clutch or first-death reconstruction when the official payload is incomplete
- Exact official ACS if the endpoint does not expose it directly; in Clutchboard it is labeled as `estimated`

### What should improve in a second phase

- Full ETL persistence for every match across all Prisma tables
- Incremental sync workers and snapshot recalculation
- RSO token refresh and revocable multi-device sessions
- Richer attacker/defender-side segmentation if official payloads support it
- Finer coaching models built around sessions, agent changes, and competitive windows

## Curated local assets (agents + maps)

Imagery is curated per visual context as optimized local WebP, so the UI never
depends on the network at build time and nothing is scraped at runtime:

```
public/valorant/agents/
  table/<slug>.webp    # 112px square head/torso crop (table avatars 56px)
  card/<slug>.webp     # 240x320 portrait (agent cards / detail)
  hero/<slug>.webp     # full-body cutout (dashboard hero card)
public/valorant/maps/
  thumb/<slug>.webp    # 224x128 thumbnail (table)
  banner/<slug>.webp   # 1280x480 banner (hero cards)
  card/<slug>.webp     # 960x540 card background
```

Slugs: `normalizeAgentSlug` (`KAY/O` -> `kayo`) and `normalizeMapSlug`
(`Haven` -> `haven`). Mappings live in `src/server/valorant/assets/`
(`*-asset-map.generated.ts` are generated — do not edit by hand). Resolvers
`getAgentAssets(name)` / `getMapAssets(name)` return `{...} | null` per context.

Resolution order per context (set during match enrichment):
- table → `agentTableImageUrl` (local) → remote icon/portrait → initials
- card → `agentCardImageUrl` (local) → remote portrait → fallback
- hero → `agentHeroImageUrl` (local) → remote portrait → fallback
- map thumb/banner/card → local → remote splash → fallback

Optional per-asset `object-position` tweaks live in
`src/server/valorant/assets/asset-crop-overrides.ts` (empty by default).

### Regenerating assets

```bash
# Reprocess the bundled source PNGs into the curated WebP set + mappings
npm run prepare:valorant-assets

# Or process an extracted Riot Public Content Catalog (no network in build):
#   1. Download the official VALORANT Public Content Catalog and extract it
#   2. Point --agents / --maps at the extracted image directories
npm run prepare:valorant-assets -- --agents /path/to/agents --maps /path/to/maps
```

Uses the already-installed `sharp` (no new dependency) and is run manually —
Vercel builds only serve the committed files.
