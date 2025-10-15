const { ObjectId } = require('mongodb');
const { Database } = require('./database');
const { databaseConfiguration } = require('./config');

const { databaseName } = databaseConfiguration;

// ✅ Use shared database connection
const connection = Database.connection;
if (!connection) {
  console.error("❌ Database connection not initialized. Call Database.connectToDatabase() first.");
}

const db = connection.db(databaseName);
const notificationsCollection = db.collection('notifications');
const usersCollection = db.collection('users');

/**
 * 📨 Create a new notification
 * Types: 'friend_request', 'follow', 'message'
 * Body: { recipientId, type }
 * Auth Required: Yes
 */
const createNotification = async (req, res) => {
  try {
    const senderId = req.user?.userId;
    const { recipientId, type } = req.body;

    if (!senderId || !recipientId || !type) {
      return res.status(400).send("senderId, recipientId, and type are required");
    }

    if (!ObjectId.isValid(senderId) || !ObjectId.isValid(recipientId)) {
      return res.status(400).send("Invalid sender or recipient ID format");
    }

    const newNotification = {
      sender: new ObjectId(senderId),
      recipient: new ObjectId(recipientId),
      type,
      status: 'pending',
      createdAt: new Date(),
    };

    const result = await notificationsCollection.insertOne(newNotification);

    res.status(201).send({
      message: "✅ Notification created successfully",
      notificationData: { _id: result.insertedId, ...newNotification },
    });
  } catch (error) {
    console.error("❌ Create Notification Error:", error);
    res.status(500).send(error.message);
  }
};

/**
 * 🔔 Get all pending notifications for a user
 * Auth Required: Yes
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId || !ObjectId.isValid(userId)) {
      return res.status(400).send("Invalid user ID format");
    }

    const notifications = await notificationsCollection.aggregate([
      { $match: { recipient: new ObjectId(userId), status: 'pending' } },
      {
        $lookup: {
          from: 'users',
          localField: 'sender',
          foreignField: '_id',
          as: 'senderInfo',
        },
      },
      { $unwind: '$senderInfo' },
      {
        $project: {
          _id: 1,
          type: 1,
          status: 1,
          createdAt: 1,
          sender: {
            _id: '$senderInfo._id',
            name: '$senderInfo.name',
            email: '$senderInfo.email',
            username: '$senderInfo.username',
          },
        },
      },
    ]).toArray();

    res.status(200).send(notifications);
  } catch (error) {
    console.error("❌ Get Notifications Error:", error);
    res.status(500).send(error.message);
  }
};

/**
 * ✅ Update notification status (read / accepted / rejected)
 * Params: notificationId
 * Body: { status: 'read' | 'accepted' | 'rejected' }
 */
const updateNotificationStatus = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { status } = req.body;

    if (!ObjectId.isValid(notificationId)) {
      return res.status(400).send("Invalid notification ID");
    }

    if (!['read', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).send("Invalid status type");
    }

    const result = await notificationsCollection.updateOne(
      { _id: new ObjectId(notificationId) },
      { $set: { status, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send("Notification not found");
    }

    res.status(200).send(`✅ Notification marked as '${status}'`);
  } catch (error) {
    console.error("❌ Update Notification Error:", error);
    res.status(500).send(error.message);
  }
};

/**
 * 🗑️ Delete a notification
 * Params: notificationId
 */
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!ObjectId.isValid(notificationId)) {
      return res.status(400).send("Invalid notification ID format");
    }

    const result = await notificationsCollection.deleteOne({
      _id: new ObjectId(notificationId),
    });

    if (result.deletedCount === 0) {
      return res.status(404).send("Notification not found");
    }

    res.status(200).send("🗑️ Notification deleted successfully");
  } catch (error) {
    console.error("❌ Delete Notification Error:", error);
    res.status(500).send(error.message);
  }
};

module.exports = {
  createNotification,
  getNotifications,
  updateNotificationStatus,
  deleteNotification,
};
