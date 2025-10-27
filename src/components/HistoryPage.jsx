// This component displays the conversation history page
// Users can view their past conversations and load them to continue chatting

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTrash } from 'react-icons/fa';
import { fetchHistory, fetchConversation, softDeleteConversation, searchConversations } from '../services/historyService';
import { checkAnalysisExists } from '../services/analysisService';
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

  // State for delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);

  // State for search functionality
  const [searchParams, setSearchParams] = useState({
    dateFrom: '',
    dateTo: '',
    tags: '',
    contextEnabled: ''
  });
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  // State for tracking which conversations have been analyzed
  const [analyzedConversations, setAnalyzedConversations] = useState(new Set());

  // Fetch conversation history when the component first loads
  useEffect(() => {
    loadConversationHistory();
  }, []);

  // Load analysis status for all conversations
  useEffect(() => {
    const loadAnalysisStatus = async () => {
      if (conversations.length === 0) return;

      const analyzed = new Set();

      // Check each conversation for analysis status
      for (const conv of conversations) {
        try {
          const result = await checkAnalysisExists(conv.conversationId);
          if (result.exists) {
            analyzed.add(conv.conversationId);
          }
        } catch (error) {
          // Log error but don't break the UI
          console.error('Error checking analysis status for', conv.conversationId, ':', error);
        }
      }

      setAnalyzedConversations(analyzed);
    };

    if (conversations.length > 0) {
      loadAnalysisStatus();
    }
  }, [conversations]);

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

  // Function to open delete confirmation modal
  const handleDeleteClick = (conversationId, event) => {
    // Prevent the card click event from firing
    event.stopPropagation();

    // Set the conversation to delete and show modal
    setConversationToDelete(conversationId);
    setShowDeleteModal(true);
  };

  // Function to cancel delete and close modal
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setConversationToDelete(null);
  };

  // Function to confirm and execute delete
  const handleConfirmDelete = async () => {
    if (!conversationToDelete) return;

    try {
      // Call the soft delete API
      await softDeleteConversation(conversationToDelete);

      // Remove the conversation from the list
      setConversations(prevConversations =>
        prevConversations.filter(conv => conv.conversationId !== conversationToDelete)
      );

      // Clear selected conversation if it was the one deleted
      if (selectedConversation?.conversationId === conversationToDelete) {
        setSelectedConversation(null);
      }

      // Close modal and clear state
      setShowDeleteModal(false);
      setConversationToDelete(null);

      console.log('Conversation deleted successfully:', conversationToDelete);

    } catch (error) {
      console.error('Failed to delete conversation:', error);
      alert('Failed to delete conversation. Please try again.');
      setShowDeleteModal(false);
      setConversationToDelete(null);
    }
  };

  // Function to handle search
  const handleSearch = async () => {
    try {
      setIsSearching(true);

      // Build search parameters object
      const searchRequest = {
        userId: 'default_user'
      };

      // Add dateFrom if provided (convert to ISO format)
      if (searchParams.dateFrom) {
        searchRequest.dateFrom = new Date(searchParams.dateFrom).toISOString();
      }

      // Add dateTo if provided (convert to ISO format)
      if (searchParams.dateTo) {
        searchRequest.dateTo = new Date(searchParams.dateTo).toISOString();
      }

      // Add tags if provided (split comma-separated string into array)
      if (searchParams.tags && searchParams.tags.trim()) {
        searchRequest.tags = searchParams.tags.split(',').map(tag => tag.trim());
      }

      // Add contextEnabled if a specific value is selected
      if (searchParams.contextEnabled !== '') {
        searchRequest.contextEnabled = searchParams.contextEnabled === 'true';
      }

      // Call the search API
      const result = await searchConversations(searchRequest);

      // Update conversations with search results
      setConversations(result.conversations);

      // Log result count
      console.log(`Search found ${result.count} conversations`);

    } catch (error) {
      console.error('Failed to search conversations:', error);
      alert('Failed to search conversations. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Function to clear search and reload all conversations
  const handleClearSearch = async () => {
    try {
      // Reset search parameters
      setSearchParams({
        dateFrom: '',
        dateTo: '',
        tags: '',
        contextEnabled: ''
      });

      // Reload all conversations
      setLoading(true);
      const historyData = await fetchHistory('default_user');
      setConversations(historyData);

      console.log('Search cleared, showing all conversations');

    } catch (error) {
      console.error('Failed to reload conversations:', error);
      alert('Failed to reload conversations. Please try again.');
    } finally {
      setLoading(false);
    }
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

          {/* Search Panel */}
          <div className="search-panel">
            <button
              className="search-toggle-btn"
              onClick={() => setIsSearchExpanded(!isSearchExpanded)}
            >
              <span>Search Conversations</span>
              <span className="chevron">{isSearchExpanded ? '▲' : '▼'}</span>
            </button>

            {isSearchExpanded && (
              <div className="search-fields-container">
                <div className="search-field">
                  <label htmlFor="dateFrom">Date From:</label>
                  <input
                    type="datetime-local"
                    id="dateFrom"
                    value={searchParams.dateFrom}
                    onChange={(e) => setSearchParams({...searchParams, dateFrom: e.target.value})}
                  />
                </div>

                <div className="search-field">
                  <label htmlFor="dateTo">Date To:</label>
                  <input
                    type="datetime-local"
                    id="dateTo"
                    value={searchParams.dateTo}
                    onChange={(e) => setSearchParams({...searchParams, dateTo: e.target.value})}
                  />
                </div>

                <div className="search-field">
                  <label htmlFor="tags">Tags:</label>
                  <input
                    type="text"
                    id="tags"
                    placeholder="comma-separated tags (e.g., work,important)"
                    value={searchParams.tags}
                    onChange={(e) => setSearchParams({...searchParams, tags: e.target.value})}
                  />
                </div>

                <div className="search-field">
                  <label htmlFor="contextFilter">Context:</label>
                  <select
                    id="contextFilter"
                    value={searchParams.contextEnabled}
                    onChange={(e) => setSearchParams({...searchParams, contextEnabled: e.target.value})}
                  >
                    <option value="">All</option>
                    <option value="true">Enabled</option>
                    <option value="false">Disabled</option>
                  </select>
                </div>

                <div className="search-actions">
                  <button
                    className="btn-search"
                    onClick={handleSearch}
                    disabled={isSearching}
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </button>
                  <button
                    className="btn-clear"
                    onClick={handleClearSearch}
                    disabled={isSearching}
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>

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
                  {/* Analyzed Badge - show if conversation has been analyzed */}
                  {analyzedConversations.has(conversation.conversationId) && (
                    <span className="analyzed-badge">✓ Analyzed</span>
                  )}

                  <button
                    className="delete-icon-btn"
                    onClick={(e) => handleDeleteClick(conversation.conversationId, e)}
                    title="Delete conversation"
                  >
                    <FaTrash />
                  </button>

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

                    {/* Analyze Button */}
                    <button
                      className="analyze-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/tools/${conversation.conversationId}`);
                      }}
                      title="Analyze this conversation"
                    >
                      📊 Analyze
                    </button>
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={handleCancelDelete}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-heading">Delete Conversation?</h2>

            <div className="modal-body">
              <p className="modal-warning">
                This conversation contains valuable research data about our interactions.
              </p>
              <p className="modal-info">
                The conversation will be hidden from your history but not permanently removed from the database.
                This helps preserve important data while keeping your interface clean.
              </p>
            </div>

            <div className="modal-actions">
              <button
                className="modal-btn cancel-btn"
                onClick={handleCancelDelete}
              >
                Cancel
              </button>
              <button
                className="modal-btn delete-btn"
                onClick={handleConfirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
