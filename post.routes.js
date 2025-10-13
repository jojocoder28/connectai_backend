
const express = require('express');
const router = express.Router();
const {
    createPost,
    getPostById,
    likePost,
    commentPost,
    sharePost,
    deletePost
} = require('./post.controller');
const authMiddleware = require('./auth.middleware');

router.post('/', authMiddleware, createPost);
router.get('/:postId', getPostById);
router.post('/like/:postId', authMiddleware, likePost);
router.post('/comment/:postId', authMiddleware, commentPost);
router.post('/share/:postId', authMiddleware, sharePost);
router.delete('/:postId', authMiddleware, deletePost);

module.exports = router;
