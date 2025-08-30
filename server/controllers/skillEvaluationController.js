const SkillEvaluation = require('../models/SkillEvaluation');
const Player = require('../models/Player');
const { logActivity } = require('./activityController');

// Get skill categories and subcategories
exports.getSkillCategories = async (req, res) => {
  try {
    console.log('🎯 Getting skill categories');
    const categories = SkillEvaluation.getSkillCategories();
    res.json(categories);
  } catch (err) {
    console.error('❌ Get skill categories error:', err);
    res.status(500).json({ error: 'Failed to get skill categories' });
  }
};

// Create a new skill evaluation
exports.createSkillEvaluation = async (req, res) => {
  try {
    console.log('🎯 Create skill evaluation request - User:', req.user);
    console.log('🎯 Evaluation data:', req.body);
    
    if (!req.user || req.user.role !== 'scout') {
      return res.status(403).json({ error: 'Only scouts can create skill evaluations' });
    }
    
    const { 
      playerId, 
      playerName,
      matchContext, 
      skillRatings, 
      generalNotes, 
      strengths, 
      areasForImprovement, 
      recommendation 
    } = req.body;
    
    // Validate required fields
    if (!playerId || !playerName || !skillRatings || skillRatings.length === 0) {
      return res.status(400).json({ 
        error: 'Player ID, player name, and skill ratings are required' 
      });
    }
    
    // Validate skill ratings
    const validCategories = Object.keys(SkillEvaluation.getSkillCategories());
    for (const rating of skillRatings) {
      if (!validCategories.includes(rating.category)) {
        return res.status(400).json({ 
          error: `Invalid skill category: ${rating.category}` 
        });
      }
      if (rating.rating < 1 || rating.rating > 10) {
        return res.status(400).json({ 
          error: 'Skill ratings must be between 1 and 10' 
        });
      }
    }
    
    // Check if player exists
    const player = await Player.findById(playerId);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    const evaluationData = {
      playerId,
      playerName,
      evaluatedBy: req.user.username,
      matchContext: matchContext || {},
      skillRatings,
      generalNotes: generalNotes || '',
      strengths: strengths || [],
      areasForImprovement: areasForImprovement || [],
      recommendation: recommendation || 'consider'
    };
    
    const evaluation = await SkillEvaluation.createEvaluation(evaluationData);
    
    console.log('🎯 Created skill evaluation:', evaluation._id);
    
    // Log activity
    await logActivity(
      req.user.id,
      'skill_evaluation',
      'Skill Evaluation',
      `Evaluated skills for ${playerName} (Overall: ${evaluation.overallRating}/10)`,
      player._id,
      req.user.club
    );
    
    res.status(201).json(evaluation);
  } catch (err) {
    console.error('❌ Create skill evaluation error:', err);
    res.status(500).json({ error: 'Failed to create skill evaluation' });
  }
};

// Get all evaluations for a specific player
exports.getPlayerEvaluations = async (req, res) => {
  try {
    const { playerId } = req.params;
    console.log('🎯 Getting evaluations for player:', playerId);
    
    const evaluations = await SkillEvaluation.getPlayerEvaluations(playerId);
    res.json(evaluations);
  } catch (err) {
    console.error('❌ Get player evaluations error:', err);
    res.status(500).json({ error: 'Failed to get player evaluations' });
  }
};

// Get average ratings for a player
exports.getPlayerAverageRatings = async (req, res) => {
  try {
    const { playerId } = req.params;
    console.log('🎯 Getting average ratings for player:', playerId);
    
    const averages = await SkillEvaluation.getAverageRatings(playerId);
    
    if (!averages) {
      return res.json({ 
        message: 'No evaluations found for this player',
        categories: {},
        subcategories: {},
        overallAverage: 0,
        totalEvaluations: 0
      });
    }
    
    res.json(averages);
  } catch (err) {
    console.error('❌ Get player average ratings error:', err);
    res.status(500).json({ error: 'Failed to get player average ratings' });
  }
};

// Get evaluations by scout
exports.getScoutEvaluations = async (req, res) => {
  try {
    console.log('🎯 Getting evaluations by scout:', req.user.username);
    
    if (!req.user || req.user.role !== 'scout') {
      return res.status(403).json({ error: 'Only scouts can access their evaluations' });
    }
    
    const evaluations = await SkillEvaluation.getEvaluationsByScout(req.user.username);
    res.json(evaluations);
  } catch (err) {
    console.error('❌ Get scout evaluations error:', err);
    res.status(500).json({ error: 'Failed to get scout evaluations' });
  }
};

// Get latest evaluation for a player
exports.getLatestPlayerEvaluation = async (req, res) => {
  try {
    const { playerId } = req.params;
    console.log('🎯 Getting latest evaluation for player:', playerId);
    
    const evaluation = await SkillEvaluation.getLatestEvaluation(playerId);
    
    if (!evaluation) {
      return res.status(404).json({ message: 'No evaluations found for this player' });
    }
    
    res.json(evaluation);
  } catch (err) {
    console.error('❌ Get latest player evaluation error:', err);
    res.status(500).json({ error: 'Failed to get latest player evaluation' });
  }
};

// Update a skill evaluation
exports.updateSkillEvaluation = async (req, res) => {
  try {
    const { evaluationId } = req.params;
    console.log('🎯 Update skill evaluation:', evaluationId, 'User:', req.user.username);
    
    if (!req.user || req.user.role !== 'scout') {
      return res.status(403).json({ error: 'Only scouts can update skill evaluations' });
    }
    
    const evaluation = await SkillEvaluation.findById(evaluationId);
    if (!evaluation) {
      return res.status(404).json({ error: 'Skill evaluation not found' });
    }
    
    // Only allow scout who created the evaluation to update it
    if (evaluation.evaluatedBy !== req.user.username) {
      return res.status(403).json({ error: 'You can only update your own evaluations' });
    }
    
    const updateData = req.body;
    
    // Validate skill ratings if provided
    if (updateData.skillRatings) {
      const validCategories = Object.keys(SkillEvaluation.getSkillCategories());
      for (const rating of updateData.skillRatings) {
        if (!validCategories.includes(rating.category)) {
          return res.status(400).json({ 
            error: `Invalid skill category: ${rating.category}` 
          });
        }
        if (rating.rating < 1 || rating.rating > 10) {
          return res.status(400).json({ 
            error: 'Skill ratings must be between 1 and 10' 
          });
        }
      }
    }
    
    const updatedEvaluation = await SkillEvaluation.findByIdAndUpdate(
      evaluationId,
      updateData,
      { new: true, runValidators: true }
    );
    
    console.log('🎯 Updated skill evaluation successfully');
    
    // Log activity
    await logActivity(
      req.user.id,
      'skill_evaluation_updated',
      'Skill Evaluation Updated',
      `Updated skill evaluation for ${updatedEvaluation.playerName}`,
      updatedEvaluation.playerId,
      req.user.club
    );
    
    res.json(updatedEvaluation);
  } catch (err) {
    console.error('❌ Update skill evaluation error:', err);
    res.status(500).json({ error: 'Failed to update skill evaluation' });
  }
};

// Delete a skill evaluation
exports.deleteSkillEvaluation = async (req, res) => {
  try {
    const { evaluationId } = req.params;
    console.log('🗑️ Delete skill evaluation:', evaluationId, 'User:', req.user.username);
    
    if (!req.user || req.user.role !== 'scout') {
      return res.status(403).json({ error: 'Only scouts can delete skill evaluations' });
    }
    
    const evaluation = await SkillEvaluation.findById(evaluationId);
    if (!evaluation) {
      return res.status(404).json({ error: 'Skill evaluation not found' });
    }
    
    // Only allow scout who created the evaluation to delete it
    if (evaluation.evaluatedBy !== req.user.username) {
      return res.status(403).json({ error: 'You can only delete your own evaluations' });
    }
    
    await SkillEvaluation.deleteEvaluation(evaluationId);
    
    console.log('🗑️ Deleted skill evaluation successfully');
    
    // Log activity
    await logActivity(
      req.user.id,
      'skill_evaluation_deleted',
      'Skill Evaluation Deleted',
      `Deleted skill evaluation for ${evaluation.playerName}`,
      evaluation.playerId,
      req.user.club
    );
    
    res.json({ message: 'Skill evaluation deleted successfully' });
  } catch (err) {
    console.error('❌ Delete skill evaluation error:', err);
    res.status(500).json({ error: 'Failed to delete skill evaluation' });
  }
};

// Get skill evaluation statistics
exports.getSkillEvaluationStats = async (req, res) => {
  try {
    console.log('📊 Getting skill evaluation statistics');
    
    const totalEvaluations = await SkillEvaluation.countDocuments();
    const evaluationsByScout = await SkillEvaluation.aggregate([
      { $group: { _id: '$evaluatedBy', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const averageOverallRating = await SkillEvaluation.aggregate([
      { $group: { _id: null, average: { $avg: '$overallRating' } } }
    ]);
    
    const recommendationStats = await SkillEvaluation.aggregate([
      { $group: { _id: '$recommendation', count: { $sum: 1 } } }
    ]);
    
    const stats = {
      totalEvaluations,
      evaluationsByScout,
      averageOverallRating: averageOverallRating[0]?.average || 0,
      recommendationStats
    };
    
    res.json(stats);
  } catch (err) {
    console.error('❌ Get skill evaluation stats error:', err);
    res.status(500).json({ error: 'Failed to get skill evaluation statistics' });
  }
};

// Get skill categories structure for frontend
exports.getSkillCategories = async (req, res) => {
  try {
    // Return the skill categories structure for the frontend
    const skillCategories = {
      physical: {
        name: 'Physical',
        subcategories: {
          speed: { name: 'Speed', description: 'Pace and acceleration over short distances' },
          stamina: { name: 'Stamina', description: 'Endurance and ability to maintain performance' },
          strength: { name: 'Strength', description: 'Physical power in challenges and possession' },
          agility: { name: 'Agility', description: 'Quickness and nimbleness in movement' },
          jumping: { name: 'Jumping', description: 'Aerial ability and heading power' }
        }
      },
      technical: {
        name: 'Technical',
        subcategories: {
          ballControl: { name: 'Ball Control', description: 'First touch and ball manipulation skills' },
          passing: { name: 'Passing', description: 'Short and long passing accuracy and vision' },
          shooting: { name: 'Shooting', description: 'Finishing ability and shot power' },
          dribbling: { name: 'Dribbling', description: 'Close control and beating opponents' },
          crossing: { name: 'Crossing', description: 'Delivery from wide positions' },
          freekicks: { name: 'Free Kicks', description: 'Set piece delivery and accuracy' }
        }
      },
      tactical: {
        name: 'Tactical',
        subcategories: {
          positioning: { name: 'Positioning', description: 'Reading the game and positioning' },
          gameReading: { name: 'Game Reading', description: 'Understanding tactical situations' },
          decisionMaking: { name: 'Decision Making', description: 'Choosing the right option under pressure' },
          teamwork: { name: 'Teamwork', description: 'Communication and working with teammates' },
          workRate: { name: 'Work Rate', description: 'Defensive contribution and pressing' }
        }
      },
      mental: {
        name: 'Mental',
        subcategories: {
          concentration: { name: 'Concentration', description: 'Focus and attention throughout the match' },
          composure: { name: 'Composure', description: 'Calmness under pressure' },
          determination: { name: 'Determination', description: 'Fighting spirit and resilience' },
          leadership: { name: 'Leadership', description: 'Influence on teammates and game management' },
          consistency: { name: 'Consistency', description: 'Reliability in performance levels' }
        }
      }
    };

    res.json(skillCategories);
  } catch (error) {
    console.error('Error fetching skill categories:', error);
    res.status(500).json({ error: 'Failed to fetch skill categories' });
  }
};
