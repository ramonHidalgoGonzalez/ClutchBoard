import { join } from "node:path"

import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  nativeImage,
  Notification,
  shell,
  Tray,
} from "electron"

import { checkSession, syncRecent } from "./api"
import {
  AUTO_SYNC_INTERVAL_MS,
  CLUTCHBOARD_URL,
  POLL_MS,
  POST_CLOSE_DELAY_MS,
  TRAY_ICON_DATA_URL,
} from "./config"
import { isValorantRunning } from "./valorant"

type CompanionState = {
  connected: boolean
  accountName: string | null
  valorantRunning: boolean
  autoSyncEnabled: boolean
  startWithWindows: boolean
  lastSyncAt: string | null
  lastNewMatches: number
  syncing: boolean
}

const state: CompanionState = {
  connected: false,
  accountName: null,
  valorantRunning: false,
  autoSyncEnabled: true,
  startWithWindows: app.getLoginItemSettings().openAtLogin,
  lastSyncAt: null,
  lastNewMatches: 0,
  syncing: false,
}

let win: BrowserWindow | null = null
let tray: Tray | null = null
let wasValorantRunning = false
let pendingCloseSync: NodeJS.Timeout | null = null

function broadcast() {
  win?.webContents.send("state", state)
  tray?.setToolTip(
    `Clutchboard Companion\n${state.connected ? "Conectado" : "No conectado"} · VALORANT ${
      state.valorantRunning ? "detectado" : "no detectado"
    }`,
  )
}

function createWindow() {
  win = new BrowserWindow({
    width: 360,
    height: 520,
    resizable: false,
    show: false,
    title: "Clutchboard Companion",
    webPreferences: { preload: join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false },
  })
  win.removeMenu()
  void win.loadFile(join(__dirname, "renderer", "index.html"))
  // Hide to tray instead of quitting.
  win.on("close", (event) => {
    if (!(app as unknown as { isQuitting?: boolean }).isQuitting) {
      event.preventDefault()
      win?.hide()
    }
  })
}

function showWindow() {
  if (!win) createWindow()
  win?.show()
  win?.focus()
}

function createTray() {
  const icon = nativeImage.createFromDataURL(TRAY_ICON_DATA_URL)
  tray = new Tray(icon)
  const menu = Menu.buildFromTemplate([
    { label: "Abrir Clutchboard Companion", click: showWindow },
    { label: "Abrir dashboard", click: openDashboard },
    { label: "Sincronizar ahora", click: () => void doSync("manual") },
    { type: "separator" },
    { label: "Salir", click: () => {
        ;(app as unknown as { isQuitting?: boolean }).isQuitting = true
        app.quit()
      } },
  ])
  tray.setContextMenu(menu)
  tray.on("click", showWindow)
  broadcast()
}

function openDashboard() {
  void shell.openExternal(`${CLUTCHBOARD_URL}/dashboard`)
}

function openLogin() {
  const loginWin = new BrowserWindow({
    width: 480,
    height: 720,
    title: "Iniciar sesión en Clutchboard",
    autoHideMenuBar: true,
  })
  void loginWin.loadURL(`${CLUTCHBOARD_URL}/login`)
  // Re-check session when the login window is closed.
  loginWin.on("closed", () => void refreshSession())
}

async function refreshSession() {
  const session = await checkSession()
  state.connected = session.connected
  state.accountName = session.name ?? null
  broadcast()
}

async function doSync(_reason: "manual" | "auto" | "post-close") {
  if (state.syncing || !state.connected) {
    if (!state.connected) await refreshSession()
    if (!state.connected) return
  }
  state.syncing = true
  broadcast()
  const result = await syncRecent()
  state.syncing = false
  if (result.error === "unauthenticated") {
    state.connected = false
  } else if (result.ok) {
    state.lastSyncAt = new Date().toISOString()
    state.lastNewMatches = result.savedMatches
    if (result.savedMatches > 0) {
      new Notification({
        title: "Clutchboard",
        body: `Se han sincronizado ${result.savedMatches} nuevas partidas.`,
      }).show()
    }
  }
  broadcast()
}

async function pollValorant() {
  const running = await isValorantRunning()
  state.valorantRunning = running

  if (wasValorantRunning && !running) {
    // VALORANT just closed — sync once after a short delay (let Riot publish it).
    if (pendingCloseSync) clearTimeout(pendingCloseSync)
    pendingCloseSync = setTimeout(() => void doSync("post-close"), POST_CLOSE_DELAY_MS)
  }
  wasValorantRunning = running
  broadcast()
}

function startTimers() {
  void pollValorant()
  setInterval(() => void pollValorant(), POLL_MS)
  // Auto-sync while playing.
  setInterval(() => {
    if (state.autoSyncEnabled && state.valorantRunning) void doSync("auto")
  }, AUTO_SYNC_INTERVAL_MS)
}

function registerIpc() {
  ipcMain.handle("get-state", () => state)
  ipcMain.handle("sync-now", () => doSync("manual"))
  ipcMain.handle("open-dashboard", () => openDashboard())
  ipcMain.handle("login", () => openLogin())
  ipcMain.handle("toggle-autosync", (_e, value: boolean) => {
    state.autoSyncEnabled = Boolean(value)
    broadcast()
    return state.autoSyncEnabled
  })
  ipcMain.handle("toggle-startup", (_e, value: boolean) => {
    state.startWithWindows = Boolean(value)
    app.setLoginItemSettings({ openAtLogin: state.startWithWindows })
    broadcast()
    return state.startWithWindows
  })
}

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on("second-instance", showWindow)
  app.whenReady().then(async () => {
    createWindow()
    createTray()
    registerIpc()
    await refreshSession()
    startTimers()
    showWindow()
  })
  // Keep running in the tray when all windows are closed.
  app.on("window-all-closed", () => {})
}
