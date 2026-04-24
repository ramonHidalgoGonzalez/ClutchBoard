import { NextRequest, NextResponse } from "next/server"

import { getVisualTheme } from "@/lib/game-visuals"

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ kind: string; name: string }> },
) {
  const { kind, name } = await params
  const decodedName = decodeURIComponent(name)
  const resolvedKind = kind === "map" ? "map" : "agent"
  const theme = getVisualTheme(resolvedKind, decodedName)
  const label = resolvedKind === "agent" ? "AGENT" : "MAP"

  const svg = `
    <svg width="1200" height="640" viewBox="0 0 1200 640" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="640" fill="${theme.surface}"/>
      <circle cx="996" cy="132" r="228" fill="${theme.accentFrom}" fill-opacity="0.28"/>
      <circle cx="196" cy="548" r="240" fill="${theme.accentTo}" fill-opacity="0.30"/>
      <path d="M0 520L1200 220V640H0V520Z" fill="url(#overlay)" fill-opacity="0.95"/>
      <path d="M688 84L1040 84L820 416L468 416L688 84Z" stroke="rgba(255,255,255,0.16)" stroke-width="4"/>
      <path d="M48 114L388 114L214 352L-126 352L48 114Z" stroke="rgba(255,255,255,0.10)" stroke-width="4"/>
      <text x="72" y="96" fill="rgba(255,255,255,0.62)" font-size="28" font-family="Arial, Helvetica, sans-serif" letter-spacing="8">${label}</text>
      <text x="72" y="430" fill="white" font-size="94" font-weight="700" font-family="Arial, Helvetica, sans-serif">${escapeXml(decodedName)}</text>
      <text x="72" y="484" fill="rgba(255,255,255,0.72)" font-size="30" font-family="Arial, Helvetica, sans-serif">${escapeXml(theme.eyebrow)}</text>
      <defs>
        <linearGradient id="overlay" x1="0" y1="640" x2="1200" y2="180" gradientUnits="userSpaceOnUse">
          <stop stop-color="rgba(0,0,0,0.92)"/>
          <stop offset="1" stop-color="rgba(255,255,255,0.02)"/>
        </linearGradient>
      </defs>
    </svg>
  `.trim()

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  })
}
