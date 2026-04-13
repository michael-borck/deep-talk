import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { ServiceStatus, ProcessingItem } from '../types';

interface ServiceContextType {
  serviceStatus: ServiceStatus;
  processingQueue: ProcessingItem[];
  testConnections: () => Promise<void>;
  addToProcessingQueue: (item: ProcessingItem) => void;
  updateProcessingItem: (id: string, updates: Partial<ProcessingItem>) => void;
  removeFromProcessingQueue: (id: string) => void;
}

const defaultServiceStatus: ServiceStatus = {
  speechToText: 'disconnected',
  aiAnalysis: 'disconnected',
  lastChecked: new Date()
};

export const ServiceContext = createContext<ServiceContextType>({
  serviceStatus: defaultServiceStatus,
  processingQueue: [],
  testConnections: async () => {},
  addToProcessingQueue: () => {},
  updateProcessingItem: () => {},
  removeFromProcessingQueue: () => {}
});

interface ServiceProviderProps {
  children: ReactNode;
}

export const ServiceProvider: React.FC<ServiceProviderProps> = ({ children }) => {
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>(defaultServiceStatus);
  const [processingQueue, setProcessingQueue] = useState<ProcessingItem[]>([]);

  const testConnections = async () => {
    try {
      // Speech-to-text now runs locally via @huggingface/transformers — no
      // server to test. Treat it as always available; the model will be
      // downloaded lazily on first transcription.
      const aiUrl = await window.electronAPI.database.get(
        'SELECT value FROM settings WHERE key = ?',
        ['aiAnalysisUrl']
      );

      const aiResult = await window.electronAPI.services.testConnection(
        aiUrl?.value || 'http://localhost:11434'
      );

      setServiceStatus({
        speechToText: 'connected',
        aiAnalysis: aiResult.success ? 'connected' : 'error',
        lastChecked: new Date()
      });
    } catch (error) {
      console.error('Error testing connections:', error);
      setServiceStatus({
        speechToText: 'connected',
        aiAnalysis: 'error',
        lastChecked: new Date()
      });
    }
  };

  const addToProcessingQueue = (item: ProcessingItem) => {
    setProcessingQueue(prev => [...prev, item]);
  };

  const updateProcessingItem = (id: string, updates: Partial<ProcessingItem>) => {
    setProcessingQueue(prev => 
      prev.map(item => item.id === id ? { ...item, ...updates } : item)
    );
  };

  const removeFromProcessingQueue = (id: string) => {
    setProcessingQueue(prev => prev.filter(item => item.id !== id));
  };

  // Test connections on mount and periodically
  useEffect(() => {
    testConnections();
    const interval = setInterval(testConnections, 30000); // Test every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <ServiceContext.Provider 
      value={{
        serviceStatus,
        processingQueue,
        testConnections,
        addToProcessingQueue,
        updateProcessingItem,
        removeFromProcessingQueue
      }}
    >
      {children}
    </ServiceContext.Provider>
  );
};