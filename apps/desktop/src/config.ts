export const CLUTCHBOARD_URL = process.env.CLUTCHBOARD_URL ?? "https://clutchboard-alpha-ten.vercel.app"

// Primary signal that a match is/was running. RiotClientServices is only a
// secondary hint (launcher open) and never the main game signal.
export const VALORANT_GAME_PROCESSES = ["VALORANT-Win64-Shipping.exe", "VALORANT.exe"]
export const RIOT_CLIENT_PROCESS = "RiotClientServices.exe"

export const AUTO_SYNC_INTERVAL_MS = 15 * 60 * 1000 // sync at most every 15 min while playing
export const POST_CLOSE_DELAY_MS = 2.5 * 60 * 1000 // wait ~2.5 min after VALORANT closes, then sync
export const POLL_MS = 30 * 1000 // process-detection poll
export const SYNC_COOLDOWN_MS = 5 * 60 * 1000 // min gap between any two syncs (anti-spam)

// 16x16 brand-red square, embedded so the tray always has a valid icon.
export const TRAY_ICON_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAG0lEQVR4nGP47xb6nxLMMGrAqAGjBvwfJgYAABO5mR/FwqNwAAAAAElFTkSuQmCC"
