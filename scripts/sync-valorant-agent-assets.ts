/**
 * Sync VALORANT agent assets into optimized local WebP files + a generated
 * mapping. Run manually — NEVER part of `npm run build` and never fetches the
 * network.
 *
 *   npm run sync:valorant-agents                 # uses bundled source PNGs
 *   npm run sync:valorant-agents -- --source DIR # use an extracted catalog dir
 *
 * Traceability: the canonical source is Riot's VALORANT Public Content
 * Catalog. Download + extract it, then point --source at the agents image dir.
 * Without --source, the script reprocesses the agent PNGs already in
 * public/game-assets/agents (see README "Agent assets").
 *
 * Output:
 *   public/valorant/agents/avatars/<slug>.webp     (48x48, head/torso crop)
 *   public/valorant/agents/portraits/<slug>.webp   (240x320 card portrait)
 *   src/server/valorant/content/agent-asset-map.generated.ts
 */
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs"
import path from "node:path"

import sharp from "sharp"

// Authoritative agent name list (display name + the source PNG filename in
// public/game-assets/agents). Slugs are derived via normalizeAgentSlug.
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

// Keep in sync with src/server/valorant/content/agent-assets.ts
function normalizeAgentSlug(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
}

const ROOT = process.cwd()
const args = process.argv.slice(2)
const sourceArgIndex = args.indexOf("--source")
const sourceDir =
  sourceArgIndex >= 0 && args[sourceArgIndex + 1]
    ? path.resolve(args[sourceArgIndex + 1])
    : path.join(ROOT, "public", "game-assets", "agents")

const avatarsDir = path.join(ROOT, "public", "valorant", "agents", "avatars")
const portraitsDir = path.join(ROOT, "public", "valorant", "agents", "portraits")
const generatedFile = path.join(ROOT, "src", "server", "valorant", "content", "agent-asset-map.generated.ts")

function findSource(slug: string, file: string): string | null {
  const candidates = [file, `${slug}.png`, `${slug}.webp`, `${slug}.jpg`]
  for (const candidate of candidates) {
    const full = path.join(sourceDir, candidate)
    if (existsSync(full)) {
      return full
    }
  }
  return null
}

async function run() {
  mkdirSync(avatarsDir, { recursive: true })
  mkdirSync(portraitsDir, { recursive: true })

  if (!existsSync(sourceDir)) {
    console.error(`Source directory not found: ${sourceDir}`)
    process.exit(1)
  }

  console.log(`Source: ${sourceDir}`)
  console.log(`Available files: ${readdirSync(sourceDir).length}`)

  const entries: Array<{ slug: string; name: string; hasAsset: boolean }> = []

  for (const agent of AGENTS) {
    const slug = normalizeAgentSlug(agent.name)
    const src = findSource(slug, agent.file)

    if (!src) {
      console.warn(`! No source image for ${agent.name} (${slug}) — fallback only`)
      entries.push({ slug, name: agent.name, hasAsset: false })
      continue
    }

    // Trim the transparent margins so the character fills the frame, then
    // crop. Falls back to the raw image if trim fails (e.g. opaque bg).
    let base = sharp(src)
    let data: Buffer
    let width: number
    let height: number
    try {
      const trimmed = await sharp(src).trim().toBuffer({ resolveWithObject: true })
      data = trimmed.data
      width = trimmed.info.width
      height = trimmed.info.height
      base = sharp(data)
    } catch {
      const meta = await base.metadata()
      data = await sharp(src).toBuffer()
      width = meta.width ?? 0
      height = meta.height ?? 0
      base = sharp(data)
    }

    // 48x48 avatar: zoom onto a centered upper-body square (head + torso).
    // Deterministic so it works whether or not trim tightened the bbox.
    const side = Math.max(1, Math.round(Math.min(width, height) * 0.6))
    const left = Math.max(0, Math.round((width - side) / 2))
    const top = Math.max(0, Math.round(height * 0.05))
    const safeHeight = Math.min(side, height - top)
    await sharp(data)
      .extract({ left, top, width: Math.min(side, width - left), height: safeHeight })
      .resize(48, 48, { fit: "cover", position: "top" })
      .webp({ quality: 82 })
      .toFile(path.join(avatarsDir, `${slug}.webp`))

    // 240x320 card portrait: head -> thigh, keep the head anchored.
    await sharp(data)
      .resize(240, 320, { fit: "cover", position: "top" })
      .webp({ quality: 84 })
      .toFile(path.join(portraitsDir, `${slug}.webp`))
    void base

    entries.push({ slug, name: agent.name, hasAsset: true })
    console.log(`✓ ${agent.name} -> ${slug}.webp`)
  }

  const mapBody = entries
    .filter((entry) => entry.hasAsset)
    .map(
      (entry) =>
        `  ${JSON.stringify(entry.slug)}: { name: ${JSON.stringify(entry.name)}, ` +
        `avatar: ${JSON.stringify(`/valorant/agents/avatars/${entry.slug}.webp`)}, ` +
        `portrait: ${JSON.stringify(`/valorant/agents/portraits/${entry.slug}.webp`)}, ` +
        `banner: null },`,
    )
    .join("\n")

  const generated = `// AUTO-GENERATED by scripts/sync-valorant-agent-assets.ts — do not edit by hand.
// Run \`npm run sync:valorant-agents\` to regenerate.
import type { AgentAssetEntry } from "./agent-assets"

export const AGENT_ASSET_MAP: Record<string, AgentAssetEntry> = {
${mapBody}
}
`

  mkdirSync(path.dirname(generatedFile), { recursive: true })
  writeFileSync(generatedFile, generated, "utf8")
  console.log(`\nWrote ${generatedFile}`)
  console.log(`Mapped ${entries.filter((e) => e.hasAsset).length}/${entries.length} agents.`)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
