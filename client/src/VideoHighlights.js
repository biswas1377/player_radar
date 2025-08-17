import React, { useState, useEffect } from 'react';

function VideoHighlights({ user }) {
  const [videos, setVideos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm('Are you sure you want to delete this video?')) {
      return;
    }

    try {
      const response = await fetch(`/api/players/video-highlights/${videoId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setSuccess('Video deleted successfully!');
        fetchVideoHighlights(); // Refresh the list
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete video');
      }
    } catch (err) {
      setError('Delete failed. Please try again.');
    }
  };

  if (!user || user.role !== 'player') {
    return null;
  }

  return (
    <div style={{ 
      background: 'rgba(255,255,255,0.95)', 
      borderRadius: 12, 
      padding: 20, 
      marginBottom: 20,
      border: '1px solid rgba(220,20,60,0.2)'
    }}>
      <h2 style={{ color: '#dc143c', marginBottom: 20 }}>🎥 Video Highlights</h2>
      
      {/* Upload Form */}
      <form onSubmit={handleVideoUpload} style={{ marginBottom: 30 }}>
        <h3 style={{ color: '#333', marginBottom: 15 }}>Upload New Highlight</h3>
        
        <div style={{ marginBottom: 15 }}>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
            Video File (Max 100MB):
          </label>
          <input
            type="file"
            accept="video/*"
            required
            style={{
              width: '100%',
              padding: 8,
              border: '1px solid #ddd',
              borderRadius: 4
            }}
          />
        </div>

        <div style={{ marginBottom: 15 }}>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
            Description (Optional):
          </label>
          <textarea
            rows={3}
            placeholder="Describe this highlight..."
            style={{
              width: '100%',
              padding: 8,
              border: '1px solid #ddd',
              borderRadius: 4,
              resize: 'vertical'
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
            padding: '10px 20px',
            borderRadius: 4,
            cursor: uploading ? 'not-allowed' : 'pointer',
            fontSize: 16
          }}
        >
          {uploading ? 'Uploading...' : 'Upload Video'}
        </button>
      </form>

      {/* Status Messages */}
      {error && (
        <div style={{
          background: '#ffebee',
          border: '1px solid #f44336',
          color: '#c62828',
          padding: 10,
          borderRadius: 4,
          marginBottom: 15
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          background: '#e8f5e8',
          border: '1px solid #4caf50',
          color: '#2e7d32',
          padding: 10,
          borderRadius: 4,
          marginBottom: 15
        }}>
          {success}
        </div>
      )}

      {/* Video List */}
      <div>
        <h3 style={{ color: '#333', marginBottom: 15 }}>
          My Highlights ({videos.length})
        </h3>
        
        {videos.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>
            No video highlights uploaded yet.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: 20 }}>
            {videos.map((video) => (
              <div
                key={video._id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  padding: 15,
                  background: '#fafafa'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, color: '#333' }}>{video.originalName}</h4>
                    <p style={{ margin: '5px 0', color: '#666', fontSize: 14 }}>
                      Uploaded: {new Date(video.uploadDate).toLocaleDateString()}
                    </p>
                    {video.description && (
                      <p style={{ margin: '5px 0', color: '#555' }}>{video.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteVideo(video._id)}
                    style={{
                      background: '#f44336',
                      color: 'white',
                      border: 'none',
                      padding: '5px 10px',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 12
                    }}
                  >
                    Delete
                  </button>
                </div>
                
                <video
                  controls
                  style={{
                    width: '100%',
                    maxHeight: 300,
                    borderRadius: 4
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
  );
}

export default VideoHighlights;
