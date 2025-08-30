const express = require('express');
const router = express.Router();
const trialController = require('../controllers/trialController');
const auth = require('../middleware/auth');

// Schedule a new trial (Scout only)
router.post('/schedule', auth, trialController.scheduleTrial);

// Get trials for a specific player
router.get('/player/:playerId', auth, trialController.getPlayerTrials);

// Get current user's trials (for players)
router.get('/my-trials', auth, trialController.getPlayerTrials);

// Get all trials scheduled by the current scout
router.get('/scout', auth, trialController.getScoutTrials);

// Get upcoming trials for notifications/dashboard
router.get('/upcoming', auth, trialController.getUpcomingTrials);

// Get upcoming trials for notifications/dashboard (NEW VERSION)
router.get('/upcoming-new', auth, trialController.getUpcomingTrialsNew);

// Debug route to see all trials (temporary)
router.get('/debug', auth, async (req, res) => {
  try {
    const trials = await require('../models/Trial').find({})
      .populate('scout', 'username club')
      .populate('player', 'name position')
      .sort({ createdAt: -1 });
    
    console.log('🔍 DEBUG: All trials in database:', trials.length);
    trials.forEach(trial => {
      console.log('🔍 Trial:', {
        id: trial._id,
        playerName: trial.player?.name,
        playerId: trial.player?._id,
        scoutUsername: trial.scout?.username,
        date: trial.date,
        status: trial.status
      });
    });
    
    res.json({ trials, count: trials.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update trial status
router.put('/:trialId/status', auth, trialController.updateTrialStatus);

// Delete trial
router.delete('/:trialId', auth, trialController.deleteTrial);

module.exports = router;
