const Player = require('../models/Player');

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
    
  } catch (err) {
    console.error('updatePlayer error:', err);
    res.status(500).json({ error: 'Failed to update player' });
  }
};

// Get all players
exports.getPlayers = async (req, res) => {
  try {
    let players;
    
    // If user is a scout, show only players they personally added + legacy system players
    if (req.user && req.user.role === 'scout') {
      // Check if scout has club information
      if (!req.user.club) {
        console.log('❌ Scout missing club information:', req.user);
        return res.status(400).json({ error: 'User club information missing. Please log out and log back in.' });
      }
      
      // Get players added by this scout OR legacy system players from their club
      players = await Player.find({ 
        $or: [
          { addedBy: req.user.username },
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
    
    const { name, dob, country, nationality, height, weight, foot, position, club } = req.body;
    
    // Validation
    if (!name || !position || !club) {
      console.log('❌ Validation failed - missing fields:', { name, position, club });
      return res.status(400).json({ error: 'Name, position, and club are required' });
    }
    
    // Prepare player data with scout information
    const playerData = {
      name,
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
    
    // Also remove the player reference from any associated user and delete player accounts
    const User = require('../models/User');
    
    // Use the model method to delete associated user accounts
    const userDeletionResult = await User.deleteUsersByPlayer(id, deletedPlayer.name);
    console.log('🗑️ User deletion result:', userDeletionResult);
    
    console.log('✅ Player deleted successfully:', deletedPlayer.name);
    res.json({ 
      message: 'Player deleted successfully', 
      player: deletedPlayer,
      deletedUserAccounts: userDeletionResult.totalDeleted
    });
    
  } catch (err) {
    console.error('Delete player error:', err);
    res.status(500).json({ error: 'Failed to delete player' });
  }
};
