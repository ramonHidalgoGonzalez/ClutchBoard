import { build } from "esbuild"
import { cpSync, mkdirSync } from "node:fs"

mkdirSync("dist", { recursive: true })

await build({
  entryPoints: ["src/main.ts", "src/preload.ts"],
  bundle: true,
  platform: "node",
  target: "node18",
  format: "cjs",
  outdir: "dist",
  external: ["electron"],
  sourcemap: true,
})

// Renderer is plain HTML/JS (no bundling needed for v0.1).
cpSync("src/renderer", "dist/renderer", { recursive: true })

// Runtime brand icons for the windows/taskbar and the tray.
cpSync("build/icon.png", "dist/icon.png")
cpSync("build/tray.png", "dist/tray.png")

console.log("clutchboard-companion: build ok")
