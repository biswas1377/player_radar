import React, { useState, useEffect } from 'react';
import SkillEvaluation from './SkillEvaluation';
import PlayerSkillDashboard from './PlayerSkillDashboard';
import './SkillEvaluationHub.css';

const SkillEvaluationHub = ({ onBackToDashboard, initialPlayer = null, initialView = null, user = null }) => {
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [currentView, setCurrentView] = useState('list'); // 'list', 'evaluate', 'dashboard'
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPlayers();
    // If an initial player was provided (e.g., from App), select and open evaluate
    if (initialPlayer) {
      setSelectedPlayer(initialPlayer);
      setCurrentView(initialView || 'evaluate');
    }
  }, []);

  const fetchPlayers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/players', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPlayers(data);
      } else {
        console.error('Failed to fetch players');
      }
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerSelect = (player, view) => {
    setSelectedPlayer(player);
    setCurrentView(view);
  };

  const handleEvaluationSubmitted = () => {
    // Refresh or navigate back to list
    setCurrentView('dashboard');
  };

  const filteredPlayers = players.filter(player => 
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.club.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="loading">Loading players...</div>;
  }

  return (
    <div className="skill-evaluation-hub">
      {currentView === 'list' && (
        <div className="players-list-view">
          <div className="hub-header">
            {onBackToDashboard && (
              <button 
                className="back-to-dashboard-btn"
                onClick={onBackToDashboard}
                style={{
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  marginBottom: '20px',
                  fontSize: '14px'
                }}
              >
                ← Back to Dashboard
              </button>
            )}
            <h1>Skill Evaluation System</h1>
            <p>Evaluate and track player performance with detailed skill assessments</p>
          </div>

          <div className="search-controls">
            <input
              type="text"
              placeholder="Search players by name, position, or club..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <div className="results-count">
              Showing {filteredPlayers.length} of {players.length} players
            </div>
          </div>

          <div className="players-grid">
            {filteredPlayers.map(player => (
              <div key={player._id} className="player-card">
                <div className="player-avatar">
                  {player.profilePicture ? (
                    <img 
                      src={`/uploads/profile-pictures/${player.profilePicture}`} 
                      alt={player.name}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="avatar-placeholder" style={{ display: player.profilePicture ? 'none' : 'flex' }}>
                    {player.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                </div>
                
                <div className="player-info">
                  <h3>{player.name}</h3>
                  <div className="player-details">
                    <span className="position">{player.position}</span>
                    <span className="club">{player.club}</span>
                  </div>
                  
                  {player.email && (
                    <div className="contact-info">
                      <small>{player.email}</small>
                    </div>
                  )}
                </div>
                
                <div className="player-actions">
                  {user && user.role === 'scout' && (
                    <button 
                      className="action-btn evaluate"
                      onClick={() => handlePlayerSelect(player, 'evaluate')}
                    >
                      📊 Evaluate Skills
                    </button>
                  )}
                  <button 
                    className="action-btn dashboard"
                    onClick={() => handlePlayerSelect(player, 'dashboard')}
                  >
                    📈 View Analysis
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredPlayers.length === 0 && (
            <div className="no-results">
              <h3>No players found</h3>
              <p>Try adjusting your search criteria</p>
            </div>
          )}
        </div>
      )}

      {currentView === 'evaluate' && selectedPlayer && (
        <div className="evaluation-view">
          <SkillEvaluation 
            player={selectedPlayer}
            onEvaluationSubmitted={handleEvaluationSubmitted}
            onBackClick={() => setCurrentView('list')}
          />
        </div>
      )}

      {currentView === 'dashboard' && selectedPlayer && (
        <div className="dashboard-view">
          <div className="view-header">
              <button 
              className="back-btn"
              onClick={() => {
                if (typeof onBackToDashboard === 'function') {
                  onBackToDashboard();
                } else {
                  setCurrentView('list');
                }
              }}
            >
              ← Back to Dashboard
            </button>
          </div>
          <PlayerSkillDashboard player={selectedPlayer} />
        </div>
      )}
    </div>
  );
};

export default SkillEvaluationHub;
