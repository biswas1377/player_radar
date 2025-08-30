const express = require('express');
const router = express.Router();
const skillEvaluationController = require('../controllers/skillEvaluationController');
const auth = require('../middleware/auth');

// Get skill categories and subcategories (no auth required)
router.get('/categories', skillEvaluationController.getSkillCategories);

// Create a new skill evaluation (scout only)
router.post('/', auth, skillEvaluationController.createSkillEvaluation);

// Get all evaluations for a specific player
router.get('/player/:playerId', skillEvaluationController.getPlayerEvaluations);

// Get average ratings for a player
router.get('/player/:playerId/averages', skillEvaluationController.getPlayerAverageRatings);

// Get latest evaluation for a player
router.get('/player/:playerId/latest', skillEvaluationController.getLatestPlayerEvaluation);

// Get evaluations by current scout
router.get('/my-evaluations', auth, skillEvaluationController.getScoutEvaluations);

// Update a skill evaluation (scout only, own evaluations)
router.put('/:evaluationId', auth, skillEvaluationController.updateSkillEvaluation);

// Delete a skill evaluation (scout only, own evaluations)
router.delete('/:evaluationId', auth, skillEvaluationController.deleteSkillEvaluation);

// Get skill evaluation statistics
router.get('/stats', skillEvaluationController.getSkillEvaluationStats);

module.exports = router;
