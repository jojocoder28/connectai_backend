const express = require('express');
const router = express.Router();
const multer = require('multer');
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
    getNotifications,
    searchUsersByName
} = require('./user.controller');
const authMiddleware = require('./auth.middleware');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', authMiddleware, getUserProfile);
router.get('/search', authMiddleware, searchUsersByName);
router.get('/:id', authMiddleware, getUserById);
router.get('/username/:username', authMiddleware, getUserByUsername);
router.put('/profile', authMiddleware, upload.single('avatar'), updateUserProfile);
router.post('/follow/:followId', authMiddleware, followUser);
router.post('/unfollow/:unfollowId', authMiddleware, unfollowUser);
router.put('/mood', authMiddleware, setUserMood);
router.post('/friend-request/:userId', authMiddleware, sendFriendRequest);
router.put('/friend-request/:userId', authMiddleware, respondToFriendRequest);
router.get('/notifications', authMiddleware, getNotifications);

module.exports = router;