// This component displays the conversation history page
// Users can view their past conversations and load them to continue chatting

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchHistory, fetchConversation } from '../services/historyService';
import './HistoryPage.css';

const HistoryPage = () => {
  const navigate = useNavigate();
  // State for managing the list of conversations
  const [conversations, setConversations] = useState([]);

  // State for the currently selected conversation (full details)
  const [selectedConversation, setSelectedConversation] = useState(null);

  // State for loading indicators
  const [loading, setLoading] = useState(true);
  const [loadingConversation, setLoadingConversation] = useState(false);

  // Fetch conversation history when the component first loads
  useEffect(() => {
    loadConversationHistory();
  }, []);

  // Function to fetch the list of conversations from the backend
  const loadConversationHistory = async () => {
    try {
      setLoading(true);

      // Fetch all conversations for the default user
      const historyData = await fetchHistory('default_user');
      setConversations(historyData);

    } catch (error) {
      console.error('Failed to load conversation history:', error);
      alert('Failed to load conversation history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle clicking on a conversation to view its details
  const handleConversationClick = async (conversationId) => {
    try {
      setLoadingConversation(true);

      // Fetch the full conversation data including all messages
      const conversationData = await fetchConversation(conversationId);
      setSelectedConversation(conversationData);

    } catch (error) {
      console.error('Failed to load conversation:', error);
      alert('Failed to load conversation details. Please try again.');
    } finally {
      setLoadingConversation(false);
    }
  };

  // Function to handle continuing a conversation in the main chat
  const handleContinueConversation = () => {
    if (!selectedConversation) return;

    console.log('Continuing conversation:', selectedConversation.conversationId);

    // Navigate to chat page with conversation state
    navigate('/chat', {
      state: {
        conversationId: selectedConversation.conversationId,
        messages: selectedConversation.messages
      }
    });
  };

  // Function to format a date/time string into a readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);

    // Format as: "Oct 26, 2025 at 3:45 PM"
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };

    return date.toLocaleString('en-US', options);
  };

  return (
    <div className="history-page">
      <div className="history-header">
        <h1>Conversation History</h1>
        <button
          className="back-to-chat-btn"
          onClick={() => navigate('/chat')}
        >
          Back to Chat
        </button>
      </div>

      <div className="history-container">
        {/* Left side: List of conversations */}
        <div className="conversations-list">
          <h2>Your Conversations</h2>

          {/* Show loading spinner while fetching history */}
          {loading && (
            <div className="loading-message">
              <p>Loading your conversations...</p>
            </div>
          )}

          {/* Show message if no conversations exist */}
          {!loading && conversations.length === 0 && (
            <div className="empty-state">
              <p>No conversations yet!</p>
              <p>Start a new chat to begin.</p>
            </div>
          )}

          {/* Display the list of conversations */}
          {!loading && conversations.length > 0 && (
            <div className="conversation-cards">
              {conversations.map((conversation) => (
                <div
                  key={conversation.conversationId}
                  className={`conversation-card ${
                    selectedConversation?.conversationId === conversation.conversationId
                      ? 'selected'
                      : ''
                  }`}
                  onClick={() => handleConversationClick(conversation.conversationId)}
                >
                  <div className="conversation-header">
                    <span className="conversation-id">
                      {conversation.conversationId}
                    </span>
                  </div>

                  <div className="conversation-details">
                    <p className="conversation-date">
                      {formatDate(conversation.createdAt)}
                    </p>

                    <p className="conversation-meta">
                      <span className="message-count">
                        {conversation.messageCount} messages
                      </span>
                      <span className="context-status">
                        Context: {conversation.contextEnabled ? 'On' : 'Off'}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right side: Selected conversation details */}
        <div className="conversation-details-panel">
          {!selectedConversation && !loadingConversation && (
            <div className="no-selection">
              <p>Select a conversation to view details</p>
            </div>
          )}

          {loadingConversation && (
            <div className="loading-message">
              <p>Loading conversation...</p>
            </div>
          )}

          {selectedConversation && !loadingConversation && (
            <div className="conversation-full-view">
              <div className="conversation-full-header">
                <h3>Conversation Details</h3>
                <button
                  className="continue-button"
                  onClick={handleContinueConversation}
                >
                  Continue Conversation
                </button>
              </div>

              <div className="conversation-info">
                <p><strong>ID:</strong> {selectedConversation.conversationId}</p>
                <p><strong>Created:</strong> {formatDate(selectedConversation.createdAt)}</p>
                <p><strong>Last Updated:</strong> {formatDate(selectedConversation.updatedAt)}</p>
                <p><strong>Messages:</strong> {selectedConversation.messageCount}</p>
                <p><strong>Context:</strong> {selectedConversation.contextEnabled ? 'Enabled' : 'Disabled'}</p>
              </div>

              <div className="messages-container">
                <h4>Messages</h4>
                {selectedConversation.messages && selectedConversation.messages.length > 0 ? (
                  <div className="messages-list">
                    {selectedConversation.messages.map((message, index) => (
                      <div
                        key={index}
                        className={`message-item ${message.role}`}
                      >
                        <div className="message-role">
                          {message.role === 'user' ? 'You' : 'Claude'}
                        </div>
                        <div className="message-content">
                          {message.content}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No messages found.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
