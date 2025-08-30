const Player = require('../models/Player');
const { logActivity } = require('./activityController');
const { sendPlayerWelcomeEmail } = require('../services/emailService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for video uploads
const videoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'public/uploads/video-highlights/';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'highlight-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const videoUpload = multer({
  storage: videoStorage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit for videos
  },
  fileFilter: function (req, file, cb) {
    // Check file type for videos
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'), false);
    }
  }
});

exports.uploadVideoHighlight = videoUpload.single('videoHighlight');

// Configure multer for photo uploads
const photoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'public/uploads/match-photos/';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'match-photo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const photoUpload = multer({
  storage: photoStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for photos
  },
  fileFilter: function (req, file, cb) {
    // Check file type for images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

exports.uploadMatchPhoto = photoUpload.single('matchPhoto');

// Update player profile (player can edit their own details)
exports.updatePlayer = async (req, res) => {
  try {
    // Always use the authenticated user's username for player lookup
    if (!req.user || req.user.role !== 'player') {
      return res.status(403).json({ error: 'You can only edit your own profile.' });
    }
    
    const username = req.user.username;
    console.log('PATCH updatePlayer - username:', username, 'req.user:', req.user, 'req.body:', req.body);
    
    // Accept all fields from the body, even if empty string
    const updateFields = {};
    const allowed = ['dob', 'country', 'nationality', 'height', 'weight', 'foot', 'position'];
    allowed.forEach(field => {
      if (field in req.body) updateFields[field] = req.body[field];
    });
    console.log('updateFields:', updateFields);
    
    // Use Model method to update player
    const player = await Player.updatePlayerByUsername(username, updateFields);
    console.log('Found player:', player);
    
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    res.json(player);
    
    // Log activity after successful response
    await logActivity(
      req.user.id,
      'profile_updated',
      'Profile Updated',
      'Updated profile information',
      player._id,
      req.user.club
    );
    
  } catch (err) {
    console.error('updatePlayer error:', err);
    res.status(500).json({ error: 'Failed to update player' });
  }
};

// Get current user's player profile
exports.getMyProfile = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'player') {
      return res.status(403).json({ error: 'Only players can access their profile' });
    }

    // First try to use a direct linkage from the User document (preferred)
    // This covers cases where the user's username does not exactly match the Player.name
    const User = require('../models/User');
    const userRecord = await User.findById(req.user.id).select('-password').populate('playerId');

    if (userRecord && userRecord.playerId) {
      return res.json(userRecord.playerId);
    }

    // Next, try to find by the stored playerIDCode on the user (if available)
    if (userRecord && userRecord.playerIDCode) {
      const playerByCode = await Player.findByPlayerID(userRecord.playerIDCode);
      if (playerByCode) return res.json(playerByCode);
    }

    // Fallback: try the legacy username -> player.name match (case-insensitive)
    const player = await Player.findOne({ 
      name: { $regex: `^${req.user.username}$`, $options: 'i' } 
    });

    if (!player) {
      return res.status(404).json({ error: 'Player profile not found' });
    }

    res.json(player);
  } catch (err) {
    console.error('getMyProfile error:', err);
    res.status(500).json({ error: 'Failed to get player profile' });
  }
};

// Get all players
exports.getPlayers = async (req, res) => {
  try {
    let players;
    
    // If user is a scout, show players added by any scout from their club + legacy system players
    if (req.user && req.user.role === 'scout') {
      // Check if scout has club information
      if (!req.user.club) {
        console.log('❌ Scout missing club information:', req.user);
        return res.status(400).json({ error: 'User club information missing. Please log out and log back in.' });
      }
      
      // Get all scouts from the same club
      const User = require('../models/User');
      const scoutsFromClub = await User.find({ role: 'scout', club: req.user.club });
      const scoutUsernames = scoutsFromClub.map(scout => scout.username);
      
      // Get players added by any scout from the same club OR legacy system players from their club
      players = await Player.find({ 
        $or: [
          { addedBy: { $in: scoutUsernames } },
          { addedBy: 'system', club: req.user.club }
        ]
      });
      
      // Determine status based on club relationship
      players = players.map(player => ({
        ...player.toObject(),
        status: player.club === req.user.club ? 'academy' : 'scouting'
      }));
    } else if (req.user && req.user.role === 'player') {
      // Players can see all players added by scouts from their club + legacy system players from their club + their own profile
      if (!req.user.club) {
        console.log('❌ Player missing club information:', req.user);
        return res.status(400).json({ error: 'User club information missing. Please log out and log back in.' });
      }
      
      // Get all scouts from the player's club, then find players added by those scouts + legacy system players + their own profile
      const User = require('../models/User');
      const scoutsFromClub = await User.find({ role: 'scout', club: req.user.club });
      const scoutUsernames = scoutsFromClub.map(scout => scout.username);
      
      // Get players added by any scout from the player's club OR legacy system players from their club OR the player's own profile
      players = await Player.find({ 
        $or: [
          { addedBy: { $in: scoutUsernames } },
          { addedBy: 'system', club: req.user.club },
          { name: { $regex: `^${req.user.username}$`, $options: 'i' } } // Player's own profile (case-insensitive)
        ]
      });
      
      // Determine status based on club relationship  
      players = players.map(player => ({
        ...player.toObject(),
        status: player.club === req.user.club ? 'academy' : 'scouting'
      }));
    } else {
      // For non-authenticated requests, return all players
      const allPlayers = await Player.getAllPlayers();
      players = allPlayers.map(player => ({
        ...player.toObject(),
        status: 'active' // Default status for non-scout views
      }));
    }
    
    res.json(players);
  } catch (err) {
    console.error('❌ Get players error:', err);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
};

// Add a new player (scout only)
exports.addPlayer = async (req, res) => {
  try {
    console.log('🔍 Add Player Request - User:', req.user);
    console.log('🔍 Add Player Request - Body:', req.body);
    
    if (!req.user || req.user.role !== 'scout') {
      return res.status(403).json({ error: 'Only scouts can add players' });
    }
    
    // Check if user has club information
    if (!req.user.club) {
      console.log('❌ User missing club information:', req.user);
      return res.status(400).json({ error: 'User club information missing. Please log out and log back in.' });
    }
    
    const { name, dob, country, nationality, height, weight, foot, position, club, email } = req.body;
    
    // Validation
    if (!name || !position || !club || !email) {
      console.log('❌ Validation failed - missing fields:', { name, position, club, email });
      return res.status(400).json({ error: 'Name, position, club, and email are required' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }
    
    // Prepare player data with scout information
    const playerData = {
      name,
      email,
      dob,
      country: country || nationality || '',
      height: height !== undefined ? Number(height) : undefined,
      weight: weight !== undefined ? Number(weight) : undefined,
      foot,
      position,
      club: club, // Use the club specified in the form
      addedBy: req.user.username // Track which scout added this player
    };
    
    console.log('🔍 Player data to create:', playerData);
    
    // Use Model method to create player
    const player = await Player.createPlayer(playerData);
    
    console.log('🔍 Created player:', player);
    
    // Determine status based on scout's club vs player's club
    const status = req.user.club === club ? 'academy' : 'scouting';
    
    console.log('🔍 Status determination - Scout club:', req.user.club, 'Player club:', club, 'Status:', status);
    
    // Add status for response
    const playerWithStatus = {
      ...player.toObject(),
      status: status
    };
    
    console.log('🔍 Final response player:', playerWithStatus);
    
    // Log activity
    await logActivity(
      req.user.id,
      'player_added',
      'Player Added',
      `Added ${player.name} to the database`,
      player._id,
      req.user.club
    );

    // Send welcome email to the player
    try {
      const emailResult = await sendPlayerWelcomeEmail(
        player.email,
        player.name,
        player.playerID
      );
      
      if (emailResult.success) {
        console.log('✅ Welcome email sent to:', player.email);
      } else {
        console.log('⚠️ Failed to send welcome email:', emailResult.error);
      }
    } catch (emailError) {
      console.error('❌ Email sending error:', emailError);
      // Don't fail the player creation if email fails
    }

    res.status(201).json(playerWithStatus);
  } catch (err) {
    console.error('❌ Add player error:', err);
    res.status(500).json({ error: 'Failed to add player' });
  }
};

// Delete a player (scout only)
exports.deletePlayer = async (req, res) => {
  console.log('🗑️ Delete player controller called with:', req.params, 'User:', req.user?.username, 'Role:', req.user?.role);
  
  try {
    if (!req.user || req.user.role !== 'scout') {
      console.log('❌ Access denied - not a scout');
      return res.status(403).json({ error: 'Only scouts can delete players' });
    }
    
    const { id } = req.params;
    console.log('🔍 Player ID to delete:', id);
    
    if (!id) {
      console.log('❌ No player ID provided');
      return res.status(400).json({ error: 'Player ID is required' });
    }
    
    // Use Model method to delete player
    const deletedPlayer = await Player.deletePlayerById(id);
    console.log('🔍 Deleted player result:', deletedPlayer);
    
    if (!deletedPlayer) {
      console.log('❌ Player not found');
      return res.status(404).json({ error: 'Player not found' });
    }
    
    // Delete all trials associated with this player
    const Trial = require('../models/Trial');
    const deletedTrials = await Trial.deleteMany({ player: id });
    console.log('🗑️ Deleted trials:', deletedTrials.deletedCount);
    
    // Also remove the player reference from any associated user and delete player accounts
    const User = require('../models/User');
    
    // Use the model method to delete associated user accounts
    const userDeletionResult = await User.deleteUsersByPlayer(id, deletedPlayer.name);
    console.log('🗑️ User deletion result:', userDeletionResult);
    
    // Log activity
    await logActivity(
      req.user.id,
      'player_deleted',
      'Player Deleted',
      `Removed ${deletedPlayer.name} from the database`,
      null,
      req.user.club
    );
    
    console.log('✅ Player deleted successfully:', deletedPlayer.name);
    res.json({ 
      message: 'Player deleted successfully', 
      player: deletedPlayer,
      deletedUserAccounts: userDeletionResult.totalDeleted,
      deletedTrials: deletedTrials.deletedCount
    });
    
  } catch (err) {
    console.error('Delete player error:', err);
    res.status(500).json({ error: 'Failed to delete player' });
  }
};

// Upload video highlight (player only)
exports.addVideoHighlight = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'player') {
      return res.status(403).json({ error: 'Only players can upload video highlights' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const { description } = req.body;
    const username = req.user.username;

    const videoData = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      description: description || '',
      uploadDate: new Date()
    };

    const player = await Player.addVideoHighlight(username, videoData);
    
    if (!player) {
      // Clean up uploaded file if player not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Player profile not found' });
    }

    res.json({ 
      message: 'Video highlight uploaded successfully',
      video: videoData
    });

    // Log activity after successful response
    await logActivity(
      req.user.id,
      'video_uploaded',
      'Video Uploaded',
      `Uploaded new video highlight: ${description || 'Untitled'}`,
      player._id,
      req.user.club
    );

  } catch (err) {
    // Clean up uploaded file on error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Upload video highlight error:', err);
    res.status(500).json({ error: 'Failed to upload video highlight' });
  }
};

// Delete video highlight (player only)
exports.deleteVideoHighlight = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'player') {
      return res.status(403).json({ error: 'Only players can delete their video highlights' });
    }

    const { videoId } = req.params;
    const username = req.user.username;

    // First get the player to find the video file
    const player = await Player.findByNameCaseInsensitive(username);
    if (!player) {
      return res.status(404).json({ error: 'Player profile not found' });
    }

    // Find the video to get filename for deletion
    const video = player.videoHighlights.find(v => v._id.toString() === videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video highlight not found' });
    }

    // Remove video from database
    const updatedPlayer = await Player.removeVideoHighlight(username, videoId);
    
    // Delete physical file
    const filePath = path.join('public/uploads/video-highlights/', video.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ 
      message: 'Video highlight deleted successfully',
      deletedVideo: video
    });

    // Log activity after successful response
    await logActivity(
      req.user.id,
      'video_deleted',
      'Video Deleted',
      `Removed video highlight: ${video.description || 'Untitled'}`,
      player._id,
      req.user.club
    );

  } catch (err) {
    console.error('Delete video highlight error:', err);
    res.status(500).json({ error: 'Failed to delete video highlight' });
  }
};

// Get video highlights for a player
exports.getVideoHighlights = async (req, res) => {
  try {
    const { playerName } = req.params;
    
    const player = await Player.findByNameCaseInsensitive(playerName);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    res.json({
      playerName: player.name,
      videoHighlights: player.videoHighlights || []
    });

  } catch (err) {
    console.error('Get video highlights error:', err);
    res.status(500).json({ error: 'Failed to fetch video highlights' });
  }
};

// Upload match photo (player only)
exports.addMatchPhoto = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'player') {
      return res.status(403).json({ error: 'Only players can upload match photos' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No photo file uploaded' });
    }

    const { description, matchDate, opponent } = req.body;
    const username = req.user.username;

    const photoData = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      description: description || '',
      matchDate: matchDate || new Date().toISOString().split('T')[0],
      opponent: opponent || '',
      uploadDate: new Date()
    };

    const player = await Player.addMatchPhoto(username, photoData);
    
    if (!player) {
      // Clean up uploaded file if player not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Player profile not found' });
    }

    res.json({ 
      message: 'Match photo uploaded successfully',
      photo: photoData
    });

    // Log activity after successful response
    await logActivity(
      req.user.id,
      'photo_uploaded',
      'Photo Uploaded',
      `Uploaded new match photo: ${description || 'Untitled'}`,
      player._id,
      req.user.club
    );

  } catch (err) {
    // Clean up uploaded file on error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Upload match photo error:', err);
    res.status(500).json({ error: 'Failed to upload match photo' });
  }
};

// Delete match photo (player only)
exports.deleteMatchPhoto = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'player') {
      return res.status(403).json({ error: 'Only players can delete their match photos' });
    }

    const { photoId } = req.params;
    const username = req.user.username;

    // First get the player to find the photo file
    const player = await Player.findByNameCaseInsensitive(username);
    if (!player) {
      return res.status(404).json({ error: 'Player profile not found' });
    }

    // Find the photo to get filename for deletion
    const photo = player.matchPhotos?.find(p => p._id.toString() === photoId);
    if (!photo) {
      return res.status(404).json({ error: 'Match photo not found' });
    }

    // Remove photo from database
    const updatedPlayer = await Player.removeMatchPhoto(username, photoId);
    
    // Delete physical file
    const filePath = path.join('public/uploads/match-photos/', photo.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ 
      message: 'Match photo deleted successfully',
      deletedPhoto: photo
    });

    // Log activity after successful response
    await logActivity(
      req.user.id,
      'photo_deleted',
      'Photo Deleted',
      `Removed match photo: ${photo.description || 'Untitled'}`,
      player._id,
      req.user.club
    );

  } catch (err) {
    console.error('Delete match photo error:', err);
    res.status(500).json({ error: 'Failed to delete match photo' });
  }
};

// Get match photos for a player
exports.getMatchPhotos = async (req, res) => {
  try {
    const { playerName } = req.params;
    
    const player = await Player.findByNameCaseInsensitive(playerName);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    res.json({
      playerName: player.name,
      matchPhotos: player.matchPhotos || []
    });

  } catch (err) {
    console.error('Get match photos error:', err);
    res.status(500).json({ error: 'Failed to fetch match photos' });
  }
};

// Add a note to a player (only scouts can add notes)
exports.addNote = async (req, res) => {
  try {
    const { playerName } = req.params;
    const { content } = req.body;
    const scoutUsername = req.user.username; // From JWT token

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Note content is required' });
    }

    const noteData = {
      content: content.trim(),
      addedBy: scoutUsername,
      timestamp: new Date()
    };

    const updatedPlayer = await Player.addNote(playerName, noteData);
    if (!updatedPlayer) {
      return res.status(404).json({ error: 'Player not found' });
    }

    res.json({ 
      message: 'Note added successfully',
      note: noteData
    });

    // Log activity after successful response
    await logActivity(
      req.user.id,
      'note_added',
      'Note Added',
      `Added note for ${updatedPlayer.name}`,
      updatedPlayer._id,
      req.user.club
    );

  } catch (err) {
    console.error('Add note error:', err);
    res.status(500).json({ error: 'Failed to add note' });
  }
};

// Remove a note from a player
exports.removeNote = async (req, res) => {
  try {
    const { playerName, noteId } = req.params;
    const scoutUsername = req.user.username; // From JWT token

    const player = await Player.findByNameCaseInsensitive(playerName);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Find the note to check ownership
    const note = player.notes.id(noteId);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Only the scout who added the note can remove it
    if (note.addedBy !== scoutUsername) {
      return res.status(403).json({ error: 'You can only delete your own notes' });
    }

    const updatedPlayer = await Player.removeNote(playerName, noteId);

    res.json({ 
      message: 'Note deleted successfully',
      deletedNote: note
    });

  } catch (err) {
    console.error('Remove note error:', err);
    res.status(500).json({ error: 'Failed to delete note' });
  }
};

// Get notes for a player
exports.getNotes = async (req, res) => {
  try {
    const { playerName } = req.params;
    
    const player = await Player.findByNameCaseInsensitive(playerName);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Sort notes by timestamp (newest first)
    const sortedNotes = (player.notes || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      playerName: player.name,
      notes: sortedNotes
    });

  } catch (err) {
    console.error('Get notes error:', err);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
};
