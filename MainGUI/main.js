const { app, BrowserWindow,Menu} = require('electron')

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    },
    icon: 'logo-small.png'
  })

  win.loadFile('rockgym/dist/rockgym/index.html')
  //win.webContents.openDevTools()
  const shell = require('electron').shell

  var menu = Menu.buildFromTemplate([
    {
        label: 'Menu',
        submenu: [
            {label:'Main Features',
            click() { 
              win.loadFile('rockgym/dist/rockgym/index.html')
            } 
          },
            {label:'Settings',
                click() { 
                  win.loadFile('display/data.html')
                } 
            },
            {
                label:'Exit', 
                click() { 
                    app.quit() 
                } 
            }
        ]
    },
    {
      label:"help"
    }
])
Menu.setApplicationMenu(menu); 
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
