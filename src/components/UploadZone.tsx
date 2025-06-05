import React, { useState, useRef, useContext } from 'react';
import { ServiceContext } from '../contexts/ServiceContext';
import { TranscriptContext } from '../contexts/TranscriptContext';
import { generateId } from '../utils/helpers';
import { fileProcessor } from '../services/fileProcessor';

export const UploadZone: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToProcessingQueue, updateProcessingItem } = useContext(ServiceContext);
  const { loadTranscripts } = useContext(TranscriptContext);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = async (files: File[]) => {
    const acceptedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'video/mp4', 'video/avi', 'video/quicktime', 'audio/m4a', 'audio/webm', 'audio/ogg'];
    
    for (const file of files) {
      if (!acceptedTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|mp4|avi|mov|m4a|webm|ogg)$/i)) {
        console.error(`File type not supported: ${file.name}`);
        continue;
      }

      // Create transcript record
      const transcriptId = generateId();
      const timestamp = new Date().toISOString();
      
      try {
        await window.electronAPI.database.run(
          `INSERT INTO transcripts (id, title, filename, file_size, created_at, updated_at, status, starred) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [transcriptId, file.name, file.name, file.size, timestamp, timestamp, 'processing', 0]
        );

        // Add to processing queue
        addToProcessingQueue({
          id: generateId(),
          transcript_id: transcriptId,
          file_path: file.name,
          status: 'queued',
          progress: 0,
          created_at: timestamp
        });
      } catch (error) {
        console.error('Error creating transcript:', error);
      }
    }
  };

  const checkForDuplicates = async (filePath: string, fileName: string): Promise<boolean> => {
    try {
      // Check for existing files with same name or path
      const existing = await window.electronAPI.database.all(
        `SELECT id, title, file_path, created_at FROM transcripts 
         WHERE filename = ? OR file_path = ? OR title = ?`,
        [fileName, filePath, fileName]
      );
      
      if (existing.length > 0) {
        const existingFile = existing[0];
        const existingDate = new Date(existingFile.created_at).toLocaleDateString();
        
        const shouldContinue = window.confirm(
          `A file with this name already exists:\n\n` +
          `"${existingFile.title}"\n` +
          `Uploaded: ${existingDate}\n\n` +
          `Do you want to upload this file anyway?`
        );
        
        return !shouldContinue; // Return true if we should skip (user said no)
      }
      
      return false; // No duplicates found
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      return false; // Continue on error
    }
  };

  const handleFilePaths = async (filePaths: string[]) => {
    for (const filePath of filePaths) {
      const fileName = filePath.split('/').pop() || filePath;
      
      // Check for duplicates
      const shouldSkip = await checkForDuplicates(filePath, fileName);
      if (shouldSkip) {
        console.log(`Skipping duplicate file: ${fileName}`);
        continue;
      }
      
      // Create transcript record
      const transcriptId = generateId();
      const timestamp = new Date().toISOString();
      
      try {
        // Get file stats
        const fileStats = await window.electronAPI.fs.getFileStats(filePath);
        
        console.log(`Creating transcript record for: ${fileName}`);
        
        await window.electronAPI.database.run(
          `INSERT INTO transcripts (id, title, filename, file_path, file_size, created_at, updated_at, status, starred) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [transcriptId, fileName, fileName, filePath, fileStats.size, timestamp, timestamp, 'processing', 0]
        );

        // Add to processing queue
        const processingItemId = generateId();
        addToProcessingQueue({
          id: processingItemId,
          transcript_id: transcriptId,
          file_path: filePath,
          status: 'queued',
          progress: 0,
          created_at: timestamp
        });

        // Start processing
        await startProcessing(processingItemId, transcriptId, filePath);
        
      } catch (error) {
        console.error('Error creating transcript:', error);
        alert(`Error processing file ${fileName}: ${(error as Error).message}`);
      }
    }
  };

  const startProcessing = async (processingItemId: string, transcriptId: string, filePath: string) => {
    try {
      updateProcessingItem(processingItemId, { status: 'transcribing' });
      
      await fileProcessor.processFile(filePath, transcriptId, {
        onProgress: (stage: string, percent: number) => {
          updateProcessingItem(processingItemId, { 
            progress: percent,
            status: stage === 'transcribing' ? 'transcribing' : 'analyzing'
          });
        },
        onError: async (error: Error) => {
          console.error('Processing error:', error);
          updateProcessingItem(processingItemId, { 
            status: 'error',
            error_message: error.message
          });
          // Reload transcripts to show the error state
          await loadTranscripts();
        },
        onComplete: async () => {
          console.log('Processing completed for:', transcriptId);
          updateProcessingItem(processingItemId, { 
            status: 'completed',
            progress: 100
          });
          // Reload transcripts to show the new one
          await loadTranscripts();
        }
      });
    } catch (error) {
      console.error('Error starting processing:', error);
      updateProcessingItem(processingItemId, { 
        status: 'error',
        error_message: (error as Error).message
      });
      // Reload transcripts to show the error state
      await loadTranscripts();
    }
  };

  const handleBrowseClick = async () => {
    const filePaths = await window.electronAPI.dialog.openFile();
    if (filePaths.length > 0) {
      console.log('Selected files:', filePaths);
      await handleFilePaths(filePaths);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <span className="mr-2">📁</span> Quick Upload
      </h2>
      
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
        `}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div className="text-gray-600">
            <p className="text-lg mb-2">Drag & drop files here</p>
            <p className="text-sm">or click to browse</p>
          </div>
          
          <div className="flex items-center justify-center">
            <button
              onClick={handleBrowseClick}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              Browse Files
            </button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".mp3,.wav,.mp4,.avi,.mov,.m4a,.webm,.ogg"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>
      
      <p className="text-sm text-gray-500 mt-3">
        Supports: MP3, WAV, MP4, AVI, MOV, M4A
      </p>
    </div>
  );
};