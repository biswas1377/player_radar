import React, { useState, useEffect } from 'react';

const PlayerTrials = ({ user, setPage, onTrialStatusUpdated }) => {
  const [trials, setTrials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch player's trials
  useEffect(() => {
    fetchPlayerTrials();
  }, []);

  const fetchPlayerTrials = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      console.log('🔍 Fetching trials for player:', user?.username);
      
      // Fetch trials for the current player using the upcoming endpoint
      const response = await fetch('/api/trials/upcoming', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔍 API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 API error:', errorText);
        throw new Error(`Failed to fetch trials: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🔍 API response data:', data);
      
      // The /api/trials/upcoming endpoint returns { trials: [...] }
      const trialsArray = data.trials || [];
      console.log('🔍 Setting trials:', trialsArray.length, 'trials found');
      setTrials(trialsArray);
    } catch (err) {
      console.error('Error fetching player trials:', err);
      setError('Failed to load trials');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#28a745';
      case 'scheduled': return '#ffc107';
      case 'cancelled': return '#dc3545';
      case 'completed': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return 'fa-check-circle';
      case 'scheduled': return 'fa-clock-o';
      case 'cancelled': return 'fa-times-circle';
      case 'completed': return 'fa-flag-checkered';
      default: return 'fa-question-circle';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const updateTrialStatus = async (trialId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/trials/${trialId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update trial status');

      // Update local state
      setTrials(trials.map(trial => {
        if (trial._id === trialId) {
          return { ...trial, status: newStatus };
        }
        return trial;
      }));

      // Backend logs trial status updates automatically
      
      console.log('🔍 Trial status updated:', trialId, newStatus);
      
      // Notify parent to refresh activities
      if (onTrialStatusUpdated) {
        onTrialStatusUpdated();
      }
      
    } catch (err) {
      console.error('Error updating trial status:', err);
      setError('Failed to update trial status');
    }
  };

  const getPlayerStatus = (trial) => {
    return trial.status || 'scheduled';
  };

  if (loading) {
    return (
      <div className="football-bg" style={{
        background: `linear-gradient(135deg, rgba(10,10,10,0.1) 60%, rgba(34,34,34,0.2) 100%), url(${process.env.PUBLIC_URL}/santi-cazorla.jpg) no-repeat center center fixed`,
        backgroundSize: 'cover, cover',
        minHeight: '100vh',
        padding: 12
      }}>
        <div style={{background: 'linear-gradient(135deg, #DC143C 0%, #ff4d6d 15%, #ffffff 40%, #ffebec 60%, #ffffff 85%, #DC143C 100%)', borderRadius: 12, boxShadow: '0 8px 32px rgba(220,20,60,0.25)', padding: 16, width: '100%', minHeight: 'calc(100vh - 24px)', display: 'flex', flexDirection: 'column', position: 'relative'}}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#666'}}>
            <div style={{textAlign: 'center'}}>
              <i className="fa fa-spinner fa-spin" style={{fontSize: 32, marginBottom: 16}}></i>
              <div style={{fontSize: 16}}>Loading your trials...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="football-bg" style={{
      background: `linear-gradient(135deg, rgba(10,10,10,0.1) 60%, rgba(34,34,34,0.2) 100%), url(${process.env.PUBLIC_URL}/santi-cazorla.jpg) no-repeat center center fixed`,
      backgroundSize: 'cover, cover',
      minHeight: '100vh',
      padding: 12
    }}>
      <div style={{background: 'linear-gradient(135deg, #DC143C 0%, #ff4d6d 15%, #ffffff 40%, #ffebec 60%, #ffffff 85%, #DC143C 100%)', borderRadius: 12, boxShadow: '0 8px 32px rgba(220,20,60,0.25)', padding: 16, width: '100%', minHeight: 'calc(100vh - 24px)', display: 'flex', flexDirection: 'column', position: 'relative'}}>
        
        {/* Header */}
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, borderBottom: '2px solid rgba(255,255,255,0.3)', paddingBottom: 16, flexShrink: 0, position: 'relative', zIndex: 1}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
            <button
              onClick={() => setPage('player-dashboard')}
              style={{background: 'rgba(255,255,255,0.9)', color: '#DC143C', border: 'none', borderRadius: 8, padding: '10px 16px', fontWeight: 'bold', fontSize: 14, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: 8}}
            >
              <i className="fa fa-arrow-left"></i>
              Back to Dashboard
            </button>
            <div>
              <h1 className="football-title" style={{margin: 0, color: '#ffffff', fontSize: 24, textShadow: '0 2px 4px rgba(0,0,0,0.3)'}}>My Trials</h1>
              <div style={{fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 2}}>View and manage your trial invitations</div>
            </div>
          </div>
          <div style={{display: 'flex', gap: 12}}>
            <button
              onClick={fetchPlayerTrials}
              disabled={loading}
              style={{
                background: loading ? '#ccc' : 'rgba(255,255,255,0.9)', 
                color: loading ? '#666' : '#DC143C', 
                border: 'none', 
                borderRadius: 8, 
                padding: '10px 16px', 
                fontWeight: 'bold', 
                fontSize: 14, 
                cursor: loading ? 'not-allowed' : 'pointer', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8
              }}
            >
              <i className={`fa fa-refresh ${loading ? 'fa-spin' : ''}`}></i>
              Refresh
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                window.location.reload();
              }}
              style={{background: 'rgba(255,255,255,0.9)', color: '#DC143C', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 'bold', fontSize: 14, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}}
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{background: 'rgba(220,20,60,0.1)', border: '1px solid rgba(220,20,60,0.3)', borderRadius: 8, padding: 16, marginBottom: 20, color: '#DC143C'}}>
            <i className="fa fa-exclamation-triangle" style={{marginRight: 8}}></i>
            {error}
          </div>
        )}

        {/* Trials List */}
        <div style={{flex: 1, position: 'relative', zIndex: 1}}>
          {trials.length === 0 ? (
            <div style={{background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 40, textAlign: 'center', boxShadow: '0 8px 24px rgba(220,20,60,0.15)', border: '2px solid rgba(220,20,60,0.2)'}}>
              <div style={{fontSize: 48, color: '#DC143C', marginBottom: 20}}>
                <i className="fa fa-calendar-o"></i>
              </div>
              <h3 style={{color: '#DC143C', marginBottom: 12, fontSize: 20}}>No Trials Yet</h3>
              <p style={{color: '#666', fontSize: 16, margin: 0}}>
                You haven't been invited to any trials yet. When scouts invite you to trials, they'll appear here.
              </p>
            </div>
          ) : (
            <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
              {trials.map((trial) => {
                const playerStatus = getPlayerStatus(trial);
                const statusColor = getStatusColor(playerStatus);
                const statusIcon = getStatusIcon(playerStatus);
                
                return (
                  <div
                    key={trial._id}
                    style={{
                      background: 'rgba(255,255,255,0.95)',
                      borderRadius: 12,
                      padding: 20,
                      boxShadow: '0 8px 24px rgba(220,20,60,0.15)',
                      border: `2px solid ${statusColor}`,
                      position: 'relative'
                    }}
                  >
                    {/* Status Badge */}
                    <div style={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      background: statusColor,
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}>
                      <i className={`fa ${statusIcon}`}></i>
                      {playerStatus.charAt(0).toUpperCase() + playerStatus.slice(1)}
                    </div>

                    {/* Trial Details */}
                    <div style={{marginBottom: 16}}>
                      <h3 style={{color: '#DC143C', margin: 0, marginBottom: 8, fontSize: 18, fontWeight: 700}}>
                        {trial.title}
                      </h3>
                      <div style={{color: '#666', fontSize: 14, marginBottom: 12}}>
                        <div style={{marginBottom: 4}}>
                          <i className="fa fa-user" style={{marginRight: 8, color: '#DC143C'}}></i>
                          Scout: {trial.scout?.name || trial.scout?.username || 'Unknown Scout'}
                        </div>
                        <div style={{marginBottom: 4}}>
                          <i className="fa fa-calendar" style={{marginRight: 8, color: '#DC143C'}}></i>
                          {formatDate(trial.date)}
                        </div>
                        <div style={{marginBottom: 4}}>
                          <i className="fa fa-clock-o" style={{marginRight: 8, color: '#DC143C'}}></i>
                          {formatTime(trial.date)}
                        </div>
                        {trial.location && (
                          <div>
                            <i className="fa fa-map-marker" style={{marginRight: 8, color: '#DC143C'}}></i>
                            {trial.location}
                          </div>
                        )}
                      </div>
                      
                      {trial.description && (
                        <div style={{color: '#333', fontSize: 14, lineHeight: 1.5, marginBottom: 16, padding: 12, background: '#f8f9fa', borderRadius: 8}}>
                          <strong>Description:</strong> {trial.description}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {playerStatus === 'scheduled' && (
                      <div style={{display: 'flex', gap: 12}}>
                        <button
                          onClick={() => updateTrialStatus(trial._id, 'confirmed')}
                          style={{
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: 6,
                            padding: '10px 20px',
                            fontWeight: 'bold',
                            fontSize: 14,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            boxShadow: '0 2px 8px rgba(40,167,69,0.3)'
                          }}
                        >
                          <i className="fa fa-check"></i>
                          Accept
                        </button>
                        <button
                          onClick={() => updateTrialStatus(trial._id, 'cancelled')}
                          style={{
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: 6,
                            padding: '10px 20px',
                            fontWeight: 'bold',
                            fontSize: 14,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            boxShadow: '0 2px 8px rgba(220,53,69,0.3)'
                          }}
                        >
                          <i className="fa fa-times"></i>
                          Decline
                        </button>
                      </div>
                    )}

                    {playerStatus === 'confirmed' && (
                      <div style={{color: '#28a745', fontWeight: 'bold', fontSize: 14}}>
                        <i className="fa fa-check-circle" style={{marginRight: 8}}></i>
                        You have accepted this trial
                      </div>
                    )}

                    {playerStatus === 'cancelled' && (
                      <div style={{color: '#dc3545', fontWeight: 'bold', fontSize: 14}}>
                        <i className="fa fa-times-circle" style={{marginRight: 8}}></i>
                        You have declined this trial
                      </div>
                    )}

                    {playerStatus === 'completed' && (
                      <div style={{color: '#6c757d', fontWeight: 'bold', fontSize: 14}}>
                        <i className="fa fa-flag-checkered" style={{marginRight: 8}}></i>
                        This trial has been completed
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerTrials;
