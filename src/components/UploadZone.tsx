import React, { useState, useRef, useContext } from 'react';
import { ServiceContext } from '../contexts/ServiceContext';
import { generateId } from '../utils/helpers';

export const UploadZone: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToProcessingQueue } = useContext(ServiceContext);

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

  const handleBrowseClick = async () => {
    const filePaths = await window.electronAPI.dialog.openFile();
    if (filePaths.length > 0) {
      // Process the selected files
      // Note: In a real implementation, we would need to handle file paths differently
      console.log('Selected files:', filePaths);
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
          
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={handleBrowseClick}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              Browse Files
            </button>
            
            <button
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Record Audio
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