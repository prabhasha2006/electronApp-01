"use strict";
const electron = require("electron");
const utils = require("@electron-toolkit/utils");
const electronUpdater = require("electron-updater");
const path = require("path");
const siteWindow = class extends electron.BrowserWindow {
  constructor(autoUpdater) {
    super({
      width: electron.screen.getPrimaryDisplay().workAreaSize.width,
      height: electron.screen.getPrimaryDisplay().workAreaSize.height,
      autoHideMenuBar: true,
      icon: path.join(__dirname, "../../build/resources/icon.png"),
      title: "",
      show: false,
      webPreferences: {
        preload: path.join(__dirname, "../preload/index.js"),
        nodeIntegration: true,
        contextIsolation: true
      }
    });
    this.hasUpdates = false;
    this.updateInterval;
    this.autoUpdater = autoUpdater;
  }
  send(event, data) {
    this.webContents.send(event, data);
  }
  handleEvents() {
    const handleClose = () => {
      this.updateInterval && clearInterval(this.updateInterval);
      this.autoUpdater.removeAllListeners();
      this.destroy();
    };
    const handleRequestUpdate = (_) => {
      if (!this.hasUpdates)
        return;
      this.autoUpdater.quitAndInstall();
    };
    this.once("close", handleClose);
    electron.ipcMain.on("install-updates", handleRequestUpdate);
  }
  checkUpdates() {
    this.autoUpdater.checkForUpdates();
  }
  updateHandler() {
    this.updateInterval = setInterval(async () => {
      this.checkUpdates();
    }, 1e3 * 60);
    const handleUpdateDownload = () => {
      this.hasUpdates = true;
      this.send("update-info", { status: "downloaded" });
    };
    this.autoUpdater.on("update-downloaded", handleUpdateDownload);
  }
  async load() {
    this.loadURL("http://localhost:3000/");
    await new Promise((resolve, reject) => {
      this.once("ready-to-show", () => {
        resolve();
      });
    });
    this.show();
    this.handleEvents();
    this.updateHandler();
  }
};
const loaderWindow = class extends electron.BrowserWindow {
  constructor(siteWindow2, autoUpdater) {
    super({
      height: 500,
      width: 400,
      resizable: false,
      autoHideMenuBar: true,
      show: false,
      titleBarStyle: "hidden",
      focusable: true,
      icon: path.join(__dirname, "../../build/resources/icon.png"),
      webPreferences: {
        preload: path.join(__dirname, "../preload/index.js"),
        nodeIntegration: true,
        contextIsolation: true
      }
    });
    this.autoUpdater = autoUpdater;
    this.siteWindow = siteWindow2;
    this.retryies = 0;
    this.retryTime = Number("5000");
  }
  send(event, data) {
    this.webContents.send(event, data);
  }
  handleEvents() {
    const handleClose = () => {
      this.destroy();
    };
    this.once("close", handleClose);
  }
  handleClearUpdates() {
    this.autoUpdater.removeAllListeners();
  }
  reset() {
    this.retryies = 0;
  }
  checkUpdates(resolve, reject) {
    this.send("loading-status", {
      status: `Checking For Updates...`
    });
    this.autoUpdater.checkForUpdates();
    this.autoUpdater.on("update-not-available", resolve);
    this.autoUpdater.on("download-progress", (info) => {
      const totalMb = info.total * 1e-6;
      const message = `Downloading Updates ${(info.percent * totalMb / 100).toFixed(
        2
      )}Mb of ${totalMb.toFixed(2)}Mb`;
      this.send("loading-status", {
        status: message
      });
    });
    this.autoUpdater.on("update-downloaded", () => {
      this.installUpdates(resolve, reject);
    });
    this.autoUpdater.on("error", async () => {
      await this.retry(resolve, reject);
    });
  }
  async installUpdates(resolve, reject) {
    const installMessage = () => {
      const message = `Installing Updates in ${this.retryTime / 1e3 - time}`;
      this.send("loading-status", {
        status: message
      });
      time++;
    };
    let time = 0;
    installMessage();
    const timeInterval = setInterval(() => {
      installMessage();
    }, 1e3);
    await new Promise((resolve2, reject2) => {
      setTimeout(() => {
        resolve2();
      }, this.retryTime);
    });
    clearInterval(timeInterval);
    this.autoUpdater.quitAndInstall();
  }
  async retry(resolve, reject) {
    const retryMessage = () => {
      const message = `Retrying in ${this.retryTime / 1e3 * this.retryies - time}`;
      this.send("loading-status", {
        status: message
      });
      time++;
    };
    this.handleClearUpdates();
    this.retryTime / this.retryies !== 1e3 && this.retryies++;
    let time = 0;
    retryMessage();
    const timeInterval = setInterval(() => {
      retryMessage();
    }, 1e3);
    await new Promise((resolve2, reject2) => {
      setTimeout(() => {
        resolve2();
      }, this.retryies * this.retryTime);
    });
    clearInterval(timeInterval);
    this.checkUpdates(resolve, reject);
  }
  async loadWindow() {
    this.send("loading-status", {
      status: "Starting..."
    });
    await new this.siteWindow(this.autoUpdater).load();
    this.close();
  }
  async load() {
    this.loadFile(path.join(__dirname, "../renderer/index.html"));
    await new Promise((resolve, reject) => {
      this.once("ready-to-show", () => {
        resolve();
      });
    });
    this.show();
    this.handleEvents();
    this.loadWindow();
  }
};
electronUpdater.autoUpdater.setFeedURL({
  provider: "github",
  owner: "achira22",
  repo: "Skill-Swap",
  releaseType: "release"
});
electronUpdater.autoUpdater.forceDevUpdateConfig = true;
electronUpdater.autoUpdater.autoDownload = true;
electronUpdater.autoUpdater.autoRunAppAfterInstall = true;
electron.app.whenReady().then(() => {
  utils.electronApp.setAppUserModelId("com.electron");
  electron.app.on("browser-window-created", (_, window) => {
    utils.optimizer.watchWindowShortcuts(window);
  });
  electron.app.on("activate", function() {
    if (electron.BrowserWindow.getAllWindows().length === 0) {
      new loaderWindow(siteWindow, electronUpdater.autoUpdater).load();
    }
  });
  new loaderWindow(siteWindow, electronUpdater.autoUpdater).load();
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
