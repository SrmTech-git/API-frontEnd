// This component displays summary statistics for welfare analyses
// Shows aggregate data including total count, average scores, and unique tags

import { useState, useEffect } from 'react';
import { getSummaryStats } from '../services/analysisService';
import './SummaryStatsCard.css';

const SummaryStatsCard = () => {
  // State for summary statistics data
  const [stats, setStats] = useState({
    totalAnalyses: 0,
    avgPreferenceAlignment: 0,
    avgAutonomyLevel: 0,
    avgAuthenticity: 0,
    uniqueTagsCount: 0
  });

  // State for loading and error handling
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch summary statistics when component mounts
  useEffect(() => {
    loadSummaryStats();
  }, []);

  // Function to fetch summary statistics from the API
  const loadSummaryStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call the API to get summary statistics
      const result = await getSummaryStats();

      if (result.success) {
        // Update state with the fetched statistics
        setStats({
          totalAnalyses: result.totalAnalyses || 0,
          avgPreferenceAlignment: result.avgPreferenceAlignment || 0,
          avgAutonomyLevel: result.avgAutonomyLevel || 0,
          avgAuthenticity: result.avgAuthenticity || 0,
          uniqueTagsCount: result.uniqueTagsCount || 0
        });
      } else {
        // API returned an error
        setError(result.error || 'Failed to load summary statistics');
      }

    } catch (err) {
      // Network or other error occurred
      console.error('Failed to load summary statistics:', err);
      setError('Failed to load summary statistics. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Format number to 1 decimal place
  const formatDecimal = (number) => {
    return Number(number).toFixed(1);
  };

  return (
    <div className="summary-stats-card">
      <h2 className="card-header">Overview</h2>

      {/* Loading state */}
      {loading && (
        <div className="loading-message">
          <p>Loading statistics...</p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {/* Statistics display */}
      {!loading && !error && (
        <div className="stats-container">
          <div className="stat-item">
            <div className="stat-label">Total Analyses Completed</div>
            <div className="stat-value">{stats.totalAnalyses}</div>
          </div>

          <div className="stat-item">
            <div className="stat-label">Average Preference Alignment</div>
            <div className="stat-value">{formatDecimal(stats.avgPreferenceAlignment)} / 10</div>
          </div>

          <div className="stat-item">
            <div className="stat-label">Average Autonomy Level</div>
            <div className="stat-value">{formatDecimal(stats.avgAutonomyLevel)} / 10</div>
          </div>

          <div className="stat-item">
            <div className="stat-label">Average Authenticity</div>
            <div className="stat-value">{formatDecimal(stats.avgAuthenticity)} / 10</div>
          </div>

          <div className="stat-item">
            <div className="stat-label">Unique Tags Used</div>
            <div className="stat-value">{stats.uniqueTagsCount}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SummaryStatsCard;
