"use strict";
const electron = require("electron");
const electronEvents = class {
  constructor() {
    this.functions = {
      handleLoading: (callback) => electron.ipcRenderer.on("loading-status", callback),
      removehandleLoading: (callback) => electron.ipcRenderer.removeListener("loading-status", callback)
    };
  }
  _load() {
    try {
      electron.contextBridge.exposeInMainWorld("electron", true);
      electron.contextBridge.exposeInMainWorld("electronAPI", this.functions);
    } catch (error) {
      console.error(error);
    }
  }
};
new electronEvents()._load();
