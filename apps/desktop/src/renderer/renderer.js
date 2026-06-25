/* global window, document */
const api = window.companion

const els = {
  conn: document.getElementById("conn"),
  account: document.getElementById("account"),
  val: document.getElementById("val"),
  client: document.getElementById("client"),
  lastSync: document.getElementById("lastSync"),
  newMatches: document.getElementById("newMatches"),
  matchlist: document.getElementById("matchlist"),
  errorRow: document.getElementById("errorRow"),
  error: document.getElementById("error"),
  login: document.getElementById("login"),
  dashboard: document.getElementById("dashboard"),
  sync: document.getElementById("sync"),
  autosync: document.getElementById("autosync"),
  startup: document.getElementById("startup"),
}

function pill(el, ok, okText, badText) {
  el.textContent = ok ? okText : badText
  el.className = "pill " + (ok ? "ok" : "bad")
}

function errorMessage(ls, connected) {
  if (ls.rateLimited) return "Riot limitó temporalmente las peticiones. Prueba más tarde."
  if (!connected || ls.error === "unauthenticated") return "Inicia sesión en Clutchboard."
  if (ls.error === "network") return "Sin conexión con Clutchboard."
  if (ls.error) return "No se pudo sincronizar. Inténtalo más tarde."
  return null
}

function render(s) {
  if (!s) return
  const ls = s.lastSync || {}
  pill(els.conn, s.connected, "Conectado", "No conectado")
  els.account.textContent = s.accountName || "—"
  pill(els.val, s.valorantRunning, "Detectado", "No detectado")
  els.client.textContent = s.riotClientRunning ? "Abierto" : "Cerrado"
  els.lastSync.textContent = ls.at ? new Date(ls.at).toLocaleString() : "Nunca"
  els.newMatches.textContent = String(ls.savedMatches ?? 0)
  els.matchlist.textContent = ls.matchlistReturned != null ? String(ls.matchlistReturned) : "—"

  const msg = errorMessage(ls, s.connected)
  els.errorRow.style.display = msg ? "flex" : "none"
  if (msg) els.error.textContent = msg

  els.autosync.checked = !!s.autoSyncEnabled
  els.startup.checked = !!s.startWithWindows
  els.sync.disabled = !!s.syncing
  els.sync.textContent = s.syncing ? "Sincronizando…" : "Sincronizar ahora"
  els.login.style.display = s.connected ? "none" : "block"
}

els.login.addEventListener("click", () => api.login())
els.dashboard.addEventListener("click", () => api.openDashboard())
els.sync.addEventListener("click", () => api.syncNow())
els.autosync.addEventListener("change", (e) => api.toggleAutoSync(e.target.checked))
els.startup.addEventListener("change", (e) => api.toggleStartup(e.target.checked))

api.onState(render)
api.getState().then(render)
