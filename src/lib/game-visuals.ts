type VisualTheme = {
  accentFrom: string
  accentTo: string
  surface: string
  eyebrow: string
}

type ArtworkPresentation = {
  imageClassName: string
  overlayClassName: string
}

const AGENT_THEMES: Record<string, VisualTheme> = {
  jett: { accentFrom: "#8be9fd", accentTo: "#2563eb", surface: "#0f172a", eyebrow: "Mobility duelist" },
  sova: { accentFrom: "#f8fafc", accentTo: "#3b82f6", surface: "#0f172a", eyebrow: "Recon initiator" },
  omen: { accentFrom: "#8b5cf6", accentTo: "#1e1b4b", surface: "#09090b", eyebrow: "Controller lurker" },
  killjoy: { accentFrom: "#facc15", accentTo: "#65a30d", surface: "#111827", eyebrow: "Sentinel lockdown" },
  raze: { accentFrom: "#fb923c", accentTo: "#dc2626", surface: "#111827", eyebrow: "Explosive entry" },
  skye: { accentFrom: "#4ade80", accentTo: "#065f46", surface: "#0f172a", eyebrow: "Flash initiator" },
}

const MAP_THEMES: Record<string, VisualTheme> = {
  ascent: { accentFrom: "#f97316", accentTo: "#7c3aed", surface: "#111827", eyebrow: "Mid control and picks" },
  bind: { accentFrom: "#eab308", accentTo: "#b45309", surface: "#111827", eyebrow: "Fast rotations and sites" },
  haven: { accentFrom: "#22c55e", accentTo: "#0f766e", surface: "#0f172a", eyebrow: "Three-site adaptation" },
  split: { accentFrom: "#fb7185", accentTo: "#7c2d12", surface: "#111827", eyebrow: "Vertical pressure" },
  lotus: { accentFrom: "#2dd4bf", accentTo: "#14532d", surface: "#0f172a", eyebrow: "Rotating door timings" },
  sunset: { accentFrom: "#f59e0b", accentTo: "#ec4899", surface: "#1f2937", eyebrow: "Skirmish-heavy tempo" },
  icebox: { accentFrom: "#93c5fd", accentTo: "#164e63", surface: "#0f172a", eyebrow: "Vertical post-plant fights" },
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-")
}

export function getVisualTheme(kind: "agent" | "map", name: string) {
  const key = slugify(name)
  const source = kind === "agent" ? AGENT_THEMES : MAP_THEMES

  return (
    source[key] ?? {
      accentFrom: "#ff4655",
      accentTo: "#0ea5e9",
      surface: "#111827",
      eyebrow: kind === "agent" ? "VALORANT agent profile" : "VALORANT battleground profile",
    }
  )
}

export function getArtworkUrl(kind: "agent" | "map", name: string, officialAssetPath?: string | null) {
  const key = slugify(name)

  if (kind === "agent") {
    return `/game-assets/agents/${key}.png`
  }

  if (kind === "map") {
    return `/game-assets/maps/${key}.png`
  }

  if (officialAssetPath && /^https?:\/\//.test(officialAssetPath)) {
    return officialAssetPath
  }

  return `/api/media/${kind}/${encodeURIComponent(name)}`
}

export function getArtworkPresentation(kind: "agent" | "map", name: string): ArtworkPresentation {
  const key = slugify(name)

  if (kind === "agent") {
    const perAgentClassName: Record<string, string> = {
      jett: "object-contain object-right-bottom scale-[1.16]",
      sova: "object-contain object-right-bottom scale-[1.14]",
      omen: "object-contain object-right-bottom scale-[1.18]",
      killjoy: "object-contain object-right-bottom scale-[1.10]",
      raze: "object-contain object-right-bottom scale-[1.12]",
      skye: "object-contain object-right-bottom scale-[1.12]",
    }

    return {
      imageClassName:
        perAgentClassName[key] ??
        "object-contain object-right-bottom scale-[1.12]",
      overlayClassName:
        "bg-[linear-gradient(90deg,rgba(0,0,0,0.96)_0%,rgba(0,0,0,0.74)_38%,rgba(0,0,0,0.18)_72%,rgba(0,0,0,0.04)_100%)]",
    }
  }

  return {
    imageClassName: "object-cover object-center",
    overlayClassName:
      "bg-[linear-gradient(180deg,rgba(0,0,0,0.16)_0%,rgba(0,0,0,0.42)_55%,rgba(0,0,0,0.92)_100%)]",
  }
}
