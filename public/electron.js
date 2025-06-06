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
        dbPath = path.join(settings.databaseLocation, 'audio-scribe.db');
      }
    }
  } catch (error) {
    console.log('No custom database location found, using default');
  }
  
  // Default location if not set
  if (!dbPath) {
    const userDataPath = app.getPath('userData');
    dbPath = path.join(userDataPath, 'audio-scribe.db');
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
  
  // Run migrations to ensure all columns exist
  runMigrations();
  
  // Store current db path in memory
  global.dbPath = dbPath;
  
  return db;
}

// Function to check and add missing columns
function runMigrations() {
  try {
    // Get existing columns for transcripts table
    const columns = db.prepare("PRAGMA table_info(transcripts)").all();
    const columnNames = columns.map(col => col.name);
    
    // Define required columns with their SQL definitions
    const requiredColumns = [
      { name: 'sentiment_overall', sql: 'ALTER TABLE transcripts ADD COLUMN sentiment_overall TEXT' },
      { name: 'sentiment_score', sql: 'ALTER TABLE transcripts ADD COLUMN sentiment_score REAL' },
      { name: 'emotions', sql: 'ALTER TABLE transcripts ADD COLUMN emotions TEXT' },
      { name: 'speaker_count', sql: 'ALTER TABLE transcripts ADD COLUMN speaker_count INTEGER DEFAULT 1' },
      { name: 'speakers', sql: 'ALTER TABLE transcripts ADD COLUMN speakers TEXT' },
      { name: 'notable_quotes', sql: 'ALTER TABLE transcripts ADD COLUMN notable_quotes TEXT' },
      { name: 'research_themes', sql: 'ALTER TABLE transcripts ADD COLUMN research_themes TEXT' },
      { name: 'qa_pairs', sql: 'ALTER TABLE transcripts ADD COLUMN qa_pairs TEXT' },
      { name: 'concept_frequency', sql: 'ALTER TABLE transcripts ADD COLUMN concept_frequency TEXT' },
      { name: 'validated_text', sql: 'ALTER TABLE transcripts ADD COLUMN validated_text TEXT' },
      { name: 'validation_changes', sql: 'ALTER TABLE transcripts ADD COLUMN validation_changes TEXT' },
      { name: 'processed_text', sql: 'ALTER TABLE transcripts ADD COLUMN processed_text TEXT' }
    ];
    
    // Add missing columns
    for (const column of requiredColumns) {
      if (!columnNames.includes(column.name)) {
        console.log(`Adding missing column: ${column.name}`);
        db.exec(column.sql);
      }
    }
    
    console.log('Database migrations completed');
  } catch (error) {
    console.error('Error running migrations:', error);
  }
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
          label: 'About AudioScribe',
          click: () => {
            mainWindow.webContents.send('menu-action', 'show-about');
          }
        },
        {
          label: 'User Guide',
          enabled: false,
          click: () => {
            // Will be enabled when documentation is ready
          }
        },
        { type: 'separator' },
        {
          label: 'View on GitHub',
          click: () => {
            shell.openExternal('https://github.com/michael-borck/audio-scribe');
          }
        },
        {
          label: 'Report Issue',
          click: () => {
            shell.openExternal('https://github.com/michael-borck/audio-scribe/issues');
          }
        },
        {
          label: 'Licenses',
          click: () => {
            mainWindow.webContents.send('menu-action', 'show-licenses');
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

ipcMain.handle('get-ollama-models', async (event, { url }) => {
  try {
    const response = await fetch(`${url}/api/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, models: data.models || [] };
    } else {
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('chat-with-ollama', async (event, { prompt, message, context }) => {
  try {
    // Get AI analysis settings from database
    const aiUrlSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('aiAnalysisUrl');
    const aiModelSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('aiModel');
    
    const aiUrl = aiUrlSetting ? aiUrlSetting.value : 'http://localhost:11434';
    const model = aiModelSetting ? aiModelSetting.value : 'llama2';

    console.log('Chat request:', { aiUrl, model, promptLength: prompt.length, messageLength: message.length });

    const response = await fetch(`${aiUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 2048,
          top_p: 0.9,
          top_k: 40
        }
      }),
      signal: AbortSignal.timeout(120000) // 2 minute timeout for chat
    });

    if (response.ok) {
      const data = await response.json();
      return { 
        success: true, 
        response: data.response || 'No response generated',
        model: model,
        totalDuration: data.total_duration,
        loadDuration: data.load_duration,
        promptEvalDuration: data.prompt_eval_duration,
        evalDuration: data.eval_duration
      };
    } else {
      const errorText = await response.text();
      console.error('Ollama API error:', response.status, errorText);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }
  } catch (error) {
    console.error('Failed to chat with Ollama:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fs-read-file', async (event, filePath) => {
  try {
    const data = fs.readFileSync(filePath);
    return data;
  } catch (error) {
    throw new Error(`Failed to read file: ${error.message}`);
  }
});

ipcMain.handle('fs-write-file', async (event, { filePath, data }) => {
  try {
    fs.writeFileSync(filePath, data);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fs-get-file-stats', async (event, filePath) => {
  try {
    const stats = fs.statSync(filePath);
    return { size: stats.size, mtime: stats.mtime };
  } catch (error) {
    return { size: 0, error: error.message };
  }
});

ipcMain.handle('fs-join-path', async (event, ...pathSegments) => {
  return path.join(...pathSegments);
});

ipcMain.handle('transcribe-audio', async (event, { audioPath, sttUrl, sttModel }) => {
  try {
    // Import fetch for Node.js
    const { default: fetch } = await import('node-fetch');
    const FormData = require('form-data');
    
    console.log('Transcription request details:', {
      audioPath,
      sttUrl,
      sttModel,
      fullUrl: `${sttUrl}/v1/audio/transcriptions`
    });
    
    // Get audio chunk size setting
    const chunkSizeSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('audioChunkSize');
    const chunkSizeSeconds = chunkSizeSetting ? parseInt(chunkSizeSetting.value) : 300; // Default 5 minutes
    
    console.log('=== AUDIO CHUNKING DEBUG ===');
    console.log('Audio chunk size setting:', chunkSizeSeconds, 'seconds');
    console.log('Audio file path:', audioPath);
    
    // Check if file exists and get file size
    if (!fs.existsSync(audioPath)) {
      console.error('ERROR: Audio file does not exist:', audioPath);
      throw new Error(`Audio file not found: ${audioPath}`);
    }
    
    const audioStats = fs.statSync(audioPath);
    console.log('Audio file size:', (audioStats.size / 1024 / 1024).toFixed(2), 'MB');
    
    // Get media info to determine if we need to chunk
    const ffmpegPath = getFFmpegPath();
    console.log('FFmpeg path:', ffmpegPath);
    
    // Use ffmpeg to get duration (the -show_entries is actually an ffprobe option)
    // We'll extract duration from ffmpeg stderr output instead
    let totalDuration = 0;
    try {
      const durationCommand = `"${ffmpegPath}" -i "${audioPath}" -f null - 2>&1`;
      console.log('Getting duration with command:', durationCommand);
      
      const { stdout, stderr } = await execAsync(durationCommand).catch(e => ({ 
        stdout: e.stdout || '', 
        stderr: e.stderr || e.message || ''
      }));
      
      const output = stdout + stderr;
      console.log('FFmpeg output sample:', output.substring(0, 500));
      
      // Extract duration from output
      const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
      if (durationMatch) {
        const hours = parseInt(durationMatch[1]);
        const minutes = parseInt(durationMatch[2]);
        const seconds = parseFloat(durationMatch[3]);
        totalDuration = hours * 3600 + minutes * 60 + seconds;
        console.log('Extracted duration:', totalDuration, 'seconds', `(${Math.floor(totalDuration / 60)}:${Math.floor(totalDuration % 60).toString().padStart(2, '0')})`);
      } else {
        console.warn('WARNING: Could not extract duration from ffmpeg output');
        console.log('Will process as single file without chunking');
        totalDuration = chunkSizeSeconds - 1; // Force single file processing
      }
    } catch (error) {
      console.error('Error getting media duration:', error);
      console.log('Will process as single file without chunking');
      totalDuration = chunkSizeSeconds - 1; // Force single file processing
    }
    
    // If audio is shorter than chunk size, process as single file
    if (totalDuration <= chunkSizeSeconds) {
      console.log('>>> DECISION: Audio is shorter than chunk size, processing as SINGLE FILE');
      console.log('=== END AUDIO CHUNKING DEBUG ===\n');
      return transcribeSingleFile(audioPath, sttUrl, sttModel);
    }
    
    // Otherwise, split into chunks and process
    console.log('>>> DECISION: Audio is longer than chunk size, SPLITTING INTO CHUNKS');
    const chunks = Math.ceil(totalDuration / chunkSizeSeconds);
    console.log('Number of chunks to create:', chunks);
    console.log('Chunk duration:', chunkSizeSeconds, 'seconds each (except possibly last chunk)');
    
    const transcriptions = [];
    let chunksDir = '';
    
    // Add overlap to prevent cutting words (10 seconds overlap)
    const overlapSeconds = 10;
    console.log('Using overlap of', overlapSeconds, 'seconds between chunks');
    
    for (let i = 0; i < chunks; i++) {
      // Add overlap for all chunks except the first
      const startTime = i === 0 ? 0 : (i * chunkSizeSeconds) - overlapSeconds;
      const remainingDuration = totalDuration - startTime;
      const duration = Math.min(chunkSizeSeconds + (i === 0 ? 0 : overlapSeconds), remainingDuration);
      
      console.log(`\n--- CHUNK ${i + 1}/${chunks} ---`);
      console.log(`Start time: ${startTime}s ${i > 0 ? '(includes ' + overlapSeconds + 's overlap)' : ''}`);
      console.log(`End time: ${startTime + duration}s`);
      console.log(`Chunk duration: ${duration}s`);
      console.log(`Remaining audio: ${remainingDuration}s`);
      
      // For last chunk, ensure we capture everything
      const isLastChunk = i === chunks - 1;
      if (isLastChunk) {
        console.log(`>>> LAST CHUNK - ensuring we capture remaining ${remainingDuration}s`);
      }
      
      // Create chunk file in a dedicated chunks directory
      if (i === 0) {
        chunksDir = path.join(path.dirname(audioPath), 'audio_chunks', path.basename(audioPath, path.extname(audioPath)));
        
        // Create chunks directory if it doesn't exist
        if (!fs.existsSync(chunksDir)) {
          fs.mkdirSync(chunksDir, { recursive: true });
          console.log('Created chunks directory:', chunksDir);
        }
      }
      
      const chunkPath = path.join(chunksDir, `chunk_${(i + 1).toString().padStart(3, '0')}_${startTime}s-${startTime + duration}s.wav`);
      console.log('Chunk file path:', chunkPath);
      
      // Extract chunk using FFmpeg
      // For the last chunk, we omit the -t duration flag to ensure we get everything to the end
      let extractCommand;
      if (isLastChunk && duration < chunkSizeSeconds) {
        // Last chunk: extract from start time to end of file
        extractCommand = `"${ffmpegPath}" -i "${audioPath}" -ss ${startTime} -acodec copy "${chunkPath}" -y`;
        console.log('Extracting LAST chunk with FFmpeg (no duration limit, will extract to end)...');
      } else {
        // Regular chunk: extract specific duration
        extractCommand = `"${ffmpegPath}" -i "${audioPath}" -ss ${startTime} -t ${duration} -acodec copy "${chunkPath}" -y`;
        console.log('Extracting chunk with FFmpeg...');
      }
      console.log('Command:', extractCommand);
      
      const extractStart = Date.now();
      await execAsync(extractCommand);
      console.log(`Chunk extracted in ${Date.now() - extractStart}ms`);
      
      // Check chunk file size
      const chunkStats = fs.statSync(chunkPath);
      console.log('Chunk file size:', (chunkStats.size / 1024 / 1024).toFixed(2), 'MB');
      
      try {
        // Transcribe chunk
        console.log(`>>> SENDING CHUNK ${i + 1} TO STT SERVICE...`);
        const transcribeStart = Date.now();
        const chunkResult = await transcribeSingleFile(chunkPath, sttUrl, sttModel);
        const transcribeTime = Date.now() - transcribeStart;
        
        if (chunkResult.success && chunkResult.text) {
          transcriptions.push({
            index: i,
            text: chunkResult.text,
            hasOverlap: i > 0
          });
          console.log(`✓ CHUNK ${i + 1} TRANSCRIBED SUCCESSFULLY`);
          console.log(`  - Transcription time: ${transcribeTime}ms`);
          console.log(`  - Text length: ${chunkResult.text.length} characters`);
          console.log(`  - Preview: "${chunkResult.text.substring(0, 50)}..."`);
          console.log(`  - Last 50 chars: "...${chunkResult.text.substring(chunkResult.text.length - 50)}"`);
        } else {
          console.error(`✗ FAILED TO TRANSCRIBE CHUNK ${i + 1}:`, chunkResult.error);
          // Continue with other chunks even if one fails
        }
      } finally {
        // Keep chunk files for debugging
        console.log(`Chunk file saved at: ${chunkPath}`);
        // Uncomment the following to delete chunks after processing:
        // try {
        //   fs.unlinkSync(chunkPath);
        //   console.log('Chunk file deleted');
        // } catch (e) {
        //   console.error('Error deleting chunk file:', e);
        // }
      }
      
      // Send progress update
      if (event.sender && !event.sender.isDestroyed()) {
        event.sender.send('transcription-progress', {
          current: i + 1,
          total: chunks,
          percent: Math.round(((i + 1) / chunks) * 100)
        });
      }
    }
    
    // Combine all transcriptions with overlap removal
    console.log('\n=== COMBINING TRANSCRIPTIONS ===');
    console.log('Total chunks to combine:', transcriptions.length);
    
    let fullTranscription = '';
    
    if (transcriptions.length === 0) {
      console.warn('WARNING: No transcriptions to combine!');
    } else if (transcriptions.length === 1) {
      fullTranscription = transcriptions[0].text;
    } else {
      // Process chunks with overlap removal
      for (let i = 0; i < transcriptions.length; i++) {
        const chunk = transcriptions[i];
        
        if (i === 0) {
          // First chunk: use entire text
          fullTranscription = chunk.text;
          console.log(`Chunk 1: Using full text (${chunk.text.length} chars)`);
        } else {
          // Subsequent chunks: find overlap and merge
          const prevChunkEnd = fullTranscription.substring(fullTranscription.length - 100);
          const currChunkStart = chunk.text.substring(0, 100);
          
          console.log(`\nChunk ${i + 1} overlap detection:`);
          console.log(`Previous chunk ends with: "...${prevChunkEnd}"`);
          console.log(`Current chunk starts with: "${currChunkStart}..."`);
          
          // Try to find where the overlap starts in the current chunk
          // Look for the last 50 characters of previous chunk in the start of current chunk
          let overlapIndex = -1;
          let searchText = '';
          
          for (let searchLen = 50; searchLen >= 10; searchLen -= 5) {
            searchText = fullTranscription.substring(fullTranscription.length - searchLen);
            overlapIndex = chunk.text.indexOf(searchText);
            if (overlapIndex !== -1) {
              console.log(`Found overlap of ${searchLen} chars at position ${overlapIndex}`);
              break;
            }
          }
          
          if (overlapIndex > 0 && searchText) {
            // Found overlap, skip it
            const textToAdd = chunk.text.substring(overlapIndex + searchText.length);
            fullTranscription += textToAdd;
            console.log(`Added ${textToAdd.length} chars after removing overlap`);
          } else {
            // No clear overlap found, just add a space and append
            fullTranscription += ' ' + chunk.text;
            console.log(`No overlap found, added full chunk with space separator`);
          }
        }
      }
    }
    
    console.log('\n=== CHUNKING COMPLETE ===');
    console.log('Expected chunks:', chunks);
    console.log('Actual chunks processed:', transcriptions.length);
    if (chunks !== transcriptions.length) {
      console.warn('WARNING: Not all chunks were successfully transcribed!');
    }
    console.log('Combined transcription length:', fullTranscription.length, 'characters');
    console.log('Total audio duration:', totalDuration, 'seconds');
    console.log('Chunk files saved in:', chunksDir);
    console.log('To delete chunks, navigate to the directory and remove them manually');
    console.log('=== END AUDIO CHUNKING DEBUG ===\n');
    
    return {
      success: true,
      text: fullTranscription
    };
  } catch (error) {
    console.error('Transcription error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Helper function to transcribe a single audio file
async function transcribeSingleFile(audioPath, sttUrl, sttModel) {
  try {
    const { default: fetch } = await import('node-fetch');
    const FormData = require('form-data');
    
    console.log('\n>>> SINGLE FILE TRANSCRIPTION');
    console.log('File path:', audioPath);
    
    // Read audio file
    const audioBuffer = fs.readFileSync(audioPath);
    console.log('Audio blob size:', (audioBuffer.length / 1024 / 1024).toFixed(2), 'MB', `(${audioBuffer.length} bytes)`);
    
    // Create form data (OpenAI-compatible format)
    const formData = new FormData();
    formData.append('file', audioBuffer, {
      filename: 'audio.wav',
      contentType: 'audio/wav'
    });
    formData.append('model', sttModel);
    formData.append('response_format', 'json');
    formData.append('temperature', '0.0');
    // Add parameters to prevent hallucination
    formData.append('compression_ratio_threshold', '2.4');
    formData.append('log_prob_threshold', '-1.0');
    formData.append('no_speech_threshold', '0.6');
    formData.append('condition_on_previous_text', 'false');
    
    console.log('STT Service URL:', `${sttUrl}/v1/audio/transcriptions`);
    console.log('Model:', sttModel);
    console.log('>>> SENDING BLOB TO STT SERVICE...');
    
    const sendStart = Date.now();
    
    // Make request to STT service (OpenAI-compatible API)
    const response = await fetch(`${sttUrl}/v1/audio/transcriptions`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });
    
    const sendTime = Date.now() - sendStart;
    console.log(`<<< RESPONSE RECEIVED in ${sendTime}ms`);
    console.log('Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      // Log response body for debugging
      const errorText = await response.text();
      console.error('Error response body:', errorText);
      throw new Error(`STT service error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    const resultText = result.text || result.transcription || '';
    
    console.log('✓ TRANSCRIPTION SUCCESSFUL');
    console.log('Result text length:', resultText.length, 'characters');
    console.log('Preview:', resultText ? `"${resultText.substring(0, 100)}..."` : 'No text');
    console.log('<<< END SINGLE FILE TRANSCRIPTION\n');
    
    return {
      success: true,
      text: resultText
    };
  } catch (error) {
    console.error('✗ SINGLE FILE TRANSCRIPTION ERROR:', error.message);
    console.log('<<< END SINGLE FILE TRANSCRIPTION\n');
    return {
      success: false,
      error: error.message
    };
  }
}

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

// Real Embedding and Vector Store Services Implementation
const lancedb = require('@lancedb/lancedb');

// Simple text-based similarity fallback
// This provides a working solution while we can enhance it later with real embeddings
function simpleTextEmbedding(text) {
  // Simple TF-IDF-like approach for basic semantic similarity
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const wordFreq = {};
  
  // Count word frequencies
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });
  
  // Create a simple 384-dimensional vector (to match expected size)
  const embedding = new Array(384).fill(0);
  
  // Use word hashes to populate embedding dimensions
  Object.keys(wordFreq).forEach(word => {
    for (let i = 0; i < word.length && i < 384; i++) {
      const charCode = word.charCodeAt(i);
      const dimension = (charCode * (i + 1)) % 384;
      embedding[dimension] += wordFreq[word] / words.length;
    }
  });
  
  // Normalize the vector
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= magnitude;
    }
  }
  
  return embedding;
}

// Global instances
let embeddingPipeline = null;
let vectorStore = null;
let isEmbeddingInitialized = false;

// Embedding service implementation
ipcMain.handle('embedding-initialize', async () => {
  try {
    console.log('embedding-initialize called - current state:', { isEmbeddingInitialized });
    
    if (isEmbeddingInitialized) {
      console.log('Embedding already initialized, returning success');
      return { success: true };
    }

    console.log('Initializing simple text embedding service...');
    
    // For now, we'll use the simple text-based approach
    // This can be enhanced later with real transformers.js integration
    isEmbeddingInitialized = true;
    console.log('Embedding service initialized successfully (using simple text similarity)');
    
    return { success: true };
  } catch (error) {
    console.error('Failed to initialize embedding service:', error);
    isEmbeddingInitialized = false;
    return { success: false, error: error.message };
  }
});

ipcMain.handle('embedding-embed-text', async (event, { text, metadata }) => {
  try {
    console.log('embedText called - isEmbeddingInitialized:', isEmbeddingInitialized);
    
    if (!isEmbeddingInitialized) {
      console.error('Embedding service not ready - isInitialized:', isEmbeddingInitialized);
      throw new Error('Embedding service not initialized');
    }

    // Generate embedding using simple text-based approach
    const embedding = simpleTextEmbedding(text);

    return {
      embedding,
      text,
      metadata
    };
  } catch (error) {
    console.error('Failed to embed text:', error);
    throw error;
  }
});

ipcMain.handle('embedding-embed-batch', async (event, { texts, metadata }) => {
  try {
    if (!isEmbeddingInitialized) {
      throw new Error('Embedding service not initialized');
    }

    const results = [];
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      const embedding = simpleTextEmbedding(text);
      
      results.push({
        embedding,
        text,
        metadata: metadata?.[i]
      });
    }

    return results;
  } catch (error) {
    console.error('Failed to embed batch:', error);
    throw error;
  }
});

ipcMain.handle('embedding-update-config', async (event, config) => {
  console.log('Embedding config updated:', config);
  // Config updates would require reinitialization in a full implementation
  return { success: true };
});

// Vector store service implementation
class MainVectorStore {
  constructor() {
    this.db = null;
    this.table = null;
    this.isInitialized = false;
  }

  async initialize(dbPath) {
    try {
      if (this.isInitialized) {
        return;
      }

      // Use user data directory if no path specified
      const vectorDbPath = dbPath || path.join(app.getPath('userData'), 'vectordb');
      
      // Ensure directory exists
      if (!fs.existsSync(vectorDbPath)) {
        fs.mkdirSync(vectorDbPath, { recursive: true });
      }

      // Connect to LanceDB
      this.db = await lancedb.connect(vectorDbPath);
      
      // Try to open existing table or create new one
      try {
        this.table = await this.db.openTable('chunks');
        console.log('Opened existing chunks table');
      } catch (error) {
        // Create table if it doesn't exist
        const sampleData = [{
          id: 'sample',
          transcriptId: 'sample',
          text: 'sample text',
          vector: new Array(384).fill(0),
          startTime: 0,
          endTime: 1,
          speaker: null,
          chunkIndex: 0,
          wordCount: 2,
          speakers: [],
          method: 'sample',
          transcriptTitle: 'sample',
          transcriptSummary: 'sample',
          keyTopics: [],
          actionItems: [],
          totalSpeakers: 1,
          createdAt: new Date().toISOString()
        }];
        
        this.table = await this.db.createTable('chunks', sampleData);
        // Remove sample data
        await this.table.delete('id = "sample"');
        console.log('Created new chunks table');
      }

      this.isInitialized = true;
      console.log('Vector store initialized at:', vectorDbPath);
    } catch (error) {
      console.error('Failed to initialize vector store:', error);
      throw error;
    }
  }

  async storeChunks(chunks, embeddings) {
    try {
      if (!this.isInitialized) {
        throw new Error('Vector store not initialized');
      }

      const records = chunks.map((chunk, i) => {
        const embedding = embeddings[i];
        return {
          id: chunk.id,
          transcriptId: chunk.transcriptId,
          text: chunk.text,
          vector: embedding?.embedding || new Array(384).fill(0),
          startTime: chunk.startTime,
          endTime: chunk.endTime,
          speaker: chunk.speaker || null,
          chunkIndex: chunk.metadata?.chunkIndex || i,
          wordCount: chunk.metadata?.wordCount || chunk.text.split(' ').length,
          speakers: JSON.stringify(chunk.metadata?.speakers || []),
          method: chunk.metadata?.method || 'unknown',
          // Enhanced metadata from embedding
          transcriptTitle: embedding?.metadata?.transcriptTitle || '',
          transcriptSummary: embedding?.metadata?.transcriptSummary || '',
          keyTopics: JSON.stringify(embedding?.metadata?.keyTopics || []),
          actionItems: JSON.stringify(embedding?.metadata?.actionItems || []),
          totalSpeakers: embedding?.metadata?.totalSpeakers || 1,
          createdAt: new Date().toISOString()
        };
      });

      await this.table.add(records);
      console.log(`Stored ${records.length} chunks in vector database`);
    } catch (error) {
      console.error('Failed to store chunks:', error);
      throw error;
    }
  }

  async searchSimilar(queryEmbedding, options = {}) {
    try {
      if (!this.isInitialized) {
        throw new Error('Vector store not initialized');
      }

      let query = this.table.search(queryEmbedding).limit(options.limit || 10);
      
      // Add filters
      if (options.transcriptId) {
        query = query.where(`transcriptId = '${options.transcriptId}'`);
      }
      
      if (options.speaker) {
        query = query.where(`speaker = '${options.speaker}'`);
      }

      const results = await query.toArray();
      
      // Filter by minimum score if specified
      const filteredResults = options.minScore 
        ? results.filter(r => r._distance <= (1 - options.minScore))
        : results;

      // Transform to expected format
      return filteredResults.map((result, i) => ({
        chunk: {
          id: result.id,
          transcriptId: result.transcriptId,
          text: result.text,
          startTime: result.startTime,
          endTime: result.endTime,
          speaker: result.speaker,
          chunkIndex: result.chunkIndex,
          wordCount: result.wordCount,
          speakers: JSON.parse(result.speakers || '[]'),
          method: result.method,
          createdAt: result.createdAt
        },
        score: 1 - result._distance, // Convert distance to similarity score
        rank: i + 1
      }));
    } catch (error) {
      console.error('Failed to search similar chunks:', error);
      throw error;
    }
  }

  async deleteTranscriptChunks(transcriptId) {
    try {
      if (!this.isInitialized) {
        throw new Error('Vector store not initialized');
      }

      await this.table.delete(`transcriptId = '${transcriptId}'`);
      console.log(`Deleted chunks for transcript: ${transcriptId}`);
    } catch (error) {
      console.error('Failed to delete transcript chunks:', error);
      throw error;
    }
  }

  async getTranscriptChunks(transcriptId) {
    try {
      if (!this.isInitialized) {
        throw new Error('Vector store not initialized');
      }

      const results = await this.table.search([]).where(`transcriptId = '${transcriptId}'`).toArray();
      
      return results.map(result => ({
        id: result.id,
        transcriptId: result.transcriptId,
        text: result.text,
        vector: result.vector,
        startTime: result.startTime,
        endTime: result.endTime,
        speaker: result.speaker,
        chunkIndex: result.chunkIndex,
        wordCount: result.wordCount,
        speakers: JSON.parse(result.speakers || '[]'),
        method: result.method,
        createdAt: result.createdAt
      }));
    } catch (error) {
      console.error('Failed to get transcript chunks:', error);
      throw error;
    }
  }

  async updateChunks(chunks, embeddings) {
    try {
      // Delete existing chunks with same IDs
      for (const chunk of chunks) {
        await this.table.delete(`id = '${chunk.id}'`);
      }
      
      // Add updated chunks
      await this.storeChunks(chunks, embeddings);
    } catch (error) {
      console.error('Failed to update chunks:', error);
      throw error;
    }
  }

  async getStats() {
    try {
      if (!this.isInitialized) {
        return {
          totalChunks: 0,
          transcripts: [],
          avgChunkSize: 0,
          speakers: []
        };
      }

      const allChunks = await this.table.search([]).toArray();
      const transcriptIds = [...new Set(allChunks.map(c => c.transcriptId))];
      const speakers = [...new Set(allChunks.flatMap(c => JSON.parse(c.speakers || '[]')))];
      
      const avgChunkSize = allChunks.length > 0 
        ? allChunks.reduce((sum, c) => sum + (c.endTime - c.startTime), 0) / allChunks.length 
        : 0;

      return {
        totalChunks: allChunks.length,
        transcripts: transcriptIds,
        avgChunkSize,
        speakers
      };
    } catch (error) {
      console.error('Failed to get vector store stats:', error);
      return {
        totalChunks: 0,
        transcripts: [],
        avgChunkSize: 0,
        speakers: []
      };
    }
  }

  async close() {
    try {
      if (this.db) {
        await this.db.close();
      }
      this.isInitialized = false;
      console.log('Vector store closed');
    } catch (error) {
      console.error('Error closing vector store:', error);
    }
  }

  async reset() {
    try {
      if (this.isInitialized && this.table) {
        // Delete all records from the table
        await this.table.delete('1 = 1'); // Delete all
        console.log('Vector store reset - all chunks deleted');
      }
    } catch (error) {
      console.error('Error resetting vector store:', error);
      throw error;
    }
  }
}

// Initialize vector store
vectorStore = new MainVectorStore();

// Vector store IPC handlers
ipcMain.handle('vector-store-initialize', async (event, dbPath) => {
  try {
    await vectorStore.initialize(dbPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('vector-store-store-chunks', async (event, { chunks, embeddings }) => {
  try {
    await vectorStore.storeChunks(chunks, embeddings);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('vector-store-search-similar', async (event, { queryEmbedding, options }) => {
  try {
    const results = await vectorStore.searchSimilar(queryEmbedding, options);
    return results;
  } catch (error) {
    console.error('Vector search error:', error);
    return [];
  }
});

ipcMain.handle('vector-store-delete-transcript-chunks', async (event, transcriptId) => {
  try {
    await vectorStore.deleteTranscriptChunks(transcriptId);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('vector-store-get-transcript-chunks', async (event, transcriptId) => {
  try {
    const chunks = await vectorStore.getTranscriptChunks(transcriptId);
    return chunks;
  } catch (error) {
    console.error('Error getting transcript chunks:', error);
    return [];
  }
});

ipcMain.handle('vector-store-update-chunks', async (event, { chunks, embeddings }) => {
  try {
    await vectorStore.updateChunks(chunks, embeddings);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('vector-store-get-stats', async () => {
  try {
    return await vectorStore.getStats();
  } catch (error) {
    console.error('Error getting vector store stats:', error);
    return {
      totalChunks: 0,
      transcripts: [],
      avgChunkSize: 0,
      speakers: []
    };
  }
});

ipcMain.handle('vector-store-close', async () => {
  try {
    await vectorStore.close();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('vector-store-reset', async () => {
  try {
    await vectorStore.reset();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Cleanup on exit
app.on('before-quit', async () => {
  try {
    if (vectorStore) {
      await vectorStore.close();
    }
    if (db) {
      db.close();
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
});