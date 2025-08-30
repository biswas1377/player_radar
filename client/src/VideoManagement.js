import React, { useState, useEffect } from 'react';
import ModalCenter from './components/ModalCenter';
import useModal from './hooks/useModal';

function VideoManagement({ user, onBack, onVideoUploaded, onVideoDeleted }) {
  const [videos, setVideos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const confirmModal = useModal(false);
  const notifyModal = useModal(false);
  const [confirmPayload, setConfirmPayload] = useState(null);
  const [notifyMessage, setNotifyMessage] = useState('');

  // Fetch existing video highlights
  const fetchVideoHighlights = React.useCallback(async () => {
    try {
      const response = await fetch(`/api/players/${user.username}/video-highlights`);
      if (response.ok) {
        const data = await response.json();
        setVideos(data.videoHighlights || []);
      }
    } catch (err) {
      console.error('Failed to fetch video highlights:', err);
    }
  }, [user.username]);

  useEffect(() => {
    if (user && user.role === 'player') {
      fetchVideoHighlights();
    }
  }, [user, fetchVideoHighlights]);

  const handleVideoUpload = async (e) => {
    e.preventDefault();
    setUploading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    const fileInput = e.target.querySelector('input[type="file"]');
    const descriptionInput = e.target.querySelector('textarea');
    
    if (!fileInput.files[0]) {
      setError('Please select a video file');
      setUploading(false);
      return;
    }

    formData.append('videoHighlight', fileInput.files[0]);
    formData.append('description', descriptionInput.value);

    try {
      const response = await fetch('/api/players/video-highlights', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        setSuccess('Video uploaded successfully!');
        fetchVideoHighlights(); // Refresh the list
        // Track activity
        if (onVideoUploaded) {
          onVideoUploaded({ description: descriptionInput.value || 'Untitled' });
        }
        e.target.reset(); // Clear the form
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to upload video');
      }
    } catch (err) {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteVideo = (videoId, videoDescription) => {
    setConfirmPayload({ videoId, videoDescription });
    confirmModal.openModal();
  };

  const confirmDeleteVideo = async () => {
    const payload = confirmPayload;
    confirmModal.closeModal();
    if (!payload) return;

    try {
      const response = await fetch(`/api/players/video-highlights/${payload.videoId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const msg = 'Video deleted successfully!';
        setSuccess(msg);
        setNotifyMessage(msg);
        notifyModal.openModal();
        fetchVideoHighlights(); // Refresh the list
        if (onVideoDeleted) onVideoDeleted({ videoName: payload.videoDescription || 'Untitled Video' });
      } else {
        const errorData = await response.json();
        const msg = errorData.error || 'Failed to delete video';
        setError(msg);
        setNotifyMessage(msg);
        notifyModal.openModal();
      }
    } catch (err) {
      const msg = 'Delete failed. Please try again.';
      setError(msg);
      setNotifyMessage(msg);
      notifyModal.openModal();
    }
  };

  if (!user || user.role !== 'player') {
    return null;
  }

  return (
    <div className="football-bg" style={{
      background: `linear-gradient(135deg, rgba(10,10,10,0.1) 60%, rgba(34,34,34,0.2) 100%), url(${process.env.PUBLIC_URL}/santi-cazorla.jpg) no-repeat center center fixed`,
      backgroundSize: 'cover, cover',
      minHeight: '100vh',
      padding: 12
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #DC143C 0%, #ff4d6d 15%, #ffffff 40%, #ffebec 60%, #ffffff 85%, #DC143C 100%)',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(220,20,60,0.25)',
        padding: 16,
        width: '100%',
        minHeight: 'calc(100vh - 24px)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          borderBottom: '2px solid rgba(255,255,255,0.3)',
          paddingBottom: 16,
          flexShrink: 0,
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div>
              <h1 className="football-title" style={{
                margin: 0,
                color: '#ffffff',
                fontSize: 24,
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}>
                🎥 Video Management
              </h1>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 2 }}>
                Upload and manage your highlights
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={onBack}
              style={{
                background: 'rgba(255,255,255,0.9)',
                color: '#DC143C',
                border: 'none',
                borderRadius: 6,
                padding: '8px 16px',
                fontWeight: 'bold',
                fontSize: 14,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, minHeight: '500px' }}>
            
            {/* Upload Section */}
            <div style={{
              background: 'rgba(255,255,255,0.95)',
              borderRadius: 12,
              padding: 20,
              border: '2px solid rgba(220,20,60,0.2)',
              height: 'fit-content'
            }}>
              <h2 style={{ color: '#dc143c', marginBottom: 20, fontSize: 18 }}>📤 Upload New Video</h2>
              
              <form onSubmit={handleVideoUpload}>
                <div style={{ marginBottom: 15 }}>
                  <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold', color: '#DC143C' }}>
                    Video File (Max 100MB):
                  </label>
                  <input
                    type="file"
                    accept="video/*"
                    required
                    style={{
                      width: '100%',
                      padding: 8,
                      border: '2px solid rgba(220,20,60,0.2)',
                      borderRadius: 6,
                      fontSize: 14
                    }}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold', color: '#DC143C' }}>
                    Description:
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe this highlight (e.g., 'Goal vs Manchester United', 'Skill moves compilation', etc.)"
                    style={{
                      width: '100%',
                      padding: 8,
                      border: '2px solid rgba(220,20,60,0.2)',
                      borderRadius: 6,
                      resize: 'vertical',
                      fontSize: 14
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  style={{
                    background: uploading ? '#ccc' : '#dc143c',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: 6,
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    fontSize: 16,
                    fontWeight: 'bold',
                    width: '100%',
                    boxShadow: uploading ? 'none' : '0 2px 8px rgba(220,20,60,0.3)'
                  }}
                >
                  {uploading ? '⏳ Uploading...' : '🚀 Upload Video'}
                </button>
              </form>

              {/* Status Messages */}
              {error && (
                <div style={{
                  background: '#ffebee',
                  border: '1px solid #f44336',
                  color: '#c62828',
                  padding: 12,
                  borderRadius: 6,
                  marginTop: 15,
                  fontSize: 14
                }}>
                  ❌ {error}
                </div>
              )}

              {success && (
                <div style={{
                  background: '#e8f5e8',
                  border: '1px solid #4caf50',
                  color: '#2e7d32',
                  padding: 12,
                  borderRadius: 6,
                  marginTop: 15,
                  fontSize: 14
                }}>
                  ✅ {success}
                </div>
              )}

              {/* Stats */}
              <div style={{
                marginTop: 20,
                padding: 15,
                background: 'rgba(220,20,60,0.05)',
                borderRadius: 8,
                border: '1px solid rgba(220,20,60,0.1)'
              }}>
                <h4 style={{ margin: 0, color: '#DC143C', marginBottom: 8 }}>📊 Your Stats</h4>
                <div style={{ fontSize: 14, color: '#666' }}>
                  Total Videos: <strong>{videos.length}</strong>
                </div>
              </div>
            </div>

            {/* Video List Section */}
            <div style={{
              background: 'rgba(255,255,255,0.95)',
              borderRadius: 12,
              padding: 20,
              border: '2px solid rgba(220,20,60,0.2)'
            }}>
              <h2 style={{ color: '#dc143c', marginBottom: 20, fontSize: 18 }}>
                🎬 My Video Highlights ({videos.length})
              </h2>
              
              {videos.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: 40,
                  color: '#666',
                  fontStyle: 'italic'
                }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🎥</div>
                  <p>No video highlights uploaded yet.</p>
                  <p>Upload your first video to showcase your skills!</p>
                </div>
              ) : (
                <div style={{ 
                  display: 'grid',
                  gap: 20,
                  maxHeight: 'calc(100vh - 400px)',
                  overflowY: 'auto'
                }}>
                  {videos.map((video) => (
                    <div
                      key={video._id}
                      style={{
                        border: '2px solid rgba(220,20,60,0.1)',
                        borderRadius: 12,
                        padding: 16,
                        background: '#fafafa',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 12
                      }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: 0, color: '#DC143C', fontSize: 16 }}>
                            {video.originalName}
                          </h4>
                          <p style={{ margin: '5px 0', color: '#666', fontSize: 12 }}>
                            📅 Uploaded: {new Date(video.uploadDate).toLocaleDateString()}
                          </p>
                          {video.description && (
                            <p style={{ margin: '8px 0', color: '#555', fontSize: 14 }}>
                              {video.description}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteVideo(video._id, video.description)}
                          style={{
                            background: '#f44336',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 'bold'
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                      
                      <video
                        controls
                        style={{
                          width: '100%',
                          maxHeight: 250,
                          borderRadius: 8,
                          backgroundColor: '#000'
                        }}
                        src={`/uploads/video-highlights/${video.filename}`}
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Confirm/Notify Modals */}
          <ModalCenter open={confirmModal.open} title="Confirm Delete" onClose={confirmModal.closeModal}>
            <p>Are you sure you want to delete this video? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="modal-btn" onClick={confirmModal.closeModal}>Cancel</button>
              <button className="modal-btn" style={{background:'#f44336',color:'#fff'}} onClick={confirmDeleteVideo}>Delete</button>
            </div>
          </ModalCenter>

          <ModalCenter open={notifyModal.open} title="Notification" onClose={notifyModal.closeModal}>
            <div>{notifyMessage}</div>
            <div className="modal-actions">
              <button className="modal-btn" onClick={notifyModal.closeModal}>OK</button>
            </div>
          </ModalCenter>
        </div>
      </div>
    </div>
  );
}

export default VideoManagement;
