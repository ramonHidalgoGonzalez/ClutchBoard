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
  isAllowedNavUrl,
  POLL_MS,
  POST_CLOSE_DELAY_MS,
  SYNC_COOLDOWN_MS,
  TRAY_ICON_DATA_URL,
} from "./config"
import { log } from "./logger"
import { detectValorant } from "./valorant"

type LastSync = {
  at: string | null
  savedMatches: number
  matchlistReturned: number
  error: string | null
  rateLimited: boolean
}

type CompanionState = {
  connected: boolean
  accountName: string | null
  valorantRunning: boolean
  riotClientRunning: boolean
  autoSyncEnabled: boolean
  startWithWindows: boolean
  syncing: boolean
  lastSync: LastSync
}

const state: CompanionState = {
  connected: false,
  accountName: null,
  valorantRunning: false,
  riotClientRunning: false,
  autoSyncEnabled: true,
  startWithWindows: app.getLoginItemSettings().openAtLogin,
  syncing: false,
  lastSync: { at: null, savedMatches: 0, matchlistReturned: 0, error: null, rateLimited: false },
}

let win: BrowserWindow | null = null
let dashboardWin: BrowserWindow | null = null
let tray: Tray | null = null
let wasGameRunning = false
let pendingCloseSync: NodeJS.Timeout | null = null
let lastSyncMs = 0

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
    height: 560,
    resizable: false,
    show: false,
    title: "Clutchboard Companion",
    webPreferences: { preload: join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false },
  })
  win.removeMenu()
  void win.loadFile(join(__dirname, "renderer", "index.html"))
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
  tray = new Tray(nativeImage.createFromDataURL(TRAY_ICON_DATA_URL))
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Abrir Clutchboard Companion", click: showWindow },
      { label: "Abrir dashboard", click: openDashboardWindow },
      { label: "Abrir dashboard en navegador", click: openDashboardExternal },
      { label: "Sincronizar ahora", click: () => void doSync("manual") },
      { type: "separator" },
      {
        label: "Salir",
        click: () => {
          ;(app as unknown as { isQuitting?: boolean }).isQuitting = true
          app.quit()
        },
      },
    ]),
  )
  tray.on("click", showWindow)
  broadcast()
}

// Keep in-app navigation on the allow-list; send anything else to the browser.
function guardNavigation(target: BrowserWindow) {
  target.webContents.on("will-navigate", (event, url) => {
    if (!isAllowedNavUrl(url)) {
      event.preventDefault()
      void shell.openExternal(url)
    }
  })
  target.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedNavUrl(url)) return { action: "allow" }
    void shell.openExternal(url)
    return { action: "deny" }
  })
}

// Opens the dashboard inside Electron (feels like a real desktop app). Falls
// back to /login inside the same window when not authenticated.
function openDashboardWindow() {
  log("open_dashboard")
  if (dashboardWin && !dashboardWin.isDestroyed()) {
    dashboardWin.show()
    dashboardWin.focus()
    return
  }
  dashboardWin = new BrowserWindow({
    width: 1280,
    height: 820,
    title: "Clutchboard",
    autoHideMenuBar: true,
    backgroundColor: "#0b1020",
    webPreferences: {
      // No companion preload here — this window only renders the web app.
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  })
  guardNavigation(dashboardWin)
  void dashboardWin.loadURL(`${CLUTCHBOARD_URL}/dashboard`)
  dashboardWin.on("closed", () => {
    dashboardWin = null
    void refreshSession()
  })
}

function openDashboardExternal() {
  log("open_dashboard")
  void shell.openExternal(`${CLUTCHBOARD_URL}/dashboard`)
}

function openLogin() {
  log("login_opened")
  const loginWin = new BrowserWindow({ width: 480, height: 720, title: "Iniciar sesión en Clutchboard", autoHideMenuBar: true })
  void loginWin.loadURL(`${CLUTCHBOARD_URL}/login`)
  loginWin.on("closed", () => void refreshSession())
}

async function refreshSession() {
  const session = await checkSession()
  state.connected = session.connected
  state.accountName = session.name ?? null
  broadcast()
}

async function doSync(reason: "manual" | "auto" | "post-close") {
  if (state.syncing) return

  // Cooldown applies to automatic syncs; manual is always allowed.
  if (reason !== "manual" && Date.now() - lastSyncMs < SYNC_COOLDOWN_MS) {
    log("sync_skipped_cooldown", { reason })
    return
  }

  if (!state.connected) {
    await refreshSession()
    if (!state.connected) {
      state.lastSync = { ...state.lastSync, error: "unauthenticated" }
      broadcast()
      return
    }
  }

  state.syncing = true
  broadcast()
  log("sync_started", { reason })

  const result = await syncRecent()
  lastSyncMs = Date.now()
  state.syncing = false

  if (result.error === "unauthenticated") {
    state.connected = false
    state.lastSync = { ...state.lastSync, error: "unauthenticated" }
    log("sync_failed", { error: "unauthenticated" })
  } else if (result.ok) {
    state.lastSync = {
      at: new Date().toISOString(),
      savedMatches: result.savedMatches,
      matchlistReturned: result.matchlistReturned,
      error: null,
      rateLimited: result.rateLimited,
    }
    log("sync_success", { savedMatches: result.savedMatches, matchlistReturned: result.matchlistReturned })
    if (result.savedMatches > 0) {
      new Notification({ title: "Clutchboard", body: `Se han sincronizado ${result.savedMatches} nuevas partidas.` }).show()
    }
  } else {
    state.lastSync = { ...state.lastSync, at: new Date().toISOString(), error: result.error ?? "error", rateLimited: result.rateLimited }
    log("sync_failed", { error: result.error })
  }
  broadcast()
}

async function pollValorant() {
  const { gameRunning, clientRunning } = await detectValorant()
  state.valorantRunning = gameRunning
  state.riotClientRunning = clientRunning

  if (!wasGameRunning && gameRunning) log("valorant_detected")
  if (wasGameRunning && !gameRunning) {
    log("valorant_closed")
    if (pendingCloseSync) clearTimeout(pendingCloseSync)
    pendingCloseSync = setTimeout(() => void doSync("post-close"), POST_CLOSE_DELAY_MS)
  }
  wasGameRunning = gameRunning
  broadcast()
}

function startTimers() {
  void pollValorant()
  setInterval(() => void pollValorant(), POLL_MS)
  setInterval(() => {
    if (state.autoSyncEnabled && state.valorantRunning) void doSync("auto")
  }, AUTO_SYNC_INTERVAL_MS)
}

function registerIpc() {
  ipcMain.handle("get-state", () => state)
  ipcMain.handle("sync-now", () => doSync("manual"))
  ipcMain.handle("open-dashboard", () => openDashboardWindow())
  ipcMain.handle("open-dashboard-external", () => openDashboardExternal())
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
    log("app_started")
    createWindow()
    createTray()
    registerIpc()
    await refreshSession()
    startTimers()
    showWindow()
  })
  app.on("window-all-closed", () => {})
}
