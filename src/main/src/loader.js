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

  async loadWindow() {
    this.send('loading-status', {
      status: 'Starting...'
    });
    await new this.siteWindow().load();
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
