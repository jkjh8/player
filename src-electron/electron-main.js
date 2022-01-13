import { app, BrowserWindow, nativeTheme, ipcMain } from 'electron'
import path from 'path'
import os from 'os'
import dgram from 'dgram'
// import db
import db from './db'
// needed in case process is undefined under Linux
const platform = process.platform || os.platform()

try {
  if (
    platform === 'win32' &&
    nativeTheme.shouldUseDarkColors === true
  ) {
    require('fs').unlinkSync(
      path.join(app.getPath('userData'), 'DevTools Extensions')
    )
  }
} catch (_) {}

let mainWindow

function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    icon: path.resolve(__dirname, 'icons/icon.png'), // tray icon
    width: 1000,
    height: 600,
    useContentSize: true,
    webPreferences: {
      contextIsolation: true,
      // More info: /quasar-cli/developing-electron-apps/electron-preload-script
      preload: path.resolve(
        __dirname,
        process.env.QUASAR_ELECTRON_PRELOAD
      )
    }
  })

  mainWindow.loadURL(process.env.APP_URL)

  if (process.env.DEBUGGING) {
    // if on DEV or Production with debug enabled
    mainWindow.webContents.openDevTools()
  } else {
    // we're on production; no access to devtools pls
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow.webContents.closeDevTools()
    })
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

// multicast
const multicast = dgram.createSocket('udp4')
multicast.bind(12300, () => {
  multicast.setBroadcast(true)
  multicast.setMulticastTTL(128)
  multicast.addMembership('230.185.192.12')
})

multicast.on('listening', () => {
  console.log('multicast start')
})

multicast.on('message', (msg) => {
  const command = JSON.parse(msg.toString())
  mainWindow.webContents.send('onResponse', { ...command })
})

ipcMain.on('onRequest', async (event, args) => {
  switch (args.key) {
    case 'set_chime':
      await db.setup.update(
        { key: 'chime' },
        { $set: { value: args.value } },
        { upsert: true }
      )
      break
    case 'get_chime': {
      const r = await db.setup.findOne({ key: 'chime' })
      mainWindow.webContents.send('onResponse', {
        key: 'chime',
        value: r.value
      })
      break
    }
    case 'set_audiooutput':
      await db.setup.update(
        { key: 'audiooutput' },
        { $set: { value: args.value } },
        { upsert: true }
      )
      break
    case 'get_audiooutput':
      const r = await db.setup.findOne({ key: 'audiooutput' })
      mainWindow.webContents.send('onResponse', {
        key: 'audiooutput',
        value: r.value
      })
      break
  }
})
