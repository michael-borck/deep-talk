import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Transcript } from '../types';

interface TranscriptContextType {
  transcripts: Transcript[];
  recentTranscripts: Transcript[];
  loadTranscripts: () => Promise<void>;
  getTranscript: (id: string) => Promise<Transcript | null>;
  updateTranscript: (id: string, updates: Partial<Transcript>) => Promise<void>;
  deleteTranscript: (id: string) => Promise<void>;
  searchTranscripts: (query: string) => Promise<Transcript[]>;
}

export const TranscriptContext = createContext<TranscriptContextType>({
  transcripts: [],
  recentTranscripts: [],
  loadTranscripts: async () => {},
  getTranscript: async () => null,
  updateTranscript: async () => {},
  deleteTranscript: async () => {},
  searchTranscripts: async () => []
});

export const useTranscripts = () => {
  const context = React.useContext(TranscriptContext);
  if (!context) {
    throw new Error('useTranscripts must be used within a TranscriptProvider');
  }
  return context;
};

interface TranscriptProviderProps {
  children: ReactNode;
}

export const TranscriptProvider: React.FC<TranscriptProviderProps> = ({ children }) => {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [recentTranscripts, setRecentTranscripts] = useState<Transcript[]>([]);

  const loadTranscripts = async () => {
    try {
      const allTranscripts = await window.electronAPI.database.all(
        'SELECT * FROM transcripts ORDER BY created_at DESC'
      );
      
      // Parse JSON fields
      const parsed = allTranscripts.map((t: any) => ({
        ...t,
        action_items: t.action_items ? JSON.parse(t.action_items) : [],
        key_topics: t.key_topics ? JSON.parse(t.key_topics) : [],
        tags: t.tags ? JSON.parse(t.tags) : [],
        starred: !!t.starred
      }));
      
      setTranscripts(parsed);
      setRecentTranscripts(parsed.slice(0, 10));
    } catch (error) {
      console.error('Error loading transcripts:', error);
    }
  };

  const getTranscript = async (id: string): Promise<Transcript | null> => {
    try {
      const transcript = await window.electronAPI.database.get(
        'SELECT * FROM transcripts WHERE id = ?',
        [id]
      );
      
      if (transcript) {
        return {
          ...transcript,
          action_items: transcript.action_items ? JSON.parse(transcript.action_items) : [],
          key_topics: transcript.key_topics ? JSON.parse(transcript.key_topics) : [],
          tags: transcript.tags ? JSON.parse(transcript.tags) : [],
          starred: !!transcript.starred
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting transcript:', error);
      return null;
    }
  };

  const updateTranscript = async (id: string, updates: Partial<Transcript>) => {
    try {
      const sets = [];
      const values = [];
      
      for (const [key, value] of Object.entries(updates)) {
        if (key === 'action_items' || key === 'key_topics' || key === 'tags') {
          sets.push(`${key} = ?`);
          values.push(JSON.stringify(value));
        } else {
          sets.push(`${key} = ?`);
          values.push(value);
        }
      }
      
      values.push(id);
      
      await window.electronAPI.database.run(
        `UPDATE transcripts SET ${sets.join(', ')} WHERE id = ?`,
        values
      );
      
      await loadTranscripts();
    } catch (error) {
      console.error('Error updating transcript:', error);
    }
  };

  const deleteTranscript = async (id: string) => {
    try {
      await window.electronAPI.database.run(
        'DELETE FROM transcripts WHERE id = ?',
        [id]
      );
      
      await loadTranscripts();
    } catch (error) {
      console.error('Error deleting transcript:', error);
    }
  };

  const searchTranscripts = async (query: string): Promise<Transcript[]> => {
    try {
      const results = await window.electronAPI.database.all(
        `SELECT * FROM transcripts 
         WHERE title LIKE ? OR full_text LIKE ? OR summary LIKE ?
         ORDER BY created_at DESC`,
        [`%${query}%`, `%${query}%`, `%${query}%`]
      );
      
      return results.map((t: any) => ({
        ...t,
        action_items: t.action_items ? JSON.parse(t.action_items) : [],
        key_topics: t.key_topics ? JSON.parse(t.key_topics) : [],
        tags: t.tags ? JSON.parse(t.tags) : [],
        starred: !!t.starred
      }));
    } catch (error) {
      console.error('Error searching transcripts:', error);
      return [];
    }
  };

  useEffect(() => {
    loadTranscripts();
  }, []);

  return (
    <TranscriptContext.Provider
      value={{
        transcripts,
        recentTranscripts,
        loadTranscripts,
        getTranscript,
        updateTranscript,
        deleteTranscript,
        searchTranscripts
      }}
    >
      {children}
    </TranscriptContext.Provider>
  );
};