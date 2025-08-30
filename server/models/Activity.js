const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['player_added', 'trial_scheduled', 'profile_updated', 'video_uploaded', 'photo_uploaded', 'note_added', 'player_deleted', 'video_deleted', 'photo_deleted']
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userRole: {
    type: String,
    required: true,
    enum: ['player', 'scout']
  },
  targetPlayer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: false // Not all activities are player-specific
  },
  club: {
    type: String,
    required: false // For club-specific filtering
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying
activitySchema.index({ user: 1, timestamp: -1 });
activitySchema.index({ club: 1, timestamp: -1 });
activitySchema.index({ userRole: 1, timestamp: -1 });

module.exports = mongoose.model('Activity', activitySchema);
