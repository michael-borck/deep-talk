import React, { useState, useEffect, useContext } from 'react';
import { ServiceContext } from '../contexts/ServiceContext';
import { formatFileSize } from '../utils/helpers';

type SettingsTab = 'services' | 'storage' | 'appearance' | 'privacy' | 'about';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('services');
  const { testConnections, serviceStatus } = useContext(ServiceContext);
  
  // Settings state
  const [speechToTextUrl, setSpeechToTextUrl] = useState('https://speaches.serveur.au');
  const [speechToTextModel, setSpeechToTextModel] = useState('Systran/faster-distil-whisper-small.en');
  const [aiAnalysisUrl, setAiAnalysisUrl] = useState('http://localhost:11434');
  const [aiModel, setAiModel] = useState('llama2');
  const [autoBackup, setAutoBackup] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState('weekly');
  const [theme, setTheme] = useState('system');
  const [databaseInfo, setDatabaseInfo] = useState<any>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  
  // Transcript processing settings
  const [enableTranscriptValidation, setEnableTranscriptValidation] = useState(true);
  const [validationOptions, setValidationOptions] = useState({
    spelling: true,
    grammar: true,
    punctuation: true,
    capitalization: true
  });
  const [enableDuplicateRemoval, setEnableDuplicateRemoval] = useState(true);
  const [analyzeValidatedTranscript, setAnalyzeValidatedTranscript] = useState(true);
  const [enableSpeakerTagging, setEnableSpeakerTagging] = useState(false);
  const [oneTaskAtATime, setOneTaskAtATime] = useState(true);
  const [audioChunkSize, setAudioChunkSize] = useState(300); // in seconds

  useEffect(() => {
    loadSettings();
    loadDatabaseInfo();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await window.electronAPI.database.all(
        'SELECT key, value FROM settings'
      );
      
      const settingsMap = settings.reduce((acc: any, { key, value }: any) => {
        acc[key] = value;
        return acc;
      }, {});

      setSpeechToTextUrl(settingsMap.speechToTextUrl || 'https://speaches.serveur.au');
      setSpeechToTextModel(settingsMap.speechToTextModel || 'Systran/faster-distil-whisper-small.en');
      setAiAnalysisUrl(settingsMap.aiAnalysisUrl || 'http://localhost:11434');
      setAiModel(settingsMap.aiModel || 'llama2');
      setAutoBackup(settingsMap.autoBackup === 'true');
      setBackupFrequency(settingsMap.backupFrequency || 'weekly');
      setTheme(settingsMap.theme || 'system');
      
      // Load transcript processing settings
      setEnableTranscriptValidation(settingsMap.enableTranscriptValidation !== 'false');
      if (settingsMap.validationOptions) {
        try {
          setValidationOptions(JSON.parse(settingsMap.validationOptions));
        } catch (e) {
          console.error('Error parsing validation options:', e);
        }
      }
      setAnalyzeValidatedTranscript(settingsMap.analyzeValidatedTranscript !== 'false');
      setEnableSpeakerTagging(settingsMap.enableSpeakerTagging === 'true');
      setEnableDuplicateRemoval(settingsMap.enableDuplicateRemoval !== 'false');
      setOneTaskAtATime(settingsMap.oneTaskAtATime !== 'false');
      setAudioChunkSize(parseInt(settingsMap.audioChunkSize) || 300);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadDatabaseInfo = async () => {
    try {
      const info = await (window.electronAPI as any).getDatabaseInfo();
      setDatabaseInfo(info);
    } catch (error) {
      console.error('Error loading database info:', error);
    }
  };

  const saveSetting = async (key: string, value: string) => {
    try {
      await window.electronAPI.database.run(
        'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
        [key, value]
      );
    } catch (error) {
      console.error('Error saving setting:', error);
    }
  };

  const handleTestConnection = async (service: 'speaches' | 'ollama') => {
    const url = service === 'speaches' ? speechToTextUrl : aiAnalysisUrl;
    const result = await window.electronAPI.services.testConnection(url, service);
    
    if (result.success) {
      alert(`✅ Successfully connected to ${service}`);
    } else {
      alert(`❌ Failed to connect: ${result.error}`);
    }
    
    await testConnections();
  };

  const fetchOllamaModels = async () => {
    setLoadingModels(true);
    try {
      const result = await window.electronAPI.services.getOllamaModels(aiAnalysisUrl);
      if (result.success && result.models) {
        const modelNames = result.models.map((model: any) => model.name);
        setAvailableModels(modelNames);
      } else {
        console.error('Failed to fetch models:', result.error);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleChangeLocation = async () => {
    const result = await window.electronAPI.dialog.saveFile({
      defaultPath: databaseInfo?.path,
      filters: [{ name: 'Folders', extensions: ['*'] }]
    });
    
    if (result) {
      const newPath = result.replace(/[^/\\]*$/, ''); // Get directory part
      const changeResult = await (window.electronAPI as any).changeDatabaseLocation(newPath);
      
      if (changeResult.success) {
        alert('Database location changed successfully. The app will reload.');
        window.location.reload();
      } else {
        alert(`Failed to change location: ${changeResult.error}`);
      }
    }
  };

  const handleOpenFolder = () => {
    if (databaseInfo?.path) {
      (window.electronAPI as any).shell.showItemInFolder(databaseInfo.path);
    }
  };

  const handleBackupNow = async () => {
    const result = await window.electronAPI.dialog.saveFile({
      defaultPath: `locallisten-backup-${new Date().toISOString().split('T')[0]}.db`,
      filters: [{ name: 'Database', extensions: ['db'] }]
    });
    
    if (result) {
      const backupResult = await (window.electronAPI as any).backupDatabase(result);
      if (backupResult.success) {
        alert('Database backed up successfully!');
      } else {
        alert(`Backup failed: ${backupResult.error}`);
      }
    }
  };

  const tabs = [
    { id: 'services' as const, label: '🔌 Services', name: 'Services' },
    { id: 'storage' as const, label: '📁 Storage', name: 'Storage' },
    { id: 'appearance' as const, label: '🎨 Appearance', name: 'Appearance' },
    { id: 'privacy' as const, label: '🔒 Privacy', name: 'Privacy' },
    { id: 'about' as const, label: 'ℹ️ About', name: 'About' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'services':
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">External Services</h2>
            
            {/* Speech-to-Text Service */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-base font-medium text-gray-900 mb-4">
                Speech-to-Text Service (Speaches)
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service URL
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={speechToTextUrl}
                      onChange={(e) => {
                        setSpeechToTextUrl(e.target.value);
                        saveSetting('speechToTextUrl', e.target.value);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                    <button
                      onClick={() => handleTestConnection('speaches')}
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                    >
                      Test
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Speech-to-Text Model
                  </label>
                  <input
                    type="text"
                    value={speechToTextModel}
                    onChange={(e) => setSpeechToTextModel(e.target.value)}
                    onBlur={(e) => saveSetting('speechToTextModel', e.target.value)}
                    placeholder="Enter model name (e.g., Systran/faster-distil-whisper-small.en)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                  <div className="mt-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Common models:
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {[
                        'Systran/faster-distil-whisper-small.en',
                        'Systran/faster-distil-whisper-medium.en',
                        'Systran/faster-distil-whisper-large-v3',
                        'openai/whisper-tiny',
                        'openai/whisper-small',
                        'openai/whisper-medium',
                        'openai/whisper-large'
                      ].map(model => (
                        <button
                          key={model}
                          onClick={() => {
                            setSpeechToTextModel(model);
                            saveSetting('speechToTextModel', model);
                          }}
                          className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                        >
                          {model.split('/').pop()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Status:</span>
                  <div className={`w-2 h-2 rounded-full ${
                    serviceStatus.speechToText === 'connected' ? 'bg-green-500' :
                    serviceStatus.speechToText === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                  }`} />
                  <span className="text-sm text-gray-700 capitalize">
                    {serviceStatus.speechToText}
                  </span>
                </div>
              </div>
            </div>

            {/* AI Analysis Service */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-base font-medium text-gray-900 mb-4">
                AI Analysis Service (Ollama)
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service URL
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={aiAnalysisUrl}
                      onChange={(e) => {
                        setAiAnalysisUrl(e.target.value);
                        saveSetting('aiAnalysisUrl', e.target.value);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                    <button
                      onClick={() => handleTestConnection('ollama')}
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                    >
                      Test
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={aiModel}
                      onChange={(e) => setAiModel(e.target.value)}
                      onBlur={(e) => saveSetting('aiModel', e.target.value)}
                      placeholder="Enter model name (e.g., llama2, mistral, codellama)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                    <button 
                      onClick={fetchOllamaModels}
                      disabled={loadingModels}
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                    >
                      {loadingModels ? 'Loading...' : 'Refresh'}
                    </button>
                  </div>
                  {availableModels.length > 0 && (
                    <div className="mt-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Available models:
                      </label>
                      <div className="flex flex-wrap gap-1">
                        {availableModels.map(model => (
                          <button
                            key={model}
                            onClick={() => {
                              setAiModel(model);
                              saveSetting('aiModel', model);
                            }}
                            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                          >
                            {model}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Status:</span>
                  <div className={`w-2 h-2 rounded-full ${
                    serviceStatus.aiAnalysis === 'connected' ? 'bg-green-500' :
                    serviceStatus.aiAnalysis === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                  }`} />
                  <span className="text-sm text-gray-700 capitalize">
                    {serviceStatus.aiAnalysis}
                  </span>
                </div>
              </div>
            </div>

            {/* Transcript Processing Settings */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-base font-medium text-gray-900 mb-4">
                Transcript Processing
              </h3>
              
              <div className="space-y-4">
                {/* Audio Chunk Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Audio Chunk Size (for long files)
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="30"
                      max="300"
                      step="30"
                      value={audioChunkSize}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setAudioChunkSize(value);
                        saveSetting('audioChunkSize', value.toString());
                      }}
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-600 w-20 text-right">
                      {audioChunkSize}s ({Math.floor(audioChunkSize / 60)}:{(audioChunkSize % 60).toString().padStart(2, '0')})
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Splits long audio into chunks for better transcription accuracy (30s to 5min)
                  </p>
                </div>

                {/* Enable Validation */}
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={enableTranscriptValidation}
                      onChange={(e) => {
                        setEnableTranscriptValidation(e.target.checked);
                        saveSetting('enableTranscriptValidation', e.target.checked.toString());
                      }}
                      className="rounded text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Enable transcript validation</span>
                  </label>
                  <p className="text-xs text-gray-500 ml-6">
                    Use AI to correct spelling, grammar, and punctuation errors
                  </p>
                </div>

                {/* Validation Options */}
                {enableTranscriptValidation && (
                  <div className="ml-6 space-y-2">
                    <p className="text-sm font-medium text-gray-700 mb-2">Validation options:</p>
                    {Object.entries(validationOptions).map(([key, value]) => (
                      <label key={key} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => {
                            const newOptions = { ...validationOptions, [key]: e.target.checked };
                            setValidationOptions(newOptions);
                            saveSetting('validationOptions', JSON.stringify(newOptions));
                          }}
                          className="rounded text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-600 capitalize">{key}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Analyze Validated Transcript */}
                {enableTranscriptValidation && (
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={analyzeValidatedTranscript}
                        onChange={(e) => {
                          setAnalyzeValidatedTranscript(e.target.checked);
                          saveSetting('analyzeValidatedTranscript', e.target.checked.toString());
                        }}
                        className="rounded text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Analyze validated transcript</span>
                    </label>
                    <p className="text-xs text-gray-500 ml-6">
                      Use the corrected transcript for AI analysis (unchecked uses original)
                    </p>
                  </div>
                )}

                {/* Automatic Speaker Tagging */}
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={enableSpeakerTagging}
                      onChange={(e) => {
                        setEnableSpeakerTagging(e.target.checked);
                        saveSetting('enableSpeakerTagging', e.target.checked.toString());
                      }}
                      className="rounded text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Automatic speaker tagging</span>
                  </label>
                  <p className="text-xs text-gray-500 ml-6">
                    Automatically add speaker labels like "[Speaker 1]:" when multiple speakers are detected
                  </p>
                </div>

                {/* Remove Duplicate Sentences */}
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={enableDuplicateRemoval}
                      onChange={(e) => {
                        setEnableDuplicateRemoval(e.target.checked);
                        saveSetting('enableDuplicateRemoval', e.target.checked.toString());
                      }}
                      className="rounded text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Remove duplicate sentences</span>
                  </label>
                  <p className="text-xs text-gray-500 ml-6">
                    Automatically detect and remove repeated sentences during processing
                  </p>
                </div>

                {/* Analysis Mode */}
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={oneTaskAtATime}
                      onChange={(e) => {
                        setOneTaskAtATime(e.target.checked);
                        saveSetting('oneTaskAtATime', e.target.checked.toString());
                      }}
                      className="rounded text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">One-task-at-a-time analysis (recommended)</span>
                  </label>
                  <p className="text-xs text-gray-500 ml-6">
                    Run individual analysis tasks separately for better accuracy and reliability. Fixes speaker detection issues.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'storage':
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Storage & Data</h2>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-base font-medium text-gray-900 mb-4">
                Database Location
              </h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 break-all">
                    {databaseInfo?.path || 'Loading...'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Size: {databaseInfo ? formatFileSize(databaseInfo.size) : '...'} | 
                    Modified: {databaseInfo ? new Date(databaseInfo.modified).toLocaleDateString() : '...'}
                  </p>
                </div>
                
                <div className="flex space-x-2">
                  <button 
                    onClick={handleChangeLocation}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Change Location
                  </button>
                  <button 
                    onClick={handleOpenFolder}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Open Folder
                  </button>
                  <button 
                    onClick={handleBackupNow}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  >
                    Backup Now
                  </button>
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={autoBackup}
                      onChange={(e) => {
                        setAutoBackup(e.target.checked);
                        saveSetting('autoBackup', e.target.checked.toString());
                      }}
                      className="rounded text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Auto-backup</span>
                  </label>
                  
                  {autoBackup && (
                    <div className="ml-6">
                      <select
                        value={backupFrequency}
                        onChange={(e) => {
                          setBackupFrequency(e.target.value);
                          saveSetting('backupFrequency', e.target.value);
                        }}
                        className="text-sm px-3 py-1 border border-gray-300 rounded-md"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Appearance</h2>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Theme
                  </label>
                  <select
                    value={theme}
                    onChange={(e) => {
                      setTheme(e.target.value);
                      saveSetting('theme', e.target.value);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Privacy</h2>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-sm text-gray-600">
                LocalListen stores all data locally on your computer. No data is sent to external services
                except for transcription and analysis processing.
              </p>
            </div>
          </div>
        );

      case 'about':
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">About LocalListen</h2>
            
            {/* App Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">🎤</div>
                <h3 className="text-2xl font-bold text-gray-900">LocalListen</h3>
                <p className="text-lg text-gray-600 mt-2">Version 1.0.0</p>
                <p className="text-gray-500 mt-1">AI-Powered Transcription & Analysis</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Platform:</span>
                  <span className="text-gray-900">{window.electronAPI?.platform === 'darwin' ? 'macOS' : window.electronAPI?.platform === 'win32' ? 'Windows' : 'Linux'}</span>
                </div>
                
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Database:</span>
                  <span className="text-gray-900">SQLite 3.42.0</span>
                </div>
                
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Electron:</span>
                  <span className="text-gray-900">{window.electronAPI?.versions?.electron || 'N/A'}</span>
                </div>
                
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Node.js:</span>
                  <span className="text-gray-900">{window.electronAPI?.versions?.node || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Support & Help */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Support & Help</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => console.log('Open user guide')}
                  className="flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <span>📚</span>
                  <span>User Guide</span>
                </button>
                
                <button
                  onClick={() => console.log('Report bug')}
                  className="flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <span>🐛</span>
                  <span>Report Bug</span>
                </button>
                
                <button
                  onClick={() => console.log('Feature request')}
                  className="flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <span>💡</span>
                  <span>Feature Request</span>
                </button>
                
                <button
                  onClick={() => console.log('Contact support')}
                  className="flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <span>📧</span>
                  <span>Contact Support</span>
                </button>
              </div>
              
              <button
                onClick={() => console.log('Check for updates')}
                className="w-full mt-4 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                🔄 Check for Updates
              </button>
            </div>

            {/* Legal */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Legal</h3>
              
              <div className="text-center space-y-4">
                <div className="flex justify-center space-x-4 text-sm">
                  <button className="text-blue-600 hover:text-blue-700">
                    Privacy Policy
                  </button>
                  <span className="text-gray-400">•</span>
                  <button className="text-blue-600 hover:text-blue-700">
                    Terms of Service
                  </button>
                  <span className="text-gray-400">•</span>
                  <button className="text-blue-600 hover:text-blue-700">
                    Licenses
                  </button>
                </div>
                
                <p className="text-gray-600">
                  © 2024 Your Institution
                </p>
                
                <p className="text-gray-500 text-sm">
                  Built with ❤️ for Academic Research
                </p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Settings</h1>
      
      {/* Tab navigation */}
      <div className="flex space-x-6 mb-6 border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              pb-3 text-sm font-medium transition-colors relative
              ${activeTab === tab.id 
                ? 'text-primary-600' 
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
            )}
          </button>
        ))}
      </div>
      
      {/* Tab content */}
      <div>{renderTabContent()}</div>
      
      {/* Action buttons */}
      <div className="mt-8 flex space-x-3">
        <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
          Reset to Defaults
        </button>
        <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
          Import Settings
        </button>
        <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
          Export Settings
        </button>
      </div>
    </div>
  );
};