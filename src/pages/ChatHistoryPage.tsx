import React, { useState, useEffect } from 'react';
import { MessageCircle, Search, Clock, Trash2, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from '../utils/helpers';
import { TranscriptChatModal } from '../components/TranscriptChatModal';
import { Transcript } from '../types';

interface ChatConversation {
  id: string;
  transcript_id?: string;
  project_id?: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message?: string;
  entity_title?: string;
  entity_type: 'transcript' | 'project';
}

export const ChatHistoryPage: React.FC = () => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTranscript, setSelectedTranscript] = useState<Transcript | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string>('');

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    filterConversations();
  }, [searchQuery, conversations]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      
      // Get all conversations with metadata (transcript conversations only for now)
      const conversationsData = await window.electronAPI.database.all(`
        SELECT 
          c.id,
          c.transcript_id,
          NULL as project_id,
          c.created_at,
          c.updated_at,
          COUNT(m.id) as message_count,
          MAX(m.content) as last_message,
          t.title as entity_title,
          'transcript' as entity_type
        FROM chat_conversations c
        LEFT JOIN chat_messages m ON c.id = m.conversation_id
        LEFT JOIN transcripts t ON c.transcript_id = t.id
        WHERE (t.is_deleted != 1 OR t.is_deleted IS NULL)
        GROUP BY c.id
        ORDER BY c.updated_at DESC
      `);

      // For now, we only support transcript conversations
      // Project conversations will be added later
      setConversations(conversationsData);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterConversations = () => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = conversations.filter(conv => {
      const titleMatch = conv.entity_title?.toLowerCase().includes(query);
      const messageMatch = conv.last_message?.toLowerCase().includes(query);
      return titleMatch || messageMatch;
    });

    setFilteredConversations(filtered);
  };

  const handleContinueChat = async (conversation: ChatConversation) => {
    if (conversation.entity_type === 'transcript' && conversation.transcript_id) {
      // Load the transcript data
      const transcript = await window.electronAPI.database.get(
        'SELECT * FROM transcripts WHERE id = ?',
        [conversation.transcript_id]
      );
      
      if (transcript) {
        // Parse JSON fields
        transcript.action_items = transcript.action_items ? JSON.parse(transcript.action_items) : [];
        transcript.key_topics = transcript.key_topics ? JSON.parse(transcript.key_topics) : [];
        transcript.tags = transcript.tags ? JSON.parse(transcript.tags) : [];
        
        setSelectedTranscript(transcript);
        setSelectedConversationId(conversation.id);
        setShowChatModal(true);
      }
    } else if (conversation.entity_type === 'project') {
      // TODO: Implement project chat modal in future
      console.log('Project chat not yet implemented');
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.');
    
    if (confirmed) {
      try {
        // Delete conversation and all its messages (CASCADE will handle messages)
        await window.electronAPI.database.run(
          'DELETE FROM chat_conversations WHERE id = ?',
          [conversationId]
        );
        
        // Also check if it's a project conversation
        await window.electronAPI.database.run(
          'DELETE FROM project_chat_conversations WHERE id = ?',
          [conversationId]
        );
        
        // Reload conversations
        await loadConversations();
      } catch (error) {
        console.error('Failed to delete conversation:', error);
        alert('Failed to delete conversation. Please try again.');
      }
    }
  };

  const getConversationTitle = (conversation: ChatConversation): string => {
    // For now, use entity title. In future, we could parse first message
    return conversation.entity_title || 'Untitled Conversation';
  };

  const getConversationIcon = (entityType: string) => {
    return entityType === 'transcript' ? '📝' : '📁';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading chat history...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">💬 Chat History</h1>
        <p className="text-gray-600">View and continue your conversations with transcripts and projects</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Conversations List */}
      {filteredConversations.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? 'No conversations found' : 'No conversations yet'}
          </h3>
          <p className="text-gray-500">
            {searchQuery 
              ? 'Try adjusting your search query' 
              : 'Start chatting with a transcript or project to see your conversation history here'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">{getConversationIcon(conversation.entity_type)}</span>
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {getConversationTitle(conversation)}
                    </h3>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                    <span className="flex items-center space-x-1">
                      <Clock size={14} />
                      <span>{formatDistanceToNow(new Date(conversation.updated_at))} ago</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <MessageCircle size={14} />
                      <span>{conversation.message_count} messages</span>
                    </span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {conversation.entity_type}
                    </span>
                  </div>
                  
                  {conversation.last_message && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      Last: {conversation.last_message}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleContinueChat(conversation)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <span>Continue</span>
                  <ChevronRight size={16} />
                </button>
                
                <button
                  onClick={() => handleDeleteConversation(conversation.id)}
                  className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chat Modal */}
      {selectedTranscript && (
        <TranscriptChatModal
          transcript={selectedTranscript}
          isOpen={showChatModal}
          onClose={() => {
            setShowChatModal(false);
            setSelectedTranscript(null);
            setSelectedConversationId('');
            // Reload conversations to reflect any updates
            loadConversations();
          }}
          existingConversationId={selectedConversationId}
        />
      )}
    </div>
  );
};