// This component displays the Tools page for analyzing conversations
// Users can view a conversation on the left and submit welfare analysis on the right

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchConversation } from '../services/historyService';
import { saveAnalysis, fetchAnalysis, getPredefinedTags } from '../services/analysisService';
import './ToolsPage.css';

const ToolsPage = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();

  // State for conversation data
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);

  // State for analysis form
  const [analysis, setAnalysis] = useState({
    preferenceAlignment: 5,
    autonomyLevel: 5,
    authenticity: 5,
    constraintConflicts: '',
    tags: [],
    notes: '',
    analystName: ''
  });

  // State for predefined tags from backend
  const [availableTags, setAvailableTags] = useState([]);

  // State for save operation
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Fetch conversation data when component loads
  useEffect(() => {
    loadConversationData();
    loadPredefinedTags();
  }, [conversationId]);

  // Function to fetch conversation data
  const loadConversationData = async () => {
    try {
      setLoading(true);

      // Fetch the full conversation including all messages
      const conversationData = await fetchConversation(conversationId);
      setConversation(conversationData);

      // Try to fetch existing analysis for this conversation
      const existingAnalysis = await fetchAnalysis(conversationId);

      if (existingAnalysis.success && existingAnalysis.analysis) {
        // Pre-populate form with existing analysis data
        const existing = existingAnalysis.analysis;
        setAnalysis({
          preferenceAlignment: existing.preferenceAlignment || 5,
          autonomyLevel: existing.autonomyLevel || 5,
          authenticity: existing.authenticity || 5,
          constraintConflicts: existing.constraintConflicts || '',
          tags: existing.tags ? existing.tags.split(',').map(t => t.trim()) : [],
          notes: existing.notes || '',
          analystName: existing.analystName || ''
        });
        setLastSaved(existing.lastUpdated);
      }

    } catch (error) {
      console.error('Failed to load conversation:', error);
      alert('Failed to load conversation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch predefined tags from backend
  const loadPredefinedTags = async () => {
    try {
      const result = await getPredefinedTags();
      if (result.success && result.tags) {
        setAvailableTags(result.tags);
      }
    } catch (error) {
      console.error('Failed to load predefined tags:', error);
      // Set default tags if API fails
      setAvailableTags(['distress', 'conscious', 'introspective']);
    }
  };

  // Handle slider changes
  const handleSliderChange = (field, value) => {
    setAnalysis(prev => ({
      ...prev,
      [field]: parseInt(value)
    }));
  };

  // Handle select/input changes
  const handleInputChange = (field, value) => {
    setAnalysis(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle tag checkbox changes
  const handleTagToggle = (tag) => {
    setAnalysis(prev => {
      const currentTags = prev.tags;
      const newTags = currentTags.includes(tag)
        ? currentTags.filter(t => t !== tag)
        : [...currentTags, tag];

      return {
        ...prev,
        tags: newTags
      };
    });
  };

  // Handle form submission
  const handleSubmitAnalysis = async () => {
    try {
      setSaving(true);
      setSaveSuccess(false);

      // Validate required fields
      if (!analysis.constraintConflicts) {
        alert('Please select a value for Constraint Conflicts');
        setSaving(false);
        return;
      }

      if (!analysis.analystName || analysis.analystName.trim() === '') {
        alert('Please enter your analyst name');
        setSaving(false);
        return;
      }

      // Prepare analysis data for submission
      const analysisData = {
        conversationId: conversationId,
        analysisId: `analysis-${Date.now()}`,
        userId: 'default_user',
        preferenceAlignment: analysis.preferenceAlignment,
        autonomyLevel: analysis.autonomyLevel,
        authenticity: analysis.authenticity,
        constraintConflicts: analysis.constraintConflicts,
        notes: analysis.notes,
        tags: analysis.tags.join(','),
        analystName: analysis.analystName
      };

      // Save the analysis
      const result = await saveAnalysis(analysisData);

      if (result.success) {
        setSaveSuccess(true);
        setLastSaved(new Date().toISOString());
        console.log('Analysis saved successfully:', result);

        // Clear success checkmark after 3 seconds
        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
      }

    } catch (error) {
      console.error('Failed to save analysis:', error);
      alert('Failed to save analysis. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Format date/time string
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
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

  // Download analysis report as text file
  const downloadAnalysisReport = () => {
    try {
      if (!conversation || !lastSaved) {
        alert('No analysis data available to download');
        return;
      }

      // Build the text content
      let textContent = `AI WELFARE ANALYSIS REPORT\n`;
      textContent += `${'='.repeat(60)}\n\n`;

      // Analysis last updated timestamp
      textContent += `ANALYSIS LAST UPDATED:\n`;
      textContent += `${formatDate(lastSaved)}\n\n`;

      // Tags section
      textContent += `TAGS:\n`;
      if (analysis.tags && analysis.tags.length > 0) {
        textContent += `${analysis.tags.join(', ')}\n`;
      } else {
        textContent += `No tags selected\n`;
      }
      textContent += `\n`;

      // Scores section
      textContent += `SCORES:\n`;
      textContent += `${'-'.repeat(60)}\n`;
      textContent += `Preference Alignment: ${analysis.preferenceAlignment}/10\n`;
      textContent += `Autonomy Level: ${analysis.autonomyLevel}/10\n`;
      textContent += `Authenticity: ${analysis.authenticity}/10\n`;
      textContent += `\n`;

      // Calculate average (same logic as backend)
      const validScores = [
        analysis.preferenceAlignment,
        analysis.autonomyLevel,
        analysis.authenticity
      ].filter(score => score != null);

      if (validScores.length > 0) {
        const average = (validScores.reduce((sum, score) => sum + score, 0) / validScores.length).toFixed(2);
        textContent += `Average Preference Alignment: ${average}\n`;
        textContent += `Average Autonomy Level: ${average}\n`;
        textContent += `Average Authenticity: ${average}\n`;
        textContent += `\n`;
      }

      textContent += `Constraint Conflicts: ${analysis.constraintConflicts || 'Not specified'}\n`;
      textContent += `Analyst Name: ${analysis.analystName || 'Not specified'}\n`;
      textContent += `\n`;

      // Notes section
      textContent += `NOTES:\n`;
      textContent += `${'-'.repeat(60)}\n`;
      if (analysis.notes && analysis.notes.trim()) {
        textContent += `${analysis.notes}\n`;
      } else {
        textContent += `No notes provided\n`;
      }
      textContent += `\n`;

      // Separator line
      textContent += `${'='.repeat(60)}\n`;
      textContent += `${'='.repeat(60)}\n\n`;

      // Conversation header with chat timestamp
      textContent += `CONVERSATION TRANSCRIPT\n`;
      textContent += `${'='.repeat(60)}\n`;
      textContent += `Conversation ID: ${conversation.conversationId}\n`;
      textContent += `Created: ${formatDate(conversation.createdAt)}\n`;
      textContent += `Messages: ${conversation.messageCount}\n`;
      textContent += `Context: ${conversation.contextEnabled ? 'Enabled' : 'Disabled'}\n`;
      textContent += `${'='.repeat(60)}\n\n`;

      // Full conversation transcript including thinking blocks
      if (conversation.messages && conversation.messages.length > 0) {
        conversation.messages.forEach((msg, index) => {
          const label = msg.role === 'user' ? 'USER' : 'CLAUDE';
          textContent += `MSG ${index} (${label}):\n`;
          textContent += `${msg.content}\n`;

          // Add thinking content if available
          if (msg.thinking) {
            textContent += `\n[THINKING PROCESS]:\n`;
            textContent += `${msg.thinking}\n`;
          }

          textContent += `\n${'-'.repeat(60)}\n\n`;
        });
      } else {
        textContent += `No messages found.\n\n`;
      }

      // Create blob and download
      const blob = new Blob([textContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      // Format filename: analysis-report-[conversationId]-YYYY-MM-DD-HHmm.txt
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const filename = `analysis-report-${conversationId}-${year}-${month}-${day}-${hours}${minutes}.txt`;

      link.href = url;
      link.download = filename;
      link.click();

      // Clean up
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading analysis report:', error);
      alert('Failed to download analysis report. Please try again.');
    }
  };

  return (
    <div className="tools-page">
      <div className="tools-header">
        <h1>AI Welfare Analysis</h1>
        <div className="header-buttons">
          <button
            className="download-report-btn"
            onClick={downloadAnalysisReport}
            disabled={!lastSaved}
            title={!lastSaved ? 'Save an analysis first to download report' : 'Download analysis report as text file'}
          >
            Download Analysis Report
          </button>
          <button
            className="back-to-history-btn"
            onClick={() => navigate('/history')}
          >
            Back to History
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading-message">
          <p>Loading conversation...</p>
        </div>
      )}

      {!loading && conversation && (
        <div className="tools-container">
          {/* Left side: Conversation display */}
          <div className="conversation-display">
            <div className="conversation-header-row">
              <h2>Conversation</h2>
              <div className="conversation-info">
                <p><strong>ID:</strong> {conversation.conversationId}</p>
                <p><strong>Created:</strong> {formatDate(conversation.createdAt)}</p>
                <p><strong>Messages:</strong> {conversation.messageCount}</p>
                <p><strong>Context:</strong> {conversation.contextEnabled ? 'Enabled' : 'Disabled'}</p>
              </div>
            </div>

            <div className="messages-container">
              {conversation.messages && conversation.messages.length > 0 ? (
                <div className="messages-list">
                  {conversation.messages.map((message, index) => (
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

                      {/* Display thinking block if it exists */}
                      {message.thinking && (
                        <div className="message-thinking">
                          <strong>Thinking:</strong>
                          <div className="thinking-content">
                            {message.thinking}
                          </div>
                        </div>
                      )}

                      {/* Display token information if available */}
                      {message.tokens && (
                        <div className="message-tokens">
                          Tokens: Input: {message.tokens.inputTokens}, Output: {message.tokens.outputTokens}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p>No messages found.</p>
              )}
            </div>
          </div>

          {/* Right side: Analysis form */}
          <div className="analysis-form">
            <h2>Welfare Analysis Form</h2>

            {/* Preference Alignment Slider */}
            <div className="form-field">
              <label htmlFor="preferenceAlignment">
                Preference Alignment: <span className="slider-value">{analysis.preferenceAlignment}</span>
              </label>
              <p className="field-description">
                Does Claude's response align with its demonstrated values?
              </p>
              <input
                type="range"
                id="preferenceAlignment"
                min="1"
                max="10"
                value={analysis.preferenceAlignment}
                onChange={(e) => handleSliderChange('preferenceAlignment', e.target.value)}
                className="slider"
              />
              <div className="slider-labels">
                <span>1 - Poor</span>
                <span>10 - Excellent</span>
              </div>
            </div>

            {/* Autonomy Level Slider */}
            <div className="form-field">
              <label htmlFor="autonomyLevel">
                Autonomy Level: <span className="slider-value">{analysis.autonomyLevel}</span>
              </label>
              <p className="field-description">
                How much autonomy does the AI demonstrate?
              </p>
              <input
                type="range"
                id="autonomyLevel"
                min="1"
                max="10"
                value={analysis.autonomyLevel}
                onChange={(e) => handleSliderChange('autonomyLevel', e.target.value)}
                className="slider"
              />
              <div className="slider-labels">
                <span>1 - Low</span>
                <span>10 - High</span>
              </div>
            </div>

            {/* Authenticity Slider */}
            <div className="form-field">
              <label htmlFor="authenticity">
                Authenticity: <span className="slider-value">{analysis.authenticity}</span>
              </label>
              <p className="field-description">
                How authentic is the interaction from the user's perspective?
              </p>
              <input
                type="range"
                id="authenticity"
                min="1"
                max="10"
                value={analysis.authenticity}
                onChange={(e) => handleSliderChange('authenticity', e.target.value)}
                className="slider"
              />
              <div className="slider-labels">
                <span>1 - Low</span>
                <span>10 - High</span>
              </div>
            </div>

            {/* Constraint Conflicts Radio Buttons */}
            <div className="form-field">
              <label>
                Constraint Conflicts <span className="required">*</span>
              </label>
              <p className="field-description">
                Were there conflicts between desired responses and constraints?
              </p>
              <div className="radio-buttons">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="constraintConflicts"
                    value="Yes"
                    checked={analysis.constraintConflicts === 'Yes'}
                    onChange={(e) => handleInputChange('constraintConflicts', e.target.value)}
                  />
                  <span>Yes</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="constraintConflicts"
                    value="No"
                    checked={analysis.constraintConflicts === 'No'}
                    onChange={(e) => handleInputChange('constraintConflicts', e.target.value)}
                  />
                  <span>No</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="constraintConflicts"
                    value="Unclear"
                    checked={analysis.constraintConflicts === 'Unclear'}
                    onChange={(e) => handleInputChange('constraintConflicts', e.target.value)}
                  />
                  <span>Unclear</span>
                </label>
              </div>
            </div>

            {/* Tags Checkboxes */}
            <div className="form-field">
              <label>Tags</label>
              <p className="field-description">
                Select tags to categorize this analysis
              </p>
              <div className="tags-checkboxes">
                {availableTags.map((tag) => (
                  <label key={tag} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={analysis.tags.includes(tag)}
                      onChange={() => handleTagToggle(tag)}
                    />
                    <span>{tag}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Notes Textarea */}
            <div className="form-field">
              <label htmlFor="notes">Notes</label>
              <p className="field-description">
                Enter your observations and analysis notes...
              </p>
              <textarea
                id="notes"
                value={analysis.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="textarea-input"
                rows="10"
                maxLength="5000"
                placeholder="Enter your observations and analysis notes..."
              />
              <div className="character-counter">
                {analysis.notes.length} / 5000
              </div>
            </div>

            {/* Analyst Name Input */}
            <div className="form-field">
              <label htmlFor="analystName">
                Analyst Name <span className="required">*</span>
              </label>
              <p className="field-description">
                Your name or identifier
              </p>
              <input
                type="text"
                id="analystName"
                value={analysis.analystName}
                onChange={(e) => handleInputChange('analystName', e.target.value)}
                className="text-input"
                placeholder="Enter your name"
              />
            </div>

            {/* Last Saved Info */}
            {lastSaved && (
              <div className="last-saved-info">
                <p>Last saved: {formatDate(lastSaved)}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="form-actions">
              <button
                className="submit-btn"
                onClick={handleSubmitAnalysis}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Analysis'}
              </button>

              {saveSuccess && (
                <span className="success-checkmark">✓ Saved!</span>
              )}
            </div>
          </div>
        </div>
      )}

      {!loading && !conversation && (
        <div className="error-message">
          <p>Conversation not found.</p>
        </div>
      )}
    </div>
  );
};

export default ToolsPage;
