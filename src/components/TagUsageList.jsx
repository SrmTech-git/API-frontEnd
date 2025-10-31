// This component displays tag usage statistics for welfare analyses
// Shows how many times each tag has been used across all analyses

import { useState, useEffect } from 'react';
import { getTagUsage } from '../services/analysisService';
import './TagUsageList.css';

const TagUsageList = () => {
  // State for tag usage data
  const [tagUsage, setTagUsage] = useState({});

  // State for loading and error handling
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch tag usage statistics when component mounts
  useEffect(() => {
    loadTagUsage();
  }, []);

  // Function to fetch tag usage statistics from the API
  const loadTagUsage = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call the API to get tag usage statistics
      const result = await getTagUsage();

      if (result.success) {
        // Update state with the fetched tag usage data
        setTagUsage(result.tagUsage || {});
      } else {
        // API returned an error
        setError(result.error || 'Failed to load tag usage statistics');
      }

    } catch (err) {
      // Network or other error occurred
      console.error('Failed to load tag usage statistics:', err);
      setError('Failed to load tag usage statistics. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Convert tagUsage object to array of [tagName, count] entries
  const tagEntries = Object.entries(tagUsage);

  return (
    <div className="tag-usage-list">
      <h2 className="card-header">Tag Usage</h2>

      {/* Loading state */}
      {loading && (
        <div className="loading-message">
          <p>Loading tag usage...</p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {/* No tags found state */}
      {!loading && !error && tagEntries.length === 0 && (
        <div className="empty-message">
          <p>No tags found</p>
        </div>
      )}

      {/* Tag usage display */}
      {!loading && !error && tagEntries.length > 0 && (
        <div className="tags-container">
          {tagEntries.map(([tagName, count]) => (
            <div key={tagName} className="tag-item">
              <div className="tag-name">{tagName}</div>
              <div className="tag-count">
                {count} {count === 1 ? 'conversation' : 'conversations'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TagUsageList;
