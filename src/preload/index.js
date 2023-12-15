import { contextBridge, ipcRenderer } from 'electron';

const electronEvents = class {
  constructor() {
    this.functions = {
      handleLoading: (callback) => ipcRenderer.on('loading-status', callback),
      removehandleLoading: (callback) => ipcRenderer.removeListener('loading-status', callback)
    };
  }

  _load() {
    try {
      contextBridge.exposeInMainWorld('electron', true);
      contextBridge.exposeInMainWorld('electronAPI', this.functions);
    } catch (error) {
      console.error(error);
    }
  }
};
new electronEvents()._load();
