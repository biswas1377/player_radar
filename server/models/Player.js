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
  email: { type: String, required: true }, // Player's email address for notifications
  dob: { type: String }, // date of birth as string (can be improved)
  country: { type: String },
  height: { type: Number },
  weight: { type: Number },
  foot: { type: String },
  position: { type: String, required: true },
  club: { type: String, required: true }, // Club association
  addedBy: { type: String, required: true }, // Username of scout who added this player
  profilePicture: { type: String, default: null }, // URL or file path to profile picture
  videoHighlights: [{ 
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    uploadDate: { type: Date, default: Date.now },
    description: { type: String, default: '' }
  }], // Array of video highlights
  matchPhotos: [{ 
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    uploadDate: { type: Date, default: Date.now },
    description: { type: String, default: '' },
    matchDate: { type: String, default: '' },
    opponent: { type: String, default: '' }
  }], // Array of match photos
  notes: [{
    content: { type: String, required: true },
    addedBy: { type: String, required: true }, // Scout username who added the note
    timestamp: { type: Date, default: Date.now }
  }] // Array of notes from scouts
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

playerSchema.statics.addVideoHighlight = async function(username, videoData) {
  return await this.findOneAndUpdate(
    { name: { $regex: `^${username}$`, $options: 'i' } },
    { $push: { videoHighlights: videoData } },
    { new: true }
  );
};

playerSchema.statics.removeVideoHighlight = async function(username, videoId) {
  return await this.findOneAndUpdate(
    { name: { $regex: `^${username}$`, $options: 'i' } },
    { $pull: { videoHighlights: { _id: videoId } } },
    { new: true }
  );
};

playerSchema.statics.addMatchPhoto = async function(username, photoData) {
  return await this.findOneAndUpdate(
    { name: { $regex: `^${username}$`, $options: 'i' } },
    { $push: { matchPhotos: photoData } },
    { new: true }
  );
};

playerSchema.statics.removeMatchPhoto = async function(username, photoId) {
  return await this.findOneAndUpdate(
    { name: { $regex: `^${username}$`, $options: 'i' } },
    { $pull: { matchPhotos: { _id: photoId } } },
    { new: true }
  );
};

playerSchema.statics.addNote = async function(username, noteData) {
  return await this.findOneAndUpdate(
    { name: { $regex: `^${username}$`, $options: 'i' } },
    { $push: { notes: noteData } },
    { new: true }
  );
};

playerSchema.statics.removeNote = async function(username, noteId) {
  return await this.findOneAndUpdate(
    { name: { $regex: `^${username}$`, $options: 'i' } },
    { $pull: { notes: { _id: noteId } } },
    { new: true }
  );
};

module.exports = mongoose.model('Player', playerSchema);
