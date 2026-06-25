/* global window, document */
const api = window.companion

const els = {
  conn: document.getElementById("conn"),
  account: document.getElementById("account"),
  val: document.getElementById("val"),
  lastSync: document.getElementById("lastSync"),
  newMatches: document.getElementById("newMatches"),
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

function render(s) {
  if (!s) return
  pill(els.conn, s.connected, "Conectado", "No conectado")
  els.account.textContent = s.accountName || "—"
  pill(els.val, s.valorantRunning, "Detectado", "No detectado")
  els.lastSync.textContent = s.lastSyncAt ? new Date(s.lastSyncAt).toLocaleString() : "Nunca"
  els.newMatches.textContent = String(s.lastNewMatches ?? 0)
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
