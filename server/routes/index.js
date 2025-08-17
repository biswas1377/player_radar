
var express = require('express');
var router = express.Router();
const playerController = require('../controllers/playerController');
const auth = require('../middleware/auth');

// GET home page
router.get('/', function(req, res, next) {
  res.send('Express backend is running!');
});

// PATCH route for player to update their own profile (MUST be before GET /api/players)
router.patch('/api/players/:name', auth, playerController.updatePlayer);

// Video highlights routes (MUST be before general /api/players routes)
router.post('/api/players/video-highlights', auth, playerController.uploadVideoHighlight, playerController.addVideoHighlight);
router.delete('/api/players/video-highlights/:videoId', auth, playerController.deleteVideoHighlight);
router.get('/api/players/:playerName/video-highlights', playerController.getVideoHighlights);

// Match photos routes (MUST be before general /api/players routes)
router.post('/api/players/match-photos', (req, res, next) => {
  console.log('📷 Match photo upload route hit');
  next();
}, auth, playerController.uploadMatchPhoto, playerController.addMatchPhoto);
router.delete('/api/players/match-photos/:photoId', auth, playerController.deleteMatchPhoto);
router.get('/api/players/:playerName/match-photos', (req, res, next) => {
  console.log('📷 Match photos GET route hit for player:', req.params.playerName);
  next();
}, playerController.getMatchPhotos);

// Notes routes (MUST be before general /api/players routes)
router.post('/api/players/:playerName/notes', auth, playerController.addNote);
router.delete('/api/players/:playerName/notes/:noteId', auth, playerController.removeNote);
router.get('/api/players/:playerName/notes', playerController.getNotes);

// Add logging middleware to see what requests are being made
router.use('/api/players*', (req, res, next) => {
  console.log(`🔍 Request: ${req.method} ${req.originalUrl} - Params:`, req.params);
  next();
});

// API route to add a new player (scout only)
router.post('/api/players', auth, playerController.addPlayer);

// API route to delete a player (scout only)
router.delete('/api/players/:id', auth, playerController.deletePlayer);

// API route to get all players from MongoDB (with optional auth for status)
router.get('/api/players', (req, res, next) => {
  // Try to authenticate but don't fail if no token
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    auth(req, res, next);
  } else {
    next();
  }
}, playerController.getPlayers);

// DEBUG: List all players and their names
router.get('/api/debug/players', async (req, res) => {
  const Player = require('../models/Player');
  const players = await Player.find({}, { name: 1, foot: 1, _id: 0 });
  res.json(players);
});

module.exports = router;
