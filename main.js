const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true
    }
  });

  win.setMenu(null);
  win.loadFile('index.html');

  // Dosya İndirme Yönetimi
  session.defaultSession.on('will-download', (event, item, webContents) => {
    const fileName = item.getFilename();

    win.webContents.send('download-start', { fileName });

    item.on('updated', (event, state) => {
      if (state === 'interrupted') {
        console.log('İndirme kesintiye uğradı');
      } else if (state === 'progressing') {
        if (item.isPaused()) {
          console.log('İndirme duraklatıldı');
        } else {
          const percent = Math.round((item.getReceivedBytes() / item.getTotalBytes()) * 100);
          win.webContents.send('download-progress', { fileName, percent });
        }
      }
    });

    item.once('done', (event, state) => {
      if (state === 'completed') {
        win.webContents.send('download-complete', { fileName });
      } else {
        console.log(`İndirme başarısız: ${state}`);
      }
    });
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
const { app, BrowserWindow, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');

// Arka plan indirme ayarları
autoUpdater.autoDownload = true; // Güncellemeyi otomatik arka planda indir
autoUpdater.autoInstallOnAppQuit = true; // Uygulama kapatıldığında otomatik kur

function createWindow() {
  // Mevcut pencere oluşturma kodların...
}

app.on('ready', () => {
  createWindow();

  // Açılışta güncellemeleri sessizce kontrol et
  autoUpdater.checkForUpdatesAndNotify();
});

// Güncelleme indirildiğinde kullanıcıya tatlı bir bildirim göster
autoUpdater.on('update-downloaded', (info) => {
  dialog.showMessageBox({
    type: 'info',
    title: 'EZ Browser Güncellendi',
    message: `Yeni sürüm (${info.version}) arka planda indirildi! Yeniden başlatarak yeni özellikleri kullanabilirsiniz.`,
    buttons: ['Şimdi Yeniden Başlat', 'Sonra']
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall(); // Uygulamayı kapatıp yeni sürümle açar
    }
  });
});