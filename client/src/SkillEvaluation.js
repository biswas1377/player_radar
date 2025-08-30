import React, { useState, useEffect } from 'react';
import './SkillEvaluation.css';
import ModalCenter from './components/ModalCenter';

const SkillEvaluation = ({ player, onEvaluationSubmitted, onBackClick, existingEvaluation = null }) => {
  const [skillCategories, setSkillCategories] = useState({});
  const [skillRatings, setSkillRatings] = useState({});
  const [matchContext, setMatchContext] = useState({
    opponent: '',
    matchDate: '',
    competition: '',
    playerPosition: ''
  });
  const [generalNotes, setGeneralNotes] = useState('');
  const [strengths, setStrengths] = useState(['']);
  const [areasForImprovement, setAreasForImprovement] = useState(['']);
  const [recommendation, setRecommendation] = useState('consider');
  const [loading, setLoading] = useState(false);
  const [overallRating, setOverallRating] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalOkAction, setModalOkAction] = useState(() => () => setModalOpen(false));

  // Load skill categories on component mount
  useEffect(() => {
    fetchSkillCategories();
  }, []);

  // Load existing evaluation if editing
  useEffect(() => {
    if (existingEvaluation) {
      loadExistingEvaluation(existingEvaluation);
    }
  }, [existingEvaluation]);

  // Calculate overall rating when skill ratings change
  useEffect(() => {
    calculateOverallRating();
  }, [skillRatings]);

  const fetchSkillCategories = async () => {
    try {
      const response = await fetch('/api/skill-evaluations/categories');
      const categories = await response.json();
      setSkillCategories(categories);
      
      // Initialize skill ratings
      const initialRatings = {};
      Object.keys(categories).forEach(category => {
        Object.keys(categories[category].subcategories).forEach(subcategory => {
          initialRatings[`${category}.${subcategory}`] = 5;
        });
      });
      setSkillRatings(initialRatings);
    } catch (error) {
      console.error('Error fetching skill categories:', error);
    }
  };

  const loadExistingEvaluation = (evaluation) => {
    // Load existing ratings
    const existingRatings = {};
    evaluation.skillRatings.forEach(rating => {
      existingRatings[`${rating.category}.${rating.subcategory}`] = rating.rating;
    });
    setSkillRatings(existingRatings);
    
    setMatchContext(evaluation.matchContext || {});
    setGeneralNotes(evaluation.generalNotes || '');
    setStrengths(evaluation.strengths.length > 0 ? evaluation.strengths : ['']);
    setAreasForImprovement(evaluation.areasForImprovement.length > 0 ? evaluation.areasForImprovement : ['']);
    setRecommendation(evaluation.recommendation || 'consider');
  };

  const calculateOverallRating = () => {
    const ratings = Object.values(skillRatings);
    if (ratings.length > 0) {
      const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
      setOverallRating(Math.round(average * 10) / 10);
    }
  };

  const handleRatingChange = (category, subcategory, value) => {
    const key = `${category}.${subcategory}`;
    setSkillRatings(prev => ({
      ...prev,
      [key]: parseInt(value)
    }));
  };

  const addStrength = () => {
    setStrengths([...strengths, '']);
  };

  const removeStrength = (index) => {
    setStrengths(strengths.filter((_, i) => i !== index));
  };

  const updateStrength = (index, value) => {
    const updated = [...strengths];
    updated[index] = value;
    setStrengths(updated);
  };

  const addImprovement = () => {
    setAreasForImprovement([...areasForImprovement, '']);
  };

  const removeImprovement = (index) => {
    setAreasForImprovement(areasForImprovement.filter((_, i) => i !== index));
  };

  const updateImprovement = (index, value) => {
    const updated = [...areasForImprovement];
    updated[index] = value;
    setAreasForImprovement(updated);
  };

  const handleBackClick = () => {
    // Check if there are any unsaved changes
    const hasChanges = Object.keys(skillRatings).some(key => skillRatings[key] !== 5) ||
                      matchContext.opponent || matchContext.matchDate || matchContext.competition || matchContext.playerPosition ||
                      generalNotes || strengths.some(s => s.trim()) || areasForImprovement.some(a => a.trim());
    
    if (hasChanges) {
      // Use centered modal instead of native confirm
      setModalTitle('Unsaved Changes');
      setModalMessage('You have unsaved changes. Are you sure you want to go back?');
      setModalOkAction(() => () => {
        setModalOpen(false);
        if (onBackClick) onBackClick();
      });
      setModalOpen(true);
    } else {
      if (onBackClick) {
        onBackClick();
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convert skill ratings to array format
      const skillRatingsArray = [];
      Object.keys(skillRatings).forEach(key => {
        const [category, subcategory] = key.split('.');
        skillRatingsArray.push({
          category,
          subcategory,
          rating: skillRatings[key],
          notes: ''
        });
      });

      const evaluationData = {
        playerId: player._id,
        playerName: player.name,
        matchContext,
        skillRatings: skillRatingsArray,
        generalNotes,
        strengths: strengths.filter(s => s.trim() !== ''),
        areasForImprovement: areasForImprovement.filter(a => a.trim() !== ''),
        recommendation
      };

      const token = localStorage.getItem('token');
      const url = existingEvaluation 
        ? `/api/skill-evaluations/${existingEvaluation._id}`
        : '/api/skill-evaluations';
      const method = existingEvaluation ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(evaluationData)
      });

      if (response.ok) {
        const result = await response.json();
        // Show centered modal instead of native alert. OK will call the provided callback.
        setModalTitle('Success');
        setModalMessage(`Skill evaluation ${existingEvaluation ? 'updated' : 'created'} successfully!`);
        setModalOkAction(() => () => {
          try { if (onEvaluationSubmitted) onEvaluationSubmitted(result); } catch (e) { console.warn(e); }
          setModalOpen(false);
        });
        setModalOpen(true);
      } else {
        const error = await response.json();
        setModalTitle('Error');
        setModalMessage(error.error || 'An error occurred');
        setModalOkAction(() => () => setModalOpen(false));
        setModalOpen(true);
      }
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      setModalTitle('Error');
      setModalMessage('Failed to submit evaluation');
      setModalOkAction(() => () => setModalOpen(false));
      setModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const buildPrintableHtml = (data) => {
    const escape = (s) => (s ? String(s).replace(/</g, '&lt;').replace(/>/g, '&gt;') : '');
    const skillsHtml = (data.skillRatings || []).map(r => (
      `<tr><td style="padding:6px 8px;border:1px solid #ddd">${escape(r.category)}</td>` +
      `<td style="padding:6px 8px;border:1px solid #ddd">${escape(r.subcategory)}</td>` +
      `<td style="padding:6px 8px;border:1px solid #ddd;text-align:center">${escape(r.rating)}</td></tr>`
    )).join('');

    return `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Evaluation - ${escape(player.name)}</title>
        <style>
          body{font-family: Arial, Helvetica, sans-serif; color:#222; padding:20px}
          h1{color:#c82333}
          .meta{margin-bottom:12px}
          table{border-collapse:collapse;width:100%;margin-top:10px}
          th,td{border:1px solid #ddd;padding:8px}
          th{background:#f7f7f7;text-align:left}
          .section{margin-top:18px}
        </style>
      </head>
      <body>
        <h1>Skill Evaluation — ${escape(player.name)}</h1>
        <div class="meta"><strong>Overall Rating:</strong> ${escape(overallRating)}/10</div>
        <div class="meta"><strong>Match:</strong> ${escape(matchContext.opponent || 'N/A')} &nbsp; <strong>Date:</strong> ${escape(matchContext.matchDate || 'N/A')}</div>
        <div class="section"><h3>Skill Ratings</h3>
          <table>
            <thead><tr><th>Category</th><th>Subcategory</th><th style="text-align:center">Rating</th></tr></thead>
            <tbody>${skillsHtml}</tbody>
          </table>
        </div>
        <div class="section"><h3>Key Strengths</h3><ul>${(strengths || []).filter(s=>s && s.trim()).map(s=>`<li>${escape(s)}</li>`).join('') || '<li>N/A</li>'}</ul></div>
        <div class="section"><h3>Areas for Improvement</h3><ul>${(areasForImprovement || []).filter(a=>a && a.trim()).map(a=>`<li>${escape(a)}</li>`).join('') || '<li>N/A</li>'}</ul></div>
        <div class="section"><h3>General Notes</h3><div>${escape(generalNotes) || 'N/A'}</div></div>
        <div class="section"><h3>Recommendation</h3><div>${escape(recommendation)}</div></div>
      </body>
      </html>
    `;
  };

  const handleDownloadPdf = () => {
    // Prepare evaluation snapshot
    const skillRatingsArray = Object.keys(skillRatings).map(key => {
      const [category, subcategory] = key.split('.');
      return { category, subcategory, rating: skillRatings[key] };
    });

    const data = {
      skillRatings: skillRatingsArray,
      strengths,
      areasForImprovement,
      generalNotes,
      recommendation,
      matchContext
    };

    const html = buildPrintableHtml(data);

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

      // Wait for iframe to render then trigger print
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

  return (
    <>
    <div className="skill-evaluation">
      <div className="evaluation-header">
        {onBackClick && (
          <button 
            type="button"
            className="back-btn"
            onClick={handleBackClick}
            style={{
              background: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: '20px',
              fontSize: '14px'
            }}
          >
            ← Back
          </button>
        )}
        <h2>
          {existingEvaluation ? 'Edit' : 'Create'} Skill Evaluation: {player.name}
        </h2>
        <div className="overall-rating">
          <h3>Overall Rating: <span style={{ color: getRatingColor(overallRating) }}>
            {overallRating}/10
          </span></h3>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="evaluation-form">
        {/* Match Context */}
        <div className="form-section">
          <h3>Match Context (Optional)</h3>
          <div className="context-grid">
            <div className="form-group">
              <label>Opponent:</label>
              <input
                type="text"
                value={matchContext.opponent}
                onChange={(e) => setMatchContext({...matchContext, opponent: e.target.value})}
                placeholder="e.g., Manchester United"
              />
            </div>
            <div className="form-group">
              <label>Match Date:</label>
              <input
                type="date"
                value={matchContext.matchDate}
                onChange={(e) => setMatchContext({...matchContext, matchDate: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Competition:</label>
              <input
                type="text"
                value={matchContext.competition}
                onChange={(e) => setMatchContext({...matchContext, competition: e.target.value})}
                placeholder="e.g., Premier League, Champions League"
              />
            </div>
            <div className="form-group">
              <label>Position Played:</label>
              <input
                type="text"
                value={matchContext.playerPosition}
                onChange={(e) => setMatchContext({...matchContext, playerPosition: e.target.value})}
                placeholder="e.g., Left Winger, Central Midfielder"
              />
            </div>
          </div>
        </div>

        {/* Skill Ratings */}
        <div className="form-section">
          <h3>Skill Ratings</h3>
          {Object.keys(skillCategories).map(categoryKey => {
            const category = skillCategories[categoryKey];
            return (
              <div key={categoryKey} className="skill-category">
                <h4>{category.name}</h4>
                <div className="skills-grid">
                  {Object.keys(category.subcategories).map(subcategoryKey => {
                    const subcategory = category.subcategories[subcategoryKey];
                    const ratingKey = `${categoryKey}.${subcategoryKey}`;
                    const currentRating = skillRatings[ratingKey] || 5;
                    
                    return (
                      <div key={subcategoryKey} className="skill-item">
                        <div className="skill-header">
                          <label>{subcategory.name}</label>
                          <span className="rating-display" 
                                style={{ color: getRatingColor(currentRating) }}>
                            {currentRating}/10 - {getRatingLabel(currentRating)}
                          </span>
                        </div>
                        <p className="skill-description">{subcategory.description}</p>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={currentRating}
                          onChange={(e) => handleRatingChange(categoryKey, subcategoryKey, e.target.value)}
                          className="skill-slider"
                          style={{
                            background: `linear-gradient(to right, ${getRatingColor(currentRating)} 0%, ${getRatingColor(currentRating)} ${(currentRating-1)*11.11}%, #ddd ${(currentRating-1)*11.11}%, #ddd 100%)`
                          }}
                        />
                        <div className="slider-labels">
                          <span>1</span>
                          <span>5</span>
                          <span>10</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Strengths */}
        <div className="form-section">
          <h3>Key Strengths</h3>
          {strengths.map((strength, index) => (
            <div key={index} className="list-item">
              <input
                type="text"
                value={strength}
                onChange={(e) => updateStrength(index, e.target.value)}
                placeholder="Enter a key strength..."
              />
              <button 
                type="button" 
                onClick={() => removeStrength(index)}
                className="remove-btn"
                disabled={strengths.length === 1}
              >
                ✕
              </button>
            </div>
          ))}
          <button type="button" onClick={addStrength} className="add-btn">
            + Add Strength
          </button>
        </div>

        {/* Areas for Improvement */}
        <div className="form-section">
          <h3>Areas for Improvement</h3>
          {areasForImprovement.map((improvement, index) => (
            <div key={index} className="list-item">
              <input
                type="text"
                value={improvement}
                onChange={(e) => updateImprovement(index, e.target.value)}
                placeholder="Enter an area for improvement..."
              />
              <button 
                type="button" 
                onClick={() => removeImprovement(index)}
                className="remove-btn"
                disabled={areasForImprovement.length === 1}
              >
                ✕
              </button>
            </div>
          ))}
          <button type="button" onClick={addImprovement} className="add-btn">
            + Add Improvement Area
          </button>
        </div>

        {/* General Notes */}
        <div className="form-section">
          <h3>General Notes</h3>
          <textarea
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            placeholder="Additional observations about the player's performance..."
            rows={4}
          />
        </div>

        {/* Recommendation */}
        <div className="form-section">
          <h3>Recommendation</h3>
          <select
            value={recommendation}
            onChange={(e) => setRecommendation(e.target.value)}
            className="recommendation-select"
          >
            <option value="highly_recommend">Highly Recommend</option>
            <option value="recommend">Recommend</option>
            <option value="consider">Consider</option>
            <option value="not_recommend">Do Not Recommend</option>
          </select>
        </div>

        <div className="form-actions">
          <button type="button" onClick={handleDownloadPdf} className="download-btn" style={{
            background: '#4a4a4a', color: 'white', border: 'none', padding: '12px 18px', borderRadius: 6, cursor: 'pointer', marginRight: 10
          }}>
            ⤓ Download PDF
          </button>
          {onBackClick && (
            <button 
              type="button" 
              onClick={handleBackClick}
              className="cancel-btn"
              style={{
                background: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '5px',
                cursor: 'pointer',
                marginRight: '10px',
                fontSize: '16px'
              }}
            >
              Cancel
            </button>
          )}
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Saving...' : (existingEvaluation ? 'Update Evaluation' : 'Create Evaluation')}
          </button>
        </div>
      </form>
    </div>
    
    <ModalCenter open={modalOpen} title={modalTitle} onClose={() => setModalOpen(false)}>
      <div style={{ padding: 8 }}>{modalMessage}</div>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
        <button onClick={() => { try { modalOkAction(); } catch (e) { setModalOpen(false); } }} style={{ padding: '8px 14px', borderRadius: 6, background: '#063672', color: '#fff', border: 'none', cursor: 'pointer' }}>
          OK
        </button>
      </div>
    </ModalCenter>
    </>
  );
};

export default SkillEvaluation;
