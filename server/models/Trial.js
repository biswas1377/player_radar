const mongoose = require('mongoose');

const trialSchema = new mongoose.Schema({
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  scout: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  club: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
trialSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Trial', trialSchema);
