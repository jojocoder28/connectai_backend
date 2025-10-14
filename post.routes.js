const express = require('express');
const router = express.Router();
const {
    createPost,
    getPostById,
    getPostsByUserId,
    getPostsByUsername,
    likePost,
    commentPost,
    sharePost,
    deletePost,
    getFeed
} = require('./post.controller');
const authMiddleware = require('./auth.middleware');
const upload = require('./upload.middleware');

router.post('/', authMiddleware, upload.single('media'), createPost);
router.get('/feed', authMiddleware, getFeed);
router.get('/:postId', getPostById);
router.get('/user/:userId', getPostsByUserId);
router.get('/user/username/:username', getPostsByUsername);
router.post('/like/:postId', authMiddleware, likePost);
router.post('/comment/:postId', authMiddleware, commentPost);
router.post('/share/:postId', authMiddleware, sharePost);
router.delete('/:postId', authMiddleware, deletePost);

module.exports = router;
