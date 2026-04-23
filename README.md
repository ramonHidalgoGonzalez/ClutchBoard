# Valorant Tracker Personal

Aplicación web full-stack estilo "Valorant Tracker" centrada en una cuenta concreta, preparada para Riot RSO, API oficial de VALORANT y modo demo/mock mientras llega la aprobación final de producción.

## Stack

- Next.js 16 App Router + TypeScript
- Tailwind CSS v4 + shadcn/ui
- PostgreSQL + Prisma
- Redis / Upstash para cache y rate limiting
- TanStack Query
- Recharts
- Zod
- Vitest + Playwright

## Estructura

```text
src/
  app/                 Rutas App Router y endpoints API
  components/          Shell, charts y UI reutilizable
  features/            Módulos de dominio orientados a producto
  lib/                 Env, logger, redis, rate-limit, providers
  server/              Auth, repositorios, servicios y helpers API
  integrations/riot/   Cliente Riot, DTOs, validación y adapters mock/real
  analytics/           Fórmulas derivadas y engine de mejora
  database/            Cliente Prisma lazy
  types/               Tipos de dominio y Riot
tests/
  unit/
  integration/
  e2e/
prisma/
  schema.prisma
```

## Requisitos

- Node.js 20+
- npm 10+
- PostgreSQL si quieres persistencia real
- Redis/Upstash opcional para cache distribuida y rate limit compartido
- Credenciales Riot de producción si quieres RSO real

## Variables de entorno

Usa `.env.example` como base.

Claves principales:

- `ENABLE_MOCK_RIOT=true`: activa modo demo con dataset coherente
- `APP_SESSION_SECRET`: secreto para firmar la sesión
- `DATABASE_URL`: conexión PostgreSQL
- `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`: cache/rate limit
- `RIOT_API_KEY`: clave oficial Riot
- `RIOT_RSO_CLIENT_ID`, `RIOT_RSO_CLIENT_SECRET`, `RIOT_RSO_REDIRECT_URI`: RSO
- `RIOT_REGION`, `RIOT_PLATFORM`: routing Riot

## Setup local

```bash
npm install
npm run prisma:generate
npm run dev
```

Con PostgreSQL:

```bash
npm run db:push
```

## Flujo de autenticación Riot

### Modo real

1. El usuario pulsa "Iniciar sesión con Riot".
2. `/api/auth/riot/login` genera `state` y redirige a `https://auth.riotgames.com/authorize`.
3. Riot vuelve a `/api/auth/riot/callback`.
4. Se valida `state`.
5. Se intercambia `code` por tokens.
6. Se llama a `/riot/account/v1/accounts/me` con `Bearer access_token`.
7. Se crea sesión propia firmada y se guarda opcionalmente en DB.

### Modo mock

1. El usuario entra por `/api/auth/riot/login`.
2. Se usa el adapter mock.
3. Se crea sesión local segura.
4. La app carga dataset demo y métricas derivadas.

## Cómo activar modo mock

```env
ENABLE_MOCK_RIOT=true
APP_SESSION_SECRET=dev-secret
```

Opcional para tests o demos automáticas:

```env
DEMO_AUTO_LOGIN=true
```

## Scripts útiles

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

- Configura todas las variables de entorno.
- Añade PostgreSQL y Redis gestionados.
- Asegura que el redirect URI de Riot apunte al dominio final.

Pasos rápidos:

```bash
npm i -g vercel
vercel login
vercel
```

Para producción:

```bash
vercel --prod
```

Variables mínimas para publicar una demo online:

- `NEXT_PUBLIC_APP_URL`
- `APP_SESSION_SECRET`
- `ENABLE_MOCK_RIOT=true`

Variables mínimas para publicar en modo Riot real:

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

- Usa `npm run build` seguido de `npm run start`.
- Inyecta secretos por variables de entorno.
- Mantén Prisma y Redis fuera del contenedor si quieres persistencia estable.

Build y run:

```bash
docker build -t valorant-tracker-personal .
docker run -p 3000:3000 --env-file .env.local valorant-tracker-personal
```

## Limitaciones actuales

- El modo real requiere `Production API Key` y aprobación RSO por parte de Riot.
- El refresh token no está rotado todavía con un job dedicado; la base está preparada pero falta el worker específico.
- El detalle persistido de match todavía no hace un ETL completo a todas las tablas Prisma; hoy el modo demo es el camino más robusto para UI y analytics.
- Algunas métricas avanzadas dependen de `roundResults` y no siempre permiten reconstrucción perfecta de contexto táctico.

## Próximos pasos recomendados

- Añadir cola real para sincronización incremental por PUUID.
- Persistir snapshots y cached responses después de cada sync.
- Implementar refresh de tokens RSO y expiración coordinada.
- Añadir filtros avanzados por fecha, mapa, agente y cola.
- Completar observabilidad con tracing y métricas Prometheus/OpenTelemetry.

## LIMITACIONES REALES DE LA API Y DECISIONES DE PRODUCTO

### Qué datos son oficiales

- `RSO/OAuth`: autenticación del jugador vía Riot Sign On.
- `/riot/account/v1/accounts/me`: identidad oficial del usuario autenticado.
- `VAL-CONTENT-V1`: contenido oficial de agentes, mapas, actos y metadatos.
- `VAL-MATCH-V1`: matchlist por `puuid` y detalle de cada partida.
- `VAL-RANKED-V1`: leaderboard por acto.
- `VAL-STATUS-V1`: estado de plataforma.

### Qué datos son derivados

- `ACS estimado`
- `headshot %`
- `clutches`
- `comfort picks`
- `consistency score`
- `impact score`
- `momentum`
- `delta reciente vs baseline`
- `fatigue score`
- `agent pool concentration`
- `stability score`
- `improvement score`
- Todos los insights de la sección "Mejora"

Cada una de estas métricas se calcula a partir de partidas reales normalizadas y está documentada en `src/analytics/formulas.ts`.

### Qué depende de aprobación RSO/producción

- Login real con Riot.
- Acceso real a datos personales de VALORANT del jugador autenticado.
- Uso de client ID / client secret RSO.
- Operación pública del producto para otros usuarios.

Riot documenta que las apps de VALORANT con datos personales deben usar `RSO` y que este acceso solo está disponible con `Production Level API Keys` y aprobación del cliente RSO oficial.

### Qué no puede saberse con precisión

- "Impacto" real absoluto del jugador en el resultado.
- Calidad táctica exacta de utility, spacing, timings o trade discipline.
- Tilt psicológico real; solo se puede inferir degradación progresiva de rendimiento.
- Clutches completos o first-death perfectos si la granularidad del payload no deja reconstrucción total en todos los casos.
- ACS oficial exacto si el endpoint no lo expone directamente; por eso aquí se etiqueta como `estimado`.

### Qué habría que mejorar en una segunda fase

- Persistencia completa de ETL match-by-match en todas las tablas Prisma.
- Worker de sincronización incremental y recalculo de snapshots.
- Refresh token RSO y sesiones revocables multi-dispositivo.
- Segmentación más rica por lado atacante/defensor si el payload oficial disponible lo permite.
- Modelos de coaching más finos basados en sesiones, cambios de agente y ventanas competitivas.
