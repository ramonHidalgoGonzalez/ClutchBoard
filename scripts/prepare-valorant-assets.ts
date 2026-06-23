/**
 * Prepare curated, context-specific VALORANT assets (agents + maps) into
 * optimized local WebP files and regenerate the asset maps.
 *
 * MANUAL ONLY — never part of `npm run build`, never fetches the network.
 *
 *   npm run prepare:valorant-assets
 *   npm run prepare:valorant-assets -- --agents DIR --maps DIR
 *
 * Source priority per kind: --agents/--maps override, else the bundled
 * public/game-assets/{agents,maps} PNGs (which are the only images committed).
 * To use Riot's official Public Content Catalog: download + extract it, then
 * pass --agents / --maps pointing at the extracted image directories.
 *
 * Output:
 *   public/valorant/agents/{table,card,hero}/<slug>.webp
 *   public/valorant/maps/{thumb,banner,card}/<slug>.webp
 *   src/server/valorant/assets/agent-asset-map.generated.ts
 *   src/server/valorant/assets/map-asset-map.generated.ts
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"

import sharp from "sharp"

const AGENTS: Array<{ name: string; file: string }> = [
  { name: "Astra", file: "astra.png" },
  { name: "Breach", file: "breach.png" },
  { name: "Brimstone", file: "brimstone.png" },
  { name: "Chamber", file: "chamber.png" },
  { name: "Clove", file: "clove.png" },
  { name: "Cypher", file: "cypher.png" },
  { name: "Deadlock", file: "deadlock.png" },
  { name: "Fade", file: "fade.png" },
  { name: "Gekko", file: "gekko.png" },
  { name: "Harbor", file: "harbor.png" },
  { name: "Iso", file: "iso.png" },
  { name: "Jett", file: "jett.png" },
  { name: "KAY/O", file: "kay-o.png" },
  { name: "Killjoy", file: "killjoy.png" },
  { name: "Miks", file: "miks.png" },
  { name: "Neon", file: "neon.png" },
  { name: "Omen", file: "omen.png" },
  { name: "Phoenix", file: "phoenix.png" },
  { name: "Raze", file: "raze.png" },
  { name: "Reyna", file: "reyna.png" },
  { name: "Sage", file: "sage.png" },
  { name: "Skye", file: "skye.png" },
  { name: "Sova", file: "sova.png" },
  { name: "Tejo", file: "tejo.png" },
  { name: "Veto", file: "veto.png" },
  { name: "Viper", file: "viper.png" },
  { name: "Vyse", file: "vyse.png" },
  { name: "Waylay", file: "waylay.png" },
  { name: "Yoru", file: "yoru.png" },
]

const MAPS: Array<{ name: string; file: string }> = [
  { name: "Abyss", file: "abyss.png" },
  { name: "Ascent", file: "ascent.png" },
  { name: "Bind", file: "bind.png" },
  { name: "Breeze", file: "breeze.png" },
  { name: "Corrode", file: "corrode.png" },
  { name: "Fracture", file: "fracture.png" },
  { name: "Haven", file: "haven.png" },
  { name: "Icebox", file: "icebox.png" },
  { name: "Lotus", file: "lotus.png" },
  { name: "Pearl", file: "pearl.png" },
  { name: "Split", file: "split.png" },
  { name: "Sunset", file: "sunset.png" },
]

function slugify(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
}

const ROOT = process.cwd()
const args = process.argv.slice(2)
function argDir(flag: string, fallback: string) {
  const i = args.indexOf(flag)
  return i >= 0 && args[i + 1] ? path.resolve(args[i + 1]) : path.join(ROOT, fallback)
}
const agentsSrc = argDir("--agents", "public/game-assets/agents")
const mapsSrc = argDir("--maps", "public/game-assets/maps")

function out(...segments: string[]) {
  return path.join(ROOT, "public", "valorant", ...segments)
}

function findSource(dir: string, slug: string, file: string) {
  for (const candidate of [file, `${slug}.png`, `${slug}.webp`, `${slug}.jpg`]) {
    const full = path.join(dir, candidate)
    if (existsSync(full)) return full
  }
  return null
}

// Hand-curated overrides with ABSOLUTE priority, dropped into
// source-assets/valorant/<kind>/<context>/<slug>.<ext> (e.g. a real agent
// selection icon). When present, used instead of the auto-derived crop.
const MANUAL_ROOT = path.join(ROOT, "source-assets", "valorant")
function manualSource(kind: "agents" | "maps", context: string, slug: string) {
  for (const ext of ["png", "webp", "jpg", "jpeg"]) {
    const full = path.join(MANUAL_ROOT, kind, context, `${slug}.${ext}`)
    if (existsSync(full)) return full
  }
  return null
}

async function buildAgents() {
  for (const sub of ["table", "card", "hero"]) {
    mkdirSync(out("agents", sub), { recursive: true })
  }
  const entries: Array<{ slug: string; name: string }> = []

  for (const agent of AGENTS) {
    const slug = slugify(agent.name)
    const src = findSource(agentsSrc, slug, agent.file)
    if (!src) {
      console.warn(`! agent source missing: ${agent.name}`)
      continue
    }

    const meta = await sharp(src).metadata()
    const width = meta.width ?? 0
    const height = meta.height ?? 0

    // table — selection-style icon (head + bust). Prefer a hand-curated icon;
    // otherwise crop tightly onto the upper body of the full-body source so it
    // reads as a clean 56px icon, not a shrunken full body.
    const tableManual = manualSource("agents", "table", slug)
    if (tableManual) {
      await sharp(tableManual)
        .resize(112, 112, { fit: "cover", position: "centre" })
        .webp({ quality: 88 })
        .toFile(out("agents", "table", `${slug}.webp`))
    } else {
      const side = Math.max(1, Math.round(Math.min(width, height) * 0.46))
      const left = Math.max(0, Math.round((width - side) / 2))
      const top = Math.max(0, Math.round(height * 0.03))
      await sharp(src)
        .extract({ left, top, width: Math.min(side, width - left), height: Math.min(side, height - top) })
        .resize(112, 112, { fit: "cover", position: "top" })
        .webp({ quality: 86 })
        .toFile(out("agents", "table", `${slug}.webp`))
    }

    // card (tall portrait)
    await sharp(manualSource("agents", "card", slug) ?? src)
      .resize(240, 320, { fit: "cover", position: "top" })
      .webp({ quality: 86 })
      .toFile(out("agents", "card", `${slug}.webp`))

    // hero (full-body cutout, transparency preserved, shown object-contain)
    await sharp(manualSource("agents", "hero", slug) ?? src)
      .resize(600, 600, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 88 })
      .toFile(out("agents", "hero", `${slug}.webp`))

    entries.push({ slug, name: agent.name })
    console.log(`✓ agent ${agent.name} -> ${slug}`)
  }

  const body = entries
    .map(
      (e) =>
        `  ${JSON.stringify(e.slug)}: { name: ${JSON.stringify(e.name)}, ` +
        `table: ${JSON.stringify(`/valorant/agents/table/${e.slug}.webp`)}, ` +
        `card: ${JSON.stringify(`/valorant/agents/card/${e.slug}.webp`)}, ` +
        `hero: ${JSON.stringify(`/valorant/agents/hero/${e.slug}.webp`)} },`,
    )
    .join("\n")

  writeFileSync(
    path.join(ROOT, "src", "server", "valorant", "assets", "agent-asset-map.generated.ts"),
    `// AUTO-GENERATED by scripts/prepare-valorant-assets.ts — do not edit by hand.\n` +
      `import type { AgentAssetEntry } from "./agent-assets"\n\n` +
      `export const AGENT_ASSET_MAP: Record<string, AgentAssetEntry> = {\n${body}\n}\n`,
    "utf8",
  )
  console.log(`Mapped ${entries.length} agents.`)
}

async function buildMaps() {
  for (const sub of ["thumb", "banner", "card"]) {
    mkdirSync(out("maps", sub), { recursive: true })
  }
  const entries: Array<{ slug: string; name: string }> = []

  for (const map of MAPS) {
    const slug = slugify(map.name)
    const src = findSource(mapsSrc, slug, map.file)
    if (!src) {
      console.warn(`! map source missing: ${map.name}`)
      continue
    }

    const thumbSrc = manualSource("maps", "thumb", slug) ?? src
    await sharp(thumbSrc).resize(224, 128, { fit: "cover", position: "centre" }).webp({ quality: 86 }).toFile(out("maps", "thumb", `${slug}.webp`))
    await sharp(src).resize(1280, 480, { fit: "cover", position: "centre" }).webp({ quality: 84 }).toFile(out("maps", "banner", `${slug}.webp`))
    await sharp(src).resize(960, 540, { fit: "cover", position: "centre" }).webp({ quality: 84 }).toFile(out("maps", "card", `${slug}.webp`))

    entries.push({ slug, name: map.name })
    console.log(`✓ map ${map.name} -> ${slug}`)
  }

  const body = entries
    .map(
      (e) =>
        `  ${JSON.stringify(e.slug)}: { name: ${JSON.stringify(e.name)}, ` +
        `thumb: ${JSON.stringify(`/valorant/maps/thumb/${e.slug}.webp`)}, ` +
        `banner: ${JSON.stringify(`/valorant/maps/banner/${e.slug}.webp`)}, ` +
        `card: ${JSON.stringify(`/valorant/maps/card/${e.slug}.webp`)} },`,
    )
    .join("\n")

  writeFileSync(
    path.join(ROOT, "src", "server", "valorant", "assets", "map-asset-map.generated.ts"),
    `// AUTO-GENERATED by scripts/prepare-valorant-assets.ts — do not edit by hand.\n` +
      `import type { MapAssetEntry } from "./map-assets"\n\n` +
      `export const MAP_ASSET_MAP: Record<string, MapAssetEntry> = {\n${body}\n}\n`,
    "utf8",
  )
  console.log(`Mapped ${entries.length} maps.`)
}

async function run() {
  mkdirSync(path.join(ROOT, "src", "server", "valorant", "assets"), { recursive: true })
  console.log(`Agents source: ${agentsSrc}`)
  console.log(`Maps source:   ${mapsSrc}`)
  await buildAgents()
  await buildMaps()
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
