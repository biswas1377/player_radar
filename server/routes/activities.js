const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const auth = require('../middleware/auth');

// Create activity
router.post('/', auth, activityController.createActivity);

// Get user activities
router.get('/user', auth, activityController.getUserActivities);

// Get recent activities for dashboard
router.get('/recent', auth, activityController.getRecentActivities);

module.exports = router;
