const { app, BrowserWindow } = require('electron/main')
const path = require('node:path')

function createWindow () {
    const win = new BrowserWindow({
        width: 800,
        height: 700,
        webPreferences: {
            /* preload: path.join(__dirname, 'preload.js'), */
            nodeIntegration: true,
            contextIsolation: false
        }
    })

    win.loadFile('index.html')
    // win.webContents.openDevTools()
}

app.whenReady().then(() => {
    createWindow()
    
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})