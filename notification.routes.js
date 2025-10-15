
const express = require('express');
const router = express.Router();
const { getNotifications } = require('./notification.controller');
const authMiddleware = require('./auth.middleware');

router.get('/', authMiddleware, getNotifications);

module.exports = router;
