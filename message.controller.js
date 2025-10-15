// 📂 message.controller.js

const { ObjectId } = require('mongodb');
const { Database } = require('./database');
const { databaseConfiguration } = require('./config');

// Use correct database config key (same as in user.controller.js)
const { databaseName } = databaseConfiguration;

// Get the singleton connection
const connection = Database.connection;
const database = connection.db(databaseName);

// Collections
const messagesCollection = database.collection('messages');
const conversationsCollection = database.collection('conversations');

/**
 * 📩 Send a new message in a conversation
 * Body: { conversationId, content }
 */
const sendMessage = async (req, res) => {
    try {
        const senderId = req.user.userId;
        const { conversationId, content } = req.body;

        if (!conversationId || !content) {
            return res.status(400).send('conversationId and content are required');
        }

        const conversation = await conversationsCollection.findOne({
            _id: new ObjectId(conversationId)
        });

        if (!conversation) {
            return res.status(404).send('Conversation not found');
        }

        // Create a message document
        const newMessage = {
            conversationId: new ObjectId(conversationId),
            senderId: new ObjectId(senderId),
            content,
            createdAt: new Date()
        };

        const result = await messagesCollection.insertOne(newMessage);

        // Update conversation with last message and timestamp
        await conversationsCollection.updateOne(
            { _id: new ObjectId(conversationId) },
            {
                $set: {
                    lastMessage: content,
                    updatedAt: new Date()
                },
                $addToSet: { participants: new ObjectId(senderId) }
            }
        );

        res.status(201).send({
            message: 'Message sent successfully',
            messageData: { _id: result.insertedId, ...newMessage }
        });
    } catch (error) {
        console.error('Send Message Error:', error);
        res.status(500).send(error.message);
    }
};

/**
 * 💬 Get all messages of a conversation
 * Params: conversationId
 */
const getMessages = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { conversationId } = req.params;

        const conversation = await conversationsCollection.findOne({
            _id: new ObjectId(conversationId),
            participants: { $in: [new ObjectId(userId)] }
        });

        if (!conversation) {
            return res.status(403).send('Access denied or conversation not found');
        }

        const messages = await messagesCollection
            .find({ conversationId: new ObjectId(conversationId) })
            .sort({ createdAt: 1 })
            .toArray();

        res.status(200).send(messages);
    } catch (error) {
        console.error('Get Messages Error:', error);
        res.status(500).send(error.message);
    }
};

/**
 * 🗑️ Delete a message (only by sender)
 * Params: messageId
 */
const deleteMessage = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { messageId } = req.params;

        const message = await messagesCollection.findOne({
            _id: new ObjectId(messageId)
        });

        if (!message) {
            return res.status(404).send('Message not found');
        }

        if (message.senderId.toString() !== userId) {
            return res.status(403).send('You can only delete your own messages');
        }

        await messagesCollection.deleteOne({ _id: new ObjectId(messageId) });
        res.status(200).send('Message deleted successfully');
    } catch (error) {
        console.error('Delete Message Error:', error);
        res.status(500).send(error.message);
    }
};

module.exports = {
    sendMessage,
    getMessages,
    deleteMessage
};
