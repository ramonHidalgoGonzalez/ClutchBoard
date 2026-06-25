import { contextBridge, ipcRenderer } from "electron"

export type CompanionState = {
  connected: boolean
  accountName: string | null
  valorantRunning: boolean
  autoSyncEnabled: boolean
  startWithWindows: boolean
  lastSyncAt: string | null
  lastNewMatches: number
  syncing: boolean
}

contextBridge.exposeInMainWorld("companion", {
  getState: (): Promise<CompanionState> => ipcRenderer.invoke("get-state"),
  onState: (cb: (s: CompanionState) => void) => {
    ipcRenderer.on("state", (_event, s: CompanionState) => cb(s))
  },
  syncNow: () => ipcRenderer.invoke("sync-now"),
  openDashboard: () => ipcRenderer.invoke("open-dashboard"),
  login: () => ipcRenderer.invoke("login"),
  toggleAutoSync: (value: boolean) => ipcRenderer.invoke("toggle-autosync", value),
  toggleStartup: (value: boolean) => ipcRenderer.invoke("toggle-startup", value),
})
