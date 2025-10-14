
const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    getUserProfile,
    getUserById,
    getUserByUsername,
    updateUserProfile,
    followUser,
    unfollowUser,
    setUserMood,
    sendFriendRequest,
    respondToFriendRequest,
    getNotifications
} = require('./user.controller');
const authMiddleware = require('./auth.middleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', authMiddleware, getUserProfile);
router.get('/:id', authMiddleware, getUserById);
router.get('/username/:username', authMiddleware, getUserByUsername);
router.put('/profile', authMiddleware, updateUserProfile);
router.post('/follow/:followId', authMiddleware, followUser);
router.post('/unfollow/:unfollowId', authMiddleware, unfollowUser);
router.put('/mood', authMiddleware, setUserMood);
router.post('/friend-request/:userId', authMiddleware, sendFriendRequest);
router.put('/friend-request/:userId', authMiddleware, respondToFriendRequest);
router.get('/notifications', authMiddleware, getNotifications);

module.exports = router;
