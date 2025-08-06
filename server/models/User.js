const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['scout', 'player'], required: true },
  club: { type: String, required: true }, // Club association
  profilePicture: { type: String, default: null }, // URL or file path to profile picture
  playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', default: null }, // Reference to Player document
  playerIDCode: { type: String, default: null } // Store the unique player ID for reference
});

// Model methods (handle all database operations)
userSchema.statics.findByUsername = async function(username) {
  return await this.findOne({ username });
};

userSchema.statics.createUser = async function(userData) {
  const { username, password, role, club, playerIDCode } = userData;
  const hash = await bcrypt.hash(password, 10);
  const user = new this({ username, password: hash, role, club });
  
  // If user is a player, handle player record connection
  if (role === 'player') {
    const Player = mongoose.model('Player');
    
    // Player ID is now required for player registration
    if (!playerIDCode) {
      throw new Error('Player ID is required for player registration');
    }
    
    // Find player by Player ID
    const player = await Player.findByPlayerID(playerIDCode);
    if (!player) {
      throw new Error(`Player with ID ${playerIDCode} not found`);
    }
    
    user.playerId = player._id;
    user.playerIDCode = playerIDCode;
    // Update player's club to match user's club
    player.club = club;
    await player.save();
    console.log(`✅ Player found by ID ${playerIDCode} and linked to user ${username}`);
  }
  
  return await user.save();
};

userSchema.statics.updateUserProfilePicture = async function(userId, profilePictureUrl) {
  return await this.findByIdAndUpdate(
    userId,
    { profilePicture: profilePictureUrl },
    { new: true }
  );
};

userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.statics.getUserProfile = async function(userId) {
  return await this.findById(userId).select('-password').populate('playerId');
};

userSchema.statics.getUserProfileWithPlayer = async function(userId) {
  return await this.findById(userId).select('-password').populate('playerId');
};

userSchema.statics.connectPlayerToUser = async function(userId, playerId) {
  return await this.findByIdAndUpdate(
    userId,
    { playerId: playerId },
    { new: true }
  ).populate('playerId');
};

userSchema.statics.deleteUsersByPlayer = async function(playerId, playerName) {
  // Delete users linked by playerId
  const result1 = await this.deleteMany({ playerId: playerId });
  
  // Delete users with matching player name (case insensitive) and role 'player'
  const result2 = await this.deleteMany({ 
    username: { $regex: `^${playerName}$`, $options: 'i' },
    role: 'player'
  });
  
  return {
    deletedByPlayerId: result1.deletedCount,
    deletedByPlayerName: result2.deletedCount,
    totalDeleted: result1.deletedCount + result2.deletedCount
  };
};

module.exports = mongoose.model('User', userSchema);
