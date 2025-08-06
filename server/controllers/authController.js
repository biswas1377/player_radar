const User = require('../models/User');
const Player = require('../models/Player');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/profile-pictures/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

exports.uploadProfilePicture = upload.single('profilePicture');
exports.register = async (req, res) => {
  try {
    const { username, password, role, club, playerIDCode } = req.body;
    
    // Validation
    if (!username || !password || !role || !club) {
      return res.status(400).json({ 
        error: 'Missing Information',
        message: 'Please fill in all required fields: username, password, role, and club.',
        type: 'validation_error'
      });
    }
    
    // Check if user already exists (using Model method)
    const existing = await User.findByUsername(username);
    if (existing) {
      return res.status(409).json({ 
        error: 'Username Already Taken',
        message: 'This username is already registered. Please choose a different username or try logging in if this is your account.',
        type: 'duplicate_username'
      });
    }
    
    // If registering as player, validate player exists and connect (using Model method)
    if (role === 'player') {
      // Player ID is now required for player registration
      if (!playerIDCode) {
        return res.status(400).json({ 
          error: 'Player ID Required',
          message: 'Player ID is required for player registration. Please contact your scout to get your Player ID.',
          type: 'player_id_required'
        });
      }
      
      // Find player by Player ID
      const player = await Player.findByPlayerID(playerIDCode);
      if (!player) {
        return res.status(403).json({ 
          error: 'Invalid Player ID',
          message: `Player with ID ${playerIDCode} not found. Please check your Player ID or contact your scout.`,
          type: 'player_id_not_found'
        });
      }
      
      // Update player's club to match user's club
      player.club = club;
      await player.save();
    }
    
    // Create user (using Model method) - will automatically connect to player if role is 'player'
    await User.createUser({ username, password, role, club, playerIDCode });
    res.status(201).json({ 
      message: 'Registration Successful',
      details: role === 'player' ? 'Your account has been created and linked to your player profile.' : 'Your scout account has been created successfully.',
      type: 'success'
    });
    
  } catch (err) {
    console.error('Registration error:', err);
    if (err.message && err.message.includes('Player with ID')) {
      return res.status(403).json({ 
        error: 'Invalid Player ID',
        message: err.message,
        type: 'player_id_not_found'
      });
    }
    res.status(500).json({ 
      error: 'Registration Failed',
      message: 'Something went wrong during registration. Please try again later.',
      type: 'server_error'
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user (using Model method)
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(401).json({ 
        error: 'Login Failed',
        message: 'Username not found. Please check your username or register for a new account.',
        type: 'invalid_username'
      });
    }
    
    // Populate player data if user is a player
    let userWithPlayer = user;
    if (user.role === 'player' && user.playerId) {
      userWithPlayer = await User.getUserProfileWithPlayer(user._id);
    }
    
    console.log('🔍 Raw user from database:', {
      _id: user._id,
      username: user.username,
      role: user.role,
      profilePicture: user.profilePicture,
      playerId: user.playerId,
      playerData: userWithPlayer.playerId,
      hasProfilePicture: user.hasOwnProperty('profilePicture'),
      profilePictureType: typeof user.profilePicture
    });
    
    // Verify password (using Model method)
    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ 
        error: 'Login Failed',
        message: 'Incorrect password. Please check your password and try again.',
        type: 'invalid_password'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role, username: user.username, club: user.club }, 
      JWT_SECRET, 
      { expiresIn: '1d' }
    );
    
    res.json({ 
      token, 
      user: { 
        username: user.username, 
        role: user.role,
        club: user.club,
        profilePicture: user.profilePicture || null, // Ensure it's null if undefined
        playerId: user.playerId || null,
        playerData: userWithPlayer.playerId || null
      } 
    });
    
    console.log('🔍 Login response - user data:', {
      username: user.username,
      role: user.role,
      club: user.club,
      profilePicture: user.profilePicture || null,
      actualProfilePicture: user.profilePicture
    });
    
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      error: 'Login Failed',
      message: 'Something went wrong during login. Please try again later.',
      type: 'server_error'
    });
  }
};

exports.me = async (req, res) => {
  try {
    // Get user profile (using Model method)
    const user = await User.getUserProfile(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    console.log('🔍 /api/auth/me response - user profile:', {
      username: user.username,
      role: user.role,
      profilePicture: user.profilePicture
    });
    res.json({ user });
  } catch (err) {
    console.error('Failed to get user profile:', err);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
};

exports.logout = (req, res) => {
  // For JWT, logout is handled on the client by deleting the token
  res.json({ message: 'Logged out' });
};

exports.updateProfilePicture = async (req, res) => {
  try {
    console.log('Profile picture upload request received');
    console.log('User:', req.user);
    console.log('File:', req.file);
    
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const profilePictureUrl = `/uploads/profile-pictures/${req.file.filename}`;
    console.log('Generated profile picture URL:', profilePictureUrl);
    
    // Update user profile picture (using Model method)
    const user = await User.updateUserProfilePicture(req.user.id, profilePictureUrl);
    
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('🔍 Updated user after profile picture upload:', {
      _id: user._id,
      username: user.username,
      role: user.role,
      profilePicture: user.profilePicture
    });

    // If user is a player, also update the Player document (using Model method)
    if (user.role === 'player') {
      await Player.updatePlayerProfilePicture(user.username, profilePictureUrl);
      console.log('Updated player profile picture');
    }

    console.log('Profile picture upload successful');
    res.json({ 
      message: 'Profile picture updated successfully',
      profilePicture: profilePictureUrl 
    });
    
  } catch (err) {
    console.error('Profile picture update error:', err);
    res.status(500).json({ error: 'Failed to update profile picture' });
  }
};

// Temporary fix endpoint to ensure user has profile picture field
exports.fixUserProfilePicture = async (req, res) => {
  try {
    console.log('🔧 Fix user profile picture called for user:', req.user);
    
    // Get the most recent profile picture from uploads
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = 'public/uploads/profile-pictures/';
    
    // Check if user already has a profile picture set
    const currentUser = await User.getUserProfile(req.user.id);
    console.log('🔧 Current user profile:', currentUser);
    
    if (currentUser && currentUser.profilePicture) {
      return res.json({ 
        message: 'User already has profile picture set',
        profilePicture: currentUser.profilePicture 
      });
    }
    
    // Try to find any profile pictures for this user
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      const profilePictures = files.filter(file => file.startsWith('profile-'));
      
      if (profilePictures.length > 0) {
        // Use the most recent profile picture
        const mostRecent = profilePictures.sort().pop();
        const profilePictureUrl = `/uploads/profile-pictures/${mostRecent}`;
        
        // Update user with this profile picture
        const updatedUser = await User.updateUserProfilePicture(req.user.id, profilePictureUrl);
        
        console.log('🔧 Fixed user profile picture:', {
          userId: req.user.id,
          profilePicture: profilePictureUrl,
          updatedUser: updatedUser
        });
        
        return res.json({ 
          message: 'Profile picture fixed successfully',
          profilePicture: profilePictureUrl 
        });
      }
    }
    
    res.json({ message: 'No profile pictures found to assign' });
    
  } catch (err) {
    console.error('Fix profile picture error:', err);
    res.status(500).json({ error: 'Failed to fix profile picture' });
  }
};

// Connect existing users to their player profiles
exports.connectUserToPlayer = async (req, res) => {
  try {
    console.log('🔗 Connect user to player called for user:', req.user);
    
    const user = await User.getUserProfile(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.role !== 'player') {
      return res.status(400).json({ error: 'Only players can be connected to player profiles' });
    }
    
    if (user.playerId) {
      return res.json({ 
        message: 'User already connected to player profile',
        playerData: user.playerId 
      });
    }
    
    // Find player by username
    const player = await Player.findByNameCaseInsensitive(user.username);
    if (!player) {
      return res.status(404).json({ error: 'No player profile found with matching name' });
    }
    
    // Connect user to player
    const updatedUser = await User.connectPlayerToUser(user._id, player._id);
    
    console.log('🔗 Connected user to player:', {
      userId: user._id,
      playerId: player._id,
      playerName: player.name
    });
    
    res.json({ 
      message: 'User successfully connected to player profile',
      playerData: updatedUser.playerId 
    });
    
  } catch (err) {
    console.error('Connect user to player error:', err);
    res.status(500).json({ error: 'Failed to connect user to player' });
  }
};
