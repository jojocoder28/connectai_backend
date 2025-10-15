
const express = require('express');
const router = express.Router();
const {
    createNotification,
    getNotifications,
    updateNotificationStatus,
    deleteNotification
  } = require('./notification.controller');
  const authMiddleware = require('./auth.middleware');
  
  router.post('/', authMiddleware, createNotification);
  router.get('/', authMiddleware, getNotifications);
  router.put('/:notificationId', authMiddleware, updateNotificationStatus);
  router.delete('/:notificationId', authMiddleware, deleteNotification);

module.exports = router;
