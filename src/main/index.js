// main.js

import { app, shell, BrowserWindow, ipcMain } from 'electron';
import { electronApp, optimizer } from '@electron-toolkit/utils';
import { autoUpdater } from 'electron-updater';
import siteWindow from './src/site';
import loaderWindow from './src/loader';
// Configure the update feed URL (replace 'username' and 'repo' with your GitHub username and repository name).
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron');
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      new loaderWindow(siteWindow).load();
    }
  });
  new loaderWindow(siteWindow).load();
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
