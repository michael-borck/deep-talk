import React, { useState, useEffect, useContext } from 'react';
import { Mic, Cog, MessageCircle, Bot, Settings, Database } from 'lucide-react';
import { ServiceContext } from '../contexts/ServiceContext';
import { formatFileSize } from '../utils/helpers';
import { PromptsSettings } from '../components/PromptsSettings';
import { Collapsible } from '../components/Collapsible';
import { chatService } from '../services/chatService';

type SettingsTab = 'transcription' | 'processing' | 'chat' | 'prompts' | 'general';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('transcription');
  const [searchQuery, setSearchQuery] = useState('');
  const { testConnections, serviceStatus } = useContext(ServiceContext);
  
  // Settings state
  const [localTranscriptionModel, setLocalTranscriptionModel] = useState('Xenova/whisper-tiny.en');
  const [transcriptionModelStatus, setTranscriptionModelStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [transcriptionModelMessage, setTranscriptionModelMessage] = useState<string>('');
  const [aiAnalysisUrl, setAiAnalysisUrl] = useState('http://localhost:11434');
  const [aiModel, setAiModel] = useState('llama2');
  const [autoBackup, setAutoBackup] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState('weekly');
  const [theme, setTheme] = useState('system');
  const [databaseInfo, setDatabaseInfo] = useState<any>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
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
  const [enableSpeakerDiarisation, setEnableSpeakerDiarisation] = useState(true);
  const [oneTaskAtATime, setOneTaskAtATime] = useState(true);
  
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

      setLocalTranscriptionModel(settingsMap.localTranscriptionModel || 'Xenova/whisper-tiny.en');
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
      setEnableSpeakerDiarisation(settingsMap.enableSpeakerDiarisation !== 'false');
      setEnableDuplicateRemoval(settingsMap.enableDuplicateRemoval !== 'false');
      setOneTaskAtATime(settingsMap.oneTaskAtATime !== 'false');
      
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

  const handleTestOllamaConnection = async () => {
    const result = await window.electronAPI.services.testConnection(aiAnalysisUrl);
    if (result.success) {
      alert('Successfully connected to AI analysis service');
    } else {
      alert(`Failed to connect: ${result.error}`);
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

  // Pre-load the local Whisper model so the first transcription doesn't pay
  // the download cost. Streams progress messages from the main process.
  const handleDownloadWhisperModel = async () => {
    setTranscriptionModelStatus('loading');
    setTranscriptionModelMessage('Initialising...');

    const onProgress = (data: { status: string; file?: string; progress?: number }) => {
      if (data.status === 'progress' && data.progress != null) {
        setTranscriptionModelMessage(`Downloading ${data.file || 'model'}: ${data.progress.toFixed(0)}%`);
      } else if (data.status === 'done') {
        setTranscriptionModelMessage(`Downloaded ${data.file || 'file'}`);
      } else if (data.status === 'ready') {
        setTranscriptionModelMessage('Model ready');
      } else if (data.status === 'initiate') {
        setTranscriptionModelMessage(`Starting ${data.file || 'download'}...`);
      }
    };

    window.electronAPI.audio.onTranscriptionProgress(onProgress);

    try {
      const result = await window.electronAPI.audio.loadTranscriptionModel(localTranscriptionModel);
      if (result.success) {
        setTranscriptionModelStatus('ready');
        setTranscriptionModelMessage('Model ready');
      } else {
        setTranscriptionModelStatus('error');
        setTranscriptionModelMessage(result.error || 'Failed to load model');
      }
    } catch (error) {
      setTranscriptionModelStatus('error');
      setTranscriptionModelMessage((error as Error).message);
    } finally {
      window.electronAPI.audio.offTranscriptionProgress();
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
      defaultPath: `deeptalk-backup-${new Date().toISOString().split('T')[0]}.db`,
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
    { id: 'transcription' as const, label: 'Transcription', name: 'Transcription', icon: Mic },
    { id: 'processing' as const, label: 'Processing', name: 'Processing', icon: Cog },
    { id: 'chat' as const, label: 'Chat', name: 'Chat', icon: MessageCircle },
    { id: 'prompts' as const, label: 'AI Prompts', name: 'Prompts', icon: Bot },
    { id: 'general' as const, label: 'General', name: 'General', icon: Settings }
  ];

  // Search functionality
  const searchInSettings = (query: string) => {
    if (!query) return null;
    
    const lowerQuery = query.toLowerCase();
    const matches: { tab: SettingsTab; setting: string }[] = [];

    // Transcription tab settings
    if ('whisper model transcription speech-to-text local'.includes(lowerQuery)) {
      matches.push({ tab: 'transcription', setting: 'Local Whisper Model' });
    }
    if ('download model offline'.includes(lowerQuery)) {
      matches.push({ tab: 'transcription', setting: 'Download Whisper Model' });
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
            {/* Local Whisper Model */}
            <div className="panel">
              <h3 className="section-title mb-2">
                Transcription Model
              </h3>
              <p className="text-sm text-surface-600 mb-5">
                Whisper runs entirely on your computer — no server, no internet connection during transcription. Choose a model based on the trade-off you want between speed and accuracy. Models are downloaded once and reused.
              </p>

              <div className="space-y-3">
                {[
                  {
                    id: 'Xenova/whisper-tiny.en',
                    name: 'Tiny (English)',
                    size: '~75 MB',
                    desc: 'Fastest. Good for quick drafts and short audio. Lower accuracy in noisy or accented speech.',
                    recommended: true,
                  },
                  {
                    id: 'Xenova/whisper-base.en',
                    name: 'Base (English)',
                    size: '~140 MB',
                    desc: 'Balanced. Noticeably more accurate than Tiny, still fast on most laptops.',
                  },
                  {
                    id: 'Xenova/whisper-small.en',
                    name: 'Small (English)',
                    size: '~470 MB',
                    desc: 'Best accuracy in this set. Slower; recommended only if you have a fast machine and want the cleanest transcripts.',
                  },
                ].map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      localTranscriptionModel === opt.id
                        ? 'border-primary-400 bg-primary-50'
                        : 'border-surface-200 hover:bg-surface-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="whisperModel"
                      value={opt.id}
                      checked={localTranscriptionModel === opt.id}
                      onChange={(e) => {
                        setLocalTranscriptionModel(e.target.value);
                        saveSetting('localTranscriptionModel', e.target.value);
                        setTranscriptionModelStatus('idle');
                        setTranscriptionModelMessage('');
                      }}
                      className="mt-1 text-primary-800 focus:ring-primary-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-surface-900">{opt.name}</span>
                        <span className="text-xs text-surface-500">{opt.size}</span>
                        {opt.recommended && (
                          <span className="badge badge-info text-[10px]">Recommended</span>
                        )}
                      </div>
                      <p className="text-xs text-surface-600 mt-1">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-5 pt-5 border-t border-surface-200">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-700">Download model now (optional)</p>
                    <p className="text-xs text-surface-500 mt-0.5">
                      The model will download automatically the first time you transcribe a file. Click here to fetch it now if you want to be ready to work offline.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadWhisperModel}
                    disabled={transcriptionModelStatus === 'loading'}
                    className="btn-primary flex-shrink-0"
                  >
                    {transcriptionModelStatus === 'loading' ? 'Downloading...' : 'Download'}
                  </button>
                </div>
                {transcriptionModelMessage && (
                  <div className={`mt-3 text-xs p-2 rounded-lg ${
                    transcriptionModelStatus === 'error'
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : transcriptionModelStatus === 'ready'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-surface-100 text-surface-700 border border-surface-200'
                  }`}>
                    {transcriptionModelMessage}
                  </div>
                )}
              </div>
            </div>
          </div>
        );


      case 'processing':
        return (
          <div className="space-y-6">
            {/* AI Analysis Service */}
            <div className="panel">
              <h3 className="section-title mb-4">
                AI Analysis Service
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="label">
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
                      className="input flex-1"
                    />
                    <button
                      onClick={handleTestOllamaConnection}
                      className="btn-primary"
                    >
                      Test
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="label">
                    Model
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={aiModel}
                      onChange={(e) => setAiModel(e.target.value)}
                      onBlur={(e) => saveSetting('aiModel', e.target.value)}
                      placeholder="Enter model name (e.g., llama2, mistral, codellama)"
                      className="input flex-1"
                    />
                    <button 
                      onClick={fetchOllamaModels}
                      disabled={loadingModels}
                      className="btn-secondary"
                    >
                      {loadingModels ? 'Loading...' : 'Refresh'}
                    </button>
                  </div>
                  {availableModels.length > 0 && (
                    <div className="mt-2">
                      <label className="label">
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
                            className="text-xs px-2 py-1 bg-surface-100 hover:bg-surface-200 rounded text-surface-700"
                          >
                            {model}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-surface-600">Status:</span>
                  <div className={`w-2 h-2 rounded-full ${
                    serviceStatus.aiAnalysis === 'connected' ? 'bg-green-500' :
                    serviceStatus.aiAnalysis === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                  }`} />
                  <span className="text-sm text-surface-700 capitalize">
                    {serviceStatus.aiAnalysis}
                  </span>
                </div>
              </div>
            </div>

            {/* Transcript Enhancement */}
            <div className="panel">
              <h3 className="section-title mb-4">
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
                      className="rounded text-primary-800 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-surface-700">Enable transcript correction</span>
                  </label>
                  <p className="text-xs text-surface-500 ml-6">
                    Use AI to correct spelling, grammar, and punctuation errors
                  </p>
                </div>

                {/* Correction Options */}
                {enableTranscriptValidation && (
                  <div className="ml-6 space-y-2">
                    <p className="text-sm font-medium text-surface-700 mb-2">Correction options:</p>
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
                          className="rounded text-primary-800 focus:ring-primary-500"
                        />
                        <span className="text-sm text-surface-600 capitalize">{key}</span>
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
                        className="rounded text-primary-800 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-surface-700">Analyze corrected transcript</span>
                    </label>
                    <p className="text-xs text-surface-500 ml-6">
                      Use the corrected transcript for AI analysis (unchecked uses original)
                    </p>
                  </div>
                )}

                {/* Speaker Detection (audio-level diarisation) */}
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={enableSpeakerDiarisation}
                      onChange={(e) => {
                        setEnableSpeakerDiarisation(e.target.checked);
                        saveSetting('enableSpeakerDiarisation', e.target.checked.toString());
                      }}
                      className="rounded text-primary-800 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-surface-700">Detect speakers from audio</span>
                  </label>
                  <p className="text-xs text-surface-500 ml-6">
                    Identifies who is speaking using voice fingerprints — much more accurate than guessing from text. Adds about 1× the audio length to processing time. Turn off for single-speaker recordings to save time.
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
                      className="rounded text-primary-800 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-surface-700">Remove duplicate sentences</span>
                  </label>
                  <p className="text-xs text-surface-500 ml-6">
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
                      className="rounded text-primary-800 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-surface-700">One-task-at-a-time analysis (recommended)</span>
                  </label>
                  <p className="text-xs text-surface-500 ml-6">
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
            <div className="bg-primary-50 rounded-xl p-6 border border-primary-100">
              <h3 className="section-title mb-4 flex items-center gap-2">
                <MessageCircle size={16} className="text-primary-700" />
                Conversation Modes
              </h3>
              
              <div className="space-y-4">
                <p className="text-sm text-surface-600">
                  Choose how the chat system interacts with your transcripts. Each mode offers different trade-offs between speed, accuracy, and context.
                </p>

                {/* Conversation Mode Selection */}
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-3">
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
                        className="mt-0.5 text-primary-800 focus:ring-primary-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-surface-900">Quote Lookup</div>
                        <div className="text-sm text-surface-600 mt-1">
                          Returns relevant transcript excerpts directly without AI interpretation. 
                          <strong>Fastest</strong> and most factual - shows exact quotes with timestamps and relevance scores.
                        </div>
                        <div className="text-xs text-primary-800 mt-1">
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
                        className="mt-0.5 text-primary-800 focus:ring-primary-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-surface-900">Smart Search (Recommended)</div>
                        <div className="text-sm text-surface-600 mt-1">
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
                        className="mt-0.5 text-primary-800 focus:ring-primary-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-surface-900">Full Transcript</div>
                        <div className="text-sm text-surface-600 mt-1">
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
                    <h4 className="text-sm font-medium text-surface-900 mb-2">Vector Search Settings</h4>
                    <div>
                      <label className="label">
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
                        <span className="text-sm text-surface-600 w-12 text-right">
                          {vectorOnlyChunkCount}
                        </span>
                      </div>
                      <p className="text-xs text-surface-500 mt-1">
                        More excerpts provide broader context but may include less relevant results
                      </p>
                    </div>
                  </div>
                )}

                {conversationMode === 'direct-llm' && (
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="text-sm font-medium text-surface-900 mb-2">Direct LLM Settings</h4>
                    <div>
                      <label className="label">
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
                        <span className="text-sm text-surface-600 w-20 text-right">
                          {(directLlmContextLimit / 1000).toFixed(0)}k
                        </span>
                      </div>
                      <p className="text-xs text-surface-500 mt-1">
                        Higher limits allow longer transcripts but may impact performance. Transcripts exceeding this limit will be truncated.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Collapsible
              title="Advanced Chat Settings"
              description="Fine-tune chunking, memory, and overlap. Defaults work well for most users."
            >
              <div className="space-y-4 pt-4">
                {/* Context Chunks */}
                <div>
                  <label className="label">
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
                    <span className="text-sm text-surface-600 w-12 text-right">
                      {chatContextChunks}
                    </span>
                  </div>
                  <p className="text-xs text-surface-500 mt-1">
                    Number of relevant transcript chunks to include in chat context (1-10)
                  </p>
                </div>

                {/* Chunking Method */}
                <div>
                  <label className="label">
                    Chunking Method
                  </label>
                  <select
                    value={chatChunkingMethod}
                    onChange={(e) => {
                      setChatChunkingMethod(e.target.value);
                      saveChatSetting('chatChunkingMethod', e.target.value);
                    }}
                    className="input"
                  >
                    <option value="speaker">Speaker-based (recommended)</option>
                    <option value="time">Time-based</option>
                    <option value="hybrid">Hybrid (speaker + time limits)</option>
                  </select>
                  <p className="text-xs text-surface-500 mt-1">
                    How to split transcripts for chat analysis
                  </p>
                </div>

                {/* Max Chunk Size */}
                <div>
                  <label className="label">
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
                    <span className="text-sm text-surface-600 w-20 text-right">
                      {chatMaxChunkSize}s ({Math.floor(chatMaxChunkSize / 60)}:{(chatMaxChunkSize % 60).toString().padStart(2, '0')})
                    </span>
                  </div>
                  <p className="text-xs text-surface-500 mt-1">
                    Maximum duration for each chat chunk (30s to 3min)
                  </p>
                </div>

                {/* Chunk Overlap */}
                <div>
                  <label className="label">
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
                    <span className="text-sm text-surface-600 w-12 text-right">
                      {chatChunkOverlap}s
                    </span>
                  </div>
                  <p className="text-xs text-surface-500 mt-1">
                    Overlap between chunks for better context continuity (0-30s)
                  </p>
                </div>

                {/* Memory Limit */}
                <div>
                  <label className="label">
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
                    <span className="text-sm text-surface-600 w-20 text-right">
                      {chatMemoryLimit} msgs
                    </span>
                  </div>
                  <p className="text-xs text-surface-500 mt-1">
                    Number of messages to remember before compacting conversation history
                  </p>
                </div>
              </div>
            </Collapsible>
          </div>
        );

      case 'prompts':
        return <PromptsSettings />;

      case 'general':
        return (
          <div className="space-y-6">
            {/* Storage & Backup */}
            <div className="panel">
              <h3 className="section-title mb-4">
                Storage & Backup
              </h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-surface-600 break-all">
                    {databaseInfo?.path || 'Loading...'}
                  </p>
                  <p className="text-xs text-surface-500 mt-1">
                    Size: {databaseInfo ? formatFileSize(databaseInfo.size) : '...'} | 
                    Modified: {databaseInfo ? new Date(databaseInfo.modified).toLocaleDateString() : '...'}
                  </p>
                </div>
                
                <div className="flex space-x-2">
                  <button 
                    onClick={handleChangeLocation}
                    className="btn-secondary"
                  >
                    Change Location
                  </button>
                  <button 
                    onClick={handleOpenFolder}
                    className="btn-secondary"
                  >
                    Open Folder
                  </button>
                  <button 
                    onClick={handleBackupNow}
                    className="btn-primary"
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
                      className="rounded text-primary-800 focus:ring-primary-500"
                    />
                    <span className="text-sm text-surface-700">Auto-backup</span>
                  </label>
                  
                  {autoBackup && (
                    <div className="ml-6">
                      <select
                        value={backupFrequency}
                        onChange={(e) => {
                          setBackupFrequency(e.target.value);
                          saveSetting('backupFrequency', e.target.value);
                        }}
                        className="text-sm px-3 py-1 border border-surface-200 rounded-lg"
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
            
            {/* Vector Database Management — advanced */}
            <Collapsible
              title="Chat Search Index"
              description="Reset the search index if chat behaves oddly. Most users never need this."
              icon={Database}
            >
              <div className="space-y-4 pt-4">
                <p className="text-sm text-surface-600">
                  This stores searchable embeddings of your transcripts so chat can quickly find relevant excerpts. Reset only if you experience chat issues or after a system update.
                </p>

                <div className="flex space-x-2">
                  <button
                    onClick={handleResetVectorDB}
                    className="px-4 py-2 border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 text-sm"
                  >
                    Reset Search Index
                  </button>
                  <button
                    onClick={handleGetVectorStats}
                    className="btn-secondary"
                  >
                    View Statistics
                  </button>
                </div>

                {vectorStats && (
                  <div className="text-sm text-surface-600 bg-surface-50 p-3 rounded-lg border border-surface-200">
                    <p><strong>Indexed chunks:</strong> {vectorStats.totalChunks}</p>
                    <p><strong>Processed transcripts:</strong> {vectorStats.transcripts.length}</p>
                    <p><strong>Average chunk size:</strong> {vectorStats.avgChunkSize.toFixed(1)}s</p>
                    <p><strong>Speakers found:</strong> {vectorStats.speakers.length}</p>
                  </div>
                )}
              </div>
            </Collapsible>

            {/* Appearance */}
            <div className="panel">
              <h3 className="section-title mb-4">
                Appearance
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="label">
                    Theme
                  </label>
                  <select
                    value={theme}
                    onChange={(e) => {
                      setTheme(e.target.value);
                      saveSetting('theme', e.target.value);
                    }}
                    className="input"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Privacy */}
            <div className="panel">
              <h3 className="section-title mb-4">
                Privacy
              </h3>
              <p className="text-sm text-surface-600">
                DeepTalk stores all data locally on your computer. No data is sent to external services
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
        <h1 className="page-title">Settings</h1>
        
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search settings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 w-64 border border-surface-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <svg 
            className="absolute left-3 top-2.5 w-4 h-4 text-surface-400"
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
        <div className="mb-4 p-3 bg-primary-100 rounded-xl">
          <p className="text-sm text-primary-800">
            Found {searchResults.length} matching setting{searchResults.length !== 1 ? 's' : ''}:
            {searchResults.map((result, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setActiveTab(result.tab);
                  setSearchQuery('');
                }}
                className="ml-2 text-primary-800 hover:underline"
              >
                {result.setting} ({tabs.find(t => t.id === result.tab)?.name})
              </button>
            ))}
          </p>
        </div>
      )}
      
      {/* Tab navigation */}
      <div className="tab-bar">
        {tabs.map(tab => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab flex items-center gap-1.5 ${activeTab === tab.id ? 'tab-active' : ''}`}
            >
              <TabIcon size={14} />
              {tab.label}
              {activeTab === tab.id && <div className="tab-indicator" />}
            </button>
          );
        })}
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
          className="btn-secondary"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};