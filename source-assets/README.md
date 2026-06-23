# Manual asset overrides

Drop hand-curated source images here to override the auto-derived crops with
**absolute priority**. Used only by `npm run prepare:valorant-assets` (manual,
never in build). Files here are sources — the committed output lives in
`public/valorant/...`.

```
source-assets/valorant/
  agents/
    table/<slug>.png    # selection-style head/bust icon (best for 56px tables)
    card/<slug>.png      # tall portrait
    hero/<slug>.png      # full-body cutout
  maps/
    thumb/<slug>.png     # clean horizontal thumbnail
    banner/<slug>.png
    card/<slug>.png
```

`<slug>` is `normalizeAgentSlug` / `normalizeMapSlug` (e.g. `KAY/O` → `kayo`,
`Haven` → `haven`). Accepts `.png`, `.webp`, `.jpg`.

Priority per context: **manual override → bundled source (auto crop) → remote
mapped → visual fallback**.

Example — give Jett a front-facing selection icon for the history table:

```
source-assets/valorant/agents/table/jett.png
npm run prepare:valorant-assets
```

This regenerates `public/valorant/agents/table/jett.webp` from your icon.
