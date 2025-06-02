const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

let mainWindow;
let db;

// Disable electron-reload for now as it may cause issues
// if (process.env.NODE_ENV === 'development') {
//   require('electron-reload')(__dirname, {
//     electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
//     hardResetMethod: 'exit'
//   });
// }

// Initialize database
async function initDatabase() {
  // Check for custom database location in settings
  let dbPath;
  
  try {
    // Try to read settings file first
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      if (settings.databaseLocation) {
        dbPath = path.join(settings.databaseLocation, 'locallisten.db');
      }
    }
  } catch (error) {
    console.log('No custom database location found, using default');
  }
  
  // Default location if not set
  if (!dbPath) {
    const userDataPath = app.getPath('userData');
    dbPath = path.join(userDataPath, 'locallisten.db');
  }
  
  // Ensure directory exists
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  console.log('Database location:', dbPath);
  db = new Database(dbPath);
  
  // Load and execute schema
  const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
  
  // Store current db path in memory
  global.dbPath = dbPath;
  
  return db;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#ffffff',
    show: false
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:9000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
    // Open dev tools to debug the issue
    mainWindow.webContents.openDevTools();
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle any loading errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log('Console:', message);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Menu setup
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Upload',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow.webContents.send('menu-action', 'new-upload');
          }
        },
        {
          label: 'Start Recording',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.webContents.send('menu-action', 'start-recording');
          }
        },
        { type: 'separator' },
        {
          label: 'Preferences',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow.webContents.send('navigate', 'settings');
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About LocalListen',
          click: () => {
            mainWindow.webContents.send('navigate', 'about');
          }
        },
        {
          label: 'User Guide',
          click: () => {
            shell.openExternal('https://locallisten.app/guide');
          }
        },
        { type: 'separator' },
        {
          label: 'Report Issue',
          click: () => {
            shell.openExternal('https://github.com/locallisten/issues');
          }
        }
      ]
    }
  ];

  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services', submenu: [] },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC Handlers
ipcMain.handle('db-query', async (event, { type, sql, params }) => {
  try {
    switch (type) {
      case 'all':
        return db.prepare(sql).all(params || []);
      case 'get':
        return db.prepare(sql).get(params || []);
      case 'run':
        return db.prepare(sql).run(params || []);
      default:
        throw new Error('Unknown query type');
    }
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
});

ipcMain.handle('dialog-open-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Audio/Video', extensions: ['mp3', 'wav', 'mp4', 'avi', 'mov', 'm4a', 'webm', 'ogg'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled) {
    return result.filePaths;
  }
  return [];
});

ipcMain.handle('dialog-save-file', async (event, { defaultPath, filters }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath,
    filters
  });

  if (!result.canceled) {
    return result.filePath;
  }
  return null;
});

ipcMain.handle('get-app-path', async (event, type) => {
  return app.getPath(type);
});

ipcMain.handle('get-database-info', async () => {
  const stats = fs.statSync(global.dbPath);
  return {
    path: global.dbPath,
    size: stats.size,
    modified: stats.mtime
  };
});

ipcMain.handle('change-database-location', async (event, newPath) => {
  try {
    const oldDbPath = global.dbPath;
    const newDbPath = path.join(newPath, 'locallisten.db');
    
    // Ensure new directory exists
    if (!fs.existsSync(newPath)) {
      fs.mkdirSync(newPath, { recursive: true });
    }
    
    // Close current database
    if (db) {
      db.close();
    }
    
    // Copy database to new location
    fs.copyFileSync(oldDbPath, newDbPath);
    
    // Save settings
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    const settings = fs.existsSync(settingsPath) 
      ? JSON.parse(fs.readFileSync(settingsPath, 'utf8'))
      : {};
    
    settings.databaseLocation = newPath;
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    
    // Reinitialize with new location
    await initDatabase();
    
    return { success: true, newPath: newDbPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('backup-database', async (event, backupPath) => {
  try {
    fs.copyFileSync(global.dbPath, backupPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.on('show-item-in-folder', (event, fullPath) => {
  shell.showItemInFolder(fullPath);
});

ipcMain.handle('test-service-connection', async (event, { url, service }) => {
  try {
    const response = await fetch(url, {
      method: service === 'speaches' ? 'GET' : 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      return { success: true, status: response.status };
    } else {
      return { success: false, status: response.status, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// App event handlers
app.whenReady().then(() => {
  initDatabase();
  createWindow();
  createMenu();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Helper function to get FFmpeg path
function getFFmpegPath() {
  if (app.isPackaged) {
    // In production, use resourcesPath
    const platform = process.platform;
    const ffmpegName = platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
    return path.join(process.resourcesPath, 'bin', ffmpegName);
  } else {
    // In development, use ffmpeg-static
    return require('ffmpeg-static');
  }
}

// Audio extraction handler
ipcMain.handle('extract-audio', async (event, { inputPath, outputPath }) => {
  const ffmpegPath = getFFmpegPath();
  
  try {
    // Check if FFmpeg exists
    if (!fs.existsSync(ffmpegPath)) {
      throw new Error('FFmpeg not found. Please run: npm run download-ffmpeg');
    }
    
    // Build FFmpeg command
    const command = `"${ffmpegPath}" -i "${inputPath}" -vn -acodec pcm_s16le -ar 16000 -ac 1 "${outputPath}" -y`;
    
    await execAsync(command);
    return { success: true };
  } catch (error) {
    console.error('Audio extraction error:', error);
    return { success: false, error: error.message };
  }
});

// Get media info handler
ipcMain.handle('get-media-info', async (event, { filePath }) => {
  const ffmpegPath = getFFmpegPath();
  
  try {
    const command = `"${ffmpegPath}" -i "${filePath}" -f null - 2>&1`;
    const { stdout, stderr } = await execAsync(command).catch(e => ({ stdout: '', stderr: e.stderr || e.message }));
    const output = stdout + stderr;
    
    // Parse duration
    const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2})/);
    let duration = 0;
    if (durationMatch) {
      const hours = parseInt(durationMatch[1]);
      const minutes = parseInt(durationMatch[2]);
      const seconds = parseInt(durationMatch[3]);
      duration = hours * 3600 + minutes * 60 + seconds;
    }
    
    return {
      success: true,
      duration,
      hasVideo: output.includes('Video:'),
      hasAudio: output.includes('Audio:')
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Cleanup on exit
app.on('before-quit', () => {
  if (db) {
    db.close();
  }
});