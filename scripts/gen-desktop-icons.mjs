/**
 * Generate the Clutchboard Companion desktop icons from the brand mark.
 *
 *   node scripts/gen-desktop-icons.mjs
 *
 * Source : public/brand/clutchboard-mark.png (512x512 RGBA)
 * Outputs: apps/desktop/build/icon.ico  (multi-size, PNG-embedded — electron-builder exe)
 *          apps/desktop/build/icon.png  (256 — runtime window/taskbar icon)
 *          apps/desktop/build/tray.png  (32  — runtime tray icon)
 *
 * MANUAL ONLY. sharp lives in the root deps, so run from the repo root.
 */
import { mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"

import sharp from "sharp"

const ROOT = process.cwd()
const SRC = path.join(ROOT, "public", "brand", "clutchboard-mark.png")
const OUT = path.join(ROOT, "apps", "desktop", "build")
mkdirSync(OUT, { recursive: true })

const png = (size) =>
  sharp(SRC).resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()

// Build a PNG-embedded .ico (Vista+). Header + per-image directory + PNG data.
function buildIco(images) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type = icon
  header.writeUInt16LE(images.length, 4)

  const dir = Buffer.alloc(16 * images.length)
  let offset = 6 + dir.length
  images.forEach((img, i) => {
    const b = i * 16
    dir.writeUInt8(img.size >= 256 ? 0 : img.size, b + 0) // width (0 => 256)
    dir.writeUInt8(img.size >= 256 ? 0 : img.size, b + 1) // height
    dir.writeUInt8(0, b + 2) // palette
    dir.writeUInt8(0, b + 3) // reserved
    dir.writeUInt16LE(1, b + 4) // color planes
    dir.writeUInt16LE(32, b + 6) // bits per pixel
    dir.writeUInt32LE(img.data.length, b + 8) // size of PNG
    dir.writeUInt32LE(offset, b + 12) // offset
    offset += img.data.length
  })

  return Buffer.concat([header, dir, ...images.map((i) => i.data)])
}

const icoSizes = [16, 24, 32, 48, 64, 128, 256]
const icoImages = await Promise.all(icoSizes.map(async (size) => ({ size, data: await png(size) })))
writeFileSync(path.join(OUT, "icon.ico"), buildIco(icoImages))
writeFileSync(path.join(OUT, "icon.png"), await png(256))
writeFileSync(path.join(OUT, "tray.png"), await png(32))

console.log("clutchboard icons -> apps/desktop/build/{icon.ico,icon.png,tray.png}")
