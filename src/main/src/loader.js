import electron, { BrowserWindow, app, ipcMain } from 'electron';
import { join } from 'path';
const loaderWindow = class extends BrowserWindow {
  constructor(siteWindow) {
    super({
      height: 500,
      width: 400,
      resizable: false,
      autoHideMenuBar: true,
      show: false,
      titleBarStyle: 'hidden',
      focusable: true,
      icon: join(__dirname, '../../build/resources/icon.png'),
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        nodeIntegration: true,
        contextIsolation: true
      }
    });
    this.siteWindow = siteWindow;
    this.retryies = 0;
    this.retryTime = Number(import.meta.env.MAIN_VITE_RETRYTIME);
  }
  send(event, data) {
    this.webContents.send(event, data);
  }
  handleEvents() {
    const handleClose = () => {
      this.destroy();
    };
    this.once('close', handleClose);
  }
  handleClearUpdates() {
    this.autoUpdater.removeAllListeners();
  }
  reset() {
    this.retryies = 0;
  }
  checkUpdates(resolve, reject) {
    this.send('loading-status', {
      status: `Checking For Updates...`
    });
    this.autoUpdater.checkForUpdates();
    this.autoUpdater.on('update-not-available', resolve);
    this.autoUpdater.on('download-progress', (info) => {
      const totalMb = info.total * 0.000001;
      const message = `Downloading Updates ${((info.percent * totalMb) / 100).toFixed(
        2
      )}Mb of ${totalMb.toFixed(2)}Mb`;

      this.send('loading-status', {
        status: message
      });
    });
    this.autoUpdater.on('update-downloaded', () => {
      this.installUpdates(resolve, reject);
    });
    this.autoUpdater.on('error', async () => {
      await this.retry(resolve, reject);
    });
  }
  async installUpdates(resolve, reject) {
    const installMessage = () => {
      const message = `Installing Updates in ${this.retryTime / 1000 - time}`;
      this.send('loading-status', {
        status: message
      });
      time++;
    };
    let time = 0;
    installMessage();
    const timeInterval = setInterval(() => {
      installMessage();
    }, 1000);
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, this.retryTime);
    });
    clearInterval(timeInterval);
    this.autoUpdater.quitAndInstall();
  }

  async retry(resolve, reject) {
    const retryMessage = () => {
      const message = `Retrying in ${(this.retryTime / 1000) * this.retryies - time}`;
      this.send('loading-status', {
        status: message
      });
      time++;
    };
    this.handleClearUpdates();
    this.retryTime / this.retryies !== 1000 && this.retryies++;
    let time = 0;
    retryMessage();
    const timeInterval = setInterval(() => {
      retryMessage();
    }, 1000);
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, this.retryies * this.retryTime);
    });
    clearInterval(timeInterval);
    this.checkUpdates(resolve, reject);
  }
  async loadWindow() {
    this.send('loading-status', {
      status: 'Starting...'
    });
    await new this.siteWindow(this.autoUpdater).load();
    this.close();
  }

  async load() {
    this.loadFile(join(__dirname, '../renderer/index.html'));
    await new Promise((resolve, reject) => {
      this.once('ready-to-show', () => {
        resolve();
      });
    });
    this.show();
    this.handleEvents();
    this.loadWindow();
  }
};
export default loaderWindow;
