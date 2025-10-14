const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversation.controller');

router.post('/', conversationController.createConversation);
router.get('/:userId', conversationController.getConversations);

module.exports = router;