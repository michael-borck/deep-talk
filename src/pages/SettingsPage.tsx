import React, { useState, useEffect, useContext } from 'react';
import { ServiceContext } from '../contexts/ServiceContext';
import { formatFileSize } from '../utils/helpers';
import { PromptsSettings } from '../components/PromptsSettings';
import { chatService } from '../services/chatService';

type SettingsTab = 'transcription' | 'processing' | 'chat' | 'prompts' | 'general';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('transcription');
  const [searchQuery, setSearchQuery] = useState('');
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
  const [availableSttModels, setAvailableSttModels] = useState<string[]>([]);
  const [loadingSttModels, setLoadingSttModels] = useState(false);
  const [vectorStats, setVectorStats] = useState<any>(null);
  
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
  const [audioChunkSize, setAudioChunkSize] = useState(60); // in seconds
  
  // Chat settings
  const [chatContextChunks, setChatContextChunks] = useState(4);
  const [chatMemoryLimit, setChatMemoryLimit] = useState(20);
  const [chatChunkingMethod, setChatChunkingMethod] = useState('speaker');
  const [chatMaxChunkSize, setChatMaxChunkSize] = useState(60);
  const [chatChunkOverlap, setChatChunkOverlap] = useState(10);
  const [conversationMode, setConversationMode] = useState('rag');
  const [directLlmContextLimit, setDirectLlmContextLimit] = useState(8000);
  const [vectorOnlyChunkCount, setVectorOnlyChunkCount] = useState(5);

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
      setSpeechToTextModel(settingsMap.speechToTextModel || 'Systran/faster-distil-whisper-medium.en');
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
      setAudioChunkSize(parseInt(settingsMap.audioChunkSize) || 60);
      
      // Load chat settings
      setChatContextChunks(parseInt(settingsMap.chatContextChunks) || 4);
      setChatMemoryLimit(parseInt(settingsMap.chatMemoryLimit) || 20);
      setChatChunkingMethod(settingsMap.chatChunkingMethod || 'speaker');
      setChatMaxChunkSize(parseInt(settingsMap.chatMaxChunkSize) || 60);
      setChatChunkOverlap(parseInt(settingsMap.chatChunkOverlap) || 10);
      setConversationMode(settingsMap.conversationMode || 'rag');
      setDirectLlmContextLimit(parseInt(settingsMap.directLlmContextLimit) || 8000);
      setVectorOnlyChunkCount(parseInt(settingsMap.vectorOnlyChunkCount) || 5);
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

  // Special handler for chat settings that need to update the chat service
  const saveChatSetting = async (key: string, value: string) => {
    await saveSetting(key, value);
    
    // Reload chat service configuration when chat settings change
    try {
      await chatService.reloadConfig();
    } catch (error) {
      console.error('Error reloading chat config:', error);
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

  const fetchSttModels = async () => {
    setLoadingSttModels(true);
    try {
      const response = await fetch(`${speechToTextUrl}/v1/models`);
      if (response.ok) {
        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
          // Filter for whisper models only
          const whisperModels = data.data
            .map((model: any) => model.id || model.name)
            .filter((modelName: string) => 
              modelName.toLowerCase().includes('whisper') || 
              modelName.toLowerCase().includes('systran')
            );
          setAvailableSttModels(whisperModels);
        } else {
          console.error('Unexpected response format:', data);
        }
      } else {
        console.error('Failed to fetch STT models:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching STT models:', error);
    } finally {
      setLoadingSttModels(false);
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
      defaultPath: `audioscribe-backup-${new Date().toISOString().split('T')[0]}.db`,
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

  const handleResetVectorDB = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to reset the vector database? This will delete all chat embeddings and you\'ll need to re-process transcripts for chat functionality.'
    );
    
    if (confirmed) {
      try {
        const result = await (window.electronAPI as any).vectorStore.reset();
        if (result.success) {
          alert('Vector database reset successfully! You\'ll need to re-process transcripts for chat.');
          setVectorStats(null);
        } else {
          alert(`Reset failed: ${result.error}`);
        }
      } catch (error) {
        alert(`Reset failed: ${error}`);
      }
    }
  };

  const handleGetVectorStats = async () => {
    try {
      const stats = await (window.electronAPI as any).vectorStore.getStats();
      setVectorStats(stats);
    } catch (error) {
      alert(`Failed to get statistics: ${error}`);
    }
  };

  const tabs = [
    { id: 'transcription' as const, label: '🎤 Transcription', name: 'Transcription' },
    { id: 'processing' as const, label: '🔧 Processing', name: 'Processing' },
    { id: 'chat' as const, label: '💬 Chat', name: 'Chat' },
    { id: 'prompts' as const, label: '🤖 Prompts', name: 'Prompts' },
    { id: 'general' as const, label: '⚙️ General', name: 'General' }
  ];

  // Search functionality
  const searchInSettings = (query: string) => {
    if (!query) return null;
    
    const lowerQuery = query.toLowerCase();
    const matches: { tab: SettingsTab; setting: string }[] = [];

    // Transcription tab settings
    if ('speech-to-text url service speaches'.includes(lowerQuery)) {
      matches.push({ tab: 'transcription', setting: 'Speech-to-Text Service URL' });
    }
    if ('model whisper stt speech'.includes(lowerQuery)) {
      matches.push({ tab: 'transcription', setting: 'Speech-to-Text Model' });
    }
    if ('chunk audio size'.includes(lowerQuery)) {
      matches.push({ tab: 'transcription', setting: 'Audio Chunk Size' });
    }

    // Processing tab settings
    if ('ai ollama analysis url'.includes(lowerQuery)) {
      matches.push({ tab: 'processing', setting: 'AI Analysis Service URL' });
    }
    if ('correction transcript validation spelling grammar'.includes(lowerQuery)) {
      matches.push({ tab: 'processing', setting: 'Transcript Correction' });
    }
    if ('speaker tagging detection'.includes(lowerQuery)) {
      matches.push({ tab: 'processing', setting: 'Speaker Tagging' });
    }
    if ('duplicate removal sentences'.includes(lowerQuery)) {
      matches.push({ tab: 'processing', setting: 'Duplicate Removal' });
    }

    // Chat tab settings
    if ('context chunks chat'.includes(lowerQuery)) {
      matches.push({ tab: 'chat', setting: 'Context Chunks' });
    }
    if ('memory limit conversation'.includes(lowerQuery)) {
      matches.push({ tab: 'chat', setting: 'Conversation Memory' });
    }

    // General tab settings
    if ('backup database storage'.includes(lowerQuery)) {
      matches.push({ tab: 'general', setting: 'Database Backup' });
    }
    if ('theme appearance dark light'.includes(lowerQuery)) {
      matches.push({ tab: 'general', setting: 'Theme' });
    }
    if ('vector database reset'.includes(lowerQuery)) {
      matches.push({ tab: 'general', setting: 'Vector Database' });
    }

    // Prompts tab settings
    if ('ai prompts template system chat analysis'.includes(lowerQuery)) {
      matches.push({ tab: 'prompts', setting: 'AI Prompts Configuration' });
    }
    if ('speaker detection tagging'.includes(lowerQuery)) {
      matches.push({ tab: 'prompts', setting: 'Speaker Prompts' });
    }
    if ('validation correction grammar spelling'.includes(lowerQuery)) {
      matches.push({ tab: 'prompts', setting: 'Validation Prompts' });
    }

    return matches.length > 0 ? matches : null;
  };

  const searchResults = searchInSettings(searchQuery);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'transcription':
        return (
          <div className="space-y-6">
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
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={speechToTextModel}
                      onChange={(e) => setSpeechToTextModel(e.target.value)}
                      onBlur={(e) => saveSetting('speechToTextModel', e.target.value)}
                      placeholder="Enter model name (e.g., Systran/faster-distil-whisper-medium.en)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                    <button 
                      onClick={fetchSttModels}
                      disabled={loadingSttModels}
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                    >
                      {loadingSttModels ? 'Loading...' : 'Refresh'}
                    </button>
                  </div>
                  {availableSttModels.length > 0 && (
                    <div className="mt-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Available whisper models:
                      </label>
                      <div className="flex flex-wrap gap-1">
                        {availableSttModels.map(model => (
                          <button
                            key={model}
                            onClick={() => {
                              setSpeechToTextModel(model);
                              saveSetting('speechToTextModel', model);
                            }}
                            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                          >
                            {model.split('/').pop() || model}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
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

            {/* Audio Processing */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-base font-medium text-gray-900 mb-4">
                Audio Processing
              </h3>
              
              <div className="space-y-4">
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
              </div>
            </div>
          </div>
        );

      case 'processing':
        return (
          <div className="space-y-6">
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

            {/* Transcript Enhancement */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-base font-medium text-gray-900 mb-4">
                Transcript Enhancement
              </h3>
              
              <div className="space-y-4">
                {/* Enable Transcript Correction */}
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
                    <span className="text-sm font-medium text-gray-700">Enable transcript correction</span>
                  </label>
                  <p className="text-xs text-gray-500 ml-6">
                    Use AI to correct spelling, grammar, and punctuation errors
                  </p>
                </div>

                {/* Correction Options */}
                {enableTranscriptValidation && (
                  <div className="ml-6 space-y-2">
                    <p className="text-sm font-medium text-gray-700 mb-2">Correction options:</p>
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

                {/* Analyze Corrected Transcript */}
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
                      <span className="text-sm font-medium text-gray-700">Analyze corrected transcript</span>
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

      case 'chat':
        return (
          <div className="space-y-6">
            {/* Conversation Modes */}
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h3 className="text-base font-medium text-gray-900 mb-4">
                💬 Conversation Modes
              </h3>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Choose how the chat system interacts with your transcripts. Each mode offers different trade-offs between speed, accuracy, and context.
                </p>

                {/* Conversation Mode Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Conversation Mode
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-white">
                      <input
                        type="radio"
                        name="conversationMode"
                        value="vector-only"
                        checked={conversationMode === 'vector-only'}
                        onChange={(e) => {
                          setConversationMode(e.target.value);
                          saveChatSetting('conversationMode', e.target.value);
                        }}
                        className="mt-0.5 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">🔍 Vector Search Only</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Returns relevant transcript excerpts directly without AI interpretation. 
                          <strong>Fastest</strong> and most factual - shows exact quotes with timestamps and relevance scores.
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          Best for: Finding specific information, quotes, or references
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-white">
                      <input
                        type="radio"
                        name="conversationMode"
                        value="rag"
                        checked={conversationMode === 'rag'}
                        onChange={(e) => {
                          setConversationMode(e.target.value);
                          saveChatSetting('conversationMode', e.target.value);
                        }}
                        className="mt-0.5 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">🤖 RAG Mode (Recommended)</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Retrieves relevant chunks and sends them to AI for interpretation and analysis. 
                          <strong>Balanced</strong> approach providing context-aware responses with good performance.
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          Best for: General questions, analysis, and interactive conversations
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-white">
                      <input
                        type="radio"
                        name="conversationMode"
                        value="direct-llm"
                        checked={conversationMode === 'direct-llm'}
                        onChange={(e) => {
                          setConversationMode(e.target.value);
                          saveChatSetting('conversationMode', e.target.value);
                        }}
                        className="mt-0.5 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">📄 Direct LLM Mode</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Sends the full transcript directly to AI for comprehensive analysis. 
                          <strong>Most thorough</strong> but slower and may hit context limits with long transcripts.
                        </div>
                        <div className="text-xs text-orange-600 mt-1">
                          Best for: Deep analysis, summaries, and questions requiring full context
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Mode-specific Settings */}
                {conversationMode === 'vector-only' && (
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Vector Search Settings</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Number of Excerpts to Show
                      </label>
                      <div className="flex items-center space-x-4">
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={vectorOnlyChunkCount}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            setVectorOnlyChunkCount(value);
                            saveChatSetting('vectorOnlyChunkCount', value.toString());
                          }}
                          className="flex-1"
                        />
                        <span className="text-sm text-gray-600 w-12 text-right">
                          {vectorOnlyChunkCount}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        More excerpts provide broader context but may include less relevant results
                      </p>
                    </div>
                  </div>
                )}

                {conversationMode === 'direct-llm' && (
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Direct LLM Settings</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Context Limit (characters)
                      </label>
                      <div className="flex items-center space-x-4">
                        <input
                          type="range"
                          min="2000"
                          max="16000"
                          step="1000"
                          value={directLlmContextLimit}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            setDirectLlmContextLimit(value);
                            saveChatSetting('directLlmContextLimit', value.toString());
                          }}
                          className="flex-1"
                        />
                        <span className="text-sm text-gray-600 w-20 text-right">
                          {(directLlmContextLimit / 1000).toFixed(0)}k
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Higher limits allow longer transcripts but may impact performance. Transcripts exceeding this limit will be truncated.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-base font-medium text-gray-900 mb-4">
                Advanced Chat Settings
              </h3>
              
              <div className="space-y-4">
                {/* Context Chunks */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Context Chunks
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={chatContextChunks}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setChatContextChunks(value);
                        saveChatSetting('chatContextChunks', value.toString());
                      }}
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {chatContextChunks}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Number of relevant transcript chunks to include in chat context (1-10)
                  </p>
                </div>

                {/* Chunking Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chunking Method
                  </label>
                  <select
                    value={chatChunkingMethod}
                    onChange={(e) => {
                      setChatChunkingMethod(e.target.value);
                      saveChatSetting('chatChunkingMethod', e.target.value);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="speaker">Speaker-based (recommended)</option>
                    <option value="time">Time-based</option>
                    <option value="hybrid">Hybrid (speaker + time limits)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    How to split transcripts for chat analysis
                  </p>
                </div>

                {/* Max Chunk Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Chunk Size (for chat)
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="30"
                      max="180"
                      step="15"
                      value={chatMaxChunkSize}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setChatMaxChunkSize(value);
                        saveChatSetting('chatMaxChunkSize', value.toString());
                      }}
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-600 w-20 text-right">
                      {chatMaxChunkSize}s ({Math.floor(chatMaxChunkSize / 60)}:{(chatMaxChunkSize % 60).toString().padStart(2, '0')})
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum duration for each chat chunk (30s to 3min)
                  </p>
                </div>

                {/* Chunk Overlap */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chunk Overlap
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="0"
                      max="30"
                      step="5"
                      value={chatChunkOverlap}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setChatChunkOverlap(value);
                        saveChatSetting('chatChunkOverlap', value.toString());
                      }}
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {chatChunkOverlap}s
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Overlap between chunks for better context continuity (0-30s)
                  </p>
                </div>

                {/* Memory Limit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Conversation Memory Limit
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="5"
                      max="50"
                      step="5"
                      value={chatMemoryLimit}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setChatMemoryLimit(value);
                        saveChatSetting('chatMemoryLimit', value.toString());
                      }}
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-600 w-20 text-right">
                      {chatMemoryLimit} msgs
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Number of messages to remember before compacting conversation history
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'prompts':
        return <PromptsSettings />;

      case 'general':
        return (
          <div className="space-y-6">
            {/* Storage & Backup */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-base font-medium text-gray-900 mb-4">
                Storage & Backup
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
            
            {/* Vector Database Management */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-base font-medium text-gray-900 mb-4">
                🤖 Chat Vector Database
              </h3>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  The vector database stores embeddings for chat functionality. Reset if you experience chat issues or after system updates.
                </p>
                
                <div className="flex space-x-2">
                  <button 
                    onClick={handleResetVectorDB}
                    className="px-4 py-2 border border-orange-300 text-orange-700 rounded-md hover:bg-orange-50"
                  >
                    Reset Vector Database
                  </button>
                  <button 
                    onClick={handleGetVectorStats}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    View Statistics
                  </button>
                </div>
                
                {vectorStats && (
                  <div className="text-sm text-gray-600 bg-white p-3 rounded border">
                    <p><strong>Total Chunks:</strong> {vectorStats.totalChunks}</p>
                    <p><strong>Processed Transcripts:</strong> {vectorStats.transcripts.length}</p>
                    <p><strong>Average Chunk Size:</strong> {vectorStats.avgChunkSize.toFixed(1)}s</p>
                    <p><strong>Speakers Found:</strong> {vectorStats.speakers.length}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Appearance */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-base font-medium text-gray-900 mb-4">
                Appearance
              </h3>
              
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

            {/* Privacy */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-base font-medium text-gray-900 mb-4">
                Privacy
              </h3>
              <p className="text-sm text-gray-600">
                AudioScribe stores all data locally on your computer. No data is sent to external services
                except for transcription and analysis processing through your configured services.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search settings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 w-64 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <svg 
            className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Search results hint */}
      {searchResults && (
        <div className="mb-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">
            Found {searchResults.length} matching setting{searchResults.length !== 1 ? 's' : ''}:
            {searchResults.map((result, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setActiveTab(result.tab);
                  setSearchQuery('');
                }}
                className="ml-2 text-blue-600 hover:underline"
              >
                {result.setting} ({tabs.find(t => t.id === result.tab)?.name})
              </button>
            ))}
          </p>
        </div>
      )}
      
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
        <button 
          onClick={() => {
            if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
              // Reset logic would go here
              window.location.reload();
            }
          }}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};