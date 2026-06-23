# Performance notes

Running log of what was optimized, where things are cached, and what's left.

## What was optimized

### Lazy charts (Recharts)
Recharts is the heaviest client dependency. All charts are now loaded with
`next/dynamic({ ssr: false })` and a premium `ChartSkeleton`/`DonutSkeleton`
fallback, so the initial JS of chart-heavy routes shrinks and the page paints
before the chart library arrives:

- Dashboard — `src/components/dashboard/lazy-charts.tsx` (`LazyTrendChart`,
  `LazyResultsDonut`).
- Ranked — dynamic `RankedProgressionChart` + `RankDistributionDonut` inside
  `ranked-view.tsx`.
- Comparisons — dynamic `ComparisonLineChart` inside `comparisons-view.tsx`.

### Instant navigation skeletons
Every priority route has a `loading.tsx` that renders the real `AppShell`
(sidebar + topbar stay mounted) with a section-shaped skeleton instead of a
blank screen: dashboard, matches, agents, agents/[slug], maps, maps/[slug],
ranked, comparisons, improvement. Skeletons live in
`src/components/skeletons/index.tsx` and look like the final layout.

### Filter changes don't freeze the page
`AnalyticsScopeSelector` navigates inside `useTransition`; while the new scope
loads, only the selector dims + shows a spinner. The route `loading.tsx`
covers the section, so the rest of the shell stays interactive.

### Request-level dedupe
`getEnrichedMatches` is wrapped in React `cache()`. Multiple callers in the
same request (page analytics, coach insights, available acts) share one
fetch + enrich pass instead of recomputing.

## Where things are cached

| Data | Layer | TTL |
|------|-------|-----|
| Match history (real) | `real-adapter.ts` `matchesCache` (module) | ~60s |
| Content catalog (agents/maps) | `content-service.ts` module cache | `CONTENT_TTL_MS` |
| Acts catalog | `content-service.ts` `actsCache` | `CONTENT_TTL_MS` |
| Enriched matches | React `cache()` | per request |
| Local assets (agent/map) | curated static maps | build-time |

Analytics aggregations (`buildScopedAnalytics`) are computed once per page in
the server component and passed down as plain data — components never
recompute `matches.map/filter/calculateStats` themselves.

## Images
- Match history rows use `agentTableImageUrl` / `mapThumbImageUrl` (compact
  assets), never hero/banner images.
- Hero/card art is only used in large cards and detail heroes.
- `<img>` is kept (custom local `/api/media` routes); `loading="lazy"` where
  off-screen. Migrating `AgentAvatar`/`MapThumbnail` to `next/image` is a
  possible future step but risks the local-route resolution, so deferred.

## What's left (future)
- Move `AppShell` into a route-group layout so it doesn't re-render per
  navigation (currently cheap: cookie + session only, no Riot).
- `MatchHistoryRepository` + DB persistence for full synced history.
- Optional `next/image` migration for avatars/thumbnails.
- Virtualize `/matches` rows if synced history grows past a few hundred.

## How to measure
- `ENABLE_MOCK_RIOT=true APP_SESSION_SECRET=x npm run build` → check the
  "First Load JS" column per route; chart routes should not carry Recharts in
  their initial chunk.
- Navigate with the network tab throttled — skeletons should appear instantly
  and charts should stream in after.
