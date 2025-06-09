import React, { useState, useContext } from 'react';
import { X, Upload, FolderPlus } from 'lucide-react';
import { ProcessingQueue } from './ProcessingQueue';
import { ServiceContext } from '../contexts/ServiceContext';
import { TranscriptContext } from '../contexts/TranscriptContext';
import { useProjects } from '../contexts/ProjectContext';
import { generateId } from '../utils/helpers';
import { fileProcessor } from '../services/fileProcessor';

interface GlobalUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalUploadModal: React.FC<GlobalUploadModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { processingQueue, addToProcessingQueue, updateProcessingItem } = useContext(ServiceContext);
  const { loadTranscripts } = useContext(TranscriptContext);
  const { projects, createProject, addTranscriptToProject } = useProjects();
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  const handleBrowseClick = async () => {
    const filePaths = await window.electronAPI.dialog.openFile();
    if (filePaths.length > 0) {
      console.log('Selected files:', filePaths);
      setSelectedFiles(filePaths);
    }
  };

  const checkForDuplicates = async (fileName: string): Promise<boolean> => {
    try {
      const existing = await window.electronAPI.database.all(
        `SELECT id, title, created_at FROM transcripts 
         WHERE filename = ? OR title = ?`,
        [fileName, fileName]
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
          await loadTranscripts();
        },
        onComplete: async () => {
          console.log('Processing completed for:', transcriptId);
          updateProcessingItem(processingItemId, { 
            status: 'completed',
            progress: 100
          });
          
          // Add transcript to project if one was selected
          if (selectedProject) {
            try {
              await addTranscriptToProject(selectedProject, transcriptId);
              console.log(`Added transcript ${transcriptId} to project ${selectedProject}`);
            } catch (error) {
              console.error('Error adding transcript to project:', error);
            }
          }
          
          await loadTranscripts();
        }
      });
    } catch (error) {
      console.error('Error starting processing:', error);
      updateProcessingItem(processingItemId, { 
        status: 'error',
        error_message: (error as Error).message
      });
      await loadTranscripts();
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    for (const filePath of selectedFiles) {
      const fileName = filePath.split('/').pop() || filePath;
      
      // Check file type by extension
      if (!fileName.match(/\.(mp3|wav|mp4|avi|mov|m4a|webm|ogg)$/i)) {
        alert(`File type not supported: ${fileName}`);
        continue;
      }
      
      // Check for duplicates
      const shouldSkip = await checkForDuplicates(fileName);
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
    
    // Close modal after upload
    onClose();
    
    // Reset form
    setSelectedFiles([]);
    setSelectedProject('');
    setShowNewProject(false);
    setNewProjectName('');
    setNewProjectDescription('');
  };

  const handleCreateNewProject = async () => {
    if (!newProjectName.trim()) return;
    
    try {
      setIsCreatingProject(true);
      const newProject = await createProject(newProjectName.trim(), newProjectDescription.trim() || undefined);
      
      // Select the newly created project
      setSelectedProject(newProject.id);
      
      // Close the new project form
      setShowNewProject(false);
      setNewProjectName('');
      setNewProjectDescription('');
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project. Please try again.');
    } finally {
      setIsCreatingProject(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Upload & Process</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* File Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Audio/Video Files
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <button 
                    onClick={handleBrowseClick}
                    className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    Click to browse files
                  </button>
                  <p className="mt-1 text-xs text-gray-500">
                    Supports MP3, WAV, MP4, MOV and other common formats
                  </p>
                </div>
              </div>
              
              {selectedFiles.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Files:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {selectedFiles.map((filePath, index) => {
                      const fileName = filePath.split('/').pop() || filePath;
                      return (
                        <li key={index} className="flex items-center space-x-2">
                          <span>📄</span>
                          <span>{fileName}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            {/* Project Assignment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign to Project (Optional)
              </label>
              <div className="space-y-3">
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">None (add to library only)</option>
                  {projects
                    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                    .map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.icon} {project.name} ({project.transcript_count || 0} transcripts)
                      </option>
                    ))}
                </select>
                
                <button
                  onClick={() => setShowNewProject(true)}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  <FolderPlus size={16} />
                  <span>Create New Project</span>
                </button>
              </div>
            </div>

            {/* New Project Form */}
            {showNewProject && (
              <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Create New Project</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter project name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Optional project description"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleCreateNewProject}
                    disabled={!newProjectName.trim() || isCreatingProject}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isCreatingProject ? 'Creating...' : 'Create Project'}
                  </button>
                  <button
                    onClick={() => setShowNewProject(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Processing Queue */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Processing Queue</h3>
              <ProcessingQueue items={processingQueue} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Upload & Process
          </button>
        </div>
      </div>
    </div>
  );
};