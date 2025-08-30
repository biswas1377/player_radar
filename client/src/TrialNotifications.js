import React, { useState, useEffect } from 'react';

const TrialNotifications = ({ userRole }) => {
  const [upcomingTrials, setUpcomingTrials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUpcomingTrials();
    
    // Set up polling to check for new trials every 5 minutes
    const interval = setInterval(fetchUpcomingTrials, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchUpcomingTrials = async () => {
    try {
      console.log('🔍 TrialNotifications - fetchUpcomingTrials called, userRole:', userRole);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/trials/upcoming', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      console.log('🔍 TrialNotifications - API response:', data);

      if (response.ok) {
        // Filter out cancelled trials for players, scouts can see all
        const filteredTrials = userRole === 'scout' ? data.trials || [] : (data.trials || []).filter(trial => trial.status !== 'cancelled');
        setUpcomingTrials(filteredTrials);
        console.log('🔍 TrialNotifications - Set trials (filtered):', filteredTrials);
      } else {
        setError(data.message || 'Failed to fetch upcoming trials');
        console.log('🔍 TrialNotifications - Error:', data.message);
      }
    } catch (error) {
      console.error('Error fetching upcoming trials:', error);
      setError('Failed to fetch upcoming trials');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeUntil = (dateString) => {
    const now = new Date();
    const trialDate = new Date(dateString);
    const diffTime = trialDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays < 7) {
      return `In ${diffDays} days`;
    } else {
      return trialDate.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short'
      });
    }
  };

  const getUrgencyClass = (dateString) => {
    const now = new Date();
    const trialDate = new Date(dateString);
    const diffTime = trialDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) {
      return 'border-danger bg-danger-subtle';
    } else if (diffDays <= 3) {
      return 'border-warning bg-warning-subtle';
    } else {
      return 'border-info bg-info-subtle';
    }
  };

  if (loading) {
    return (
      <div className="trial-notifications">
        <div className="d-flex align-items-center">
          <i className="fa fa-spinner fa-spin" style={{marginRight: 8}}></i>
          <span>Loading notifications...</span>
        </div>
      </div>
    );
  }

  if (upcomingTrials.length === 0) {
    return (
      <div className="trial-notifications">
        <div className="alert alert-info border-0 bg-light">
          <i className="fa fa-info-circle" style={{marginRight: 8}}></i>
          No upcoming trials
        </div>
      </div>
    );
  }

  return (
    <div className="trial-notifications">
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-arsenal-red text-white">
          <h6 className="card-title mb-0">
            <i className="fa fa-bell" style={{marginRight: 8}}></i>
            Upcoming Trials ({upcomingTrials.length})
            {userRole === 'player' && (
              <small className="ms-2 opacity-75">(cancelled trials hidden)</small>
            )}
          </h6>
        </div>
        <div className="card-body p-0">
          {error && (
            <div className="alert alert-danger m-3 mb-0" role="alert">
              <i className="fa fa-exclamation-triangle" style={{marginRight: 8}}></i>
              {error}
            </div>
          )}
          
          <div className="list-group list-group-flush">
            {upcomingTrials.slice(0, 5).map(trial => (
              <div 
                key={trial._id} 
                className={`list-group-item ${getUrgencyClass(trial.date)} border-start border-3`}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center mb-1">
                      <strong style={{marginRight: 8}}>
                        {userRole === 'scout' ? (
                          <>
                            <i className="fa fa-user" style={{marginRight: 4}}></i>
                            {trial.player?.name}
                          </>
                        ) : (
                          <>
                            <i className="fa fa-shield" style={{marginRight: 4}}></i>
                            {trial.scout?.club}
                          </>
                        )}
                      </strong>
                      <span className="badge bg-secondary small">
                        {trial.status}
                      </span>
                    </div>
                    
                    <div className="small text-muted">
                      <div>
                        <i className="fa fa-calendar" style={{marginRight: 4}}></i>
                        {new Date(trial.date).toLocaleDateString('en-GB')} at {trial.time}
                      </div>
                      <div>
                        <i className="fa fa-map-marker" style={{marginRight: 4}}></i>
                        {trial.location}
                      </div>
                      {userRole === 'player' && (
                        <div>
                          <i className="fa fa-user" style={{marginRight: 4}}></i>
                          Scout: {trial.scout?.username}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-end">
                    <div className="small fw-bold text-primary">
                      {formatTimeUntil(trial.date)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {upcomingTrials.length > 5 && (
            <div className="card-footer text-center">
              <small className="text-muted">
                +{upcomingTrials.length - 5} more trials
              </small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrialNotifications;
