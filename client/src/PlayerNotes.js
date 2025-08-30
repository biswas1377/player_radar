import React, { useState, useEffect } from 'react';

const PlayerNotes = ({ user, setPage }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch player's scouting notes
  useEffect(() => {
    fetchPlayerNotes();
  }, []);

  const fetchPlayerNotes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      console.log('Fetching notes for user:', user.username);
      
      // Use the player's username/name to fetch notes
      const response = await fetch(`/api/players/${user.username}/notes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      console.log('Notes API response status:', response.status);
      console.log('Notes API response headers:', response.headers);

      if (!response.ok) throw new Error('Failed to fetch notes');
      
      const data = await response.json();
      console.log('Received notes data:', data);
      
      // Extract notes array from the response (backend returns {playerName, notes})
      const notesArray = data.notes || [];
      console.log('Extracted notes array:', notesArray);
      
      // Sort notes by timestamp (newest first)
      const sortedNotes = notesArray.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      console.log('Sorted notes:', sortedNotes);
      setNotes(sortedNotes);
      
    } catch (err) {
      console.error('Error fetching player notes:', err);
      setError('Failed to load notes');
    } finally {
      setLoading(false);
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

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const noteDate = new Date(timestamp);
    const diffTime = Math.abs(now - noteDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return formatDate(timestamp);
    }
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
              <div style={{fontSize: 16}}>Loading your scouting notes...</div>
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
              <h1 className="football-title" style={{margin: 0, color: '#ffffff', fontSize: 24, textShadow: '0 2px 4px rgba(0,0,0,0.3)'}}>Scout Notes</h1>
              <div style={{fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 2}}>View scouting reports and feedback about your performance</div>
            </div>
          </div>
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

        {/* Error Display */}
        {error && (
          <div style={{background: 'rgba(220,20,60,0.1)', border: '1px solid rgba(220,20,60,0.3)', borderRadius: 8, padding: 16, marginBottom: 20, color: '#DC143C'}}>
            <i className="fa fa-exclamation-triangle" style={{marginRight: 8}}></i>
            {error}
          </div>
        )}

        {/* Notes Summary */}
        <div style={{background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 20, marginBottom: 20, boxShadow: '0 8px 24px rgba(220,20,60,0.15)', border: '2px solid rgba(220,20,60,0.2)'}}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
            <div>
              <h2 style={{color: '#228B22', margin: 0, marginBottom: 8, fontSize: 20, fontWeight: 700}}>
                <i className="fa fa-file-text-o" style={{marginRight: 12}}></i>
                Your Scouting Reports
              </h2>
              <p style={{color: '#666', margin: 0, fontSize: 14}}>
                {notes.length === 0 ? 'No scouting notes yet' : `${notes.length} note${notes.length !== 1 ? 's' : ''} from scouts`}
              </p>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #228B22 0%, #32CD32 100%)',
              color: 'white',
              padding: '12px 20px',
              borderRadius: 20,
              fontSize: 24,
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(34,139,34,0.3)'
            }}>
              {notes.length}
            </div>
          </div>
        </div>

        {/* Notes List */}
        <div style={{flex: 1, position: 'relative', zIndex: 1}}>
          {notes.length === 0 ? (
            <div style={{background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 40, textAlign: 'center', boxShadow: '0 8px 24px rgba(220,20,60,0.15)', border: '2px solid rgba(220,20,60,0.2)'}}>
              <div style={{fontSize: 48, color: '#228B22', marginBottom: 20}}>
                <i className="fa fa-file-text-o"></i>
              </div>
              <h3 style={{color: '#228B22', marginBottom: 12, fontSize: 20}}>No Scouting Notes Yet</h3>
              <p style={{color: '#666', fontSize: 16, margin: 0, lineHeight: 1.6}}>
                When scouts add notes about your performance during trials or games, they'll appear here.<br/>
                This is where you'll see feedback about your skills, playing style, and areas for improvement.
              </p>
            </div>
          ) : (
            <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
              {notes.map((note, index) => (
                <div
                  key={note._id}
                  style={{
                    background: 'rgba(255,255,255,0.95)',
                    borderRadius: 12,
                    padding: 20,
                    boxShadow: '0 8px 24px rgba(34,139,34,0.15)',
                    border: '2px solid rgba(34,139,34,0.2)',
                    position: 'relative'
                  }}
                >
                  {/* Note Index Badge */}
                  <div style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    background: '#228B22',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 'bold'
                  }}>
                    #{notes.length - index}
                  </div>

                  {/* Scout Information */}
                  <div style={{marginBottom: 16}}>
                    <div style={{display: 'flex', alignItems: 'center', marginBottom: 8}}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #228B22 0%, #32CD32 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                        fontSize: 18,
                        color: 'white'
                      }}>
                        <i className="fa fa-user"></i>
                      </div>
                      <div>
                        <div style={{fontWeight: 'bold', color: '#228B22', fontSize: 16}}>
                          {note.addedBy || 'Unknown Scout'}
                        </div>
                        <div style={{fontSize: 12, color: '#666'}}>
                          {formatTimestamp(note.timestamp)} at {formatTime(note.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Note Content */}
                  <div style={{
                    color: '#333',
                    lineHeight: 1.6,
                    fontSize: 14,
                    padding: 16,
                    background: '#f8f9fa',
                    borderRadius: 8,
                    border: '1px solid rgba(34,139,34,0.1)',
                    position: 'relative'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: -8,
                      left: 16,
                      background: '#f8f9fa',
                      padding: '0 8px',
                      fontSize: 12,
                      fontWeight: 'bold',
                      color: '#228B22'
                    }}>
                      SCOUT FEEDBACK
                    </div>
                    <div style={{marginTop: 8}}>
                      {note.content}
                    </div>
                  </div>

                  {/* Note Date */}
                  <div style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: '1px solid rgba(34,139,34,0.1)',
                    fontSize: 12,
                    color: '#999',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <i className="fa fa-calendar"></i>
                    Added on {formatDate(note.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerNotes;
