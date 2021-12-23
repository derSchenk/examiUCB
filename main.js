const {app, BrowserWindow} = require('electron');
const path = require('path');
const url = require('url');


let win;

function createWindow(){
  win = new BrowserWindow({width: 1280 , height: 720, webPreferences: {nodeIntegration: true, contextIsolation: false, enableRemoteModule: true}});

  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  //Open devtools
//  win.webContents.openDevTools();

  win.on('closed', () =>{
    win = null;
  });
}

//Run created window function
app.on('ready', createWindow);

//Quit when all windows are closed
app.on('window-all-closed', () =>{
  if(process.platform !== 'darwin'){
    app.quit();
  }
});
