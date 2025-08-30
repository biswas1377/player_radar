const Trial = require('../models/Trial');
const Player = require('../models/Player');
const User = require('../models/User');
const { logActivity } = require('./activityController');

// Schedule a new trial (Scout only)
exports.scheduleTrial = async (req, res) => {
  try {
    const { playerId, date, time, location, description } = req.body;
    
    // Verify the user is a scout
    if (req.user.role !== 'scout') {
      return res.status(403).json({ message: 'Only scouts can schedule trials' });
    }

    // Check if player exists
    const player = await Player.findById(playerId);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    // Get scout's club information
    const scout = await User.findById(req.user.id);
    if (!scout) {
      return res.status(404).json({ message: 'Scout not found' });
    }

    // Create new trial
    const trial = new Trial({
      player: playerId,
      scout: req.user.id,
      club: scout.club,
      date: new Date(date),
      time,
      location,
      description: description || ''
    });

    await trial.save();

    console.log('🔍 Trial saved successfully:', {
      trialId: trial._id,
      playerId: trial.player,
      scoutId: trial.scout,
      date: trial.date,
      status: trial.status
    });

    // Populate the trial with scout and player details
    const populatedTrial = await Trial.findById(trial._id)
      .populate('scout', 'username club')
      .populate('player', 'name position');

    console.log('🔍 Populated trial details:', {
      trialId: populatedTrial._id,
      playerName: populatedTrial.player?.name,
      scoutUsername: populatedTrial.scout?.username
    });

    res.status(201).json({
      message: 'Trial scheduled successfully',
      trial: populatedTrial
    });

    // Log activity after successful response
    await logActivity(
      req.user.id,
      'trial_scheduled',
      'Trial Scheduled',
      `Scheduled trial for ${populatedTrial.player?.name}`,
      populatedTrial.player?._id,
      scout.club
    );
  } catch (error) {
    console.error('Error scheduling trial:', error);
    res.status(500).json({ message: 'Error scheduling trial', error: error.message });
  }
};

// Get trials for a specific player (Player view)
exports.getPlayerTrials = async (req, res) => {
  try {
    const { playerId } = req.params;
    
    console.log('🔍 getPlayerTrials called - User role:', req.user.role, 'User username:', req.user.username, 'PlayerId param:', playerId);
    
    // Verify the user is the player or a scout
    if (req.user.role === 'player') {
      // For players, find their player profile by username (name field in Player model)
      const player = await Player.findByNameCaseInsensitive(req.user.username);
      console.log('🔍 Player found by username:', player ? player._id : 'not found');
      
      if (!player) {
        return res.status(404).json({ message: 'Player profile not found' });
      }
      
      // If playerId is provided, check if it matches the player's ID
      if (playerId && player._id.toString() !== playerId) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Use the player's actual ID for the query
      const trials = await Trial.find({ player: player._id })
        .populate('scout', 'username club')
        .populate('player', 'name position')
        .sort({ date: 1 });

      console.log('🔍 Trials found for player (getPlayerTrials):', trials.length);
      if (trials.length > 0) {
        console.log('🔍 First trial details:', {
          id: trials[0]._id,
          date: trials[0].date,
          status: trials[0].status,
          scout: trials[0].scout?.username
        });
      }
      return res.json({ trials });
    } else if (req.user.role === 'scout') {
      // Scouts can view any player's trials if playerId is provided
      if (!playerId) {
        return res.status(400).json({ message: 'Player ID required for scouts' });
      }
      
      const trials = await Trial.find({ player: playerId })
        .populate('scout', 'username club')
        .populate('player', 'name position')
        .sort({ date: 1 });

      return res.json({ trials });
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }
  } catch (error) {
    console.error('Error fetching player trials:', error);
    res.status(500).json({ message: 'Error fetching trials', error: error.message });
  }
};

// Get all trials scheduled by a scout (Scout view)
exports.getScoutTrials = async (req, res) => {
  try {
    // Verify the user is a scout
    if (req.user.role !== 'scout') {
      return res.status(403).json({ message: 'Only scouts can view their scheduled trials' });
    }

    const trials = await Trial.find({ scout: req.user.id })
      .populate('scout', 'username club')
      .populate('player', 'name position')
      .sort({ date: 1 });

    // Filter out trials with null players (deleted players)
    const validTrials = trials.filter(trial => trial.player !== null);
    
    console.log('🔍 Scout trials - Total found:', trials.length, 'Valid trials (with player):', validTrials.length);
    
    // Log invalid trials for debugging
    const invalidTrials = trials.filter(trial => trial.player === null);
    if (invalidTrials.length > 0) {
      console.log('⚠️ Found trials with deleted players:', invalidTrials.map(t => ({
        trialId: t._id,
        date: t.date,
        status: t.status
      })));
    }

    res.json({ trials: validTrials });
  } catch (error) {
    console.error('Error fetching scout trials:', error);
    res.status(500).json({ message: 'Error fetching trials', error: error.message });
  }
};

// Get upcoming trials for notifications (Player dashboard) - NEW VERSION TO BYPASS CACHE
exports.getUpcomingTrialsNew = async (req, res) => {
  try {
    console.log('🆕 NEW FUNCTION - getUpcomingTrialsNew called - User role:', req.user.role, 'User username:', req.user.username);
    let trials = [];
    
    if (req.user.role === 'player') {
      // Get player's trials using username (name field in Player model)
      const player = await Player.findByNameCaseInsensitive(req.user.username);
      console.log('🆕 Player found by username:', player ? player._id : 'not found');
      
      if (player) {
        // Get ALL trials for this player first
        trials = await Trial.find({
          player: player._id
        })
        .populate('scout', 'username club')
        .populate('player', 'name position')
        .sort({ date: 1 });
        
        // Filter out trials with null players (shouldn't happen for player's own trials, but safety check)
        trials = trials.filter(trial => trial.player !== null);
        
        console.log('🆕 ALL trials found for player (before date filter):', trials.length);
        
        // Filter for upcoming trials in JavaScript instead of MongoDB
        const currentTime = new Date();
        console.log('🆕 Current time for comparison:', currentTime);
        
        trials = trials.filter(trial => {
          const trialDate = new Date(trial.date);
          const isUpcoming = trialDate >= currentTime;
          console.log('🆕 Trial date check:', {
            trialId: trial._id,
            trialDate: trialDate,
            now: currentTime,
            isUpcoming: isUpcoming
          });
          return isUpcoming;
        });

        console.log('🆕 Found upcoming trials for player:', trials.length);
      }
    } else if (req.user.role === 'scout') {
      // Get scout's scheduled trials
      const now = new Date();
      const upcoming = new Date();
      upcoming.setDate(now.getDate() + 7); // Next 7 days
      
      trials = await Trial.find({
        scout: req.user.id,
        date: { $gte: now, $lte: upcoming },
        status: { $in: ['scheduled', 'confirmed'] }
      })
      .populate('player', 'name position')
      .populate('scout', 'username club')
      .sort({ date: 1 });
      
      // Filter out trials with null players (deleted players)
      const validTrials = trials.filter(trial => trial.player !== null);
      console.log('🆕 Scout trials - Total found:', trials.length, 'Valid trials:', validTrials.length);
      trials = validTrials;
    }

    res.json({ trials });
  } catch (error) {
    console.error('Error fetching upcoming trials (new function):', error);
    res.status(500).json({ message: 'Error fetching trials', error: error.message });
  }
};

// Get upcoming trials for notifications (Player dashboard)
exports.getUpcomingTrials = async (req, res) => {
  try {
    console.log('🔍🔍🔍 NEW DEBUG VERSION - getUpcomingTrials called - User role:', req.user.role, 'User username:', req.user.username);
    let trials = [];
    
    if (req.user.role === 'player') {
      // Get player's trials using username (name field in Player model)
      const player = await Player.findByNameCaseInsensitive(req.user.username);
      console.log('🔍 Player found by username:', player ? player._id : 'not found');
      console.log('🔍 Player found details:', player ? { id: player._id, name: player.name } : 'none');
      
      if (player) {
        // First, let's check all trials for this player to debug
        const allTrials = await Trial.find({ player: player._id })
          .populate('scout', 'username club')
          .sort({ date: 1 });
        
        console.log('🔍 All trials for player (debug):', allTrials.length);
        allTrials.forEach(trial => {
          console.log('🔍 Trial debug:', {
            id: trial._id,
            date: trial.date,
            status: trial.status,
            scout: trial.scout?.username,
            player: trial.player
          });
        });
        
        // Get all upcoming trials (not just next 7 days for debugging)
        const now = new Date();
        console.log('🔍 Current date for comparison:', now);
        
        trials = await Trial.find({
          player: player._id
          // Removed date filter to get all trials first
        })
        .populate('scout', 'username club')
        .sort({ date: 1 });
        
        console.log('🔍 ALL trials found for player (before date filter):', trials.length);
        
        // Filter for upcoming trials in JavaScript instead of MongoDB
        const currentTime = new Date();
        trials = trials.filter(trial => {
          const trialDate = new Date(trial.date);
          const isUpcoming = trialDate >= currentTime;
          console.log('🔍 Trial date check:', {
            trialId: trial._id,
            trialDate: trialDate,
            now: currentTime,
            isUpcoming: isUpcoming
          });
          return isUpcoming;
        });
        
        console.log('🔍 Found trials for player:', trials.length);
        if (trials.length > 0) {
          trials.forEach(trial => {
            console.log('🔍 Upcoming trial:', {
              id: trial._id,
              date: trial.date,
              status: trial.status,
              scout: trial.scout?.username,
              dateIsInFuture: trial.date >= now
            });
          });
        }
      }
    } else if (req.user.role === 'scout') {
      // Get scout's scheduled trials
      const now = new Date();
      const upcoming = new Date();
      upcoming.setDate(now.getDate() + 30); // Next 30 days instead of 7
      
      trials = await Trial.find({
        scout: req.user.id,
        date: { $gte: now, $lte: upcoming },
        status: { $in: ['scheduled', 'confirmed'] }
      })
      .populate('player', 'name position club')
      .populate('scout', 'username club')
      .sort({ date: 1 });
      
      // Filter out trials with null players (deleted players)
      const validTrials = trials.filter(trial => trial.player !== null);
      
      console.log('🔍 Found trials for scout:', trials.length);
      console.log('🔍 Valid trials (with player):', validTrials.length);
      console.log('🔍 Scout trials details:', validTrials.map(t => ({
        id: t._id,
        playerName: t.player?.name,
        scoutName: t.scout?.username,
        date: t.date
      })));
      
      trials = validTrials;
    }

    res.json({ trials });
  } catch (error) {
    console.error('Error fetching upcoming trials:', error);
    res.status(500).json({ message: 'Error fetching upcoming trials', error: error.message });
  }
};

// Update trial status
exports.updateTrialStatus = async (req, res) => {
  try {
    const { trialId } = req.params;
    const { status } = req.body;

    const trial = await Trial.findById(trialId);
    if (!trial) {
      return res.status(404).json({ message: 'Trial not found' });
    }

    // Check permissions
    if (req.user.role === 'scout' && trial.scout.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    trial.status = status;
    await trial.save();

    const updatedTrial = await Trial.findById(trialId)
      .populate('scout', 'username club')
      .populate('player', 'name position');

    res.json({
      message: 'Trial status updated successfully',
      trial: updatedTrial
    });

    // Log activity for trial status updates
    const statusText = status.charAt(0).toUpperCase() + status.slice(1);
    await logActivity(
      req.user.id,
      'trial_updated',
      `Trial ${statusText}`,
      `${statusText} trial for ${updatedTrial.player?.name}`,
      updatedTrial.player?._id,
      req.user.club
    );
  } catch (error) {
    console.error('Error updating trial status:', error);
    res.status(500).json({ message: 'Error updating trial status', error: error.message });
  }
};

// Delete trial
exports.deleteTrial = async (req, res) => {
  try {
    const { trialId } = req.params;

    const trial = await Trial.findById(trialId);
    if (!trial) {
      return res.status(404).json({ message: 'Trial not found' });
    }

    // Only the scout who scheduled the trial can delete it
    if (req.user.role !== 'scout' || trial.scout.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get trial details before deletion for activity logging
    const trialWithDetails = await Trial.findById(trialId)
      .populate('player', 'name')
      .populate('scout', 'club');

    await Trial.findByIdAndDelete(trialId);

    res.json({ message: 'Trial deleted successfully' });

    // Log activity for trial deletion
    await logActivity(
      req.user.id,
      'trial_deleted',
      'Trial Deleted',
      `Deleted trial for ${trialWithDetails.player?.name}`,
      trialWithDetails.player?._id,
      trialWithDetails.scout?.club
    );
  } catch (error) {
    console.error('Error deleting trial:', error);
    res.status(500).json({ message: 'Error deleting trial', error: error.message });
  }
};
