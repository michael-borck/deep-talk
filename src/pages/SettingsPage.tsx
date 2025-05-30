import React, { useState, useEffect, useContext } from 'react';
import { ServiceContext } from '../contexts/ServiceContext';

type SettingsTab = 'services' | 'storage' | 'appearance' | 'privacy';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('services');
  const { testConnections, serviceStatus } = useContext(ServiceContext);
  
  // Settings state
  const [speechToTextUrl, setSpeechToTextUrl] = useState('http://localhost:8000');
  const [aiAnalysisUrl, setAiAnalysisUrl] = useState('http://localhost:11434');
  const [aiModel, setAiModel] = useState('llama2');
  const [autoBackup, setAutoBackup] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState('weekly');
  const [theme, setTheme] = useState('system');

  useEffect(() => {
    loadSettings();
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

      setSpeechToTextUrl(settingsMap.speechToTextUrl || 'http://localhost:8000');
      setAiAnalysisUrl(settingsMap.aiAnalysisUrl || 'http://localhost:11434');
      setAiModel(settingsMap.aiModel || 'llama2');
      setAutoBackup(settingsMap.autoBackup === 'true');
      setBackupFrequency(settingsMap.backupFrequency || 'weekly');
      setTheme(settingsMap.theme || 'system');
    } catch (error) {
      console.error('Error loading settings:', error);
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

  const tabs = [
    { id: 'services' as const, label: '🔌 Services', name: 'Services' },
    { id: 'storage' as const, label: '📁 Storage', name: 'Storage' },
    { id: 'appearance' as const, label: '🎨 Appearance', name: 'Appearance' },
    { id: 'privacy' as const, label: '🔒 Privacy', name: 'Privacy' }
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
                    <select
                      value={aiModel}
                      onChange={(e) => {
                        setAiModel(e.target.value);
                        saveSetting('aiModel', e.target.value);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      <option value="llama2">Llama 2</option>
                      <option value="mistral">Mistral</option>
                      <option value="codellama">Code Llama</option>
                    </select>
                    <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                      Refresh
                    </button>
                  </div>
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
                <div className="text-sm text-gray-600">
                  /Users/john/Documents/LocalListen/
                </div>
                
                <div className="flex space-x-2">
                  <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                    Change Location
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                    Open Folder
                  </button>
                  <button className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
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