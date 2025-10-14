// 📂 message.controller.js

const { ObjectId } = require('mongodb');
const { Database } = require('./database');
const { databaseName } = require('./config');

// Ensure we are using the same singleton connection
const connection = Database.connection;

// If connection hasn’t been established yet, handle gracefully
if (!connection) {
  console.error("❌ Database connection not initialized. Make sure Database.connectToDatabase() is called before using this controller.");
}

const db = connection.db(databaseName);
const messagesCollection = db.collection('messages');
const conversationsCollection = db.collection('conversations');

/**
 * 📩 Send a new message in a conversation
 * Request Body: { conversationId, content }
 * Auth Required: Yes (req.user.userId)
 */
const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.userId;
    const { conversationId, content } = req.body;

    if (!conversationId || !content) {
      return res.status(400).send("conversationId and content are required");
    }

    // Check if conversation exists
    const conversation = await conversationsCollection.findOne({
      _id: new ObjectId(conversationId)
    });

    if (!conversation) {
      return res.status(404).send("Conversation not found");
    }

    // Create message document
    const newMessage = {
      conversationId: new ObjectId(conversationId),
      senderId: new ObjectId(senderId),
      content,
      createdAt: new Date(),
    };

    // Insert into messages collection
    const result = await messagesCollection.insertOne(newMessage);

    // Update conversation's last message and timestamp
    await conversationsCollection.updateOne(
      { _id: new ObjectId(conversationId) },
      {
        $set: { lastMessage: content, updatedAt: new Date() },
        $addToSet: { participants: new ObjectId(senderId) },
      }
    );

    res.status(201).send({
      message: "Message sent successfully",
      messageData: { _id: result.insertedId, ...newMessage }
    });
  } catch (error) {
    console.error("Send Message Error:", error);
    res.status(500).send(error.message);
  }
};

/**
 * 💬 Get all messages in a conversation
 * Params: conversationId
 * Auth Required: Yes
 */
const getMessages = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { conversationId } = req.params;

    // Check if conversation exists and user is a participant
    const conversation = await conversationsCollection.findOne({
      _id: new ObjectId(conversationId),
      participants: { $in: [new ObjectId(userId)] },
    });

    if (!conversation) {
      return res.status(403).send("Access denied or conversation not found");
    }

    // Fetch messages sorted by createdAt
    const messages = await messagesCollection
      .find({ conversationId: new ObjectId(conversationId) })
      .sort({ createdAt: 1 })
      .toArray();

    res.status(200).send(messages);
  } catch (error) {
    console.error("Get Messages Error:", error);
    res.status(500).send(error.message);
  }
};

/**
 * 🗑️ Delete a message (optional, only by sender)
 */
const deleteMessage = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { messageId } = req.params;

    const message = await messagesCollection.findOne({
      _id: new ObjectId(messageId),
    });

    if (!message) {
      return res.status(404).send("Message not found");
    }

    if (message.senderId.toString() !== userId) {
      return res.status(403).send("You can only delete your own messages");
    }

    await messagesCollection.deleteOne({ _id: new ObjectId(messageId) });
    res.status(200).send("Message deleted successfully");
  } catch (error) {
    console.error("Delete Message Error:", error);
    res.status(500).send(error.message);
  }
};

module.exports = {
  sendMessage,
  getMessages,
  deleteMessage
};
