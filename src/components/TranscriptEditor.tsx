import React, { useState, useEffect, useRef } from 'react';
import { Save, X, Search, RotateCcw, Type, Clock, AlertCircle } from 'lucide-react';
import { Transcript } from '../types';
import { TimestampedTranscript } from './TimestampedTranscript';

interface TranscriptEditorProps {
  transcript: Transcript;
  isOpen: boolean;
  onClose: () => void;
  onSave: (editedText: string) => void;
}

export const TranscriptEditor: React.FC<TranscriptEditorProps> = ({
  transcript,
  isOpen,
  onClose,
  onSave
}) => {
  const [editedText, setEditedText] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [showTimestamps, setShowTimestamps] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen && transcript) {
      const textToEdit = transcript.validated_text || transcript.full_text || '';
      setEditedText(textToEdit);
      setOriginalText(textToEdit);
      setHasUnsavedChanges(false);
      updateStats(textToEdit);
    }
  }, [isOpen, transcript]);

  useEffect(() => {
    // Auto-save after 3 seconds of no changes
    if (hasUnsavedChanges) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleAutoSave();
      }, 3000);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [editedText, hasUnsavedChanges]);

  const updateStats = (text: string) => {
    setCharCount(text.length);
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
  };

  const handleTextChange = (newText: string) => {
    setEditedText(newText);
    setHasUnsavedChanges(newText !== originalText);
    updateStats(newText);
  };

  const handleAutoSave = async () => {
    if (!hasUnsavedChanges) return;
    
    try {
      // Save to localStorage as backup
      localStorage.setItem(`transcript_edit_${transcript.id}`, editedText);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  const handleSave = () => {
    onSave(editedText);
    setOriginalText(editedText);
    setHasUnsavedChanges(false);
    setLastSaved(new Date());
    
    // Clear localStorage backup
    localStorage.removeItem(`transcript_edit_${transcript.id}`);
    onClose();
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  const handleForceClose = () => {
    setShowConfirmClose(false);
    setHasUnsavedChanges(false);
    localStorage.removeItem(`transcript_edit_${transcript.id}`);
    onClose();
  };

  const handleUndo = () => {
    setEditedText(originalText);
    setHasUnsavedChanges(false);
    updateStats(originalText);
  };

  const handleFind = () => {
    if (!findText) return;
    
    const textarea = textareaRef.current;
    if (!textarea) return;

    const text = textarea.value;
    const index = text.toLowerCase().indexOf(findText.toLowerCase());
    
    if (index !== -1) {
      textarea.focus();
      textarea.setSelectionRange(index, index + findText.length);
    }
  };

  const handleReplace = () => {
    if (!findText) return;
    
    const newText = editedText.replace(
      new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
      replaceText
    );
    
    handleTextChange(newText);
  };

  const handleReplaceAll = () => {
    if (!findText) return;
    
    const newText = editedText.replace(
      new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
      replaceText
    );
    
    handleTextChange(newText);
  };

  const renderTextWithTimestamps = () => {
    if (!showTimestamps) {
      return (
        <textarea
          ref={textareaRef}
          value={editedText}
          onChange={(e) => handleTextChange(e.target.value)}
          className="w-full h-full resize-none border-none outline-none p-4 font-mono text-sm leading-relaxed"
          placeholder="Start editing the transcript..."
        />
      );
    }

    return (
      <div className="w-full h-full overflow-y-auto">
        <TimestampedTranscript
          transcript={editedText}
          showTimestamps={true}
          editable={true}
          onTextChange={handleTextChange}
          className="p-4"
        />
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Type size={20} className="text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Edit Transcript
              </h2>
              <p className="text-sm text-gray-600">{transcript.title}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFindReplace(!showFindReplace)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              title="Find & Replace"
            >
              <Search size={18} />
            </button>
            <button
              onClick={() => setShowTimestamps(!showTimestamps)}
              className={`p-2 rounded transition-colors ${
                showTimestamps 
                  ? 'text-blue-600 bg-blue-100' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title="Toggle Timestamp View"
            >
              <Clock size={18} />
            </button>
            <button
              onClick={handleUndo}
              disabled={!hasUnsavedChanges}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-50"
              title="Undo Changes"
            >
              <RotateCcw size={18} />
            </button>
            <button
              onClick={handleClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Find & Replace Bar */}
        {showFindReplace && (
          <div className="border-b bg-gray-50 p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Find..."
                  value={findText}
                  onChange={(e) => setFindText(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && handleFind()}
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Replace with..."
                  value={replaceText}
                  onChange={(e) => setReplaceText(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleFind}
                  className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  Find
                </button>
                <button
                  onClick={handleReplace}
                  className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                >
                  Replace
                </button>
                <button
                  onClick={handleReplaceAll}
                  className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                >
                  Replace All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Bar */}
        <div className="px-6 py-2 bg-gray-50 border-b flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center space-x-4">
            <span>Words: {wordCount.toLocaleString()}</span>
            <span>Characters: {charCount.toLocaleString()}</span>
            {hasUnsavedChanges && (
              <span className="flex items-center space-x-1 text-orange-600">
                <AlertCircle size={12} />
                <span>Unsaved changes</span>
              </span>
            )}
          </div>
          
          {lastSaved && (
            <span>Last auto-saved: {lastSaved.toLocaleTimeString()}</span>
          )}
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          {renderTextWithTimestamps()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {showTimestamps ? 'Timestamp view (read-only)' : 'Editing mode'}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} />
              <span>Save Changes</span>
            </button>
          </div>
        </div>

        {/* Confirmation Dialog */}
        {showConfirmClose && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 m-4">
              <div className="flex items-center space-x-3 mb-4">
                <AlertCircle size={24} className="text-orange-500" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Unsaved Changes
                </h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                You have unsaved changes. Are you sure you want to close the editor without saving?
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConfirmClose(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Continue Editing
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save & Close
                </button>
                <button
                  onClick={handleForceClose}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Discard Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};