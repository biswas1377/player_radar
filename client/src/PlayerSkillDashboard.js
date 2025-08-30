import React, { useState, useEffect } from 'react';
import './PlayerSkillDashboard.css';

const PlayerSkillDashboard = ({ player, isPlayerView = false, onOpenEvaluation = null }) => {
  const [evaluations, setEvaluations] = useState([]);
  const [averageRatings, setAverageRatings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [viewMode, setViewMode] = useState('overview'); // 'overview', 'history', 'details'
  const [localPlayer, setLocalPlayer] = useState(null); // used when isPlayerView === true

  useEffect(() => {
    // If this component is used by a logged-in player (isPlayerView), fetch that player's profile first
    if (isPlayerView) {
      fetchLocalPlayer();
      return; // fetchLocalPlayer will trigger evaluation/averages fetch
    }

    if (player) {
      fetchPlayerEvaluations(player._id);
      fetchAverageRatings(player._id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player, isPlayerView]);

  // When localPlayer becomes available (player viewing own dashboard), fetch evaluations
  useEffect(() => {
    if (isPlayerView && localPlayer) {
      fetchPlayerEvaluations(localPlayer._id);
      fetchAverageRatings(localPlayer._id);
    }
  }, [isPlayerView, localPlayer]);

  const fetchLocalPlayer = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/players/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        console.error('Failed to fetch local player profile', res.status);
        setLocalPlayer(null);
        setLoading(false);
        return;
      }

      const data = await res.json();
      setLocalPlayer(data);
    } catch (err) {
      console.error('Error fetching local player:', err);
      setLocalPlayer(null);
    }
  };

  const fetchPlayerEvaluations = async (playerId) => {
    if (!playerId) return setEvaluations([]);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/skill-evaluations/player/${playerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setEvaluations(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch evaluations:', response.status);
        setEvaluations([]);
      }
    } catch (error) {
      console.error('Error fetching evaluations:', error);
      setEvaluations([]);
    }
  };

  const fetchAverageRatings = async (playerId) => {
    if (!playerId) {
      setAverageRatings(null);
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/skill-evaluations/player/${playerId}/averages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAverageRatings(data);
      } else {
        console.error('Failed to fetch average ratings:', response.status);
        setAverageRatings(null);
      }
    } catch (error) {
      console.error('Error fetching average ratings:', error);
      setAverageRatings(null);
    } finally {
      setLoading(false);
    }
  };

  const getRatingColor = (rating) => {
    if (rating <= 3) return '#ff4757'; // Red
    if (rating <= 5) return '#ffa502'; // Orange
    if (rating <= 7) return '#ffdd59'; // Yellow
    if (rating <= 8) return '#7bed9f'; // Light Green
    return '#2ed573'; // Green
  };

  const getRatingLabel = (rating) => {
    if (rating <= 2) return 'Poor';
    if (rating <= 4) return 'Below Average';
    if (rating <= 6) return 'Average';
    if (rating <= 8) return 'Good';
    return 'Excellent';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const buildPrintableHtmlFromEvaluation = (evaluation) => {
    const escape = (s) => (s ? String(s).replace(/</g, '&lt;').replace(/>/g, '&gt;') : '');
    const skillsHtml = (evaluation.skillRatings || []).map(r => (
      `<tr><td style="padding:6px 8px;border:1px solid #ddd">${escape(r.category)}</td>` +
      `<td style="padding:6px 8px;border:1px solid #ddd">${escape(r.subcategory)}</td>` +
      `<td style="padding:6px 8px;border:1px solid #ddd;text-align:center">${escape(r.rating)}</td></tr>`
    )).join('');

    return `
      <!doctype html>
      <html>
      <head><meta charset="utf-8" /><title>Evaluation - ${escape(evaluation.playerName || 'Player')}</title>
      <style>body{font-family:Arial;padding:18px;color:#222}h1{color:#2c3e50}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px}</style></head>
      <body>
        <h1>Skill Evaluation — ${escape(evaluation.playerName || 'Player')}</h1>
        <div><strong>Overall:</strong> ${escape(evaluation.overallRating || '')}/10</div>
        <div style="margin-top:12px"><strong>Date:</strong> ${escape(evaluation.evaluationDate || evaluation.createdAt || '')}</div>
        <h3 style="margin-top:18px">Skill Ratings</h3>
        <table><thead><tr><th>Category</th><th>Subcategory</th><th>Rating</th></tr></thead><tbody>${skillsHtml}</tbody></table>
        <h3>Strengths</h3><ul>${(evaluation.strengths||[]).map(s=>`<li>${escape(s)}</li>`).join('')||'<li>N/A</li>'}</ul>
        <h3>Improvements</h3><ul>${(evaluation.areasForImprovement||[]).map(a=>`<li>${escape(a)}</li>`).join('')||'<li>N/A</li>'}</ul>
        <h3>Notes</h3><div>${escape(evaluation.generalNotes||'')}</div>
      </body></html>`;
  };

  const downloadEvaluationPdf = (evaluation) => {
    const html = buildPrintableHtmlFromEvaluation(evaluation);

    const printHtml = (htmlContent) => {
      // Use invisible iframe to print (no new tab)
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';
      document.body.appendChild(iframe);

      const idoc = iframe.contentDocument || iframe.contentWindow.document;
      idoc.open();
      idoc.write(htmlContent);
      idoc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } catch (err) {
          console.warn('Print via iframe failed', err);
        }
        setTimeout(() => { try { document.body.removeChild(iframe); } catch (_) {} }, 1000);
      }, 350);
    };

    printHtml(html);
  };

  const getRecommendationColor = (recommendation) => {
    switch (recommendation) {
      case 'highly_recommend': return '#2ed573';
      case 'recommend': return '#7bed9f';
      case 'consider': return '#ffdd59';
      case 'not_recommend': return '#ff4757';
      default: return '#74b9ff';
    }
  };

  const getRecommendationText = (recommendation) => {
    switch (recommendation) {
      case 'highly_recommend': return 'Highly Recommend';
      case 'recommend': return 'Recommend';
      case 'consider': return 'Consider';
      case 'not_recommend': return 'Do Not Recommend';
      default: return 'No Recommendation';
    }
  };

  if (loading) {
    return <div className="loading">Loading skill evaluations...</div>;
  }

  // If this is player view but we couldn't load the player profile
  const effectivePlayer = isPlayerView ? localPlayer : player;
  if (isPlayerView && !localPlayer) {
    return (
      <div className="player-skill-dashboard">
        <div className="no-data">
          <h3>Unable to load your profile</h3>
          <p>Please sign in again or contact an administrator.</p>
        </div>
      </div>
    );
  }
  // If this is the player's own view, render a compact summary and a single button
  if (isPlayerView) {
    return (
      <div className="player-skill-dashboard compact">
        <div className="dashboard-header">
          <h2>{(effectivePlayer && effectivePlayer.name) || 'Player'} - Skill Analysis</h2>
        </div>

        <div className="compact-summary">
          <div className="summary-cards">
            <div className="summary-card">
              <h4>Overall Rating</h4>
              <div className="summary-value">{averageRatings && averageRatings.overallAverage !== undefined ? averageRatings.overallAverage.toFixed(1) : '—'}/10</div>
              <div className="summary-label">{averageRatings ? (getRatingLabel(averageRatings.overallAverage)) : ''}</div>
            </div>
            <div className="summary-card">
              <h4>Total Evaluations</h4>
              <div className="summary-value">{evaluations && evaluations.length ? evaluations.length : 0}</div>
            </div>
            <div className="summary-card">
              <h4>Latest Evaluation</h4>
              <div className="summary-value">{evaluations && evaluations.length > 0 ? formatDate(evaluations[0].evaluationDate || evaluations[0].createdAt) : 'None'}</div>
            </div>
          </div>

          <div className="compact-actions">
            <button
              className="open-eval-primary"
              onClick={() => {
                if (onOpenEvaluation) onOpenEvaluation(effectivePlayer);
                else setViewMode('overview');
              }}
            >
              Open Evaluations
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="player-skill-dashboard">
      <div className="dashboard-header">
        <h2>{(effectivePlayer && effectivePlayer.name) || 'Player'} - Skill Analysis</h2>
        <div className="view-controls">
          <button 
            className={viewMode === 'overview' ? 'active' : ''}
            onClick={() => setViewMode('overview')}
          >
            Overview
          </button>
          <button 
            className={viewMode === 'history' ? 'active' : ''}
            onClick={() => setViewMode('history')}
          >
            Evaluation History
          </button>
        </div>
      </div>

      {viewMode === 'overview' && (
        <div className="overview-section">
          {averageRatings && averageRatings.overallAverage !== undefined ? (
            <>
              {/* Overall Statistics */}
              <div className="stats-cards">
                <div className="stat-card overall">
                  <h3>Overall Rating</h3>
                  <div className="rating-circle" style={{ borderColor: getRatingColor(averageRatings.overallAverage) }}>
                    <span className="rating-number" style={{ color: getRatingColor(averageRatings.overallAverage) }}>
                      {averageRatings.overallAverage.toFixed(1)}
                    </span>
                    <span className="rating-max">/10</span>
                  </div>
                  <p className="rating-label">{getRatingLabel(averageRatings.overallAverage)}</p>
                </div>
                
                <div className="stat-card">
                  <h3>Total Evaluations</h3>
                  <div className="stat-number">{evaluations && evaluations.length ? evaluations.length : 0}</div>
                </div>
                
                <div className="stat-card">
                  <h3>Latest Evaluation</h3>
                  <div className="stat-date">
                    {evaluations && evaluations.length > 0 ? formatDate(evaluations[0].evaluationDate) : 'None'}
                  </div>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="category-breakdown">
                <h3>Category Averages</h3>
                <div className="categories-grid">
                  {averageRatings.categories && Object.keys(averageRatings.categories).length > 0 ? (
                    Object.keys(averageRatings.categories).map(categoryKey => {
                      const categoryAverage = averageRatings.categories[categoryKey];
                      
                      // Get subcategories for this category
                      const subcategories = Object.keys(averageRatings.subcategories || {})
                        .filter(key => key.startsWith(`${categoryKey}.`))
                        .map(key => ({
                          subcategory: key.split('.')[1],
                          average: averageRatings.subcategories[key]
                        }));
                      
                      return (
                        <div key={categoryKey} className="category-card">
                          <h4>{categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1)}</h4>
                          <div className="category-rating" style={{ color: getRatingColor(categoryAverage) }}>
                            {categoryAverage.toFixed(1)}/10
                          </div>
                          <div className="category-bar">
                            <div 
                              className="category-fill" 
                              style={{ 
                                width: `${(categoryAverage / 10) * 100}%`,
                                backgroundColor: getRatingColor(categoryAverage)
                              }}
                            ></div>
                          </div>
                          <div className="subcategory-list">
                            {subcategories.map(sub => (
                              <div key={sub.subcategory} className="subcategory-item">
                                <span className="subcategory-name">{sub.subcategory}</span>
                                <span className="subcategory-rating" style={{ color: getRatingColor(sub.average) }}>
                                  {sub.average.toFixed(1)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="no-category-data">
                      <p>No category data available yet.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Recommendations removed per UI request */}
            </>
          ) : (
            <div className="no-data">
              <h3>No evaluations available</h3>
              <p>This player hasn't been evaluated yet.</p>
            </div>
          )}
        </div>
      )}

      {viewMode === 'history' && (
        <div className="history-section">
          <h3>Evaluation History ({evaluations && evaluations.length ? evaluations.length : 0} evaluations)</h3>
          {evaluations && evaluations.length > 0 ? (
            <div className="evaluations-timeline">
              {evaluations.map(evaluation => (
                <div key={evaluation._id} className="timeline-item">
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <div className="evaluation-header">
                      <div className="evaluation-meta">
                        <h4>Evaluation by {evaluation.scoutName || evaluation.evaluatedBy}</h4>
                        <span className="evaluation-date">{formatDate(evaluation.evaluationDate || evaluation.createdAt)}</span>
                      </div>
                      <div className="evaluation-rating" style={{ color: getRatingColor(evaluation.overallRating) }}>
                        {evaluation.overallRating.toFixed(1)}/10
                      </div>
                    </div>
                    
                    {evaluation.matchContext && evaluation.matchContext.opponent && (
                      <div className="match-context">
                        <strong>Match:</strong> vs {evaluation.matchContext.opponent}
                        {evaluation.matchContext.competition && ` (${evaluation.matchContext.competition})`}
                      </div>
                    )}
                    
                    <div 
                      className="recommendation-badge small"
                      style={{ backgroundColor: getRecommendationColor(evaluation.recommendation) }}
                    >
                      {getRecommendationText(evaluation.recommendation)}
                    </div>
                    
                    {evaluation.strengths && evaluation.strengths.length > 0 && (
                      <div className="evaluation-highlights">
                        <strong>Key Strengths:</strong>
                        <ul>
                          {evaluation.strengths.slice(0, 2).map((strength, index) => (
                            <li key={index}>{strength}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div style={{display:'flex', gap:8}}>
                      <button 
                        className="view-details-btn"
                        onClick={() => {
                          setSelectedEvaluation(evaluation);
                          setViewMode('details');
                        }}
                      >
                        View Details
                      </button>
                      <button
                        className="view-details-btn"
                        onClick={() => downloadEvaluationPdf(evaluation)}
                        title="Download this evaluation as PDF"
                        style={{ background: '#6c5ce7' }}
                      >
                        PDF
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data">
              <p>No evaluations found for this player.</p>
            </div>
          )}
        </div>
      )}

      {viewMode === 'details' && selectedEvaluation && (
        <div className="details-section">
          <div className="details-header">
            <button 
              className="back-btn"
              onClick={() => setViewMode('history')}
            >
              ← Back to History
            </button>
            <h3>Evaluation Details - {formatDate(selectedEvaluation.evaluationDate)}</h3>
          </div>
          
          <div className="evaluation-details">
            <div className="details-grid">
              <div className="detail-section">
                <h4>Scout Information</h4>
                <p><strong>Scout:</strong> {selectedEvaluation.scoutName || selectedEvaluation.evaluatedBy}</p>
                <p><strong>Date:</strong> {formatDate(selectedEvaluation.evaluationDate || selectedEvaluation.createdAt)}</p>
                <p><strong>Overall Rating:</strong> 
                  <span style={{ color: getRatingColor(selectedEvaluation.overallRating) }}>
                    {selectedEvaluation.overallRating.toFixed(1)}/10
                  </span>
                </p>
              </div>
              
              {selectedEvaluation.matchContext && (
                <div className="detail-section">
                  <h4>Match Context</h4>
                  <p><strong>Opponent:</strong> {selectedEvaluation.matchContext.opponent || 'N/A'}</p>
                  <p><strong>Competition:</strong> {selectedEvaluation.matchContext.competition || 'N/A'}</p>
                  <p><strong>Position:</strong> {selectedEvaluation.matchContext.playerPosition || 'N/A'}</p>
                  <p><strong>Match Date:</strong> {selectedEvaluation.matchContext.matchDate ? formatDate(selectedEvaluation.matchContext.matchDate) : 'N/A'}</p>
                </div>
              )}
            </div>
            
            <div className="skills-breakdown">
              <h4>Skill Ratings</h4>
              <div className="skills-grid-details">
                {selectedEvaluation.skillRatings && selectedEvaluation.skillRatings.length > 0 ? (
                  selectedEvaluation.skillRatings.map(skill => (
                    <div key={`${skill.category}-${skill.subcategory}`} className="skill-detail-item">
                      <div className="skill-name">
                        {skill.category.charAt(0).toUpperCase() + skill.category.slice(1)} - {skill.subcategory}
                      </div>
                      <div className="skill-rating" style={{ color: getRatingColor(skill.rating) }}>
                        {skill.rating}/10
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No skill ratings available.</p>
                )}
              </div>
            </div>
            
            {selectedEvaluation.strengths && selectedEvaluation.strengths.length > 0 && (
              <div className="detail-section">
                <h4>Key Strengths</h4>
                <ul>
                  {selectedEvaluation.strengths.map((strength, index) => (
                    <li key={index}>{strength}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {selectedEvaluation.areasForImprovement && selectedEvaluation.areasForImprovement.length > 0 && (
              <div className="detail-section">
                <h4>Areas for Improvement</h4>
                <ul>
                  {selectedEvaluation.areasForImprovement.map((area, index) => (
                    <li key={index}>{area}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {selectedEvaluation.generalNotes && (
              <div className="detail-section">
                <h4>General Notes</h4>
                <p>{selectedEvaluation.generalNotes}</p>
              </div>
            )}
            
            <div className="detail-section">
              <h4>Recommendation</h4>
              <div 
                className="recommendation-badge"
                style={{ backgroundColor: getRecommendationColor(selectedEvaluation.recommendation) }}
              >
                {getRecommendationText(selectedEvaluation.recommendation)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerSkillDashboard;
