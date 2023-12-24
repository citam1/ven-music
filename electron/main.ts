import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'node:path'
import {  writeFile, readFile, unlink } from 'fs/promises';
import { autoUpdater, AppUpdater } from 'electron-updater';

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')


autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true

let win: BrowserWindow | null
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
    win = new BrowserWindow({
    autoHideMenuBar: true,
    width: 1700,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      webSecurity: false,
    },  
  }
  )
  //win.webContents.openDevTools();
  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(process.env.DIST, 'index.html'))
  }


  ipcMain.on('saveLast', async (event,data) => {
    await writeFile("./src/assets/jsons/lastSong.json",JSON.stringify(data))
  });
    ipcMain.on("createAPlaylist", async (event, data) => {
      try {
        const newPlaylist = {
          name: data,
          songs: []
        };

        const playlistsJsonPath = VITE_DEV_SERVER_URL
          ? "./src/assets/jsons/playlists.json"
          : path.join(process.env.DIST, 'assets', 'jsons', 'playlists.json');
        
        const existingData = await readFile(playlistsJsonPath, 'utf-8');
        const jsonData = JSON.parse(existingData);
        
        jsonData.playlists.push(newPlaylist);
        
        await writeFile(playlistsJsonPath, JSON.stringify(jsonData, null, 2), 'utf-8');
      } catch (error: any) {
        console.error('Error:', error.message);
        dialog.showErrorBox('Error', `An error occurred: ${error.message}`);
      }
    });

  ipcMain.on("downloadSpotify", async (event, url) => {
      const FullData: any = JSON.parse(url)

      const CurrentPlaylist = FullData.CurrentPlaylist
      

  });


  ipcMain.on("deleteSong", async (event, data) => {
    try {
      const existingData = await readFile("./src/assets/jsons/playlists.json", 'utf-8');
      const jsonData = JSON.parse(existingData); // Parse existing data from the file
  
      const inputJsonData = JSON.parse(data); // Parse input data
      const playlistName = inputJsonData.CurrentPlaylist;
      const songName = inputJsonData.songName;
  
      console.log(inputJsonData);
  
      const playlistIndex = jsonData.playlists.findIndex(
        (playlist:any) => playlist.name === playlistName
      );
  
      if (playlistIndex !== -1) {
        const songIndex = jsonData.playlists[playlistIndex].songs.findIndex(
          (song:any) => song.name === songName
        );
  
        if (songIndex !== -1) {
          const deletedSong = jsonData.playlists[playlistIndex].songs.splice(songIndex, 1)[0];
  
          // Delete the corresponding MP3 file
          const mp3FilePath = `./src/assets/music/${songName}.mp3`;
          await unlink(mp3FilePath);
  
          // Write the merged data back to the file
          await writeFile("./src/assets/jsons/playlists.json", JSON.stringify(jsonData, null, 2), 'utf-8');
  
          console.log('Song removed from playlist:', playlistName);
  
          // Send the updated data back to the renderer process
          event.reply("deleteSongResponse", JSON.stringify(jsonData));
        } else {
          console.error('Song not found in playlist:', songName);
        }
      } else {
        console.error('Playlist not found:', playlistName);
      }
    } catch (error) {
      console.error('Error processing deleteSong:', error);
      // You might want to send an error response to the renderer process here
    }
  });
}
// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(()=> {
  createWindow()

  autoUpdater.checkForUpdates();
})
