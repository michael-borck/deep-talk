import React, { useState, useContext } from 'react';
import { Upload, FolderPlus, FileAudio, Play } from 'lucide-react';
import { ProcessingQueue } from '../components/ProcessingQueue';
import { ServiceContext } from '../contexts/ServiceContext';
import { TranscriptContext } from '../contexts/TranscriptContext';
import { useProjects } from '../contexts/ProjectContext';
import { generateId } from '../utils/helpers';
import { fileProcessor } from '../services/fileProcessor';

export const UploadPage: React.FC = () => {
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

        return !shouldContinue;
      }

      return false;
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      return false;
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

      if (!fileName.match(/\.(mp3|wav|mp4|avi|mov|m4a|webm|ogg)$/i)) {
        alert(`File type not supported: ${fileName}`);
        continue;
      }

      const shouldSkip = await checkForDuplicates(fileName);
      if (shouldSkip) {
        console.log(`Skipping duplicate file: ${fileName}`);
        continue;
      }

      const transcriptId = generateId();
      const timestamp = new Date().toISOString();

      try {
        const fileStats = await window.electronAPI.fs.getFileStats(filePath);

        console.log(`Creating transcript record for: ${fileName}`);

        await window.electronAPI.database.run(
          `INSERT INTO transcripts (id, title, filename, file_path, file_size, created_at, updated_at, status, starred)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [transcriptId, fileName, fileName, filePath, fileStats.size, timestamp, timestamp, 'processing', 0]
        );

        const processingItemId = generateId();
        addToProcessingQueue({
          id: processingItemId,
          transcript_id: transcriptId,
          file_path: filePath,
          status: 'queued',
          progress: 0,
          created_at: timestamp
        });

        await startProcessing(processingItemId, transcriptId, filePath);

      } catch (error) {
        console.error('Error creating transcript:', error);
        alert(`Error processing file ${fileName}: ${(error as Error).message}`);
      }
    }

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

      setSelectedProject(newProject.id);

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

  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* Page Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="page-title">Upload & Process</h1>
        <p className="mt-1 text-sm text-surface-500">
          Upload audio or video files to transcribe and analyze with AI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Upload Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* File Upload Section */}
          <div className="card-interactive p-6 animate-slide-up" style={{ animationDelay: '0.05s', opacity: 0 }}>
            <h2 className="section-title mb-4">Select Files</h2>
            <div
              className="border-2 border-dashed border-surface-200 rounded-xl p-10 text-center hover:border-surface-300 transition-all duration-300 cursor-pointer"
              onClick={handleBrowseClick}
            >
              <Upload className="mx-auto h-12 w-12 text-surface-300" strokeWidth={1.5} />
              <div className="mt-4">
                <button className="text-base font-medium text-primary-800 hover:text-primary-900 transition-colors">
                  Click to browse files
                </button>
                <p className="mt-1.5 text-xs text-surface-400">
                  Supports MP3, WAV, MP4, MOV, M4A, WebM, OGG and other common formats
                </p>
              </div>
            </div>

            {selectedFiles.length > 0 && (
              <div className="mt-5">
                <h3 className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-3">Selected Files ({selectedFiles.length})</h3>
                <div className="panel p-3">
                  <ul className="space-y-2">
                    {selectedFiles.map((filePath, index) => {
                      const fileName = filePath.split('/').pop() || filePath;
                      return (
                        <li key={index} className="flex items-center gap-2.5 text-sm">
                          <FileAudio size={15} className="text-primary-400 flex-shrink-0" />
                          <span className="text-surface-800 font-medium">{fileName}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Project Assignment */}
          <div className="card-interactive p-6 animate-slide-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
            <h2 className="section-title mb-4">Project Assignment</h2>
            <div className="space-y-4">
              <div>
                <label className="label mb-2">
                  Assign to Project (Optional)
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="input"
                >
                  <option value="">None (add to library only)</option>
                  {projects
                    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                    .map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name} ({project.transcript_count || 0} transcripts)
                      </option>
                    ))}
                </select>
              </div>

              <button
                onClick={() => setShowNewProject(true)}
                className="flex items-center gap-2 link-accent text-sm"
              >
                <FolderPlus size={15} />
                <span>Create New Project</span>
              </button>
            </div>

            {/* New Project Form */}
            {showNewProject && (
              <div className="mt-5 border border-surface-200 rounded-xl p-4 space-y-4 bg-surface-50">
                <h3 className="section-title">Create New Project</h3>
                <div>
                  <label className="label">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="input"
                    placeholder="Enter project name"
                  />
                </div>
                <div>
                  <label className="label">
                    Description
                  </label>
                  <textarea
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    rows={3}
                    className="input-textarea"
                    placeholder="Optional project description"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCreateNewProject}
                    disabled={!newProjectName.trim() || isCreatingProject}
                    className="btn-primary"
                  >
                    {isCreatingProject ? 'Creating...' : 'Create Project'}
                  </button>
                  <button
                    onClick={() => setShowNewProject(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Upload Action */}
          <div className="card-interactive p-6 animate-slide-up" style={{ animationDelay: '0.15s', opacity: 0 }}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="section-title">Ready to Process</h3>
                <p className="text-xs text-surface-500 mt-1">
                  {selectedFiles.length === 0
                    ? 'Select files to begin processing'
                    : `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} selected for processing`
                  }
                </p>
              </div>
              <button
                onClick={handleUpload}
                disabled={selectedFiles.length === 0}
                className="px-6 py-2.5 bg-accent-600 text-white text-sm font-medium rounded-lg hover:bg-accent-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-card hover:shadow-md flex items-center gap-2"
              >
                <Play size={15} />
                Upload & Process
              </button>
            </div>
          </div>
        </div>

        {/* Processing Queue Sidebar */}
        <div className="lg:col-span-1 animate-slide-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
          <div className="sticky top-8">
            <ProcessingQueue items={processingQueue} />
          </div>
        </div>
      </div>
    </div>
  );
};
