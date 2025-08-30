import React, { useState, useEffect } from 'react';

const TrialScheduler = ({ playerId, playerName, onTrialScheduled }) => {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    location: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/trials/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          playerId,
          ...formData
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Trial scheduled successfully!');
        setFormData({
          date: '',
          time: '',
          location: '',
          description: ''
        });
        if (onTrialScheduled) {
          onTrialScheduled(data.trial);
        }
      } else {
        setError(data.message || 'Failed to schedule trial');
      }
    } catch (error) {
      console.error('Error scheduling trial:', error);
      setError('Failed to schedule trial');
    } finally {
      setLoading(false);
    }
  };

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="trial-scheduler">
      <div className="card">
        <div className="card-header">
          <h5 className="card-title">
            <i className="fa fa-calendar-plus-o me-2"></i>
            Schedule Trial for {playerName}
          </h5>
        </div>
        <div className="card-body">
          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="fa fa-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}
          
          {success && (
            <div className="alert alert-success" role="alert">
              <i className="fa fa-check-circle me-2"></i>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="date" className="form-label">
                  <i className="fa fa-calendar me-2"></i>Trial Date
                </label>
                <input
                  type="date"
                  className="form-control"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  min={today}
                  required
                />
              </div>
              
              <div className="col-md-6 mb-3">
                <label htmlFor="time" className="form-label">
                  <i className="fa fa-clock-o me-2"></i>Time
                </label>
                <input
                  type="time"
                  className="form-control"
                  id="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="location" className="form-label">
                <i className="fa fa-map-marker me-2"></i>Location
              </label>
              <input
                type="text"
                className="form-control"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Arsenal Training Ground, London Colney"
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="description" className="form-label">
                <i className="fa fa-info-circle me-2"></i>Description (Optional)
              </label>
              <textarea
                className="form-control"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                placeholder="Additional details about the trial..."
              ></textarea>
            </div>

            <button
              type="submit"
              className="btn btn-arsenal-red"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fa fa-spinner fa-spin me-2"></i>
                  Scheduling...
                </>
              ) : (
                <>
                  <i className="fa fa-calendar-plus-o me-2"></i>
                  Schedule Trial
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TrialScheduler;
