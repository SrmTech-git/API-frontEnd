// This service handles API calls to the backend for conversation persistence
// It provides methods to save, fetch, and load conversation history

// Base URL for the backend API
const API_BASE_URL = 'http://localhost:8080/api';

/**
 * Save a conversation to the database
 *
 * @param {string} conversationId - Unique identifier for the conversation
 * @param {string} userId - User who owns this conversation (defaults to "default_user")
 * @param {Array} messages - Array of message objects (will be stringified)
 * @param {boolean} contextEnabled - Whether context is enabled for this conversation
 * @returns {Object} Response from the backend with success status
 */
export const saveConversation = async (conversationId, userId, messages, contextEnabled) => {
  try {
    // Convert the messages array to a JSON string before sending
    const messagesJson = JSON.stringify(messages);

    // Make a POST request to save the conversation
    const response = await fetch(`${API_BASE_URL}/conversations/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversationId: conversationId,
        userId: userId || 'default_user',
        messages: messagesJson,
        contextEnabled: contextEnabled
      })
    });

    // Check if the response is okay
    if (!response.ok) {
      throw new Error(`Failed to save conversation: ${response.status}`);
    }

    // Parse and return the JSON response
    const data = await response.json();
    return data;

  } catch (error) {
    // Log the error and re-throw it so the caller can handle it
    console.error('Error saving conversation:', error);
    throw error;
  }
};

/**
 * Fetch conversation history for a user
 *
 * @param {string} userId - User ID to fetch conversations for
 * @returns {Array} Array of conversation summaries (without full chat data)
 */
export const fetchHistory = async (userId) => {
  try {
    // Make a GET request to fetch conversation history
    const response = await fetch(
      `${API_BASE_URL}/conversations/history?userId=${userId || 'default_user'}`
    );

    // Check if the response is okay
    if (!response.ok) {
      throw new Error(`Failed to fetch history: ${response.status}`);
    }

    // Parse and return the array of conversation summaries
    const data = await response.json();
    return data;

  } catch (error) {
    // Log the error and re-throw it so the caller can handle it
    console.error('Error fetching conversation history:', error);
    throw error;
  }
};

/**
 * Fetch a specific conversation by its ID
 *
 * @param {string} conversationId - The ID of the conversation to fetch
 * @returns {Object} Full conversation data with parsed messages array
 */
export const fetchConversation = async (conversationId) => {
  try {
    // Make a GET request to fetch the specific conversation
    const response = await fetch(
      `${API_BASE_URL}/conversations/${conversationId}`
    );

    // Check if the response is okay
    if (!response.ok) {
      throw new Error(`Failed to fetch conversation: ${response.status}`);
    }

    // Parse the JSON response
    const data = await response.json();

    // Check if the conversation was found
    if (!data.success) {
      throw new Error(data.error || 'Conversation not found');
    }

    // Parse the messages JSON string back into an array
    if (data.conversation && data.conversation.chatData) {
      data.conversation.messages = JSON.parse(data.conversation.chatData);
    }

    // Return the full conversation data
    return data.conversation;

  } catch (error) {
    // Log the error and re-throw it so the caller can handle it
    console.error('Error fetching conversation:', error);
    throw error;
  }
};

/**
 * Soft delete a conversation
 *
 * @param {string} conversationId - The ID of the conversation to delete
 * @returns {Object} Response from the backend with success status
 */
export const softDeleteConversation = async (conversationId) => {
  try {
    // Make a PUT request to soft delete the conversation
    const response = await fetch(
      `${API_BASE_URL}/conversations/${conversationId}/delete`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    // Check if the response is okay
    if (!response.ok) {
      throw new Error(`Failed to delete conversation: ${response.status}`);
    }

    // Parse and return the JSON response
    const data = await response.json();
    return data;

  } catch (error) {
    // Log the error and re-throw it so the caller can handle it
    console.error('Error deleting conversation:', error);
    throw error;
  }
};

/**
 * Search conversations with filters
 *
 * @param {Object} searchParams - Search criteria object
 * @param {string} searchParams.userId - User ID to search conversations for (required)
 * @param {string} searchParams.dateFrom - Filter by conversations created after this date (optional)
 * @param {string} searchParams.dateTo - Filter by conversations created before this date (optional)
 * @param {Array<string>} searchParams.tags - Filter by tags (optional)
 * @param {boolean} searchParams.contextEnabled - Filter by context status (optional)
 * @returns {Object} Response with conversations array and count
 */
export const searchConversations = async (searchParams) => {
  try {
    // Make a POST request to search conversations
    const response = await fetch(
      `${API_BASE_URL}/conversations/search`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchParams)
      }
    );

    // Check if the response is okay
    if (!response.ok) {
      throw new Error(`Failed to search conversations: ${response.status}`);
    }

    // Parse and return the JSON response
    const data = await response.json();
    return data;

  } catch (error) {
    // Log the error and re-throw it so the caller can handle it
    console.error('Error searching conversations:', error);
    throw error;
  }
};
