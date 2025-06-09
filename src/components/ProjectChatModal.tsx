import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageSquare, Users, BarChart3, Loader } from 'lucide-react';
import { Project } from '../types';
import { projectChatService, ProjectChatMessage } from '../services/projectChatService';

interface ProjectChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

export const ProjectChatModal: React.FC<ProjectChatModalProps> = ({
  isOpen,
  onClose,
  project
}) => {
  const [messages, setMessages] = useState<ProjectChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize project chat when modal opens
  useEffect(() => {
    if (isOpen && project.id) {
      initializeProjectChat();
    }
  }, [isOpen, project.id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeProjectChat = async () => {
    try {
      setIsInitializing(true);
      
      // Initialize project chat service
      await projectChatService.initialize();
      
      // Get or create conversation
      const convId = await projectChatService.getOrCreateProjectConversation(project.id);
      setConversationId(convId);
      
      // Load conversation history
      const history = await projectChatService.loadProjectConversationHistory(convId);
      setMessages(history);
      
      console.log('Project chat initialized successfully');
    } catch (error) {
      console.error('Failed to initialize project chat:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !conversationId || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      // Add user message to UI immediately
      const tempUserMessage: ProjectChatMessage = {
        id: `temp_${Date.now()}`,
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, tempUserMessage]);

      // Send to project chat service
      const response = await projectChatService.chatWithProject(
        project.id,
        conversationId,
        userMessage,
        messages
      );

      // Update messages with actual response
      setMessages(prev => [...prev.slice(0, -1), tempUserMessage, response]);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Add error message
      const errorMessage: ProjectChatMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: "I'm sorry, I encountered an error while processing your question. Please try again.",
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

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getAnalysisTypeIcon = (analysisType: string) => {
    switch (analysisType) {
      case 'collated':
        return <BarChart3 className="w-3 h-3" />;
      case 'cross_transcript':
        return <Users className="w-3 h-3" />;
      case 'hybrid':
        return <MessageSquare className="w-3 h-3" />;
      default:
        return <MessageSquare className="w-3 h-3" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-4/5 h-4/5 max-w-4xl max-h-[800px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold">Project Chat</h2>
              <p className="text-sm text-gray-600">{project.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isInitializing ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Initializing project chat...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Start a conversation about this project!</p>
              <p className="text-sm mt-1">
                Ask questions about themes, patterns, or insights across transcripts.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-3/4 rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                    <span>{formatTimestamp(message.timestamp)}</span>
                    {message.role === 'assistant' && message.metadata && (
                      <div className="flex items-center space-x-2">
                        {message.metadata.analysisType && (
                          <div className="flex items-center space-x-1">
                            {getAnalysisTypeIcon(message.metadata.analysisType)}
                            <span>{message.metadata.analysisType}</span>
                          </div>
                        )}
                        {message.metadata.sourceTranscripts && (
                          <span>{message.metadata.sourceTranscripts.length} transcripts</span>
                        )}
                        {message.metadata.processingTime && (
                          <span>{message.metadata.processingTime}ms</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3 flex items-center space-x-2">
                <Loader className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-gray-600">Analyzing project...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex space-x-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about patterns, themes, or insights across project transcripts..."
              className="flex-1 resize-none border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              disabled={isLoading || isInitializing || !conversationId}
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading || isInitializing || !conversationId}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isLoading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Send</span>
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Press Enter to send, Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
};