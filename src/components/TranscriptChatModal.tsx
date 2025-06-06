import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageCircle, User, Bot, AlertCircle } from 'lucide-react';
import { Transcript } from '../types';
import { chatService, ChatMessage, ProcessingProgress } from '../services/chatService';

interface TranscriptChatModalProps {
  transcript: Transcript;
  isOpen: boolean;
  onClose: () => void;
}

export const TranscriptChatModal: React.FC<TranscriptChatModalProps> = ({
  transcript,
  isOpen,
  onClose
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  const [processingProgress, setProcessingProgress] = useState<ProcessingProgress | null>(null);
  const [isProcessingTranscript, setIsProcessingTranscript] = useState(false);
  const [chatReady, setChatReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      initializeChat();
    }
  }, [isOpen, transcript.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeChat = async () => {
    try {
      setError(null);
      
      // Check if chat service is ready
      if (!chatService.isReady()) {
        setIsProcessingTranscript(true);
        await chatService.initialize(undefined, (progress) => {
          setProcessingProgress(progress);
        });
      }

      // Create or load conversation
      const newConvId = await chatService.getOrCreateConversation(transcript.id);
      setConversationId(newConvId);

      // Check if transcript has been processed for chat
      const hasEmbeddings = await checkTranscriptChatReady();
      
      if (!hasEmbeddings) {
        await processTranscriptForChat();
      } else {
        setChatReady(true);
      }

      // Load existing messages
      const existingMessages = await chatService.loadConversationHistory(newConvId);
      setMessages(existingMessages);
      
      setIsProcessingTranscript(false);
      setProcessingProgress(null);
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      setError('Failed to initialize chat. Please try again.');
      setIsProcessingTranscript(false);
    }
  };

  const checkTranscriptChatReady = async (): Promise<boolean> => {
    try {
      const stats = await chatService.getStats();
      const transcriptChunks = stats.vectorStats.transcripts.includes(transcript.id);
      return transcriptChunks;
    } catch (error) {
      console.error('Failed to check chat readiness:', error);
      return false;
    }
  };

  const processTranscriptForChat = async () => {
    try {
      setIsProcessingTranscript(true);
      
      // Get transcript segments
      const segments = await window.electronAPI.database.all(
        'SELECT * FROM transcript_segments WHERE transcript_id = ? ORDER BY start_time',
        [transcript.id]
      );

      await chatService.processTranscriptForChat(
        transcript,
        segments,
        (progress) => {
          setProcessingProgress(progress);
        }
      );
      
      setChatReady(true);
    } catch (error) {
      console.error('Failed to process transcript for chat:', error);
      setError('Failed to prepare transcript for chat. Please try again.');
      throw error;
    }
  };

  // Remove this function since we're now using chatService.loadConversationHistory directly

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isLoading || !chatReady) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: currentMessage.trim(),
      timestamp: new Date().toISOString()
    };

    // Add user message to UI
    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      // Get assistant response
      const assistantMessage = await chatService.chatWithTranscript(
        transcript.id,
        conversationId,
        userMessage.content,
        messages
      );

      // Add assistant message to UI
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to get chat response:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your question. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <MessageCircle size={20} className="text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Chat with Transcript
              </h2>
              <p className="text-sm text-gray-600">{transcript.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Processing/Error States */}
        {isProcessingTranscript && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Preparing Chat
                </h3>
                {processingProgress && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      {processingProgress.message}
                    </p>
                    <div className="w-64 bg-gray-200 rounded-full h-2 mx-auto">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${(processingProgress.progress / processingProgress.total) * 100}%` 
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      {processingProgress.progress}/{processingProgress.total}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <AlertCircle size={48} className="text-red-500 mx-auto" />
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Error
                </h3>
                <p className="text-sm text-gray-600 mb-4">{error}</p>
                <button
                  onClick={initializeChat}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chat Interface */}
        {chatReady && !error && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <MessageCircle size={48} className="text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Start a conversation
                  </h3>
                  <p className="text-gray-600">
                    Ask questions about the transcript content, request summaries, or explore specific topics.
                  </p>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.role === 'assistant' && (
                        <Bot size={16} className="text-gray-500 mt-1 flex-shrink-0" />
                      )}
                      {message.role === 'user' && (
                        <User size={16} className="text-white mt-1 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                          }`}
                        >
                          {formatTime(message.timestamp)}
                          {message.metadata?.processingTime && (
                            <span className="ml-2">
                              ({Math.round(message.metadata.processingTime / 1000)}s)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-3 max-w-[70%]">
                    <div className="flex items-center space-x-2">
                      <Bot size={16} className="text-gray-500" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex space-x-3">
                <textarea
                  ref={textareaRef}
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask a question about the transcript..."
                  className="flex-1 resize-none px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim() || isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};