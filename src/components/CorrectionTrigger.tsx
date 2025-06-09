import React, { useState, useEffect } from 'react';
import { CheckCircle, Edit3, AlertTriangle, Settings, RefreshCw } from 'lucide-react';
import { Transcript } from '../types';
import { sentenceSegmentsService } from '../services/sentenceSegmentsService';

// Extend the services interface to include validateTranscript
interface ExtendedServices {
  validateTranscript: (text: string) => Promise<{ 
    success: boolean; 
    validatedText: string; 
    changes: any[]; 
    error?: string;
  }>;
}

interface CorrectionTriggerProps {
  transcript: Transcript;
  onCorrectionStart: () => void;
  onCorrectionComplete: (updatedTranscript: Transcript) => void;
  onError: (error: string) => void;
}

interface ValidationSettings {
  enabled: boolean;
  options: {
    spelling: boolean;
    grammar: boolean;
    punctuation: boolean;
    capitalization: boolean;
  };
}

export const CorrectionTrigger: React.FC<CorrectionTriggerProps> = ({
  transcript,
  onCorrectionStart,
  onCorrectionComplete,
  onError
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationSettings, setValidationSettings] = useState<ValidationSettings | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [hasExistingCorrection, setHasExistingCorrection] = useState(false);

  useEffect(() => {
    loadValidationSettings();
    checkExistingCorrection();
  }, [transcript]);

  const loadValidationSettings = async () => {
    try {
      const settings = await window.electronAPI.database.all(
        'SELECT key, value FROM settings WHERE key IN (?, ?)',
        ['enableTranscriptValidation', 'validationOptions']
      );

      const settingsMap = settings.reduce((acc: any, { key, value }: any) => {
        acc[key] = value;
        return acc;
      }, {});

      const enabled = settingsMap.enableTranscriptValidation !== 'false';
      let options = {
        spelling: true,
        grammar: true,
        punctuation: true,
        capitalization: true
      };

      if (settingsMap.validationOptions) {
        try {
          options = JSON.parse(settingsMap.validationOptions);
        } catch (e) {
          console.error('Error parsing validation options:', e);
        }
      }

      setValidationSettings({ enabled, options });
    } catch (error) {
      console.error('Failed to load validation settings:', error);
      onError('Failed to load validation settings');
    }
  };

  const checkExistingCorrection = () => {
    const hasCorrection = !!(transcript.validated_text && transcript.validated_text.trim().length > 0);
    setHasExistingCorrection(hasCorrection);
  };

  const handleCorrectionClick = () => {
    if (!validationSettings?.enabled) {
      onError('Transcript validation is disabled in Settings. Please enable it first.');
      return;
    }

    if (hasExistingCorrection) {
      setShowConfirmDialog(true);
    } else {
      startCorrection();
    }
  };

  const startCorrection = async () => {
    setShowConfirmDialog(false);
    setIsProcessing(true);
    onCorrectionStart();

    try {
      // Use the validation service API
      const services = window.electronAPI.services as typeof window.electronAPI.services & ExtendedServices;
      const validationResult = await services.validateTranscript(
        transcript.full_text || ''
      );

      if (!validationResult.success) {
        throw new Error(validationResult.error || 'Validation failed');
      }

      // Update the transcript in the database
      await window.electronAPI.database.run(
        `UPDATE transcripts 
         SET validated_text = ?, validation_changes = ?, updated_at = ?
         WHERE id = ?`,
        [
          validationResult.validatedText,
          JSON.stringify(validationResult.changes || []),
          new Date().toISOString(),
          transcript.id
        ]
      );

      // Create updated transcript object
      const updatedTranscript = {
        ...transcript,
        validated_text: validationResult.validatedText,
        validation_changes: validationResult.changes || [],
        updated_at: new Date().toISOString()
      };

      // Create corrected sentence segments
      try {
        await sentenceSegmentsService.createCorrectedSegments(
          transcript.id, 
          validationResult.validatedText
        );
        console.log('Created corrected sentence segments');
      } catch (segmentError) {
        console.warn('Failed to create corrected sentence segments:', segmentError);
        // Don't fail the whole correction process for this
      }

      onCorrectionComplete(updatedTranscript);
    } catch (error) {
      console.error('Correction failed:', error);
      const errorMessage = (error as Error).message;
      // Truncate very long error messages (like HTML responses)
      const truncatedMessage = errorMessage.length > 200 
        ? errorMessage.substring(0, 200) + '...' 
        : errorMessage;
      onError(`Failed to correct transcript: ${truncatedMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const getCorrectionStatus = () => {
    if (!validationSettings) return 'loading';
    if (!validationSettings.enabled) return 'disabled';
    if (hasExistingCorrection) return 'existing';
    return 'available';
  };

  const getStatusInfo = () => {
    const status = getCorrectionStatus();
    switch (status) {
      case 'loading':
        return {
          icon: <RefreshCw size={16} className="animate-spin text-gray-400" />,
          text: 'Loading settings...',
          color: 'text-gray-500'
        };
      case 'disabled':
        return {
          icon: <Settings size={16} className="text-orange-500" />,
          text: 'Validation disabled in Settings',
          color: 'text-orange-600'
        };
      case 'existing':
        return {
          icon: <CheckCircle size={16} className="text-green-500" />,
          text: 'Corrected version available',
          color: 'text-green-600'
        };
      case 'available':
        return {
          icon: <Edit3 size={16} className="text-blue-500" />,
          text: 'Ready to generate correction',
          color: 'text-blue-600'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const canCorrect = validationSettings?.enabled && !isProcessing;

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {statusInfo.icon}
            <div>
              <h3 className="text-sm font-medium text-gray-900">Transcript Correction</h3>
              <p className={`text-xs ${statusInfo.color}`}>
                {statusInfo.text}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleCorrectionClick}
            disabled={!canCorrect}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              canCorrect
                ? hasExistingCorrection
                  ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isProcessing ? (
              <div className="flex items-center space-x-2">
                <RefreshCw size={14} className="animate-spin" />
                <span>Processing...</span>
              </div>
            ) : hasExistingCorrection ? (
              'Re-correct'
            ) : (
              'Generate Correction'
            )}
          </button>
        </div>

        {validationSettings && (
          <div className="mt-3 text-xs text-gray-500">
            <strong>Active validation options:</strong>{' '}
            {Object.entries(validationSettings.options)
              .filter(([_, enabled]) => enabled)
              .map(([option, _]) => option)
              .join(', ') || 'None'}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle size={24} className="text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                Overwrite Existing Correction?
              </h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              This transcript already has a corrected version. Re-correcting will overwrite 
              the existing corrections with new AI-generated ones based on your current settings.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={startCorrection}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
              >
                Overwrite
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};