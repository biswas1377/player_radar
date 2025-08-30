import React, { useState, useEffect } from 'react';
import ModalCenter from './components/ModalCenter';

const TrialCalendar = ({ userRole, playerId = null, onRefreshRequested = null }) => {
  const [trials, setTrials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchTrials();
  }, [playerId, userRole]);

  const fetchTrials = async () => {
    try {
      const token = localStorage.getItem('token');
      let url = '/api/trials/upcoming-new'; // Using NEW endpoint to bypass cache issues
      
      console.log('🔍 TrialCalendar fetchTrials - userRole:', userRole, 'playerId:', playerId);
      
      if (userRole === 'scout') {
        url = '/api/trials/scout';
      } else if (userRole === 'player') {
        // For players, use the NEW upcoming endpoint to bypass cache issues
        url = '/api/trials/upcoming-new';
      }
      
      console.log('🔍 TrialCalendar final URL:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        console.log('🔍 TrialCalendar received trial data:', data.trials);
        // Debug each trial's player data
        data.trials?.forEach((trial, index) => {
          console.log(`🔍 Trial ${index}:`, {
            id: trial._id,
            player: trial.player,
            playerName: trial.player?.name,
            playerPosition: trial.player?.position,
            scout: trial.scout?.username,
            status: trial.status
          });
        });
        setTrials(data.trials || []);
      } else {
        setError(data.message || 'Failed to fetch trials');
      }
    } catch (error) {
      console.error('Error fetching trials:', error);
      setError('Failed to fetch trials');
    } finally {
      setLoading(false);
    }
  };

  const updateTrialStatus = async (trialId, status) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/trials/${trialId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        fetchTrials(); // Refresh the list
        // notify parent to refresh any summary counts (optional)
        if (typeof onRefreshRequested === 'function') onRefreshRequested();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update trial status');
      }
    } catch (error) {
      console.error('Error updating trial status:', error);
      setError('Failed to update trial status');
    }
  };

  // confirmation modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTargetTrial, setConfirmTargetTrial] = useState(null);

  const openDeleteConfirm = (trialId) => {
    setConfirmTargetTrial(trialId);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    const trialId = confirmTargetTrial;
    setConfirmOpen(false);
    setConfirmTargetTrial(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/trials/${trialId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchTrials(); // Refresh the list
        if (typeof onRefreshRequested === 'function') onRefreshRequested();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to delete trial');
      }
    } catch (error) {
      console.error('Error deleting trial:', error);
      setError('Failed to delete trial');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return timeString || 'Time not specified';
  };

  const getStatusBadgeClass = (status) => {
    const baseClass = 'badge';
    switch (status) {
      case 'scheduled':
        return `${baseClass} bg-primary`;
      case 'confirmed':
        return `${baseClass} bg-success`;
      case 'completed':
        return `${baseClass} bg-info`;
      case 'cancelled':
        return `${baseClass} bg-danger`;
      default:
        return `${baseClass} bg-secondary`;
    }
  };

  // Group trials by date
  const groupedTrials = trials.reduce((acc, trial) => {
    // Only show non-cancelled trials for players
    if (userRole === 'player' && trial.status === 'cancelled') {
      return acc;
    }
    
    const dateKey = trial.date?.split('T')[0] || 'Unknown Date';
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(trial);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="text-center p-4">
        <i className="fa fa-spinner fa-spin fa-2x text-arsenal-red"></i>
        <p className="mt-2">Loading trials...</p>
      </div>
    );
  }

  return (
    <div className="trial-calendar">
      <div className="card" style={{
        border: 'none', 
        boxShadow: '0 4px 16px rgba(220,20,60,0.1)', 
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <div className="card-body" style={{
          padding: '20px', 
          background: '#ffffff',
          maxHeight: '75vh',
          overflowY: 'auto'
        }}>
          {error && (
            <div className="alert alert-danger" role="alert" style={{
              borderRadius: '6px',
              border: '1px solid #dc3545',
              padding: '12px 16px',
              marginBottom: '16px'
            }}>
              <i className="fa fa-exclamation-triangle" style={{marginRight: 8}}></i>
              {error}
            </div>
          )}

          {trials.length === 0 ? (
            <div className="text-center" style={{padding: '40px 20px'}}>
              <div style={{
                background: 'rgba(220,20,60,0.1)',
                borderRadius: '50%',
                width: '80px',
                height: '80px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}>
                <i className="fa fa-calendar-times-o" style={{fontSize: '32px', color: '#DC143C'}}></i>
              </div>
              <h6 style={{color: '#333', marginBottom: '8px'}}>No Trials Scheduled</h6>
              <p className="text-muted" style={{fontSize: '14px', margin: 0}}>
                {userRole === 'scout' ? 'Start by scheduling trials for your players' : 'No upcoming trials at the moment'}
              </p>
            </div>
          ) : Object.keys(groupedTrials).length === 0 ? (
            <div className="text-center" style={{padding: '40px 20px'}}>
              <div style={{
                background: 'rgba(220,20,60,0.1)',
                borderRadius: '50%',
                width: '80px',
                height: '80px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}>
                <i className="fa fa-calendar-times-o" style={{fontSize: '32px', color: '#DC143C'}}></i>
              </div>
              <h6 style={{color: '#333', marginBottom: '8px'}}>No Active Trials</h6>
              <p className="text-muted" style={{fontSize: '14px', margin: 0}}>Cancelled trials are hidden from view</p>
            </div>
          ) : (
            <div className="trials-list">
              {Object.keys(groupedTrials)
                .sort((a, b) => new Date(a) - new Date(b))
                .map(date => (
                  <div key={date} style={{marginBottom: '16px'}}>
                    <div style={{
                      background: '#DC143C',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '6px 6px 0 0',
                      marginBottom: '0'
                    }}>
                      <h6 style={{margin: 0, fontWeight: 'bold'}}>
                        <i className="fa fa-calendar" style={{marginRight: 8}}></i>
                        {formatDate(date)}
                      </h6>
                    </div>
                    
                    <div style={{
                      background: 'white',
                      borderRadius: '0 0 6px 6px',
                      border: '1px solid #ddd',
                      borderTop: 'none'
                    }}>
                      {groupedTrials[date].map((trial, index) => (
                        <div key={trial._id} style={{
                          padding: '12px 16px',
                          borderBottom: index < groupedTrials[date].length - 1 ? '1px solid #f0f0f0' : 'none'
                        }}>
                          <div className="row align-items-center">
                            <div className="col-md-8">
                              <div style={{marginBottom: '8px'}}>
                                <div style={{
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  flexWrap: 'wrap',
                                  gap: '8px',
                                  marginBottom: '8px'
                                }}>
                                  <strong style={{fontSize: '16px', color: '#333'}}>
                                    {userRole === 'scout' ? (
                                      <>
                                        <i className="fa fa-user" style={{marginRight: 6, color: '#DC143C'}}></i>
                                        {trial.player?.name || 'Unknown Player'}
                                      </>
                                    ) : (
                                      <>
                                        <i className="fa fa-shield" style={{marginRight: 6, color: '#DC143C'}}></i>
                                        Trial with {trial.scout?.club || 'Unknown Club'}
                                      </>
                                    )}
                                  </strong>
                                  {trial.player?.position && userRole === 'scout' && (
                                    <span style={{
                                      background: 'rgba(220,20,60,0.1)',
                                      color: '#DC143C',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      fontSize: '11px',
                                      fontWeight: 'bold'
                                    }}>
                                      {trial.player.position}
                                    </span>
                                  )}
                                  <span className={getStatusBadgeClass(trial.status)} style={{
                                    padding: '3px 8px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase'
                                  }}>
                                    {trial.status}
                                  </span>
                                </div>
                              </div>
                              
                              <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '12px',
                                fontSize: '14px',
                                marginBottom: trial.description ? '8px' : '0'
                              }}>
                                <span>
                                  <i className="fa fa-clock-o" style={{marginRight: 4, color: '#DC143C'}}></i>
                                  {formatTime(trial.time)}
                                </span>
                                <span>
                                  <i className="fa fa-map-marker" style={{marginRight: 4, color: '#DC143C'}}></i>
                                  {trial.location}
                                </span>
                                {userRole === 'player' && (
                                  <span>
                                    <i className="fa fa-user" style={{marginRight: 4, color: '#DC143C'}}></i>
                                    Scout: {trial.scout?.username || 'Unknown Scout'}
                                  </span>
                                )}
                              </div>
                              
                              {trial.description && (
                                <div style={{
                                  background: '#f8f9fa',
                                  border: '1px solid #e9ecef',
                                  borderRadius: '4px',
                                  padding: '8px',
                                  fontSize: '13px',
                                  color: '#666',
                                  marginTop: '8px'
                                }}>
                                  <i className="fa fa-info-circle" style={{marginRight: 6, color: '#28a745'}}></i>
                                  {trial.description}
                                </div>
                              )}
                            </div>
                            
                            {userRole === 'scout' && (
                              <div className="col-md-4">
                                <div className="dropdown" style={{position: 'relative'}}>
                                  <button 
                                    className="btn btn-sm"
                                    type="button"
                                    onClick={(e) => {
                                      const dropdown = e.target.closest('.dropdown');
                                      const menu = dropdown.querySelector('.dropdown-menu');
                                      const isOpen = menu.style.display === 'block';
                                      
                                      // Close all other dropdowns
                                      document.querySelectorAll('.dropdown-menu').forEach(m => m.style.display = 'none');
                                      
                                      // Toggle this dropdown
                                      menu.style.display = isOpen ? 'none' : 'block';
                                      
                                      // Close dropdown when clicking outside
                                      const closeDropdown = (event) => {
                                        if (!dropdown.contains(event.target)) {
                                          menu.style.display = 'none';
                                          document.removeEventListener('click', closeDropdown);
                                        }
                                      };
                                      if (!isOpen) {
                                        setTimeout(() => document.addEventListener('click', closeDropdown), 0);
                                      }
                                    }}
                                    style={{
                                      background: '#DC143C',
                                      border: '1px solid #DC143C',
                                      color: '#fff',
                                      borderRadius: '4px',
                                      padding: '6px 12px',
                                      cursor: 'pointer',
                                      fontSize: '12px',
                                      fontWeight: 'bold',
                                      width: '100px'
                                    }}
                                  >
                                    <i className="fa fa-cog" style={{marginRight: 4}}></i>
                                    Actions
                                  </button>
                                  <div 
                                    className="dropdown-menu" 
                                    style={{
                                      display: 'none',
                                      position: 'absolute',
                                      top: '100%',
                                      right: '0',
                                      background: '#fff',
                                      border: '1px solid #ddd',
                                      borderRadius: '4px',
                                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                      minWidth: '140px',
                                      zIndex: 1000,
                                      padding: '4px 0',
                                      marginTop: '2px'
                                    }}
                                  >
                                    {trial.status === 'scheduled' && (
                                      <button 
                                        className="dropdown-item"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          updateTrialStatus(trial._id, 'confirmed');
                                          e.target.closest('.dropdown-menu').style.display = 'none';
                                        }}
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          width: '100%',
                                          textAlign: 'left',
                                          padding: '6px 12px',
                                          cursor: 'pointer',
                                          fontSize: '12px',
                                          color: '#333'
                                        }}
                                        onMouseOver={(e) => e.target.style.background = '#f8f9fa'}
                                        onMouseOut={(e) => e.target.style.background = 'none'}
                                      >
                                        <i className="fa fa-check" style={{marginRight: 6, color: '#28a745', width: '12px'}}></i>
                                        Confirm
                                      </button>
                                    )}
                                    {(trial.status === 'scheduled' || trial.status === 'confirmed') && (
                                      <button 
                                        className="dropdown-item"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          updateTrialStatus(trial._id, 'completed');
                                          e.target.closest('.dropdown-menu').style.display = 'none';
                                        }}
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          width: '100%',
                                          textAlign: 'left',
                                          padding: '6px 12px',
                                          cursor: 'pointer',
                                          fontSize: '12px',
                                          color: '#333'
                                        }}
                                        onMouseOver={(e) => e.target.style.background = '#f8f9fa'}
                                        onMouseOut={(e) => e.target.style.background = 'none'}
                                      >
                                        <i className="fa fa-flag-checkered" style={{marginRight: 6, color: '#007bff', width: '12px'}}></i>
                                        Complete
                                      </button>
                                    )}
                                    <button 
                                      className="dropdown-item"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateTrialStatus(trial._id, 'cancelled');
                                        e.target.closest('.dropdown-menu').style.display = 'none';
                                      }}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        width: '100%',
                                        textAlign: 'left',
                                        padding: '6px 12px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        color: '#333'
                                      }}
                                      onMouseOver={(e) => e.target.style.background = '#f8f9fa'}
                                      onMouseOut={(e) => e.target.style.background = 'none'}
                                    >
                                      <i className="fa fa-times" style={{marginRight: 6, color: '#dc3545', width: '12px'}}></i>
                                      Cancel
                                    </button>
                                    <div style={{height: '1px', background: '#e9ecef', margin: '4px 0'}}></div>
                                    <button 
                                      className="dropdown-item"
                                      onClick={(e) => {
                                          e.stopPropagation();
                                          openDeleteConfirm(trial._id);
                                          e.target.closest('.dropdown-menu').style.display = 'none';
                                        }}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        width: '100%',
                                        textAlign: 'left',
                                        padding: '6px 12px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        color: '#dc3545'
                                      }}
                                      onMouseOver={(e) => e.target.style.background = '#fff5f5'}
                                      onMouseOut={(e) => e.target.style.background = 'none'}
                                    >
                                      <i className="fa fa-trash" style={{marginRight: 6, width: '12px'}}></i>
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
      {/* Delete confirmation modal using shared ModalCenter */}
      <ModalCenter
        open={confirmOpen}
        title="Delete Trial"
        onClose={() => { setConfirmOpen(false); setConfirmTargetTrial(null); }}
      >
        <div style={{textAlign: 'center'}}>
          <p>Are you sure you want to delete this trial? This action cannot be undone.</p>
          <div style={{display: 'flex', gap: 12, justifyContent: 'center', marginTop: 12}}>
            <button onClick={() => { setConfirmOpen(false); setConfirmTargetTrial(null); }} style={{padding: '8px 14px', borderRadius: 6, border: '1px solid #ddd', background: '#fff'}}>Cancel</button>
            <button onClick={handleConfirmDelete} style={{padding: '8px 14px', borderRadius: 6, border: 'none', background: '#DC143C', color: '#fff'}}>Delete</button>
          </div>
        </div>
      </ModalCenter>
    </div>
  );
};

export default TrialCalendar;