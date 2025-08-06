const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Register
router.post('/register', authController.register);
// Login
router.post('/login', authController.login);
// Get current user
router.get('/me', auth, authController.me);
// Update profile picture
router.post('/profile-picture', auth, authController.uploadProfilePicture, authController.updateProfilePicture);
// Fix profile picture (temporary endpoint)
router.post('/fix-profile-picture', auth, authController.fixUserProfilePicture);
// Connect user to player profile
router.post('/connect-player', auth, authController.connectUserToPlayer);
// Logout (client-side for JWT)
router.post('/logout', auth, authController.logout);

module.exports = router;
