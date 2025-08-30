import React, { useEffect, useState, useCallback } from 'react';
import './App.css';
import LoginTemplate from './LoginTemplate';
import VideoHighlights from './VideoHighlights';
import VideoManagement from './VideoManagement';
import PhotoManagement from './PhotoManagement';
import TrialScheduler from './TrialScheduler';
import TrialCalendar from './TrialCalendar';
import TrialNotifications from './TrialNotifications';
import PlayerTrials from './PlayerTrials';
import PlayerNotes from './PlayerNotes';
import SkillEvaluationHub from './SkillEvaluationHub';
import PlayerSkillDashboard from './PlayerSkillDashboard';

function PlayerForm({ onAdd }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    dob: '',
    nationality: '',
    height: '',
    weight: '',
    foot: '',
    position: '',
    club: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.name || !form.email || !form.dob || !form.nationality || !form.height || !form.weight || !form.foot || !form.position || !form.club) {
      setError('All fields are required.');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError('Please provide a valid email address.');
      return;
    }
    try {
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error('Failed to add player');
      const data = await res.json();
      onAdd(data);
      setSuccess(`Player added successfully! Player ID: ${data.playerID}`);
      setForm({ name: '', email: '', dob: '', nationality: '', height: '', weight: '', foot: '', position: '', club: '' });
    } catch (err) {
      setError('Failed to add player.');
    }
  };
  
  return (
    <form className="auth-form" onSubmit={handleSubmit} style={{ marginBottom: 24, background: 'rgba(255,255,255,0.9)', borderRadius: 12, padding: 16, border: '1px solid rgba(220,20,60,0.2)' }}>
      <h3 style={{ marginTop: 0, color: '#DC143C' }}>Add New Player</h3>
      {error && <div className="auth-error">{error}</div>}
      {success && (
        <div className="auth-success">
          {success}
          <br />
          <small style={{ fontWeight: 'normal' }}>
            📧 <strong>EMAIL SENT:</strong> {form.name || 'The player'} will receive an email with their Player ID and registration instructions.
            <br />
            🔑 <strong>BACKUP:</strong> Give this Player ID to {form.name || 'the player'} - they'll need it to register their account.
          </small>
        </div>
      )}
      <input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} />
      <input name="email" type="email" placeholder="Email Address" value={form.email} onChange={handleChange} />
      <input name="dob" type="date" placeholder="Date of Birth" value={form.dob} onChange={handleChange} />
      <input name="nationality" placeholder="Nationality" value={form.nationality} onChange={handleChange} />
      <input name="height" type="number" step="0.01" placeholder="Height (cm)" value={form.height} onChange={handleChange} />
      <input name="weight" type="number" step="0.1" placeholder="Weight (kg)" value={form.weight} onChange={handleChange} />
      <select name="foot" value={form.foot} onChange={handleChange}>
        <option value="">Dominant Foot</option>
        <option value="Right">Right</option>
        <option value="Left">Left</option>
        <option value="Both">Both</option>
      </select>
      <input name="position" placeholder="Preferred Position" value={form.position} onChange={handleChange} />
      <input name="club" placeholder="Club Name" value={form.club} onChange={handleChange} />
      <button type="submit">Add Player</button>
    </form>
  );
}

// Arsenal badge import removed - keeping brand neutral



function App() {
  const [user, setUser] = useState(null);
  const [players, setPlayers] = useState([]);
  const [showSignUp, setShowSignUp] = useState(false);
  const [page, setPage] = useState('auth'); // 'auth' | 'scout-add' | 'list' | 'player-profile'
  // For selected player viewing (for scouts)
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  // For auth error and success messages
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  // For player dashboard filtering and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPosition, setFilterPosition] = useState('');
  const [filterNationality, setFilterNationality] = useState('');
  const [filterAge, setFilterAge] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  // For player profile
  const [profile, setProfile] = useState(null);
  const [evaluationTarget, setEvaluationTarget] = useState(null);
  const [evaluationInitialView, setEvaluationInitialView] = useState(null);
  const [playerNotes, setPlayerNotes] = useState([]);
  const [loadingPlayerNotes, setLoadingPlayerNotes] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  // For player edit mode
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    dob: '',
    nationality: '',
    height: '',
    weight: '',
    foot: '',
    position: ''
  });
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  // For profile picture uploads
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [pictureUploadError, setPictureUploadError] = useState('');
  const [enlargedImage, setEnlargedImage] = useState(null); // For image modal
  // For delete confirmation modal
  const [deleteModal, setDeleteModal] = useState({ 
    show: false, 
    type: 'player', // 'player' or 'note'
    playerId: null, 
    playerName: '', 
    noteId: null 
  });
  // For success/error notification modal
  const [notificationModal, setNotificationModal] = useState({
    show: false,
    type: 'success', // 'success' or 'error'
    title: '',
    message: ''
  });
  // For video counts in player list
  const [playerVideoCounts, setPlayerVideoCounts] = useState({});
  // For photo counts in player list
  const [playerPhotoCounts, setPlayerPhotoCounts] = useState({});
  // For activity feed tracking
  const [recentActivities, setRecentActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [activeTrialsCount, setActiveTrialsCount] = useState(0);

  // Helper function to calculate age from date of birth
  const calculateAge = (dob) => {
    if (!dob) return null;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Function to add activity to the feed (now sends to backend)
  const addActivity = async (type, title, description, targetPlayer = null) => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          type,
          title,
          description,
          targetPlayer
        })
      });

      if (response.ok) {
        // Refresh the activities after adding a new one
        fetchRecentActivities();
      }
    } catch (err) {
      console.error('Failed to add activity:', err);
    }
  };

  // Function to fetch recent activities from backend
  const fetchRecentActivities = useCallback(async () => {
    if (!user) return;
    
    console.log('🔍 Fetching recent activities for user:', user.username, user.role);
    setLoadingActivities(true);
    try {
      const response = await fetch('/api/activities/recent', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('📋 Activities API response status:', response.status);
      
      if (response.ok) {
        const activities = await response.json();
        console.log('✅ Activities received:', activities.length, activities);
        setRecentActivities(activities);
      } else {
        console.log('❌ Activities API failed:', response.status, response.statusText);
        setRecentActivities([]);
      }
    } catch (err) {
      console.error('❌ Failed to fetch activities:', err);
      setRecentActivities([]);
    } finally {
      setLoadingActivities(false);
    }
  }, [user]);

  // Fetch active trials count for the dashboard (scout or player)
  const fetchActiveTrialsCount = useCallback(async () => {
    if (!user) {
      setActiveTrialsCount(0);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      let url = '/api/trials/upcoming-new';
      if (user.role === 'scout') url = '/api/trials/scout';

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) {
        setActiveTrialsCount(0);
        return;
      }
      const data = await res.json();
      const trialsArray = data.trials || [];
      // Count non-cancelled trials as "active"
      const activeCount = trialsArray.filter(t => t.status !== 'cancelled').length;
      setActiveTrialsCount(activeCount);
    } catch (err) {
      console.error('Failed to fetch active trials count:', err);
      setActiveTrialsCount(0);
    }
  }, [user]);

  // Update active trials count when user or page changes
  useEffect(() => {
    if (user) fetchActiveTrialsCount();
  }, [user, page, fetchActiveTrialsCount]);

  // Fetch activities when user changes or page loads
  useEffect(() => {
    if (user) {
      fetchRecentActivities();
    } else {
      setRecentActivities([]);
    }
  }, [user, fetchRecentActivities]);

  // Function to get icon for activity type
  const getActivityIcon = (type) => {
    switch(type) {
      case 'player_added': return { icon: 'fa-plus', color: '#28a745' };
      case 'trial_scheduled': return { icon: 'fa-calendar', color: '#17a2b8' };
      case 'profile_updated': return { icon: 'fa-edit', color: '#ffc107' };
      case 'video_uploaded': return { icon: 'fa-video-camera', color: '#ff6b35' };
      case 'video_deleted': return { icon: 'fa-trash', color: '#dc3545' };
      case 'photo_uploaded': return { icon: 'fa-camera', color: '#8A2BE2' };
      case 'photo_deleted': return { icon: 'fa-trash', color: '#dc3545' };
      case 'note_added': return { icon: 'fa-file-text-o', color: '#228B22' };
      case 'player_deleted': return { icon: 'fa-trash', color: '#dc3545' };
      default: return { icon: 'fa-info', color: '#6c757d' };
    }
  };

  // Function to format timestamp
  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - activityTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  // Helper function to filter and sort players
  const getFilteredAndSortedPlayers = () => {
    let filteredPlayers = players.filter(player => {
      // Search term filter (name, position, nationality)
      const matchesSearch = searchTerm === '' || 
        player.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (player.nationality || player.country || '')?.toLowerCase().includes(searchTerm.toLowerCase());

      // Position filter
      const matchesPosition = filterPosition === '' || 
        player.position?.toLowerCase() === filterPosition.toLowerCase();

      // Nationality filter
      const matchesNationality = filterNationality === '' || 
        (player.nationality || player.country || '').toLowerCase() === filterNationality.toLowerCase();

      // Age filter
      const playerAge = calculateAge(player.dob);
      const matchesAge = filterAge === '' || 
        (filterAge === 'under-20' && playerAge < 20) ||
        (filterAge === '20-25' && playerAge >= 20 && playerAge <= 25) ||
        (filterAge === '26-30' && playerAge >= 26 && playerAge <= 30) ||
        (filterAge === 'over-30' && playerAge > 30);

      return matchesSearch && matchesPosition && matchesNationality && matchesAge;
    });

    // Sort players
    filteredPlayers.sort((a, b) => {
      let valueA, valueB;
      
      switch (sortBy) {
        case 'name':
          valueA = a.name || '';
          valueB = b.name || '';
          break;
        case 'playerID':
          valueA = a.playerID || '';
          valueB = b.playerID || '';
          break;
        case 'position':
          valueA = a.position || '';
          valueB = b.position || '';
          break;
        case 'age':
          valueA = calculateAge(a.dob) || 0;
          valueB = calculateAge(b.dob) || 0;
          break;
        case 'nationality':
          valueA = a.nationality || a.country || '';
          valueB = b.nationality || b.country || '';
          break;
        case 'club':
          valueA = a.club || '';
          valueB = b.club || '';
          break;
        case 'height':
          valueA = parseFloat(a.height) || 0;
          valueB = parseFloat(b.height) || 0;
          break;
        case 'weight':
          valueA = parseFloat(a.weight) || 0;
          valueB = parseFloat(b.weight) || 0;
          break;
        default:
          valueA = a.name || '';
          valueB = b.name || '';
      }

      if (typeof valueA === 'string') {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      } else {
        return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
      }
    });

    return filteredPlayers;
  };

  // Get unique values for filter dropdowns
  const getUniquePositions = () => {
    return [...new Set(players.map(p => p.position).filter(Boolean))].sort();
  };

  const getUniqueNationalities = () => {
    return [...new Set(players.map(p => p.nationality || p.country).filter(Boolean))].sort();
  };

  // Fetch user info on mount or when user changes
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !user) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(data => {
          console.log('🔍 Frontend - /api/auth/me response data:', data);
          console.log('🔍 Frontend - user.profilePicture:', data.user?.profilePicture);
          setUser(data.user);
          if (data.user && data.user.role === 'scout') setPage('scout-dashboard');
          else if (data.user && data.user.role === 'player') setPage('player-dashboard');
          else if (data.user) setPage('list');
        })
        .catch(() => setUser(null));
    }
  }, [user]);

  // Fetch players from backend for scouts only
  useEffect(() => {
    if (user && user.role === 'scout' && (page === 'list' || page === 'scout-dashboard')) {
      fetch('/api/players', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(data => {
          setPlayers(data);
          // Fetch video and photo counts for scout users
          fetchVideoCountsForPlayers(data);
          fetchPhotoCountsForPlayers(data);
        })
        .catch(() => setPlayers([]));
    }
  }, [user, page]);

  // Fetch video counts for all players (scout only)
  const fetchVideoCountsForPlayers = async (playersData) => {
    const counts = {};
    try {
      await Promise.all(
        playersData.map(async (player) => {
          try {
            const response = await fetch(`/api/players/${player.name}/video-highlights`);
            if (response.ok) {
              const data = await response.json();
              counts[player._id] = data.videoHighlights?.length || 0;
            } else {
              counts[player._id] = 0;
            }
          } catch {
            counts[player._id] = 0;
          }
        })
      );
      setPlayerVideoCounts(counts);
    } catch (err) {
      console.error('Failed to fetch video counts:', err);
    }
  };

  // Fetch photo counts for all players (scout only)
  const fetchPhotoCountsForPlayers = async (playersData) => {
    const counts = {};
    try {
      await Promise.all(
        playersData.map(async (player) => {
          try {
            const response = await fetch(`/api/players/${player.name}/match-photos`);
            if (response.ok) {
              const data = await response.json();
              counts[player._id] = data.matchPhotos?.length || 0;
            } else {
              counts[player._id] = 0;
            }
          } catch {
            counts[player._id] = 0;
          }
        })
      );
      setPlayerPhotoCounts(counts);
    } catch (err) {
      console.error('Failed to fetch photo counts:', err);
    }
  };

  // Fetch player profile if user is a player
  useEffect(() => {
    if (user && user.role === 'player') {
      setLoadingProfile(true);
      fetch('/api/players/me', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
        .then(res => {
          if (res.ok) {
            return res.json();
          } else if (res.status === 404) {
            // Player profile not found
            throw new Error('PROFILE_NOT_FOUND');
          } else {
            throw new Error('Failed to fetch profile');
          }
        })
        .then(data => {
          setProfile(data);
          // Also fetch notes for this player
          fetchPlayerNotes();
        })
        .catch((error) => {
          console.error('Profile fetch error:', error);
          setProfile(null);
          setPlayerNotes([]);
          
          if (error.message === 'PROFILE_NOT_FOUND') {
            // Player record doesn't exist - log out the user
            console.warn('Player record not found for user:', user.username);
            localStorage.removeItem('token');
            setUser(null);
            setPage('auth');
            setNotificationModal({
              show: true,
              type: 'error',
              title: 'Profile Removed',
              message: 'Your player profile has been removed. Please contact an administrator.'
            });
          } else {
            // Also log out if there's an error fetching profile
            localStorage.removeItem('token');
            setUser(null);
            setPage('auth');
          }
        })
        .finally(() => {
          setLoadingProfile(false);
        });
    } else {
      setProfile(null);
      setPlayerNotes([]);
      setLoadingProfile(false);
    }
  }, [user]);

  // Fetch player notes
  const fetchPlayerNotes = async () => {
    if (!user || user.role !== 'player') return;
    
    setLoadingPlayerNotes(true);
    try {
      const response = await fetch(`/api/players/${user.username}/notes`);
      if (response.ok) {
        const data = await response.json();
        setPlayerNotes(data.notes || []);
      }
    } catch (err) {
      console.error('Failed to fetch player notes:', err);
      setPlayerNotes([]);
    } finally {
      setLoadingPlayerNotes(false);
    }
  };

  // Keep edit form in sync with profile
  useEffect(() => {
    setEditForm({
      dob: profile?.dob || '',
      nationality: profile?.nationality || profile?.country || '',
      height: profile?.height || '',
      weight: profile?.weight || '',
      foot: profile?.foot || '',
      position: profile?.position || ''
    });
  }, [profile]);

  const handleAddPlayer = (newPlayer) => {
    setPlayers([newPlayer, ...players]);
    setPage('list');
    // Refresh activities to show the new player addition
    fetchRecentActivities();
  };

  // Handle player deletion (scout only)
  const handleDeletePlayer = async (playerId, playerName) => {
    if (!user || user.role !== 'scout') {
  setNotificationModal({ show: true, type: 'error', title: 'Permission Denied', message: 'Only scouts can delete players' });
      return;
    }

    // Show delete confirmation modal
    setDeleteModal({ show: true, type: 'player', playerId, playerName, noteId: null });
  };

  // Confirm and execute player deletion
  const confirmDeletePlayer = async () => {
    const { type, playerId, playerName, noteId } = deleteModal;
    setDeleteModal({ show: false, type: 'player', playerId: null, playerName: '', noteId: null });

    try {
      if (type === 'player') {
        // Delete player
        const res = await fetch(`/api/players/${playerId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Failed to delete player');
        }

        const result = await res.json();

        // Remove player from local state
        setPlayers(players.filter(player => player._id !== playerId));
        
        // If we're viewing this player's profile, go back to list
        if (selectedPlayer && selectedPlayer._id === playerId) {
          setSelectedPlayer(null);
          setPage('list');
        }

        // Refresh activities to show the player deletion
        fetchRecentActivities();

        const accountMessage = result.deletedUserAccounts > 0 ? ` and ${result.deletedUserAccounts} user account(s)` : '';
        setNotificationModal({
          show: true,
          type: 'success',
          title: 'Player Deleted',
          message: `${playerName} has been successfully deleted${accountMessage}.`
        });
      } else if (type === 'note') {
        // Delete note
        const response = await fetch(`/api/players/${selectedPlayer.name}/notes/${noteId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          // Refresh notes
          const notesResponse = await fetch(`/api/players/${selectedPlayer.name}/notes`);
          if (notesResponse.ok) {
            const data = await notesResponse.json();
            setPlayerNotes(data.notes || []);
          }
        } else {
          throw new Error('Failed to delete note');
        }
      }
    } catch (error) {
      console.error('Delete error:', error);
      if (type === 'player') {
        setNotificationModal({
          show: true,
          type: 'error',
          title: 'Delete Failed',
          message: `Failed to delete player: ${error.message}`
        });
      } else {
        setNotificationModal({
          show: true,
          type: 'error',
          title: 'Delete Failed',
          message: `Failed to delete note: ${error.message}`
        });
      }
    }
  };

  // Cancel player deletion
  const cancelDeletePlayer = () => {
    setDeleteModal({ show: false, type: 'player', playerId: null, playerName: '', noteId: null });
  };

  // Handle profile picture upload
  const handleProfilePictureUpload = async (file) => {
    if (!file) return;
    
    console.log('Uploading file:', file.name, file.type, file.size);
    setUploadingPicture(true);
    setPictureUploadError('');
    
    const formData = new FormData();
    formData.append('profilePicture', file);
    
    try {
      const res = await fetch('/api/auth/profile-picture', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      console.log('Upload response status:', res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Upload failed with error:', errorText);
        throw new Error('Upload failed');
      }
      
      const data = await res.json();
      console.log('Upload successful, response:', data);
      
      // Update user state with new profile picture
      setUser(prev => ({ ...prev, profilePicture: data.profilePicture }));
      
      // Activity logged by backend
      
      // If user is a player, also update profile
      if (user.role === 'player' && profile) {
        setProfile(prev => ({ ...prev, profilePicture: data.profilePicture }));
      }
      
    } catch (err) {
      console.error('Upload error:', err);
      setPictureUploadError('Failed to upload profile picture');
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleImageEnlarge = (imageSrc) => {
    console.log('🔍 handleImageEnlarge called with:', imageSrc);
    console.log('🔍 Current enlargedImage state:', enlargedImage);
    setEnlargedImage(imageSrc);
    console.log('🔍 setEnlargedImage called, should update state to:', imageSrc);
  };

  const closeImageModal = () => {
    console.log('Closing image modal');
    setEnlargedImage(null);
  };

  // Auth page
  if (!user || page === 'auth') {
    return (
      <LoginTemplate 
        onLogin={async (username, password) => {
          // Clear previous messages
          setAuthError('');
          setAuthSuccess('');
          
          try {
            const res = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (res.ok) {
              localStorage.setItem('token', data.token);
              setUser(data.user);
              setPage(data.user.role === 'scout' ? 'scout-dashboard' : 'list');
              setAuthSuccess('Login successful!');
            } else {
              // Display the enhanced error message from the server
              setAuthError(data.message || data.error || 'Login failed');
            }
          } catch (err) {
            setAuthError('Login failed - please check your connection and try again.');
          }
        }}
        onRegister={async (username, password, role, club, playerIDCode) => {
          // Clear previous messages
          setAuthError('');
          setAuthSuccess('');
          
          try {
            const res = await fetch('/api/auth/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, password, role, club, playerIDCode })
            });
            const data = await res.json();
            if (res.ok) {
              setAuthSuccess(`Registration successful! ${data.details || 'Please sign in.'}`);
              setShowSignUp(false);
            } else {
              // Display the enhanced error message from the server
              setAuthError(data.message || data.error || 'Registration failed');
            }
          } catch (err) {
            setAuthError('Registration failed - please check your connection and try again.');
          }
        }}
        isLogin={!showSignUp}
        setIsLogin={(isLogin) => {
          setShowSignUp(!isLogin);
          // Clear messages when switching between login and register
          setAuthError('');
          setAuthSuccess('');
        }}
        error={authError}
        success={authSuccess}
      />
    );
  }

  // Scout dashboard page
  if (user && user.role === 'scout' && page === 'scout-dashboard') {
    return (
      <div className="football-bg" style={{
        background: `linear-gradient(135deg, rgba(10,10,10,0.1) 60%, rgba(34,34,34,0.2) 100%), url(${process.env.PUBLIC_URL}/santi-cazorla.jpg) no-repeat center center fixed`,
        backgroundSize: 'cover, cover',
        minHeight: '100vh',
        padding: 12
      }}>
        <div style={{background: 'linear-gradient(135deg, #DC143C 0%, #ff4d6d 15%, #ffffff 40%, #ffebec 60%, #ffffff 85%, #DC143C 100%)', borderRadius: 12, boxShadow: '0 8px 32px rgba(220,20,60,0.25)', padding: 16, width: '100%', minHeight: 'calc(100vh - 24px)', display: 'flex', flexDirection: 'column', position: 'relative'}}>
          {/* Decorative background elements */}
          <div style={{position: 'absolute', top: -50, right: -50, width: 200, height: 200, background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)', borderRadius: '50%'}}></div>
          <div style={{position: 'absolute', bottom: -30, left: -30, width: 150, height: 150, background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)', borderRadius: '50%'}}></div>
          <div style={{position: 'absolute', top: '50%', right: '10%', width: 100, height: 100, background: 'radial-gradient(circle, rgba(220,20,60,0.15) 0%, transparent 70%)', borderRadius: '50%'}}></div>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderBottom: '2px solid rgba(255,255,255,0.3)', paddingBottom: 16, flexShrink: 0, position: 'relative', zIndex: 1}}>
            <div style={{display: 'flex', alignItems: 'center'}}>
              <div>
                <h1 className="football-title" style={{margin: 0, color: '#ffffff', fontSize: 24, textShadow: '0 2px 4px rgba(0,0,0,0.3)'}}>Player Radar</h1>
                <div style={{fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 2}}>Scout Dashboard</div>
              </div>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                setUser(null);
                setPage('auth');
                window.location.reload();
              }}
              style={{background: 'rgba(255,255,255,0.9)', color: '#DC143C', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 'bold', fontSize: 14, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}}>Sign Out</button>
          </div>
          
          <div style={{display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20, flexShrink: 0, background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 16, backdropFilter: 'blur(10px)'}}>
            <div style={{position: 'relative'}}>
              <div 
                style={{
                  width: 80, 
                  height: 80, 
                  borderRadius: '50%', 
                  background: 'rgba(255,255,255,0.9)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)', 
                  fontSize: 40, 
                  color: '#DC143C', 
                  overflow: 'hidden', 
                  cursor: user.profilePicture ? 'pointer' : 'default'
                }} 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🔍 SCOUT AVATAR CLICKED!');
                  console.log('Scout avatar clicked, profilePicture:', user.profilePicture);
                  console.log('Event target:', e.target);
                  if (user.profilePicture) {
                    handleImageEnlarge(user.profilePicture);
                  }
                }}
              >
                {user.profilePicture ? (
                  <img 
                    src={user.profilePicture} 
                    alt="Profile" 
                    style={{
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      pointerEvents: 'none' // Prevent img from blocking clicks
                    }} 
                  />
                ) : (
                  <span role="img" aria-label="profile">🕵️</span>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleProfilePictureUpload(e.target.files[0])}
                style={{display: 'none'}}
                id="scout-profile-upload"
                disabled={uploadingPicture}
              />
              <label
                htmlFor="scout-profile-upload"
                style={{
                  position: 'absolute',
                  bottom: -5,
                  right: -5,
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: '#DC143C',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: uploadingPicture ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  opacity: uploadingPicture ? 0.6 : 1
                }}
              >
                <span style={{color: 'white', fontSize: 16}}>{uploadingPicture ? '⏳' : '📷'}</span>
              </label>
            </div>
            <div style={{flex: 1}}>
              <div style={{fontSize: 28, fontWeight: 700, color: '#ffffff', marginBottom: 4, textShadow: '0 2px 4px rgba(0,0,0,0.3)'}}>Welcome, {user.username}</div>
              <div style={{fontSize: 18, color: 'rgba(255,255,255,0.9)', marginBottom: 4}}>Scout</div>
              <div style={{fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 12}}>{user.club}</div>
              {pictureUploadError && <div style={{color: '#ffcccf', fontSize: 12, marginBottom: 8}}>{pictureUploadError}</div>}
              <div style={{display: 'flex', gap: 12}}>
                <button style={{background: 'rgba(255,255,255,0.9)', color: '#DC143C', border: 'none', borderRadius: 6, padding: '12px 20px', fontWeight: 600, fontSize: 16, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}} onClick={() => setPage('scout-add')}>Add New Player</button>
                <button style={{background: '#063672', color: '#fff', border: 'none', borderRadius: 6, padding: '12px 20px', fontWeight: 600, fontSize: 16, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}} onClick={() => setPage('list')}>Player Dashboard</button>
              </div>
            </div>
          </div>
          
          <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
            {/* Main dashboard content - 2x2 grid */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, minHeight: '400px', position: 'relative', zIndex: 1}}>
              {/* Player Statistics - Enhanced */}
              <div style={{background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 20, boxShadow: '0 8px 24px rgba(220,20,60,0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(220,20,60,0.2)'}}>
                <div style={{fontWeight: 700, color: '#DC143C', marginBottom: 16, fontSize: 18}}>
                  <i className="fa fa-users" style={{marginRight: 8}}></i>Player Statistics
                </div>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, width: '100%'}}>
                  <div style={{textAlign: 'center'}}>
                    <div style={{width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(145deg, #DC143C 0%, #ff4d6d 100%)', border: '3px solid rgba(220,20,60,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, boxShadow: '0 4px 12px rgba(220,20,60,0.2)', margin: '0 auto'}}>
                      <span style={{fontSize: 24, fontWeight: 700, color: '#fff'}}>{players.length}</span>
                    </div>
                    <div style={{fontSize: 12, color: '#666', fontWeight: 'bold'}}>Total Players</div>
                  </div>
                  <div style={{textAlign: 'center'}}>
                    <div style={{width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(145deg, #228B22 0%, #32CD32 100%)', border: '3px solid rgba(34,139,34,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, boxShadow: '0 4px 12px rgba(34,139,34,0.2)', margin: '0 auto'}}>
                        <span style={{fontSize: 24, fontWeight: 700, color: '#fff'}}>{activeTrialsCount}</span>
                      </div>
                      <div style={{fontSize: 12, color: '#666', fontWeight: 'bold'}}>Active Trials</div>
                  </div>
                </div>
              </div>
              
              {/* Quick Actions - Enhanced */}
              <div style={{background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 20, boxShadow: '0 8px 24px rgba(220,20,60,0.15)', display: 'flex', flexDirection: 'column', border: '2px solid rgba(220,20,60,0.2)'}}>
                <div style={{fontWeight: 700, color: '#DC143C', marginBottom: 16, fontSize: 18, textAlign: 'center'}}>
                  <i className="fa fa-bolt" style={{marginRight: 8}}></i>Quick Actions
                </div>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1}}>
                  <button 
                    style={{background: 'linear-gradient(135deg, #DC143C 0%, #ff4d6d 100%)', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 8px', fontWeight: 600, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 12px rgba(220,20,60,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transition: 'transform 0.2s'}} 
                    onClick={() => setPage('scout-add')}
                    onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    <i className="fa fa-plus" style={{fontSize: 20}}></i>
                    Add Player
                  </button>
                  <button 
                    style={{background: 'linear-gradient(135deg, #063672 0%, #4a90e2 100%)', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 8px', fontWeight: 600, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 12px rgba(6,54,114,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transition: 'transform 0.2s'}} 
                    onClick={() => setPage('list')}
                    onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    <i className="fa fa-list" style={{fontSize: 20}}></i>
                    Players
                  </button>
                  <button 
                    style={{background: 'linear-gradient(135deg, #228B22 0%, #32CD32 100%)', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 8px', fontWeight: 600, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 12px rgba(34,139,34,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transition: 'transform 0.2s'}} 
                    onClick={() => setPage('trials')}
                    onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    <i className="fa fa-calendar" style={{fontSize: 20}}></i>
                    Trials
                  </button>
                  <button 
                    style={{background: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 8px', fontWeight: 600, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 12px rgba(155,89,182,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transition: 'transform 0.2s'}}
                    onClick={() => setPage('skill-evaluations')}
                    onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    <i className="fa fa-star" style={{fontSize: 20}}></i>
                    Skill Evaluations
                  </button>
                </div>
              </div>
            </div>
            
            {/* Recent Activity - Full width at bottom */}
            <div style={{marginTop: 20, background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 20, boxShadow: '0 8px 24px rgba(220,20,60,0.15)', border: '2px solid rgba(220,20,60,0.2)'}}>
              <div style={{fontWeight: 700, color: '#DC143C', marginBottom: 16, fontSize: 18, borderBottom: '2px solid rgba(220,20,60,0.2)', paddingBottom: 8}}>
                <i className="fa fa-clock-o" style={{marginRight: 8}}></i>Recent Activity
              </div>
              {loadingActivities ? (
                <div style={{textAlign: 'center', padding: '40px 20px', color: '#999'}}>
                  <i className="fa fa-spinner fa-spin" style={{fontSize: 24, marginBottom: 16}}></i>
                  <div>Loading activities...</div>
                </div>
              ) : recentActivities.filter(activity => activity.type !== 'note_added').length > 0 ? (
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16}}>
                  {recentActivities
                    .filter(activity => activity.type !== 'note_added').map((activity) => {
                    const activityStyle = getActivityIcon(activity.type);
                    return (
                      <div key={activity._id} style={{padding: '12px 16px', background: '#f8f9fa', borderRadius: 8, borderLeft: `4px solid ${activityStyle.color}`}}>
                        <div style={{fontWeight: 600, fontSize: 14, color: '#333', marginBottom: 4}}>
                          <i className={`fa ${activityStyle.icon}`} style={{marginRight: 8, color: activityStyle.color}}></i>
                          {activity.title}
                        </div>
                        <div style={{fontSize: 12, color: '#666'}}>{activity.description}</div>
                        <div style={{fontSize: 11, color: '#999', marginTop: 4, display: 'flex', justifyContent: 'space-between'}}>
                          <span>by {activity.user?.username || 'Unknown'}</span>
                          <span>{formatTimestamp(activity.timestamp)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{textAlign: 'center', padding: '40px 20px', color: '#999'}}>
                  <i className="fa fa-hourglass-empty" style={{fontSize: 32, marginBottom: 16, opacity: 0.5}}></i>
                  <div style={{fontSize: 16, fontWeight: 500}}>No recent activity</div>
                  <div style={{fontSize: 14, marginTop: 8}}>Start by adding players or scheduling trials</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Image Enlargement Modal - Scout Dashboard */}
        {console.log('🔍 Scout Dashboard Modal render check - enlargedImage:', enlargedImage)}
        {enlargedImage && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            cursor: 'pointer'
          }} onClick={closeImageModal}>
            <div style={{
              maxWidth: '90%',
              maxHeight: '90%',
              position: 'relative'
            }}>
              <img 
                src={enlargedImage} 
                alt="Enlarged profile" 
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
                onClick={closeImageModal}
                style={{
                  position: 'absolute',
                  top: '-15px',
                  right: '-15px',
                  background: '#DC143C',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                }}
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModal.show && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001
          }}>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '30px',
              maxWidth: '450px',
              width: '90%',
              boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
              border: '2px solid #DC143C'
            }} onClick={(e) => e.stopPropagation()}>
              <div style={{
                textAlign: 'center',
                marginBottom: '25px'
              }}>
                <div style={{
                  fontSize: '48px',
                  color: '#DC143C',
                  marginBottom: '15px'
                }}>
                  ⚠️
                </div>
                <h3 style={{
                  color: '#DC143C',
                  marginBottom: '10px',
                  fontSize: '24px'
                }}>
                  Delete Player
                </h3>
                <p style={{
                  color: '#333',
                  fontSize: '16px',
                  marginBottom: '20px'
                }}>
                  Are you sure you want to delete <strong>{deleteModal.playerName}</strong>?
                </p>
                <div style={{
                  background: '#fff5f5',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '15px',
                  textAlign: 'left',
                  marginBottom: '20px'
                }}>
                  <p style={{ 
                    color: '#DC143C', 
                    fontWeight: 'bold', 
                    marginBottom: '8px',
                    fontSize: '14px' 
                  }}>
                    This action will:
                  </p>
                  <ul style={{ 
                    color: '#666', 
                    margin: 0, 
                    paddingLeft: '20px',
                    fontSize: '14px'
                  }}>
                    <li>Remove the player from the database</li>
                    <li>Delete their login account</li>
                    <li style={{ color: '#DC143C', fontWeight: 'bold' }}>This action cannot be undone</li>
                  </ul>
                </div>
              </div>
              <div style={{
                display: 'flex',
                gap: '15px',
                justifyContent: 'center'
              }}>
                <button
                  onClick={cancelDeletePlayer}
                  style={{
                    padding: '12px 24px',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = '#e5e7eb';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = '#f3f4f6';
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeletePlayer}
                  style={{
                    padding: '12px 24px',
                    background: '#DC143C',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = '#b91c1c';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = '#DC143C';
                  }}
                >
                  Delete Player
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notification Modal */}
        {notificationModal.show && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1002
          }} onClick={() => setNotificationModal({ ...notificationModal, show: false })}>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '30px',
              maxWidth: '450px',
              width: '90%',
              boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
              border: `2px solid ${notificationModal.type === 'success' ? '#22c55e' : '#DC143C'}`
            }} onClick={(e) => e.stopPropagation()}>
              <div style={{
                textAlign: 'center',
                marginBottom: '25px'
              }}>
                <div style={{
                  fontSize: '48px',
                  color: notificationModal.type === 'success' ? '#22c55e' : '#DC143C',
                  marginBottom: '15px'
                }}>
                  {notificationModal.type === 'success' ? '✅' : '❌'}
                </div>
                <h3 style={{
                  color: notificationModal.type === 'success' ? '#22c55e' : '#DC143C',
                  marginBottom: '10px',
                  fontSize: '24px'
                }}>
                  {notificationModal.title}
                </h3>
                <p style={{
                  color: '#333',
                  fontSize: '16px',
                  marginBottom: '20px'
                }}>
                  {notificationModal.message}
                </p>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'center'
              }}>
                <button
                  onClick={() => setNotificationModal({ ...notificationModal, show: false })}
                  style={{
                    padding: '12px 24px',
                    background: notificationModal.type === 'success' ? '#22c55e' : '#DC143C',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = notificationModal.type === 'success' ? '#16a34a' : '#b91c1c';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = notificationModal.type === 'success' ? '#22c55e' : '#DC143C';
                  }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Scout add player page
  if (user && user.role === 'scout' && page === 'scout-add') {
    return (
      <div className="football-bg" style={{
        background: `linear-gradient(135deg, rgba(10,10,10,0.1) 60%, rgba(34,34,34,0.2) 100%), url(${process.env.PUBLIC_URL}/santi-cazorla.jpg) no-repeat center center fixed`,
        backgroundSize: 'cover, cover',
        height: '100vh',
        overflow: 'hidden',
        padding: 12
      }}>
        <div style={{background: 'linear-gradient(135deg, #ffffff 0%, #ffeff0 25%, #ffffff 50%, #fff5f5 75%, #ffffff 100%)', borderRadius: 12, boxShadow: '0 8px 32px rgba(220,20,60,0.15)', padding: 16, width: '100%', minHeight: 'calc(100vh - 24px)', display: 'flex', flexDirection: 'column', position: 'relative'}}>
          {/* Decorative background elements */}
          <div style={{position: 'absolute', top: -30, right: -30, width: 120, height: 120, background: 'radial-gradient(circle, rgba(220,20,60,0.04) 0%, transparent 70%)', borderRadius: '50%'}}></div>
          <div style={{position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, background: 'radial-gradient(circle, rgba(6,54,114,0.03) 0%, transparent 70%)', borderRadius: '50%'}}></div>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderBottom: '2px solid #ffebec', paddingBottom: 16, flexShrink: 0, position: 'relative', zIndex: 1}}>
            <div style={{display: 'flex', alignItems: 'center'}}>
              <div>
                <h1 className="football-title" style={{margin: 0, color: '#DC143C', fontSize: 24}}>Player Radar</h1>
                <div style={{fontSize: 14, color: '#666', marginTop: 2}}>Add New Player</div>
              </div>
            </div>
            <div style={{display: 'flex', gap: 12}}>
              <button onClick={() => setPage('scout-dashboard')} style={{background: '#f0f0f0', color: '#DC143C', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 'bold', fontSize: 14, cursor: 'pointer'}}>← Dashboard</button>
              <button onClick={() => setPage('list')} style={{background: '#063672', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 'bold', fontSize: 14, cursor: 'pointer'}}>Dashboard</button>
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  setUser(null);
                  setPage('auth');
                  window.location.reload();
                }}
                style={{background: '#f0f0f0', color: '#DC143C', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 'bold', fontSize: 14, cursor: 'pointer'}}>Sign Out</button>
            </div>
          </div>
          
          <div style={{flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: 20}}>
            <div style={{width: '100%', maxWidth: 600}}>
              <div style={{marginBottom: 20, textAlign: 'center'}}>
                <h2 style={{color: '#1e7c1e', fontSize: 28, marginBottom: 8}}>Add New Player</h2>
                <p style={{color: '#666', fontSize: 16}}>Enter player details to add them to the database</p>
              </div>
              <PlayerForm onAdd={handleAddPlayer} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Video Management page (for players only)
  if (user && user.role === 'player' && page === 'video-management') {
    return (
      <VideoManagement 
        user={user} 
        onBack={() => setPage('player-dashboard')} 
        onVideoUploaded={(videoData) => {
          // Activity logged by backend, refresh to show it
          fetchRecentActivities();
        }}
        onVideoDeleted={(videoData) => {
          // Activity logged by backend, refresh to show it
          fetchRecentActivities();
        }}
      />
    );
  }

  // Photo Management page (for players only)
  if (user && user.role === 'player' && page === 'photo-management') {
    return (
      <PhotoManagement 
        user={user} 
        onBack={() => setPage('player-dashboard')} 
        onPhotoUploaded={(photoData) => {
          // Activity logged by backend, refresh to show it
          fetchRecentActivities();
        }}
        onPhotoDeleted={(photoData) => {
          // Activity logged by backend, refresh to show it
          fetchRecentActivities();
        }}
      />
    );
  }

  // Player Notes page (for players only)
  if (user && user.role === 'player' && page === 'player-notes') {
    return (
      <PlayerNotes 
        user={user} 
        setPage={setPage} 
      />
    );
  }

  // Player Trials page (for players only)
  if (user && user.role === 'player' && page === 'player-trials') {
    return (
      <PlayerTrials 
        user={user} 
        setPage={setPage}
        onTrialStatusUpdated={() => {
          // Activity logged by backend, refresh to show it
          fetchRecentActivities();
          fetchActiveTrialsCount();
        }}
      />
    );
  }

  // Skill Evaluation Hub (for scouts only)
  if (page === 'skill-evaluations') {
    return (
      <SkillEvaluationHub 
        onBackToDashboard={() => setPage(user?.role === 'scout' ? 'scout-dashboard' : 'player-dashboard')}
        initialPlayer={evaluationTarget}
        initialView={evaluationInitialView}
        user={user}
      />
    );
  }

  // Player profile page (for players only)
  // Player profile page (for players only)
  if (user && user.role === 'player') {
    // Show loading state while fetching profile
    if (loadingProfile) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f5f5f5'
        }}>
          <div style={{
            background: '#fff',
            padding: '40px',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            textAlign: 'center',
            maxWidth: '400px'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '20px'
            }}>
              ⏳
            </div>
            <h2 style={{color: '#333', marginBottom: '20px'}}>Loading Your Profile...</h2>
            <p style={{color: '#666'}}>
              Please wait while we fetch your player information.
            </p>
          </div>
        </div>
      );
    }

    // Safety check: if no profile exists, log out the user
    if (!profile) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f5f5f5'
        }}>
          <div style={{
            background: '#fff',
            padding: '40px',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            textAlign: 'center',
            maxWidth: '400px'
          }}>
            <h2 style={{color: '#DC143C', marginBottom: '20px'}}>Profile Not Found</h2>
            <p style={{color: '#666', marginBottom: '20px'}}>
              Your player profile could not be found. Please contact an administrator.
            </p>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                setUser(null);
                setPage('auth');
              }}
              style={{
                background: '#DC143C',
                color: '#fff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Return to Login
            </button>
          </div>
        </div>
      );
    }

    const handleEditChange = e => {
      setEditForm({ ...editForm, [e.target.name]: e.target.value });
    };
    const handleEditSubmit = async e => {
      e.preventDefault();
      setEditError('');
      setEditSuccess('');
      try {
        // Map 'nationality' to 'country' for backend
        const patchBody = { ...editForm };
        if (patchBody.nationality !== undefined) {
          patchBody.country = patchBody.nationality;
          delete patchBody.nationality;
        }
        const res = await fetch(`/api/players/${encodeURIComponent(user.username)}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(patchBody)
        });
        if (!res.ok) throw new Error('Failed to update profile');
        const data = await res.json();
        setProfile(data);
        setEditSuccess('Profile updated!');
        setEditMode(false);
        // Activity logged by backend, refresh to show it
        fetchRecentActivities();
      } catch (err) {
        setEditError('Failed to update profile.');
      }
    };

    return (
      <div className="football-bg" style={{
        background: `linear-gradient(135deg, rgba(10,10,10,0.1) 60%, rgba(34,34,34,0.2) 100%), url(${process.env.PUBLIC_URL}/santi-cazorla.jpg) no-repeat center center fixed`,
        backgroundSize: 'cover, cover',
        minHeight: '100vh',
        padding: 12
      }}>
        <div style={{background: 'linear-gradient(135deg, #DC143C 0%, #ff4d6d 15%, #ffffff 40%, #ffebec 60%, #ffffff 85%, #DC143C 100%)', borderRadius: 12, boxShadow: '0 8px 32px rgba(220,20,60,0.25)', padding: 16, width: '100%', minHeight: 'calc(100vh - 24px)', display: 'flex', flexDirection: 'column', position: 'relative'}}>
          {/* Decorative background elements */}
          <div style={{position: 'absolute', top: -40, right: -40, width: 150, height: 150, background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)', borderRadius: '50%'}}></div>
          <div style={{position: 'absolute', bottom: -25, left: -25, width: 120, height: 120, background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)', borderRadius: '50%'}}></div>
          <div style={{position: 'absolute', top: '40%', right: '5%', width: 80, height: 80, background: 'radial-gradient(circle, rgba(220,20,60,0.15) 0%, transparent 70%)', borderRadius: '50%'}}></div>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderBottom: '2px solid rgba(255,255,255,0.3)', paddingBottom: 16, flexShrink: 0, position: 'relative', zIndex: 1}}>
            <div style={{display: 'flex', alignItems: 'center'}}>
              <div>
                <h1 className="football-title" style={{margin: 0, color: '#ffffff', fontSize: 24, textShadow: '0 2px 4px rgba(0,0,0,0.3)'}}>Player Radar</h1>
                <div style={{fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 2}}>Player Dashboard</div>
              </div>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                setUser(null);
                setPage('auth');
                window.location.reload();
              }}
              style={{background: 'rgba(255,255,255,0.9)', color: '#DC143C', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 'bold', fontSize: 14, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}}>Sign Out</button>
          </div>
          
          <div style={{display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16, flexShrink: 0, background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 16, backdropFilter: 'blur(10px)'}}>
            <div style={{position: 'relative'}}>
              <div 
                style={{
                  width: 80, 
                  height: 80, 
                  borderRadius: '50%', 
                  background: 'rgba(255,255,255,0.9)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)', 
                  fontSize: 40, 
                  color: '#DC143C', 
                  overflow: 'hidden', 
                  cursor: (profile?.profilePicture || user.profilePicture) ? 'pointer' : 'default'
                }} 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const imageUrl = profile?.profilePicture || user.profilePicture;
                  console.log('🔍 PLAYER AVATAR CLICKED!');
                  console.log('Player avatar clicked, profilePicture:', imageUrl);
                  console.log('Event target:', e.target);
                  if (imageUrl) {
                    handleImageEnlarge(imageUrl);
                  }
                }}
              >
                {profile?.profilePicture || user.profilePicture ? (
                  <img 
                    src={profile?.profilePicture || user.profilePicture} 
                    alt="Profile" 
                    style={{
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      pointerEvents: 'none' // Prevent img from blocking clicks
                    }} 
                  />
                ) : (
                  <span role="img" aria-label="profile">👤</span>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleProfilePictureUpload(e.target.files[0])}
                style={{display: 'none'}}
                id="player-profile-upload"
                disabled={uploadingPicture}
              />
              <label
                htmlFor="player-profile-upload"
                style={{
                  position: 'absolute',
                  bottom: -5,
                  right: -5,
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: '#DC143C',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: uploadingPicture ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  opacity: uploadingPicture ? 0.6 : 1
                }}
              >
                <span style={{color: 'white', fontSize: 16}}>{uploadingPicture ? '⏳' : '📷'}</span>
              </label>
            </div>
            <div style={{flex: 1}}>
              <div style={{fontSize: 28, fontWeight: 700, color: '#ffffff', marginBottom: 4, textShadow: '0 2px 4px rgba(0,0,0,0.3)'}}>{profile?.name || user.username}</div>
              <div style={{fontSize: 18, color: 'rgba(255,255,255,0.9)', marginBottom: 12}}>{profile?.position || 'Player'}</div>
              {pictureUploadError && <div style={{color: '#ffcccf', fontSize: 12, marginBottom: 8}}>{pictureUploadError}</div>}
              <div style={{display: 'flex', gap: 12, flexWrap: 'wrap'}}>
                <button style={{background: '#063672', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 600, fontSize: 14, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}} onClick={() => setEditMode(true)}>Edit Profile</button>
                <button 
                  onClick={() => setPage('video-management')}
                  style={{background: '#ff6b35', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 600, fontSize: 14, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}}
                >
                  🎥 Manage Videos
                </button>
                <button 
                  onClick={() => setPage('photo-management')}
                  style={{background: '#8A2BE2', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 600, fontSize: 14, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}}
                >
                  📸 Manage Photos
                </button>
              </div>
            </div>
          </div>
          {editMode ? (
            <div style={{background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 16, marginBottom: 16, flexShrink: 0, border: '2px solid rgba(220,20,60,0.3)', boxShadow: '0 8px 24px rgba(220,20,60,0.15)', position: 'relative', zIndex: 1}}>
              <div style={{fontWeight: 700, color: '#DC143C', marginBottom: 12, fontSize: 16, textShadow: '0 1px 2px rgba(0,0,0,0.1)'}}>Edit Profile</div>
              {editError && <div style={{color: '#DC143C', marginBottom: 8, padding: 8, background: 'rgba(220,20,60,0.1)', borderRadius: 6, fontSize: 14, border: '1px solid rgba(220,20,60,0.2)'}}>{editError}</div>}
              {editSuccess && <div style={{color: '#DC143C', marginBottom: 8, padding: 8, background: 'rgba(220,20,60,0.1)', borderRadius: 6, fontSize: 14, border: '1px solid rgba(220,20,60,0.2)'}}>{editSuccess}</div>}
              <form onSubmit={handleEditSubmit}>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16}}>
                  <div>
                    <label style={{fontWeight: 600, color: '#DC143C', display: 'block', marginBottom: 4, fontSize: 14}}>Date of Birth:</label>
                    <input name="dob" type="date" value={editForm.dob} onChange={handleEditChange} style={{width: '100%', padding: 8, border: '2px solid rgba(220,20,60,0.2)', borderRadius: 6, fontSize: 14, outline: 'none', transition: 'border-color 0.2s'}} />
                  </div>
                  <div>
                    <label style={{fontWeight: 600, color: '#DC143C', display: 'block', marginBottom: 4, fontSize: 14}}>Country:</label>
                    <input name="nationality" value={editForm.nationality} onChange={handleEditChange} style={{width: '100%', padding: 8, border: '2px solid rgba(220,20,60,0.2)', borderRadius: 6, fontSize: 14, outline: 'none', transition: 'border-color 0.2s'}} placeholder="Enter your country" />
                  </div>
                  <div>
                    <label style={{fontWeight: 600, color: '#DC143C', display: 'block', marginBottom: 4, fontSize: 14}}>Height (cm):</label>
                    <input name="height" type="number" value={editForm.height} onChange={handleEditChange} style={{width: '100%', padding: 8, border: '2px solid rgba(220,20,60,0.2)', borderRadius: 6, fontSize: 14, outline: 'none', transition: 'border-color 0.2s'}} placeholder="e.g. 180" />
                  </div>
                  <div>
                    <label style={{fontWeight: 600, color: '#DC143C', display: 'block', marginBottom: 4, fontSize: 14}}>Weight (kg):</label>
                    <input name="weight" type="number" value={editForm.weight} onChange={handleEditChange} style={{width: '100%', padding: 8, border: '2px solid rgba(220,20,60,0.2)', borderRadius: 6, fontSize: 14, outline: 'none', transition: 'border-color 0.2s'}} placeholder="e.g. 75" />
                  </div>
                  <div>
                    <label style={{fontWeight: 600, color: '#DC143C', display: 'block', marginBottom: 4, fontSize: 14}}>Foot:</label>
                    <select name="foot" value={editForm.foot} onChange={handleEditChange} style={{width: '100%', padding: 8, border: '2px solid rgba(220,20,60,0.2)', borderRadius: 6, fontSize: 14, outline: 'none', transition: 'border-color 0.2s'}}>
                      <option value="">Select</option>
                      <option value="Right">Right</option>
                      <option value="Left">Left</option>
                      <option value="Both">Both</option>
                    </select>
                  </div>
                  <div>
                    <label style={{fontWeight: 600, color: '#DC143C', display: 'block', marginBottom: 4, fontSize: 14}}>Position:</label>
                    <input name="position" value={editForm.position} onChange={handleEditChange} style={{width: '100%', padding: 8, border: '2px solid rgba(220,20,60,0.2)', borderRadius: 6, fontSize: 14, outline: 'none', transition: 'border-color 0.2s'}} placeholder="e.g. Midfielder" />
                  </div>
                </div>
                <div style={{display: 'flex', gap: 12}}>
                  <button type="submit" style={{background: '#DC143C', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer', boxShadow: '0 2px 8px rgba(220,20,60,0.2)'}}>Save Changes</button>
                  <button type="button" onClick={() => setEditMode(false)} style={{background: 'rgba(255,255,255,0.9)', color: '#DC143C', border: '2px solid rgba(220,20,60,0.2)', borderRadius: 6, padding: '8px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer'}}>Cancel</button>
                </div>
              </form>
            </div>
          ) : null}
          
          <div style={{flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1}}>
            {/* Player Skill Dashboard for players to view their own evaluations */}
            <div style={{flex: 1, overflow: 'auto', position: 'relative', zIndex: 1, marginBottom: 20}}>
              <PlayerSkillDashboard 
                isPlayerView={true} 
                onOpenEvaluation={(player) => {
                  // Set the evaluation target and navigate to skill evaluations hub
                  setEvaluationTarget(player);
                  // Choose initial view: scouts should go to evaluate, players to dashboard
                  setEvaluationInitialView(user?.role === 'scout' ? 'evaluate' : 'dashboard');
                  setPage('skill-evaluations');
                }}
              />
            </div>
            {/* Main Dashboard Grid - 2x2 layout for better visual appeal */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20, position: 'relative', zIndex: 1}}>
              {/* Player Information Card - Enhanced */}
              <div style={{background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 20, boxShadow: '0 8px 24px rgba(220,20,60,0.15)', border: '2px solid rgba(220,20,60,0.2)'}}>
                <div style={{fontWeight: 700, color: '#DC143C', marginBottom: 16, fontSize: 16, borderBottom: '2px solid rgba(220,20,60,0.2)', paddingBottom: 8}}>
                  <i className="fa fa-user" style={{marginRight: 8}}></i>Player Information
                </div>
                <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f8f9fa', borderRadius: 6}}>
                    <span style={{fontWeight: 600, color: '#DC143C', fontSize: 14}}>
                      <i className="fa fa-address-card" style={{marginRight: 8}}></i>Name:
                    </span>
                    <span style={{color: '#333', fontSize: 14, fontWeight: 'bold'}}>{profile?.name || user.username}</span>
                  </div>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f8f9fa', borderRadius: 6}}>
                    <span style={{fontWeight: 600, color: '#DC143C', fontSize: 14}}>
                      <i className="fa fa-map-marker" style={{marginRight: 8}}></i>Position:
                    </span>
                    <span style={{color: '#333', fontSize: 14}}>{profile?.position || '-'}</span>
                  </div>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f8f9fa', borderRadius: 6}}>
                    <span style={{fontWeight: 600, color: '#DC143C', fontSize: 14}}>
                      <i className="fa fa-globe" style={{marginRight: 8}}></i>Country:
                    </span>
                    <span style={{color: '#333', fontSize: 14}}>{profile?.nationality || profile?.country || '-'}</span>
                  </div>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f8f9fa', borderRadius: 6}}>
                    <span style={{fontWeight: 600, color: '#DC143C', fontSize: 14}}>
                      <i className="fa fa-child" style={{marginRight: 8}}></i>Foot:
                    </span>
                    <span style={{color: '#333', fontSize: 14}}>{profile?.foot || '-'}</span>
                  </div>
                </div>
              </div>
              
              {/* Media & Actions - Combined */}
              <div style={{background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 20, boxShadow: '0 8px 24px rgba(220,20,60,0.15)', border: '2px solid rgba(220,20,60,0.2)'}}>
                <div style={{fontWeight: 700, color: '#DC143C', marginBottom: 16, fontSize: 16, borderBottom: '2px solid rgba(220,20,60,0.2)', paddingBottom: 8}}>
                  <i className="fa fa-bolt" style={{marginRight: 8}}></i>Quick Actions
                </div>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16}}>
                  <button 
                    onClick={() => setPage('video-management')}
                    style={{
                      background: 'linear-gradient(135deg, #ff6b35 0%, #ff4d20 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      padding: '16px 12px',
                      fontSize: 13,
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(255,107,53,0.3)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8,
                      transition: 'transform 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    <i className="fa fa-video-camera" style={{fontSize: 24}}></i>
                    Manage Videos
                  </button>
                  
                  <button 
                    onClick={() => setPage('photo-management')}
                    style={{
                      background: 'linear-gradient(135deg, #8A2BE2 0%, #9A32F5 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      padding: '16px 12px',
                      fontSize: 13,
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(138,43,226,0.3)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8,
                      transition: 'transform 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    <i className="fa fa-camera" style={{fontSize: 24}}></i>
                    Manage Photos
                  </button>
                </div>
                
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12}}>
                  <button 
                    onClick={() => setPage('player-notes')}
                    style={{
                      background: 'linear-gradient(135deg, #228B22 0%, #32CD32 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      padding: '12px 16px',
                      fontSize: 13,
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(34,139,34,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      transition: 'transform 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    <i className="fa fa-sticky-note" style={{fontSize: 16}}></i>
                    Scout Notes
                  </button>
                  
                  <button 
                    onClick={() => setPage('player-trials')}
                    style={{
                      background: 'linear-gradient(135deg, #FF6347 0%, #FF8C69 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      padding: '12px 16px',
                      fontSize: 13,
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(255,99,71,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      transition: 'transform 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    <i className="fa fa-calendar-check-o" style={{fontSize: 16}}></i>
                    My Trials
                  </button>
                </div>
                
                <div style={{marginTop: 16}}>
                  <button 
                    onClick={() => setEditMode(true)}
                    style={{
                      background: 'linear-gradient(135deg, #063672 0%, #4a90e2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      padding: '12px 20px',
                      fontSize: 14,
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(6,54,114,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      width: '100%',
                      transition: 'transform 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    <i className="fa fa-edit" style={{fontSize: 18}}></i>
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>

            {/* Activity Feed Section for Player */}
            <div style={{marginTop: 20, background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 20, boxShadow: '0 8px 24px rgba(220,20,60,0.15)', border: '2px solid rgba(220,20,60,0.2)'}}>
              <div style={{fontWeight: 700, color: '#DC143C', marginBottom: 16, fontSize: 18, borderBottom: '2px solid rgba(220,20,60,0.2)', paddingBottom: 8}}>
                <i className="fa fa-clock-o" style={{marginRight: 8}}></i>My Activity
              </div>
              {loadingActivities ? (
                <div style={{textAlign: 'center', padding: '40px 20px', color: '#999'}}>
                  <i className="fa fa-spinner fa-spin" style={{fontSize: 24, marginBottom: 16}}></i>
                  <div>Loading activities...</div>
                </div>
              ) : recentActivities
                .filter(activity => activity.type !== 'note_added')
                .length > 0 ? (
                <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
                  {recentActivities
                    .filter(activity => activity.type !== 'note_added')
                    .map((activity) => {
                      const activityStyle = getActivityIcon(activity.type);
                      return (
                        <div key={activity._id} style={{padding: '16px', background: '#f8f9fa', borderRadius: 8, borderLeft: `4px solid ${activityStyle.color}`, border: '1px solid #e9ecef'}}>
                          <div style={{display: 'flex', alignItems: 'center', marginBottom: 8}}>
                            <div style={{width: 32, height: 32, borderRadius: '50%', background: activityStyle.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12}}>
                              <i className={`fa ${activityStyle.icon}`} style={{fontSize: 14, color: '#fff'}}></i>
                            </div>
                            <div style={{flex: 1}}>
                              <div style={{fontWeight: 600, fontSize: 14, color: '#333', marginBottom: 2}}>{activity.title}</div>
                              <div style={{fontSize: 12, color: '#666'}}>{activity.description}</div>
                              {activity.user && activity.user.username !== user.username && (
                                <div style={{fontSize: 11, color: '#28a745', marginTop: 4}}>by {activity.user.username}</div>
                              )}
                            </div>
                            <div style={{fontSize: 11, color: '#999', textAlign: 'right'}}>{formatTimestamp(activity.timestamp)}</div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div style={{textAlign: 'center', padding: '40px 20px', color: '#999'}}>
                  <i className="fa fa-hourglass-empty" style={{fontSize: 32, marginBottom: 16, opacity: 0.5}}></i>
                  <div style={{fontSize: 16, fontWeight: 500}}>No recent activity</div>
                  <div style={{fontSize: 14, marginTop: 8}}>Your recent actions will appear here</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Image Enlargement Modal - Player Profile */}
        {console.log('🔍 Player Profile Modal render check - enlargedImage:', enlargedImage)}
        {enlargedImage && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            cursor: 'pointer'
          }} onClick={closeImageModal}>
            <div style={{
              maxWidth: '90%',
              maxHeight: '90%',
              position: 'relative'
            }}>
              <img 
                src={enlargedImage} 
                alt="Enlarged profile" 
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
                onClick={closeImageModal}
                style={{
                  position: 'absolute',
                  top: '-15px',
                  right: '-15px',
                  background: '#DC143C',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                }}
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModal.show && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001
          }}>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '30px',
              maxWidth: '450px',
              width: '90%',
              boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
              border: '2px solid #DC143C'
            }} onClick={(e) => e.stopPropagation()}>
              <div style={{
                textAlign: 'center',
                marginBottom: '25px'
              }}>
                <div style={{
                  fontSize: '48px',
                  color: '#DC143C',
                  marginBottom: '15px'
                }}>
                  ⚠️
                </div>
                <h3 style={{
                  color: '#DC143C',
                  marginBottom: '10px',
                  fontSize: '24px'
                }}>
                  Delete Player
                </h3>
                <p style={{
                  color: '#333',
                  fontSize: '16px',
                  marginBottom: '20px'
                }}>
                  Are you sure you want to delete <strong>{deleteModal.playerName}</strong>?
                </p>
                <div style={{
                  background: '#fff5f5',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '15px',
                  textAlign: 'left',
                  marginBottom: '20px'
                }}>
                  <p style={{ 
                    color: '#DC143C', 
                    fontWeight: 'bold', 
                    marginBottom: '8px',
                    fontSize: '14px' 
                  }}>
                    This action will:
                  </p>
                  <ul style={{ 
                    color: '#666', 
                    margin: 0, 
                    paddingLeft: '20px',
                    fontSize: '14px'
                  }}>
                    <li>Remove the player from the database</li>
                    <li>Delete their login account</li>
                    <li style={{ color: '#DC143C', fontWeight: 'bold' }}>This action cannot be undone</li>
                  </ul>
                </div>
              </div>
              <div style={{
                display: 'flex',
                gap: '15px',
                justifyContent: 'center'
              }}>
                <button
                  onClick={cancelDeletePlayer}
                  style={{
                    padding: '12px 24px',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = '#e5e7eb';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = '#f3f4f6';
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeletePlayer}
                  style={{
                    padding: '12px 24px',
                    background: '#DC143C',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = '#b91c1c';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = '#DC143C';
                  }}
                >
                  Delete Player
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Trials management page (scout only)
  if (user && user.role === 'scout' && page === 'trials') {
    return (
      <div className="football-bg" style={{
        background: `linear-gradient(135deg, rgba(10,10,10,0.1) 60%, rgba(34,34,34,0.2) 100%), url(${process.env.PUBLIC_URL}/santi-cazorla.jpg) no-repeat center center fixed`,
        backgroundSize: 'cover, cover',
        minHeight: '100vh',
        padding: 12
      }}>
        <div style={{background: 'linear-gradient(135deg, #ffffff 0%, #ffeff0 25%, #ffffff 50%, #fff5f5 75%, #ffffff 100%)', borderRadius: 16, boxShadow: '0 8px 32px rgba(220,20,60,0.15)', padding: 32, position: 'relative', overflow: 'hidden', minHeight: 'calc(100vh - 24px)'}}>
          {/* Decorative background elements */}
          <div style={{position: 'absolute', top: -30, right: -30, width: 150, height: 150, background: 'radial-gradient(circle, rgba(220,20,60,0.03) 0%, transparent 70%)', borderRadius: '50%'}}></div>
          <div style={{position: 'absolute', bottom: -40, left: -40, width: 120, height: 120, background: 'radial-gradient(circle, rgba(6,54,114,0.02) 0%, transparent 70%)', borderRadius: '50%'}}></div>
          
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, position: 'relative', zIndex: 1}}>
            <div style={{display: 'flex', alignItems: 'center'}}>
              <div>
                <h1 className="football-title" style={{margin: 0, color: '#DC143C', fontSize: 28}}>Trial Management</h1>
                <div style={{fontSize: 14, color: '#666', marginTop: 2}}>Schedule and manage player trials</div>
              </div>
            </div>
            <div style={{display: 'flex', gap: 12}}>
              <button onClick={() => setPage('scout-dashboard')} style={{background: '#063672', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 'bold', fontSize: 16, cursor: 'pointer'}}>← Dashboard</button>
              <button onClick={() => setPage('list')} style={{background: '#DC143C', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 'bold', fontSize: 16, cursor: 'pointer', boxShadow: '0 2px 8px rgba(220,20,60,0.08)'}}>Players</button>
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  setUser(null);
                  setPage('auth');
                  window.location.reload();
                }}
                style={{background: '#f0f0f0', color: '#DC143C', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 'bold', fontSize: 16, cursor: 'pointer'}}>
                Sign Out
              </button>
            </div>
          </div>

          <div style={{position: 'relative', zIndex: 1}}>
            <TrialCalendar userRole={user.role} onRefreshRequested={() => fetchActiveTrialsCount()} />
          </div>
        </div>
      </div>
    );
  }

  // Player list page (scout only)
  if (user && user.role === 'scout' && page === 'list') {
    return (
      <div className="football-bg" style={{
        background: `linear-gradient(135deg, rgba(10,10,10,0.5) 60%, rgba(34,34,34,0.6) 100%), url(${process.env.PUBLIC_URL}/santi-cazorla.jpg) no-repeat center center fixed`,
        backgroundSize: 'cover, cover',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingTop: 40
    }}>
      <div style={{width: '100%', maxWidth: 1000, margin: '40px auto', background: 'linear-gradient(135deg, #ffffff 0%, #ffeff0 25%, #ffffff 50%, #fff5f5 75%, #ffffff 100%)', borderRadius: 16, boxShadow: '0 8px 32px rgba(220,20,60,0.15)', padding: 32, position: 'relative', overflow: 'hidden'}}>
        {/* Decorative background elements */}
        <div style={{position: 'absolute', top: -30, right: -30, width: 150, height: 150, background: 'radial-gradient(circle, rgba(220,20,60,0.03) 0%, transparent 70%)', borderRadius: '50%'}}></div>
        <div style={{position: 'absolute', bottom: -40, left: -40, width: 120, height: 120, background: 'radial-gradient(circle, rgba(6,54,114,0.02) 0%, transparent 70%)', borderRadius: '50%'}}></div>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, position: 'relative', zIndex: 1}}>
          <div style={{display: 'flex', alignItems: 'center'}}>
            <div>
              <h1 className="football-title" style={{margin: 0, color: '#DC143C', fontSize: 28}}>Player Radar</h1>
            </div>
          </div>
          <div style={{display: 'flex', gap: 12}}>
            {user.role === 'scout' && (
              <>
                <button onClick={() => setPage('scout-dashboard')} style={{background: '#063672', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 'bold', fontSize: 16, cursor: 'pointer'}}>← Dashboard</button>
                <button onClick={() => setPage('scout-add')} style={{background: '#DC143C', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 'bold', fontSize: 16, cursor: 'pointer', boxShadow: '0 2px 8px rgba(220,20,60,0.08)'}}>Add Player</button>
              </>
            )}
            <button
              onClick={() => {
                localStorage.removeItem('token');
                setUser(null);
                setPage('auth');
                window.location.reload();
              }}
              style={{background: '#f0f0f0', color: '#DC143C', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 'bold', fontSize: 16, cursor: 'pointer'}}>
              Sign Out
            </button>
          </div>
        </div>
        
        {/* Player Dashboard Header */}
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
          <h2 style={{margin: 0, color: '#DC143C', fontSize: 22}}>Player Dashboard</h2>
          <div style={{fontSize: 14, color: '#666'}}>
            {getFilteredAndSortedPlayers().length} of {players.length} players
          </div>
        </div>

        {/* Search and Filters */}
        <div style={{background: '#f8f9fa', padding: 20, borderRadius: 8, marginBottom: 20, border: '1px solid #e9ecef'}}>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 15, marginBottom: 15}}>
            {/* Search */}
            <div>
              <label style={{display: 'block', fontWeight: 'bold', color: '#333', marginBottom: 5, fontSize: 12}}>SEARCH PLAYERS</label>
              <input
                type="text"
                placeholder="Search by name, position, nationality..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  fontSize: 14,
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Position Filter */}
            <div>
              <label style={{display: 'block', fontWeight: 'bold', color: '#333', marginBottom: 5, fontSize: 12}}>POSITION</label>
              <select
                value={filterPosition}
                onChange={(e) => setFilterPosition(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  fontSize: 14,
                  boxSizing: 'border-box'
                }}
              >
                <option value="">All Positions</option>
                {getUniquePositions().map(position => (
                  <option key={position} value={position}>{position}</option>
                ))}
              </select>
            </div>

            {/* Nationality Filter */}
            <div>
              <label style={{display: 'block', fontWeight: 'bold', color: '#333', marginBottom: 5, fontSize: 12}}>NATIONALITY</label>
              <select
                value={filterNationality}
                onChange={(e) => setFilterNationality(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  fontSize: 14,
                  boxSizing: 'border-box'
                }}
              >
                <option value="">All Countries</option>
                {getUniqueNationalities().map(nationality => (
                  <option key={nationality} value={nationality}>{nationality}</option>
                ))}
              </select>
            </div>

            {/* Age Filter */}
            <div>
              <label style={{display: 'block', fontWeight: 'bold', color: '#333', marginBottom: 5, fontSize: 12}}>AGE GROUP</label>
              <select
                value={filterAge}
                onChange={(e) => setFilterAge(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  fontSize: 14,
                  boxSizing: 'border-box'
                }}
              >
                <option value="">All Ages</option>
                <option value="under-20">Under 20</option>
                <option value="20-25">20-25</option>
                <option value="26-30">26-30</option>
                <option value="over-30">Over 30</option>
              </select>
            </div>
          </div>

          {/* Sort Controls */}
          <div style={{display: 'flex', gap: 15, alignItems: 'center'}}>
            <div>
              <label style={{display: 'block', fontWeight: 'bold', color: '#333', marginBottom: 5, fontSize: 12}}>SORT BY</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  fontSize: 14
                }}
              >
                <option value="name">Name</option>
                <option value="position">Position</option>
                <option value="age">Age</option>
                <option value="nationality">Nationality</option>
                <option value="club">Club</option>
                <option value="height">Height</option>
                <option value="weight">Weight</option>
              </select>
            </div>
            <div>
              <label style={{display: 'block', fontWeight: 'bold', color: '#333', marginBottom: 5, fontSize: 12}}>ORDER</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  fontSize: 14
                }}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterPosition('');
                setFilterNationality('');
                setFilterAge('');
                setSortBy('name');
                setSortOrder('asc');
              }}
              style={{
                padding: '8px 16px',
                background: '#DC143C',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                fontSize: 14,
                cursor: 'pointer',
                fontWeight: 'bold',
                alignSelf: 'end'
              }}
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Player Table */}
        <div style={{overflowX: 'auto', width: '100%'}}>
          <table style={{width: '100%', background: '#fff', borderRadius: 8, borderCollapse: 'collapse', color: '#333', boxShadow: '0 2px 8px rgba(220,20,60,0.04)'}}>
            <thead>
              <tr style={{background: '#ffebec', color: '#DC143C'}}>
                <th style={{padding: '12px 8px', border: '1px solid #ffcccf', fontWeight: 600, cursor: 'pointer'}} onClick={() => setSortBy('name')}>
                  Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{padding: '12px 8px', border: '1px solid #ffcccf', fontWeight: 600, cursor: 'pointer'}} onClick={() => setSortBy('playerID')}>
                  Player ID* {sortBy === 'playerID' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{padding: '12px 8px', border: '1px solid #ffcccf', fontWeight: 600, cursor: 'pointer'}} onClick={() => setSortBy('position')}>
                  Position {sortBy === 'position' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{padding: '12px 8px', border: '1px solid #ffcccf', fontWeight: 600, cursor: 'pointer'}} onClick={() => setSortBy('age')}>
                  Age {sortBy === 'age' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{padding: '12px 8px', border: '1px solid #ffcccf', fontWeight: 600, cursor: 'pointer'}} onClick={() => setSortBy('nationality')}>
                  Nationality {sortBy === 'nationality' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{padding: '12px 8px', border: '1px solid #ffcccf', fontWeight: 600, cursor: 'pointer'}} onClick={() => setSortBy('club')}>
                  Club {sortBy === 'club' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{padding: '12px 8px', border: '1px solid #ffcccf', fontWeight: 600, cursor: 'pointer'}} onClick={() => setSortBy('height')}>
                  Height {sortBy === 'height' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{padding: '12px 8px', border: '1px solid #ffcccf', fontWeight: 600, cursor: 'pointer'}} onClick={() => setSortBy('weight')}>
                  Weight {sortBy === 'weight' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{padding: '12px 8px', border: '1px solid #ffcccf', fontWeight: 600}}>Foot</th>
                <th style={{padding: '12px 8px', border: '1px solid #ffcccf', fontWeight: 600}}>Videos</th>
                <th style={{padding: '12px 8px', border: '1px solid #ffcccf', fontWeight: 600}}>Photos</th>
                <th style={{padding: '12px 8px', border: '1px solid #ffcccf', fontWeight: 600}}>Status</th>
                {user && user.role === 'scout' && (
                  <th style={{padding: '12px 8px', border: '1px solid #ffcccf', fontWeight: 600}}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {getFilteredAndSortedPlayers().length === 0 ? (
                <tr>
                  <td colSpan={user && user.role === 'scout' ? "13" : "12"} style={{padding: '20px', textAlign: 'center', color: '#666', fontStyle: 'italic'}}>
                    No players found matching your criteria
                  </td>
                </tr>
              ) : (
                getFilteredAndSortedPlayers().map(player => {
                  const age = calculateAge(player.dob);
                  return (
                    <tr key={player._id || player.id} style={{color: '#333'}}>
                      <td 
                        style={{
                          padding: '12px 8px', 
                          border: '1px solid #ffcccf', 
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          color: '#DC143C',
                          textDecoration: 'underline'
                        }}
                        onClick={() => {
                          setSelectedPlayer(player);
                          setPage('player-profile');
                        }}
                        onMouseOver={(e) => e.target.style.background = '#ffebec'}
                        onMouseOut={(e) => e.target.style.background = 'transparent'}
                      >
                        {player.name}
                      </td>
                      <td style={{padding: '12px 8px', border: '1px solid #ffcccf'}}>
                        <span style={{
                          background: '#e8f5e8',
                          color: '#2d5a2d',
                          padding: '4px 8px',
                          borderRadius: 8,
                          fontSize: 11,
                          fontWeight: 'bold',
                          fontFamily: 'monospace',
                          letterSpacing: '1px'
                        }}>
                          {player.playerID || 'N/A'}
                        </span>
                      </td>
                      <td style={{padding: '12px 8px', border: '1px solid #ffcccf'}}>
                        <span style={{
                          background: '#f0f8ff',
                          color: '#0066cc',
                          padding: '2px 6px',
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 'bold'
                        }}>
                          {player.position || 'N/A'}
                        </span>
                      </td>
                      <td style={{padding: '12px 8px', border: '1px solid #ffcccf'}}>
                        {age ? `${age} years` : 'N/A'}
                      </td>
                      <td style={{padding: '12px 8px', border: '1px solid #ffcccf'}}>
                        {player.nationality || player.country || 'N/A'}
                      </td>
                      <td style={{padding: '12px 8px', border: '1px solid #ffcccf'}}>
                        <span style={{
                          background: '#f0f8ff',
                          color: '#0066cc',
                          padding: '2px 6px',
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 'bold'
                        }}>
                          {player.club || 'N/A'}
                        </span>
                      </td>
                      <td style={{padding: '12px 8px', border: '1px solid #ffcccf'}}>
                        {player.height ? `${player.height} cm` : 'N/A'}
                      </td>
                      <td style={{padding: '12px 8px', border: '1px solid #ffcccf'}}>
                        {player.weight ? `${player.weight} kg` : 'N/A'}
                      </td>
                      <td style={{padding: '12px 8px', border: '1px solid #ffcccf'}}>
                        {player.foot || 'N/A'}
                      </td>
                      <td style={{padding: '12px 8px', border: '1px solid #ffcccf', textAlign: 'center'}}>
                        {user.role === 'scout' ? (
                          <span style={{
                            background: (playerVideoCounts[player._id] || 0) > 0 ? '#e8f5e8' : '#fff3cd',
                            color: (playerVideoCounts[player._id] || 0) > 0 ? '#2d5a2d' : '#856404',
                            padding: '4px 8px',
                            borderRadius: 12,
                            fontSize: 12,
                            fontWeight: 'bold',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}>
                            🎥 {playerVideoCounts[player._id] || 0}
                          </span>
                        ) : 'N/A'}
                      </td>
                      <td style={{padding: '12px 8px', border: '1px solid #ffcccf', textAlign: 'center'}}>
                        {user.role === 'scout' ? (
                          <span style={{
                            background: (playerPhotoCounts[player._id] || 0) > 0 ? '#f0e8ff' : '#fff3cd',
                            color: (playerPhotoCounts[player._id] || 0) > 0 ? '#4b0082' : '#856404',
                            padding: '4px 8px',
                            borderRadius: 12,
                            fontSize: 12,
                            fontWeight: 'bold',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}>
                            📷 {playerPhotoCounts[player._id] || 0}
                          </span>
                        ) : 'N/A'}
                      </td>
                      <td style={{padding: '12px 8px', border: '1px solid #ffcccf'}}>
                        <span style={{
                          background: player.status === 'academy' ? '#e8f5e8' : player.status === 'scouting' ? '#fff3cd' : '#e8f5e8',
                          color: player.status === 'academy' ? '#2d5a2d' : player.status === 'scouting' ? '#856404' : '#2d5a2d',
                          padding: '2px 6px',
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 'bold'
                        }}>
                          {player.status === 'academy' ? 'Academy' : player.status === 'scouting' ? 'Scouting' : 'Active'}
                        </span>
                      </td>
                      {user && user.role === 'scout' && (
                        <td style={{padding: '12px 8px', border: '1px solid #ffcccf', textAlign: 'center'}}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePlayer(player._id, player.name);
                            }}
                            style={{
                              background: '#dc3545',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 4,
                              padding: '4px 8px',
                              fontSize: 12,
                              cursor: 'pointer',
                              fontWeight: 'bold'
                            }}
                            onMouseOver={(e) => e.target.style.background = '#c82333'}
                            onMouseOut={(e) => e.target.style.background = '#dc3545'}
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteModal.show && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001
          }}>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '30px',
              maxWidth: '450px',
              width: '90%',
              boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
              border: '2px solid #DC143C'
            }} onClick={(e) => e.stopPropagation()}>
              <div style={{
                textAlign: 'center',
                marginBottom: '25px'
              }}>
                <div style={{
                  fontSize: '48px',
                  color: '#DC143C',
                  marginBottom: '15px'
                }}>
                  ⚠️
                </div>
                <h3 style={{
                  color: '#DC143C',
                  marginBottom: '10px',
                  fontSize: '24px'
                }}>
                  Delete Player
                </h3>
                <p style={{
                  color: '#333',
                  fontSize: '16px',
                  marginBottom: '20px'
                }}>
                  Are you sure you want to delete <strong>{deleteModal.playerName}</strong>?
                </p>
                <div style={{
                  background: '#fff5f5',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '15px',
                  textAlign: 'left',
                  marginBottom: '20px'
                }}>
                  <p style={{ 
                    color: '#DC143C', 
                    fontWeight: 'bold', 
                    marginBottom: '8px',
                    fontSize: '14px' 
                  }}>
                    This action will:
                  </p>
                  <ul style={{ 
                    color: '#666', 
                    margin: 0, 
                    paddingLeft: '20px',
                    fontSize: '14px'
                  }}>
                    <li>Remove the player from the database</li>
                    <li>Delete their login account</li>
                    <li style={{ color: '#DC143C', fontWeight: 'bold' }}>This action cannot be undone</li>
                  </ul>
                </div>
              </div>
              <div style={{
                display: 'flex',
                gap: '15px',
                justifyContent: 'center'
              }}>
                <button
                  onClick={cancelDeletePlayer}
                  style={{
                    padding: '12px 24px',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = '#e5e7eb';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = '#f3f4f6';
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeletePlayer}
                  style={{
                    padding: '12px 24px',
                    background: '#DC143C',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = '#b91c1c';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = '#DC143C';
                  }}
                >
                  Delete Player
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    );
  }

  // Individual Player Profile page (for scouts viewing a specific player)
  if (user && user.role === 'scout' && page === 'player-profile' && selectedPlayer) {
    return <ScoutPlayerProfileView />;
  }

  // Scout Player Profile View Component
  function ScoutPlayerProfileView() {
    const [playerVideos, setPlayerVideos] = useState([]);
    const [loadingVideos, setLoadingVideos] = useState(false);
    const [playerPhotos, setPlayerPhotos] = useState([]);
    const [loadingPhotos, setLoadingPhotos] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [playerNotes, setPlayerNotes] = useState([]);
    const [loadingNotes, setLoadingNotes] = useState(false);
    const [noteContent, setNoteContent] = useState('');
    const [addingNote, setAddingNote] = useState(false);

    // Fetch player video highlights
    useEffect(() => {
      const fetchPlayerVideos = async () => {
        if (!selectedPlayer?.name) return;
        
        setLoadingVideos(true);
        try {
          const response = await fetch(`/api/players/${selectedPlayer.name}/video-highlights`);
          if (response.ok) {
            const data = await response.json();
            setPlayerVideos(data.videoHighlights || []);
          }
        } catch (err) {
          console.error('Failed to fetch player videos:', err);
          setPlayerVideos([]);
        } finally {
          setLoadingVideos(false);
        }
      };

      fetchPlayerVideos();
    }, [selectedPlayer]);

    // Fetch player match photos
    useEffect(() => {
      const fetchPlayerPhotos = async () => {
        if (!selectedPlayer?.name) return;
        
        setLoadingPhotos(true);
        try {
          const response = await fetch(`/api/players/${selectedPlayer.name}/match-photos`);
          if (response.ok) {
            const data = await response.json();
            setPlayerPhotos(data.matchPhotos || []);
          }
        } catch (err) {
          console.error('Failed to fetch player photos:', err);
          setPlayerPhotos([]);
        } finally {
          setLoadingPhotos(false);
        }
      };

      fetchPlayerPhotos();
    }, [selectedPlayer]);

    // Fetch player notes
    useEffect(() => {
      const fetchPlayerNotes = async () => {
        if (!selectedPlayer?.name) return;
        
        setLoadingNotes(true);
        try {
          const response = await fetch(`/api/players/${selectedPlayer.name}/notes`);
          if (response.ok) {
            const data = await response.json();
            setPlayerNotes(data.notes || []);
          }
        } catch (err) {
          console.error('Failed to fetch player notes:', err);
          setPlayerNotes([]);
        } finally {
          setLoadingNotes(false);
        }
      };

      fetchPlayerNotes();
    }, [selectedPlayer]);

    // Add a new note
    const handleAddNote = async () => {
      if (!noteContent.trim()) return;
      
      setAddingNote(true);
      try {
        const response = await fetch(`/api/players/${selectedPlayer.name}/notes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ content: noteContent.trim() })
        });

        if (response.ok) {
          // Refresh notes
          const notesResponse = await fetch(`/api/players/${selectedPlayer.name}/notes`);
          if (notesResponse.ok) {
            const data = await notesResponse.json();
            setPlayerNotes(data.notes || []);
          }
          // Activity logged by backend
          setNoteContent('');
        } else {
          setNotificationModal({ show: true, type: 'error', title: 'Add Note Failed', message: 'Failed to add note' });
        }
      } catch (err) {
        console.error('Failed to add note:', err);
        setNotificationModal({ show: true, type: 'error', title: 'Add Note Failed', message: 'Failed to add note' });
      } finally {
        setAddingNote(false);
      }
    };

    // Delete a note
    const handleDeleteNote = async (noteId) => {
      setDeleteModal({ 
        show: true, 
        type: 'note', 
        playerId: null, 
        playerName: '', 
        noteId: noteId 
      });
    };

    return (
      <div className="football-bg" style={{
        background: `linear-gradient(135deg, rgba(10,10,10,0.1) 60%, rgba(34,34,34,0.2) 100%), url(${process.env.PUBLIC_URL}/santi-cazorla.jpg) no-repeat center center fixed`,
        backgroundSize: 'cover, cover',
        minHeight: '100vh',
        overflow: 'auto',
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
          position: 'relative', 
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderBottom: '2px solid rgba(255,255,255,0.3)', paddingBottom: 16, flexShrink: 0, position: 'relative', zIndex: 1}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
              <div>
                <h1 style={{margin: 0, color: '#fff', fontSize: 24, fontWeight: 900, textShadow: '2px 2px 4px rgba(0,0,0,0.3)'}}>
                  {selectedPlayer.name}
                </h1>
                <p style={{margin: 0, color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: 600}}>
                  Player Profile • {playerVideos.length} Video{playerVideos.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div style={{display: 'flex', gap: 8}}>
              <button onClick={() => setPage('list')} style={{background: '#063672', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 'bold', fontSize: 16, cursor: 'pointer'}}>← Back to List</button>
              <button onClick={() => setPage('scout-dashboard')} style={{background: 'rgba(255,255,255,0.9)', color: '#DC143C', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 'bold', fontSize: 16, cursor: 'pointer'}}>Dashboard</button>
              <button
                onClick={() => handleDeletePlayer(selectedPlayer._id, selectedPlayer.name)}
                style={{background: '#dc3545', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 'bold', fontSize: 16, cursor: 'pointer'}}
                onMouseOver={(e) => e.target.style.background = '#c82333'}
                onMouseOut={(e) => e.target.style.background = '#dc3545'}
              >
                🗑️ Delete Player
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  setUser(null);
                  setPage('auth');
                }}
                style={{background: '#f0f0f0', color: '#DC143C', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 'bold', fontSize: 16, cursor: 'pointer'}}>
                Sign Out
              </button>
            </div>
          </div>

          {/* Player Profile Content */}
          <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 20, position: 'relative', zIndex: 1, overflow: 'auto'}}>
            
            {/* Top Row - Player Info and Photo */}
            <div style={{display: 'flex', gap: 20, flexShrink: 0}}>
              {/* Left Column - Player Info */}
              <div style={{flex: 1, background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.1)'}}>
                <h2 style={{color: '#DC143C', fontSize: 20, marginBottom: 20, borderBottom: '2px solid #ffebec', paddingBottom: 10}}>
                  Player Information
                </h2>
                
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15}}>
                  <div>
                    <label style={{display: 'block', fontWeight: 'bold', color: '#333', marginBottom: 5}}>Full Name:</label>
                    <p style={{margin: 0, padding: '8px 12px', background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: 4}}>
                      {selectedPlayer.name || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <label style={{display: 'block', fontWeight: 'bold', color: '#333', marginBottom: 5}}>Position:</label>
                    <p style={{margin: 0, padding: '8px 12px', background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: 4}}>
                      {selectedPlayer.position || 'N/A'}
                    </p>
                  </div>

                  <div>
                    <label style={{display: 'block', fontWeight: 'bold', color: '#333', marginBottom: 5}}>Club:</label>
                    <p style={{margin: 0, padding: '8px 12px', background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: 4}}>
                      {selectedPlayer.club || 'N/A'}
                    </p>
                  </div>

                  <div>
                    <label style={{display: 'block', fontWeight: 'bold', color: '#333', marginBottom: 5}}>Status:</label>
                    <p style={{margin: 0, padding: '8px 12px', background: selectedPlayer.status === 'academy' ? '#e8f5e8' : '#fff3cd', border: '1px solid #e9ecef', borderRadius: 4, fontWeight: 'bold', color: selectedPlayer.status === 'academy' ? '#2d5a2d' : '#856404'}}>
                      {selectedPlayer.status === 'academy' ? 'Academy Player' : selectedPlayer.status === 'scouting' ? 'Being Scouted' : 'Active'}
                    </p>
                  </div>
                  
                  <div>
                    <label style={{display: 'block', fontWeight: 'bold', color: '#333', marginBottom: 5}}>Date of Birth:</label>
                    <p style={{margin: 0, padding: '8px 12px', background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: 4}}>
                      {selectedPlayer.dob || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <label style={{display: 'block', fontWeight: 'bold', color: '#333', marginBottom: 5}}>Nationality:</label>
                    <p style={{margin: 0, padding: '8px 12px', background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: 4}}>
                      {selectedPlayer.nationality || selectedPlayer.country || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <label style={{display: 'block', fontWeight: 'bold', color: '#333', marginBottom: 5}}>Height:</label>
                    <p style={{margin: 0, padding: '8px 12px', background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: 4}}>
                      {selectedPlayer.height ? `${selectedPlayer.height} cm` : 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <label style={{display: 'block', fontWeight: 'bold', color: '#333', marginBottom: 5}}>Weight:</label>
                    <p style={{margin: 0, padding: '8px 12px', background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: 4}}>
                      {selectedPlayer.weight ? `${selectedPlayer.weight} kg` : 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <label style={{display: 'block', fontWeight: 'bold', color: '#333', marginBottom: 5}}>Dominant Foot:</label>
                    <p style={{margin: 0, padding: '8px 12px', background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: 4}}>
                      {selectedPlayer.foot || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column - Player Photo and Stats */}
              <div style={{width: 300, display: 'flex', flexDirection: 'column', gap: 20}}>
                {/* Player Photo */}
                <div style={{background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.1)'}}>
                  <h3 style={{color: '#DC143C', fontSize: 16, marginBottom: 15, textAlign: 'center'}}>Player Photo</h3>
                  <div style={{
                    width: '100%',
                    height: 200,
                    background: '#f8f9fa',
                    border: '2px dashed #DC143C',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#666',
                    fontSize: 14
                  }}>
                    {selectedPlayer.profilePicture ? (
                      <img 
                        src={selectedPlayer.profilePicture} 
                        alt={selectedPlayer.name} 
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: 6
                        }}
                      />
                    ) : (
                      'No photo available'
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                <div style={{background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.1)'}}>
                  <h3 style={{color: '#DC143C', fontSize: 16, marginBottom: 15}}>Video Statistics</h3>
                  <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e9ecef'}}>
                      <span style={{fontWeight: 'bold', color: '#333'}}>Total Videos:</span>
                      <span style={{color: '#666', fontWeight: 'bold'}}>{playerVideos.length}</span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e9ecef'}}>
                      <span style={{fontWeight: 'bold', color: '#333'}}>Latest Upload:</span>
                      <span style={{color: '#666', fontSize: 12}}>
                        {playerVideos.length > 0 
                          ? new Date(Math.max(...playerVideos.map(v => new Date(v.uploadDate)))).toLocaleDateString()
                          : 'N/A'
                        }
                      </span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', padding: '8px 0'}}>
                      <span style={{fontWeight: 'bold', color: '#333'}}>Profile Status:</span>
                      <span style={{color: playerVideos.length > 0 ? '#2d5a2d' : '#856404', fontWeight: 'bold', fontSize: 12}}>
                        {playerVideos.length > 0 ? '✅ Active' : '⚠️ No Videos'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Trial Scheduling Section */}
            <div style={{marginBottom: 20}}>
              <TrialScheduler 
                playerId={selectedPlayer._id} 
                playerName={selectedPlayer.name}
                onTrialScheduled={(trial) => {
                  console.log('Trial scheduled:', trial);
                  // Activity logged by backend, refresh to show it
                  fetchRecentActivities();
                }}
              />
            </div>

            {/* Bottom Row - Video Highlights, Match Photos, and Scout Notes */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20}}>
              {/* Video Highlights Column */}
              <div style={{background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', minHeight: '400px'}}>
                <h2 style={{color: '#DC143C', fontSize: 18, marginBottom: 20, borderBottom: '2px solid #ffebec', paddingBottom: 10}}>
                  🎥 Video Highlights ({playerVideos.length})
                </h2>
                
                {loadingVideos ? (
                  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#666'}}>
                    <div>Loading videos...</div>
                  </div>
                ) : playerVideos.length === 0 ? (
                  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#666', textAlign: 'center'}}>
                    <div>
                      <div style={{fontSize: 48, marginBottom: 10}}>🎥</div>
                      <div style={{fontSize: 16, fontWeight: 'bold', marginBottom: 5}}>No Video Highlights</div>
                      <div style={{fontSize: 14}}>This player has not uploaded any video highlights yet.</div>
                    </div>
                  </div>
                ) : (
                  <div style={{display: 'flex', flexDirection: 'column', gap: 15, overflowY: 'auto', maxHeight: '500px'}}>
                    {playerVideos.map((video) => (
                      <div
                        key={video._id}
                        style={{
                          border: '2px solid #ffebec',
                          borderRadius: 12,
                          padding: 15,
                          background: '#fafafa',
                          boxShadow: '0 2px 8px rgba(220,20,60,0.1)'
                        }}
                      >
                        <div style={{marginBottom: 10}}>
                          <h4 style={{margin: 0, color: '#DC143C', fontSize: 16, fontWeight: 'bold'}}>{video.originalName}</h4>
                          <p style={{margin: '5px 0', color: '#666', fontSize: 12}}>
                            📅 Uploaded: {new Date(video.uploadDate).toLocaleDateString()}
                          </p>
                          {video.description && (
                            <p style={{margin: '5px 0', color: '#555', fontSize: 14, fontStyle: 'italic'}}>{video.description}</p>
                          )}
                        </div>
                        
                        <video
                          controls
                          style={{
                            width: '100%',
                            maxHeight: 200,
                            borderRadius: 8,
                            background: '#000'
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

              {/* Match Photos Column */}
              <div style={{background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', minHeight: '400px'}}>
                <h2 style={{color: '#4b0082', fontSize: 18, marginBottom: 20, borderBottom: '2px solid #f0e8ff', paddingBottom: 10}}>
                  📷 Match Photos ({playerPhotos.length})
                </h2>
                
                {loadingPhotos ? (
                  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#666'}}>
                    <div>Loading photos...</div>
                  </div>
                ) : playerPhotos.length === 0 ? (
                  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#666', textAlign: 'center'}}>
                    <div>
                      <div style={{fontSize: 48, marginBottom: 10}}>📷</div>
                      <div style={{fontSize: 16, fontWeight: 'bold', marginBottom: 5}}>No Match Photos</div>
                      <div style={{fontSize: 14}}>This player has not uploaded any match photos yet.</div>
                    </div>
                  </div>
                ) : (
                  <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 15, overflowY: 'auto', maxHeight: '500px'}}>
                    {playerPhotos.map((photo) => (
                      <div
                        key={photo._id}
                        style={{
                          border: '2px solid #f0e8ff',
                          borderRadius: 12,
                          padding: 10,
                          background: '#fafafa',
                          boxShadow: '0 2px 8px rgba(75,0,130,0.1)',
                          cursor: 'pointer',
                          transition: 'transform 0.2s, box-shadow 0.2s'
                        }}
                        onClick={() => setSelectedPhoto(photo)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.02)';
                          e.currentTarget.style.boxShadow = '0 4px 16px rgba(75,0,130,0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(75,0,130,0.1)';
                        }}
                      >
                        <img
                          src={`/uploads/match-photos/${photo.filename}`}
                          alt={photo.description || 'Match photo'}
                          style={{
                            width: '100%',
                            height: 120,
                            objectFit: 'cover',
                            borderRadius: 8,
                            marginBottom: 8
                          }}
                        />
                        <div style={{fontSize: 12, color: '#666', marginBottom: 4}}>
                          📅 {new Date(photo.matchDate).toLocaleDateString()}
                        </div>
                        {photo.opponent && (
                          <div style={{fontSize: 12, color: '#4b0082', fontWeight: 'bold', marginBottom: 4}}>
                            vs {photo.opponent}
                          </div>
                        )}
                        {photo.description && (
                          <div style={{fontSize: 11, color: '#555', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                            {photo.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Scout Notes Column */}
              <div style={{background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', minHeight: '400px'}}>
                <h2 style={{color: '#228B22', fontSize: 18, marginBottom: 20, borderBottom: '2px solid #e8f5e8', paddingBottom: 10}}>
                  📝 Scout Notes ({playerNotes.length})
                </h2>
                
                {/* Add New Note Form */}
                <div style={{marginBottom: 20, padding: 15, background: '#f8fdf8', border: '2px solid #e8f5e8', borderRadius: 8}}>
                  <h3 style={{margin: '0 0 10px 0', color: '#228B22', fontSize: 16}}>✍️ Write New Note</h3>
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Enter your scouting observations about this player..."
                    style={{
                      width: '100%',
                      minHeight: 100,
                      padding: 12,
                      border: '2px solid #d4edda',
                      borderRadius: 6,
                      fontSize: 14,
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#228B22'}
                    onBlur={(e) => e.target.style.borderColor = '#d4edda'}
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={!noteContent.trim() || addingNote}
                    style={{
                      marginTop: 10,
                      background: noteContent.trim() ? '#228B22' : '#ccc',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      padding: '10px 16px',
                      fontSize: 14,
                      fontWeight: 'bold',
                      cursor: noteContent.trim() && !addingNote ? 'pointer' : 'not-allowed',
                      opacity: addingNote ? 0.7 : 1,
                      transition: 'all 0.2s'
                    }}
                  >
                    {addingNote ? '📝 Adding...' : '📝 Add Note'}
                  </button>
                </div>
                
                {/* Notes List */}
                {loadingNotes ? (
                  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#666'}}>
                    <div>Loading notes...</div>
                  </div>
                ) : playerNotes.length === 0 ? (
                  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#666', textAlign: 'center'}}>
                    <div>
                      <div style={{fontSize: 48, marginBottom: 10}}>📝</div>
                      <div style={{fontSize: 16, fontWeight: 'bold', marginBottom: 5}}>No Scout Notes</div>
                      <div style={{fontSize: 14}}>Be the first to add scouting observations for this player.</div>
                    </div>
                  </div>
                ) : (
                  <div style={{display: 'flex', flexDirection: 'column', gap: 15, overflowY: 'auto', maxHeight: '300px'}}>
                    {playerNotes.map((note, index) => (
                      <div
                        key={index}
                        style={{
                          border: '2px solid #e8f5e8',
                          borderRadius: 12,
                          padding: 15,
                          background: '#fafafa',
                          boxShadow: '0 2px 8px rgba(34,139,34,0.1)'
                        }}
                      >
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10}}>
                          <div>
                            <div style={{fontWeight: 'bold', color: '#228B22', fontSize: 14}}>
                              🕵️ {note.addedBy || 'Unknown Scout'}
                            </div>
                            <div style={{fontSize: 12, color: '#666'}}>
                              📅 {new Date(note.timestamp).toLocaleDateString()} at {new Date(note.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                          {note.addedBy === user.username && (
                            <button
                              onClick={() => handleDeleteNote(note._id)}
                              style={{
                                background: '#dc3545',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 4,
                                padding: '4px 8px',
                                fontSize: 12,
                                cursor: 'pointer'
                              }}
                              title="Delete this note"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                        <div style={{
                          color: '#333',
                          fontSize: 14,
                          lineHeight: 1.5,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word'
                        }}>
                          {note.content}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Photo Modal */}
            {selectedPhoto && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0,0,0,0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000,
                  padding: 20
                }}
                onClick={() => setSelectedPhoto(null)}
              >
                <div
                  style={{
                    background: '#fff',
                    borderRadius: 12,
                    padding: 20,
                    maxWidth: '90vw',
                    maxHeight: '90vh',
                    overflow: 'auto',
                    position: 'relative'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setSelectedPhoto(null)}
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      background: '#DC143C',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: 30,
                      height: 30,
                      cursor: 'pointer',
                      fontSize: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ×
                  </button>
                  
                  <img
                    src={`/uploads/match-photos/${selectedPhoto.filename}`}
                    alt={selectedPhoto.description || 'Match photo'}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '70vh',
                      objectFit: 'contain',
                      borderRadius: 8,
                      marginBottom: 15
                    }}
                  />
                  
                  <div style={{color: '#333'}}>
                    <h3 style={{margin: '0 0 10px 0', color: '#4b0082'}}>
                      📷 Match Photo Details
                    </h3>
                    
                    <div style={{marginBottom: 8}}>
                      <strong>📅 Date:</strong> {new Date(selectedPhoto.matchDate).toLocaleDateString()}
                    </div>
                    
                    {selectedPhoto.opponent && (
                      <div style={{marginBottom: 8}}>
                        <strong>⚽ Opponent:</strong> {selectedPhoto.opponent}
                      </div>
                    )}
                    
                    {selectedPhoto.description && (
                      <div style={{marginBottom: 8}}>
                        <strong>📝 Description:</strong> {selectedPhoto.description}
                      </div>
                    )}
                    
                    <div style={{fontSize: 12, color: '#666', marginTop: 10}}>
                      Uploaded: {new Date(selectedPhoto.uploadDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default fallback (should not reach here)
  return <div>Loading...</div>;
}

export default App;
