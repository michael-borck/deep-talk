import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Save, RotateCcw, Copy, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { AIPrompt } from '../services/promptService';

interface PromptEditorProps {
  prompt: AIPrompt;
  onSave: (prompt: AIPrompt) => Promise<void>;
  onReset: () => Promise<void>;
  isDefault: boolean;
}

export const PromptEditor: React.FC<PromptEditorProps> = ({ 
  prompt, 
  onSave, 
  onReset,
  isDefault 
}) => {
  const [editedPrompt, setEditedPrompt] = useState(prompt.promptText);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showVariables, setShowVariables] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditedPrompt(prompt.promptText);
    setIsEditing(false);
  }, [prompt]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        ...prompt,
        promptText: editedPrompt,
        userModified: true,
        variables: extractVariables(editedPrompt)
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving prompt:', error);
      alert('Failed to save prompt. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset this prompt to default? Your customizations will be lost.')) {
      await onReset();
      setIsEditing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const extractVariables = (text: string): string[] => {
    const matches = text.match(/\{([^}]+)\}/g);
    if (!matches) return [];
    return [...new Set(matches.map(match => match.slice(1, -1)))];
  };

  const highlightVariables = (text: string) => {
    const parts = text.split(/(\{[^}]+\})/g);
    return parts.map((part, index) => {
      if (part.match(/^\{[^}]+\}$/)) {
        return (
          <span key={index} className="bg-blue-100 text-blue-800 px-1 rounded font-mono text-sm">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const countTokens = (text: string): number => {
    // Simple approximation: ~4 characters per token
    return Math.ceil(text.length / 4);
  };

  const hasChanged = editedPrompt !== prompt.promptText;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{prompt.name}</h3>
            {prompt.description && (
              <p className="text-sm text-gray-600 mt-1">{prompt.description}</p>
            )}
            {prompt.systemUsed && (
              <p className="text-xs text-green-700 mt-1 font-medium">
                ⚙️ This prompt is actively used by the system's processing pipeline. Changes will immediately affect how audio files are processed.
              </p>
            )}
            {!prompt.systemUsed && (
              <p className="text-xs text-gray-500 mt-1">
                💡 This prompt is available for reference or external use but is not currently used by the system's automated processing.
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {prompt.systemUsed && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-medium">System Used</span>
            )}
            {prompt.userModified && !isDefault && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Modified</span>
            )}
            {isDefault && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Default</span>
            )}
          </div>
        </div>
      </div>

      {/* Variables Info */}
      {prompt.variables.length > 0 && (
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
          <button
            onClick={() => setShowVariables(!showVariables)}
            className="flex items-center space-x-2 text-sm text-blue-700 hover:text-blue-800"
          >
            {showVariables ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <span className="font-medium">Template Variables</span>
          </button>
          {showVariables && (
            <div className="mt-2 space-y-1">
              {prompt.variables.map((variable, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <code className="bg-white px-2 py-1 rounded border border-blue-200 text-blue-700">
                    {`{${variable}}`}
                  </code>
                  <span className="text-blue-600">
                    {variable === 'transcript' && '- The full transcript text'}
                    {variable === 'title' && '- The transcript title'}
                    {variable === 'context' && '- Relevant context from the transcript'}
                    {variable === 'message' && '- The user\'s question or message'}
                    {variable === 'validation_options' && '- Selected validation options'}
                    {variable === 'speakers' && '- List of available speakers'}
                    {variable === 'segments' && '- Text segments to analyze'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Editor */}
      <div className="p-6">
        {isEditing ? (
          <div className="space-y-4">
            <textarea
              ref={textareaRef}
              value={editedPrompt}
              onChange={(e) => setEditedPrompt(e.target.value)}
              className="w-full h-96 p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
              placeholder="Enter your prompt template here..."
            />
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <span>≈ {countTokens(editedPrompt)} tokens</span>
                <span>{editedPrompt.length} characters</span>
              </div>
              {hasChanged && (
                <span className="text-orange-600 flex items-center space-x-1">
                  <AlertCircle size={16} />
                  <span>Unsaved changes</span>
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-md p-4 font-mono text-sm text-gray-700 whitespace-pre-wrap">
              {highlightVariables(prompt.promptText)}
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <span>≈ {countTokens(prompt.promptText)} tokens</span>
                <span>{prompt.promptText.length} characters</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-white"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
            {prompt.userModified && !isDefault && (
              <button
                onClick={handleReset}
                className="flex items-center space-x-1 px-3 py-2 text-sm text-orange-600 hover:text-orange-700 border border-orange-300 rounded-md hover:bg-orange-50"
              >
                <RotateCcw size={16} />
                <span>Reset to Default</span>
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setEditedPrompt(prompt.promptText);
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!hasChanged || isSaving}
                  className="flex items-center space-x-1 px-4 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={16} />
                  <span>{isSaving ? 'Saving...' : 'Save'}</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Edit Prompt
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};