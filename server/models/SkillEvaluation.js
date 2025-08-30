const mongoose = require('mongoose');

// Define skill categories and their subcategories
const skillCategories = {
  physical: {
    name: 'Physical',
    subcategories: {
      speed: { name: 'Speed', description: 'Pace and acceleration' },
      stamina: { name: 'Stamina', description: 'Endurance and fitness level' },
      strength: { name: 'Strength', description: 'Physical power and body strength' },
      agility: { name: 'Agility', description: 'Balance and coordination' },
      jumping: { name: 'Jumping', description: 'Aerial ability and heading power' }
    }
  },
  technical: {
    name: 'Technical',
    subcategories: {
      ballControl: { name: 'Ball Control', description: 'First touch and ball handling' },
      passing: { name: 'Passing', description: 'Short and long passing accuracy' },
      shooting: { name: 'Shooting', description: 'Finishing and shot power' },
      dribbling: { name: 'Dribbling', description: 'Close control and skills' },
      crossing: { name: 'Crossing', description: 'Delivery from wide areas' },
      freekicks: { name: 'Free Kicks', description: 'Set piece taking ability' }
    }
  },
  tactical: {
    name: 'Tactical',
    subcategories: {
      positioning: { name: 'Positioning', description: 'Spatial awareness and movement' },
      gameReading: { name: 'Game Reading', description: 'Understanding of the game flow' },
      decisionMaking: { name: 'Decision Making', description: 'Choice of actions under pressure' },
      teamwork: { name: 'Teamwork', description: 'Collaboration with teammates' },
      workRate: { name: 'Work Rate', description: 'Defensive contribution and effort' }
    }
  },
  mental: {
    name: 'Mental',
    subcategories: {
      concentration: { name: 'Concentration', description: 'Focus during matches' },
      composure: { name: 'Composure', description: 'Calmness under pressure' },
      determination: { name: 'Determination', description: 'Will to win and fight' },
      leadership: { name: 'Leadership', description: 'Ability to influence and guide team' },
      consistency: { name: 'Consistency', description: 'Reliability of performance' }
    }
  }
};

// Individual skill rating schema
const skillRatingSchema = new mongoose.Schema({
  category: { 
    type: String, 
    required: true,
    enum: Object.keys(skillCategories)
  },
  subcategory: { 
    type: String, 
    required: true 
  },
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 10 
  },
  notes: { 
    type: String, 
    default: '' 
  }
});

// Main skill evaluation schema
const skillEvaluationSchema = new mongoose.Schema({
  playerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Player', 
    required: true 
  },
  playerName: { 
    type: String, 
    required: true 
  },
  evaluatedBy: { 
    type: String, 
    required: true 
  }, // Scout username
  evaluationDate: { 
    type: Date, 
    default: Date.now 
  },
  matchContext: {
    opponent: { type: String, default: '' },
    matchDate: { type: String, default: '' },
    competition: { type: String, default: '' },
    playerPosition: { type: String, default: '' }
  },
  skillRatings: [skillRatingSchema],
  overallRating: { 
    type: Number, 
    min: 1, 
    max: 10 
  },
  generalNotes: { 
    type: String, 
    default: '' 
  },
  strengths: [{ 
    type: String 
  }],
  areasForImprovement: [{ 
    type: String 
  }],
  recommendation: {
    type: String,
    enum: ['highly_recommend', 'recommend', 'consider', 'not_recommend'],
    default: 'consider'
  }
});

// Calculate overall rating before saving
skillEvaluationSchema.pre('save', function(next) {
  if (this.skillRatings && this.skillRatings.length > 0) {
    const totalRating = this.skillRatings.reduce((sum, skill) => sum + skill.rating, 0);
    this.overallRating = Math.round((totalRating / this.skillRatings.length) * 10) / 10;
  }
  next();
});

// Static methods for skill evaluations
skillEvaluationSchema.statics.getSkillCategories = function() {
  return skillCategories;
};

skillEvaluationSchema.statics.createEvaluation = async function(evaluationData) {
  const evaluation = new this(evaluationData);
  return await evaluation.save();
};

skillEvaluationSchema.statics.getPlayerEvaluations = async function(playerId) {
  return await this.find({ playerId }).sort({ evaluationDate: -1 });
};

skillEvaluationSchema.statics.getEvaluationsByScout = async function(scoutUsername) {
  return await this.find({ evaluatedBy: scoutUsername }).sort({ evaluationDate: -1 });
};

skillEvaluationSchema.statics.getLatestEvaluation = async function(playerId) {
  return await this.findOne({ playerId }).sort({ evaluationDate: -1 });
};

skillEvaluationSchema.statics.getAverageRatings = async function(playerId) {
  const evaluations = await this.find({ playerId });
  
  if (evaluations.length === 0) return null;
  
  const categoryAverages = {};
  const subcategoryAverages = {};
  
  // Initialize averages object
  Object.keys(skillCategories).forEach(category => {
    categoryAverages[category] = { total: 0, count: 0 };
    Object.keys(skillCategories[category].subcategories).forEach(subcategory => {
      subcategoryAverages[`${category}.${subcategory}`] = { total: 0, count: 0 };
    });
  });
  
  // Calculate sums
  evaluations.forEach(evaluation => {
    evaluation.skillRatings.forEach(rating => {
      const key = `${rating.category}.${rating.subcategory}`;
      if (subcategoryAverages[key]) {
        subcategoryAverages[key].total += rating.rating;
        subcategoryAverages[key].count += 1;
        
        categoryAverages[rating.category].total += rating.rating;
        categoryAverages[rating.category].count += 1;
      }
    });
  });
  
  // Calculate averages
  const result = {
    categories: {},
    subcategories: {},
    overallAverage: 0,
    totalEvaluations: evaluations.length
  };
  
  let overallTotal = 0;
  let overallCount = 0;
  
  Object.keys(categoryAverages).forEach(category => {
    if (categoryAverages[category].count > 0) {
      result.categories[category] = Math.round((categoryAverages[category].total / categoryAverages[category].count) * 10) / 10;
      overallTotal += categoryAverages[category].total;
      overallCount += categoryAverages[category].count;
    }
  });
  
  Object.keys(subcategoryAverages).forEach(key => {
    if (subcategoryAverages[key].count > 0) {
      result.subcategories[key] = Math.round((subcategoryAverages[key].total / subcategoryAverages[key].count) * 10) / 10;
    }
  });
  
  if (overallCount > 0) {
    result.overallAverage = Math.round((overallTotal / overallCount) * 10) / 10;
  }
  
  return result;
};

skillEvaluationSchema.statics.deleteEvaluation = async function(evaluationId) {
  return await this.findByIdAndDelete(evaluationId);
};

module.exports = mongoose.model('SkillEvaluation', skillEvaluationSchema);
