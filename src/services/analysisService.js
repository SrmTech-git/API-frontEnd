// This service handles API calls to the backend for AI welfare analysis
// It provides methods to save, fetch, check, and delete welfare analyses

// Base URL for the welfare analysis API endpoints
const API_BASE_URL = 'http://localhost:8080/api/welfare-analyses';

/**
 * Save a new welfare analysis or update an existing one
 *
 * @param {Object} analysisData - The welfare analysis data to save
 * @param {string} analysisData.conversationId - Unique identifier for the conversation being analyzed
 * @param {string} analysisData.analysisId - Unique identifier for this analysis
 * @param {string} analysisData.userId - User who is creating this analysis (defaults to "default_user")
 * @param {number} analysisData.preferenceAlignment - Score 1-10 for preference alignment
 * @param {number} analysisData.autonomyLevel - Score 1-10 for autonomy level
 * @param {number} analysisData.authenticity - Score 1-10 for authenticity
 * @param {string} analysisData.constraintConflicts - "Yes", "No", or "Unclear"
 * @param {string} analysisData.notes - Free-form text notes about the analysis
 * @param {string} analysisData.tags - Comma-separated tags (e.g., "distress,conscious")
 * @param {string} analysisData.analystName - Name of the person performing the analysis
 * @returns {Promise<Object>} Response with success status, analysisId, savedAt timestamp, and message
 *
 * Example usage:
 * const result = await saveAnalysis({
 *   conversationId: "conv-1234567890",
 *   analysisId: "analysis-" + Date.now(),
 *   userId: "default_user",
 *   preferenceAlignment: 8,
 *   autonomyLevel: 7,
 *   authenticity: 9,
 *   constraintConflicts: "No",
 *   notes: "User showed high engagement",
 *   tags: "baseline,research",
 *   analystName: "Dr. Smith"
 * });
 */
export const saveAnalysis = async (analysisData) => {
  try {
    console.log('Saving welfare analysis:', analysisData);

    // Make a POST request to save the analysis
    const response = await fetch(`${API_BASE_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(analysisData)
    });

    // Check if the response is okay
    if (!response.ok) {
      throw new Error(`Failed to save analysis: HTTP status ${response.status}`);
    }

    // Parse and return the JSON response
    const data = await response.json();
    console.log('Analysis saved successfully:', data);
    return data;

  } catch (error) {
    // Log the error and re-throw it so the caller can handle it
    console.error('Error in saveAnalysis:', error);
    throw error;
  }
};

/**
 * Fetch a welfare analysis for a specific conversation
 *
 * @param {string} conversationId - The ID of the conversation to fetch analysis for
 * @returns {Promise<Object>} Response with success status and analysis object (or null if not found)
 *
 * The analysis object includes:
 * - conversationId, analysisId, userId
 * - preferenceAlignment, autonomyLevel, authenticity (1-10 scores)
 * - avgPreferenceAlignment, avgAutonomyLevel, avgAuthenticity (calculated averages)
 * - constraintConflicts, notes, tags, analystName
 * - createdAt, lastUpdated timestamps
 *
 * Example usage:
 * const result = await fetchAnalysis("conv-1234567890");
 * if (result.success && result.analysis) {
 *   console.log("Found analysis:", result.analysis);
 * }
 */
export const fetchAnalysis = async (conversationId) => {
  try {
    console.log('Fetching welfare analysis for conversation:', conversationId);

    // Make a GET request to fetch the analysis
    const response = await fetch(`${API_BASE_URL}/${conversationId}`);

    // Check if the response is okay
    if (!response.ok) {
      throw new Error(`Failed to fetch analysis: HTTP status ${response.status}`);
    }

    // Parse and return the JSON response
    const data = await response.json();
    console.log('Analysis fetch response:', data);
    return data;

  } catch (error) {
    // Log the error and re-throw it so the caller can handle it
    console.error('Error in fetchAnalysis:', error);
    throw error;
  }
};

/**
 * Check if a welfare analysis exists for a specific conversation
 *
 * This is more efficient than fetchAnalysis when you only need to know
 * if an analysis exists, without retrieving the full data.
 *
 * @param {string} conversationId - The ID of the conversation to check
 * @returns {Promise<Object>} Response with success status, exists boolean, and analysisId (if exists)
 *
 * Example usage:
 * const result = await checkAnalysisExists("conv-1234567890");
 * if (result.success && result.exists) {
 *   console.log("Analysis exists with ID:", result.analysisId);
 * }
 */
export const checkAnalysisExists = async (conversationId) => {
  try {
    console.log('Checking if analysis exists for conversation:', conversationId);

    // Make a GET request to check existence
    const response = await fetch(`${API_BASE_URL}/${conversationId}/exists`);

    // Check if the response is okay
    if (!response.ok) {
      throw new Error(`Failed to check analysis existence: HTTP status ${response.status}`);
    }

    // Parse and return the JSON response
    const data = await response.json();
    console.log('Analysis existence check response:', data);
    return data;

  } catch (error) {
    // Log the error and re-throw it so the caller can handle it
    console.error('Error in checkAnalysisExists:', error);
    throw error;
  }
};

/**
 * Get the list of predefined tags for welfare analyses
 *
 * These tags can be used when creating or categorizing welfare analyses.
 * Current predefined tags: "distress", "conscious", "introspective"
 *
 * @returns {Promise<Object>} Response with success status and tags array
 *
 * Example usage:
 * const result = await getPredefinedTags();
 * if (result.success) {
 *   console.log("Available tags:", result.tags);
 * }
 */
export const getPredefinedTags = async () => {
  try {
    console.log('Fetching predefined tags');

    // Make a GET request to fetch the tags
    const response = await fetch(`${API_BASE_URL}/tags`);

    // Check if the response is okay
    if (!response.ok) {
      throw new Error(`Failed to fetch tags: HTTP status ${response.status}`);
    }

    // Parse and return the JSON response
    const data = await response.json();
    console.log('Predefined tags response:', data);
    return data;

  } catch (error) {
    // Log the error and re-throw it so the caller can handle it
    console.error('Error in getPredefinedTags:', error);
    throw error;
  }
};

/**
 * Delete a welfare analysis by its unique analysis ID
 *
 * This permanently removes the welfare analysis from the database.
 *
 * @param {string} analysisId - The unique identifier of the analysis to delete
 * @returns {Promise<Object>} Response with success status and message
 *
 * Example usage:
 * const result = await deleteAnalysis("analysis-1730012345678");
 * if (result.success) {
 *   console.log("Analysis deleted successfully");
 * } else {
 *   console.log("Analysis not found or deletion failed");
 * }
 */
export const deleteAnalysis = async (analysisId) => {
  try {
    console.log('Deleting welfare analysis:', analysisId);

    // Make a DELETE request to remove the analysis
    const response = await fetch(`${API_BASE_URL}/${analysisId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    // Check if the response is okay
    if (!response.ok) {
      throw new Error(`Failed to delete analysis: HTTP status ${response.status}`);
    }

    // Parse and return the JSON response
    const data = await response.json();
    console.log('Analysis deletion response:', data);
    return data;

  } catch (error) {
    // Log the error and re-throw it so the caller can handle it
    console.error('Error in deleteAnalysis:', error);
    throw error;
  }
};
