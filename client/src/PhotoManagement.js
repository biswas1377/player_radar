import React, { useState, useEffect } from 'react';

function PhotoManagement({ user, onBack }) {
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [enlargedPhoto, setEnlargedPhoto] = useState(null);

  // Fetch existing match photos
  const fetchMatchPhotos = React.useCallback(async () => {
    try {
      const response = await fetch(`/api/players/${user.username}/match-photos`);
      if (response.ok) {
        const data = await response.json();
        setPhotos(data.matchPhotos || []);
      }
    } catch (err) {
      console.error('Failed to fetch match photos:', err);
    }
  }, [user.username]);

  useEffect(() => {
    if (user && user.role === 'player') {
      fetchMatchPhotos();
    }
  }, [user, fetchMatchPhotos]);

  const handlePhotoUpload = async (e) => {
    e.preventDefault();
    setUploading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    const fileInput = e.target.querySelector('input[type="file"]');
    const descriptionInput = e.target.querySelector('textarea[name="description"]');
    const matchDateInput = e.target.querySelector('input[name="matchDate"]');
    const opponentInput = e.target.querySelector('input[name="opponent"]');
    
    if (!fileInput.files[0]) {
      setError('Please select a photo file');
      setUploading(false);
      return;
    }

    formData.append('matchPhoto', fileInput.files[0]);
    formData.append('description', descriptionInput.value);
    formData.append('matchDate', matchDateInput.value);
    formData.append('opponent', opponentInput.value);

    try {
      const response = await fetch('/api/players/match-photos', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        setSuccess('Photo uploaded successfully!');
        fetchMatchPhotos(); // Refresh the list
        e.target.reset(); // Clear the form
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to upload photo');
      }
    } catch (err) {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    try {
      const response = await fetch(`/api/players/match-photos/${photoId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setSuccess('Photo deleted successfully!');
        fetchMatchPhotos(); // Refresh the list
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete photo');
      }
    } catch (err) {
      setError('Delete failed. Please try again.');
    }
  };

  const handlePhotoEnlarge = (photoSrc) => {
    setEnlargedPhoto(photoSrc);
  };

  const closePhotoModal = () => {
    setEnlargedPhoto(null);
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
          <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
            <div>
              <h1 style={{
                margin: 0, 
                color: '#fff', 
                fontSize: 28, 
                fontWeight: 900, 
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
              }}>
                📸 Match Photos
              </h1>
              <p style={{
                margin: 0, 
                color: 'rgba(255,255,255,0.9)', 
                fontSize: 16, 
                fontWeight: 600
              }}>
                Upload and manage your match photos
              </p>
            </div>
          </div>
          <div style={{display: 'flex', gap: 12}}>
            <button 
              onClick={onBack}
              style={{
                background: 'rgba(255,255,255,0.9)', 
                color: '#DC143C', 
                border: 'none', 
                borderRadius: 8, 
                padding: '12px 20px', 
                fontWeight: 'bold', 
                fontSize: 16, 
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Content Container */}
        <div style={{
          flex: 1, 
          display: 'flex', 
          gap: 20, 
          position: 'relative', 
          zIndex: 1, 
          overflow: 'hidden'
        }}>
          {/* Left Column - Upload Form & Stats */}
          <div style={{
            width: 400, 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 20, 
            flexShrink: 0
          }}>
            {/* Upload Form */}
            <div style={{
              background: 'rgba(255,255,255,0.95)', 
              borderRadius: 12, 
              padding: 20, 
              boxShadow: '0 8px 24px rgba(220,20,60,0.15)',
              border: '2px solid rgba(220,20,60,0.2)'
            }}>
              <h2 style={{color: '#DC143C', marginBottom: 20, fontSize: 20, fontWeight: 700}}>
                📷 Upload New Photo
              </h2>
              
              <form onSubmit={handlePhotoUpload}>
                <div style={{marginBottom: 15}}>
                  <label style={{display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#333'}}>
                    Photo File (Max 10MB):
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    required
                    style={{
                      width: '100%',
                      padding: 10,
                      border: '2px solid #ddd',
                      borderRadius: 6,
                      fontSize: 14,
                      cursor: 'pointer'
                    }}
                  />
                </div>

                <div style={{marginBottom: 15}}>
                  <label style={{display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#333'}}>
                    Match Date:
                  </label>
                  <input
                    type="date"
                    name="matchDate"
                    style={{
                      width: '100%',
                      padding: 10,
                      border: '2px solid #ddd',
                      borderRadius: 6,
                      fontSize: 14
                    }}
                  />
                </div>

                <div style={{marginBottom: 15}}>
                  <label style={{display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#333'}}>
                    Opponent:
                  </label>
                  <input
                    type="text"
                    name="opponent"
                    placeholder="vs Manchester United"
                    style={{
                      width: '100%',
                      padding: 10,
                      border: '2px solid #ddd',
                      borderRadius: 6,
                      fontSize: 14
                    }}
                  />
                </div>

                <div style={{marginBottom: 20}}>
                  <label style={{display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#333'}}>
                    Description (Optional):
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    placeholder="Describe this match moment..."
                    style={{
                      width: '100%',
                      padding: 10,
                      border: '2px solid #ddd',
                      borderRadius: 6,
                      fontSize: 14,
                      resize: 'vertical'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  style={{
                    width: '100%',
                    background: uploading ? '#ccc' : '#DC143C',
                    color: 'white',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: 6,
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    fontSize: 16,
                    fontWeight: 'bold',
                    boxShadow: '0 2px 8px rgba(220,20,60,0.3)'
                  }}
                >
                  {uploading ? 'Uploading...' : '📸 Upload Photo'}
                </button>
              </form>
            </div>

            {/* Stats Card */}
            <div style={{
              background: 'rgba(255,255,255,0.95)', 
              borderRadius: 12, 
              padding: 20, 
              boxShadow: '0 8px 24px rgba(220,20,60,0.15)',
              border: '2px solid rgba(220,20,60,0.2)'
            }}>
              <h3 style={{color: '#DC143C', marginBottom: 15, fontSize: 18}}>📊 Your Gallery</h3>
              <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
                <div style={{
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '8px 0', 
                  borderBottom: '1px solid #e9ecef'
                }}>
                  <span style={{fontWeight: 'bold', color: '#333'}}>Total Photos:</span>
                  <span style={{color: '#DC143C', fontWeight: 'bold'}}>{photos.length}</span>
                </div>
                <div style={{
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '8px 0', 
                  borderBottom: '1px solid #e9ecef'
                }}>
                  <span style={{fontWeight: 'bold', color: '#333'}}>Latest Upload:</span>
                  <span style={{color: '#666', fontSize: 12}}>
                    {photos.length > 0 
                      ? new Date(Math.max(...photos.map(p => new Date(p.uploadDate)))).toLocaleDateString()
                      : 'N/A'
                    }
                  </span>
                </div>
                <div style={{
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '8px 0'
                }}>
                  <span style={{fontWeight: 'bold', color: '#333'}}>Gallery Status:</span>
                  <span style={{
                    color: photos.length > 0 ? '#2d5a2d' : '#856404', 
                    fontWeight: 'bold', 
                    fontSize: 12
                  }}>
                    {photos.length > 0 ? '✅ Active' : '⚠️ Empty'}
                  </span>
                </div>
              </div>
            </div>

            {/* Status Messages */}
            {error && (
              <div style={{
                background: '#ffebee',
                border: '2px solid #f44336',
                color: '#c62828',
                padding: 12,
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 'bold'
              }}>
                ❌ {error}
              </div>
            )}

            {success && (
              <div style={{
                background: '#e8f5e8',
                border: '2px solid #4caf50',
                color: '#2e7d32',
                padding: 12,
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 'bold'
              }}>
                ✅ {success}
              </div>
            )}
          </div>

          {/* Right Column - Photo Gallery */}
          <div style={{
            flex: 1, 
            background: 'rgba(255,255,255,0.95)', 
            borderRadius: 12, 
            padding: 20, 
            boxShadow: '0 8px 24px rgba(220,20,60,0.15)',
            border: '2px solid rgba(220,20,60,0.2)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <h2 style={{
              color: '#DC143C', 
              marginBottom: 20, 
              fontSize: 20, 
              fontWeight: 700,
              borderBottom: '2px solid #ffebec',
              paddingBottom: 10
            }}>
              🖼️ My Match Photos ({photos.length})
            </h2>
            
            {photos.length === 0 ? (
              <div style={{
                flex: 1,
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: '#666', 
                textAlign: 'center'
              }}>
                <div>
                  <div style={{fontSize: 64, marginBottom: 20}}>📷</div>
                  <div style={{fontSize: 18, fontWeight: 'bold', marginBottom: 10}}>No Match Photos</div>
                  <div style={{fontSize: 14}}>Upload your first match photo to get started!</div>
                </div>
              </div>
            ) : (
              <div style={{
                flex: 1,
                overflowY: 'auto', 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
                gap: 20,
                paddingRight: 10
              }}>
                {photos.map((photo) => (
                  <div
                    key={photo._id}
                    style={{
                      border: '2px solid #ffebec',
                      borderRadius: 12,
                      padding: 15,
                      background: '#fafafa',
                      boxShadow: '0 2px 8px rgba(220,20,60,0.1)',
                      transition: 'transform 0.2s',
                      cursor: 'pointer'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <div style={{marginBottom: 10}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8}}>
                        <h4 style={{margin: 0, color: '#DC143C', fontSize: 14, fontWeight: 'bold'}}>
                          {photo.opponent ? `vs ${photo.opponent}` : 'Match Photo'}
                        </h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePhoto(photo._id);
                          }}
                          style={{
                            background: '#f44336',
                            color: 'white',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: 10,
                            fontWeight: 'bold'
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                      <div style={{fontSize: 11, color: '#666', marginBottom: 8}}>
                        {photo.matchDate && `📅 ${new Date(photo.matchDate).toLocaleDateString()}`}
                        {photo.matchDate && ' • '}
                        📤 {new Date(photo.uploadDate).toLocaleDateString()}
                      </div>
                      {photo.description && (
                        <p style={{margin: '0 0 10px 0', color: '#555', fontSize: 12, fontStyle: 'italic'}}>
                          {photo.description}
                        </p>
                      )}
                    </div>
                    
                    <img
                      src={`/uploads/match-photos/${photo.filename}`}
                      alt={photo.originalName}
                      onClick={() => handlePhotoEnlarge(`/uploads/match-photos/${photo.filename}`)}
                      style={{
                        width: '100%',
                        height: 180,
                        objectFit: 'cover',
                        borderRadius: 8,
                        cursor: 'pointer',
                        transition: 'opacity 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.opacity = '0.8'}
                      onMouseOut={(e) => e.target.style.opacity = '1'}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Photo Enlargement Modal */}
        {enlargedPhoto && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            cursor: 'pointer'
          }} onClick={closePhotoModal}>
            <div style={{
              maxWidth: '90%',
              maxHeight: '90%',
              position: 'relative'
            }}>
              <img 
                src={enlargedPhoto} 
                alt="Enlarged match photo" 
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(220,20,60,0.4)',
                  border: '3px solid #DC143C'
                }}
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={closePhotoModal}
                style={{
                  position: 'absolute',
                  top: '-15px',
                  right: '-15px',
                  background: '#DC143C',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '35px',
                  height: '35px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                  fontWeight: 'bold'
                }}
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PhotoManagement;
