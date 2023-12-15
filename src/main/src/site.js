import electron, { BrowserWindow, app, ipcMain } from 'electron';
import { join } from 'path';
const siteWindow = class extends BrowserWindow {
  constructor(autoUpdater) {
    super({
      width: electron.screen.getPrimaryDisplay().workAreaSize.width,
      height: electron.screen.getPrimaryDisplay().workAreaSize.height,
      autoHideMenuBar: true,
      icon: join(__dirname, '../../build/resources/icon.png'),
      title: '',
      show: false,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
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
      if (!this.hasUpdates) return;
      this.autoUpdater.quitAndInstall();
    };
    this.once('close', handleClose);
    ipcMain.on('install-updates', handleRequestUpdate);
  }
  checkUpdates() {
    this.autoUpdater.checkForUpdates();
  }
  updateHandler() {
    this.updateInterval = setInterval(async () => {
      this.checkUpdates();
    }, 1000 * 60);
    const handleUpdateDownload = () => {
      this.hasUpdates = true;
      this.send('update-info', { status: 'downloaded' });
    };
    this.autoUpdater.on('update-downloaded', handleUpdateDownload);
  }
  async load() {
    this.loadURL(import.meta.env.MAIN_VITE_APPURI);
    await new Promise((resolve, reject) => {
      this.once('ready-to-show', () => {
        resolve();
      });
    });
    this.show();
    this.handleEvents();
    this.updateHandler();
  }
};
export default siteWindow;
