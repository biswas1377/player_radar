const mongoose = require('mongoose');

// Function to generate unique player ID
function generatePlayerID() {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = 'PL';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  playerID: { type: String, unique: true, default: generatePlayerID }, // Unique player identifier
  dob: { type: String }, // date of birth as string (can be improved)
  country: { type: String },
  height: { type: Number },
  weight: { type: Number },
  foot: { type: String },
  position: { type: String, required: true },
  club: { type: String, required: true }, // Club association
  addedBy: { type: String, required: true }, // Username of scout who added this player
  profilePicture: { type: String, default: null } // URL or file path to profile picture
});

// Model methods (handle all database operations)
playerSchema.statics.findByNameCaseInsensitive = async function(name) {
  return await this.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
};

playerSchema.statics.findByPlayerID = async function(playerID) {
  return await this.findOne({ playerID: playerID });
};

playerSchema.statics.updatePlayerName = async function(oldName, newName) {
  const player = await this.findByNameCaseInsensitive(oldName);
  if (player && player.name !== newName) {
    player.name = newName;
    return await player.save();
  }
  return player;
};

playerSchema.statics.updatePlayerProfilePicture = async function(username, profilePictureUrl) {
  return await this.findOneAndUpdate(
    { name: { $regex: `^${username}$`, $options: 'i' } },
    { profilePicture: profilePictureUrl }
  );
};

playerSchema.statics.getAllPlayers = async function() {
  return await this.find();
};

playerSchema.statics.getPlayersByClub = async function(club) {
  return await this.find({ club: club });
};

playerSchema.statics.updatePlayerByUsername = async function(username, updateFields) {
  return await this.findOneAndUpdate(
    { name: { $regex: `^${username}$`, $options: 'i' } },
    { $set: updateFields },
    { new: true }
  );
};

playerSchema.statics.createPlayer = async function(playerData) {
  const player = new this(playerData);
  return await player.save();
};

playerSchema.statics.deletePlayerById = async function(playerId) {
  return await this.findByIdAndDelete(playerId);
};

module.exports = mongoose.model('Player', playerSchema);
