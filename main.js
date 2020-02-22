/*jshint esversion : 9 */
//Use dotenv
require('dotenv').config();

//Core modules
const spawn = require('child_process').exec;
const os = require('os');

//Third party modules
const { app, BrowserWindow, ipcMain } = require('electron');

//Internal modules
const ADSyncer = require('./ad');

//Get environment vars
const AD_URL = process.env.AD_URL;
const AD_BASE = process.env.AD_BASE;
const AD_DOMAIN = process.env.AD_DOMAIN;

let mainWindow, detailsWindow;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    icon: 'favicon.ico',
    width: 1360,
    height: 768,
    minWidth: 800,
    minHeight: 650,
    webPreferences: {
      nodeIntegration: true
    }
  });

  // and load the index.html of the app.
  mainWindow.loadFile('renderer/index.html');

  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}//End createWindow

///Try to open msra to remote PC
ipcMain.on('msra', (e, data) => {
  spawn(`msra.exe /offerra ${data}`, () => { });
});

///Try to open msra to remote PC
ipcMain.on('mstsc', (e, computerName) => {
  spawn(`mstsc.exe /v:${computerName}`, () => { });
});

//Sync with ad
ipcMain.on('ad-sync', async (event, password) => {
  //Get the current user's info
  const user = os.userInfo().username;
  const fullUserName = `${user}@${AD_DOMAIN}`;
  const syncer = new ADSyncer(fullUserName, password, AD_URL, AD_BASE);
  const computers = await syncer.getComputers();
  mainWindow.webContents.send('ad-sync', computers);
});

//Open PC details in a new browserwindow
ipcMain.on('open', (e, data) => {
  // Create the browser window.
  detailsWindow = new BrowserWindow({
    icon: 'favicon.ico',
    useContentSize: true,
    minWidth: 600,
    minHeight: 750,
    webPreferences: {
      nodeIntegration: true
    }
  });

  detailsWindow.setMenu(null);
  // and load the index.html of the app.
  detailsWindow.loadFile('renderer/details.html');

  // detailsWindow.webContents.openDevTools();
  detailsWindow.webContents.on('did-finish-load', () => {
    detailsWindow.webContents.send('data', data);
  });

  detailsWindow.on('closed', function () {
    detailsWindow = null;
  });
});

//Open event viewer for a PC
ipcMain.on('event-vwr', (e, computerName) => {
  spawn(`eventvwr /computer:${computerName}`, () => { });
});

//When electron is done initializing and is ready, create our main window
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
