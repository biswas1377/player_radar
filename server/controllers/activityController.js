const Activity = require('../models/Activity');
const User = require('../models/User');

// Create a new activity
exports.createActivity = async (req, res) => {
  try {
    const { type, title, description, targetPlayer } = req.body;
    
    const activity = new Activity({
      type,
      title,
      description,
      user: req.user.id,
      userRole: req.user.role,
      targetPlayer,
      club: req.user.club
    });

    await activity.save();
    await activity.populate('user', 'username');
    
    res.status(201).json(activity);
  } catch (err) {
    console.error('❌ Create activity error:', err);
    res.status(500).json({ error: 'Failed to create activity' });
  }
};

// Get activities for the current user
exports.getUserActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const userRole = req.user.role;
    
    let query = {};
    
    if (userRole === 'player') {
      // Players see their own activities and scout activities related to them
      const Player = require('../models/Player');
      const player = await Player.findOne({ name: { $regex: `^${req.user.username}$`, $options: 'i' } });
      
      if (player) {
        query = {
          $or: [
            { user: req.user.id }, // User's own activities
            { targetPlayer: player._id, userRole: 'scout' } // Scout activities about this player
          ]
        };
      } else {
        query = { user: req.user.id }; // Only user's own activities if no player profile found
      }
    } else if (userRole === 'scout') {
      // Scouts see only their own activities
      query = { user: req.user.id };
    }

    const activities = await Activity.find(query)
      .populate('user', 'username')
      .populate('targetPlayer', 'name')
      .sort({ timestamp: -1 })
      .limit(limit);

    res.json(activities);
  } catch (err) {
    console.error('❌ Get activities error:', err);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
};

// Get recent activities for dashboard
exports.getRecentActivities = async (req, res) => {
  try {
    console.log('🔍 getRecentActivities called - User:', req.user?.username, 'Role:', req.user?.role);
    
    const userRole = req.user.role;
    const limit = 5; // Show last 5 activities
    
    let query = {};
    
    if (userRole === 'player') {
      // Players see their own activities (excluding notes and trials which have dedicated sections)
      query = { 
        user: req.user.id,
        type: { $nin: ['note_added', 'trial_scheduled'] }
      };
      console.log('📋 Player query:', query);
    } else if (userRole === 'scout') {
      // Scouts see only their own activities (including trial scheduling)
      query = { 
        user: req.user.id, 
        type: { $nin: ['note_added'] } 
      };
      console.log('📋 Scout query:', query);
    }

    const activities = await Activity.find(query)
      .populate('user', 'username')
      .populate('targetPlayer', 'name')
      .sort({ timestamp: -1 })
      .limit(limit);

    console.log('📋 Found activities:', activities.length);
    activities.forEach(activity => {
      console.log(`  - ${activity.title}: ${activity.description} (by ${activity.user?.username})`);
    });

    res.json(activities);
  } catch (err) {
    console.error('❌ Get recent activities error:', err);
    res.status(500).json({ error: 'Failed to fetch recent activities' });
  }
};

// Helper function to create activity (can be called from other controllers)
exports.logActivity = async (userId, type, title, description, targetPlayer = null, club = null) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const activity = new Activity({
      type,
      title,
      description,
      user: userId,
      userRole: user.role,
      targetPlayer,
      club: club || user.club
    });

    await activity.save();
    return activity;
  } catch (err) {
    console.error('❌ Log activity error:', err);
  }
};
