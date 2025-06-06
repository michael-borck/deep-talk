import React, { useState, useContext } from 'react';
import { X, Upload, FolderPlus } from 'lucide-react';
import { ProcessingQueue } from './ProcessingQueue';
import { ServiceContext } from '../contexts/ServiceContext';

interface GlobalUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalUploadModal: React.FC<GlobalUploadModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { processingQueue } = useContext(ServiceContext);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');

  // Mock project list - will be replaced with actual data
  const projects = [
    { id: '1', name: 'Customer Interviews' },
    { id: '2', name: 'Q4 Analysis' },
    { id: '3', name: 'Product Research' },
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    setSelectedFiles(files);
  };

  const handleUpload = () => {
    if (!selectedFiles) return;
    
    // Handle upload logic here
    console.log('Uploading files:', selectedFiles);
    console.log('To project:', selectedProject);
    
    // Close modal after upload
    onClose();
    
    // Reset form
    setSelectedFiles(null);
    setSelectedProject('');
    setShowNewProject(false);
    setNewProjectName('');
    setNewProjectDescription('');
  };

  const handleCreateNewProject = () => {
    if (!newProjectName.trim()) return;
    
    // Create new project logic here
    console.log('Creating new project:', { name: newProjectName, description: newProjectDescription });
    
    // For now, just close the new project form
    setShowNewProject(false);
    setNewProjectName('');
    setNewProjectDescription('');
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
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Drop files here or click to browse
                    </span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      multiple
                      accept="audio/*,video/*"
                      onChange={handleFileSelect}
                    />
                  </label>
                  <p className="mt-1 text-xs text-gray-500">
                    Supports MP3, WAV, MP4, MOV and other common formats
                  </p>
                </div>
              </div>
              
              {selectedFiles && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Files:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {Array.from(selectedFiles).map((file, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <span>📄</span>
                        <span>{file.name}</span>
                        <span className="text-gray-400">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                      </li>
                    ))}
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
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
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
                    disabled={!newProjectName.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    Create Project
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
            disabled={!selectedFiles}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Upload & Process
          </button>
        </div>
      </div>
    </div>
  );
};