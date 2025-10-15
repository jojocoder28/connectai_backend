// 📂 conversation.controller.js

const { ObjectId } = require('mongodb');
const { Database } = require('./database');
const { databaseConfiguration } = require('./config');

// ✅ Use consistent database config key
const { databaseName } = databaseConfiguration;

// ✅ Get the singleton database connection (same as other controllers)
const connection = Database.connection;
const database = connection.db(databaseName);
const conversationsCollection = database.collection('conversations');

/**
 * 🆕 Create a new conversation
 * Body: { participants: [userId1, userId2, ...] }
 */
const createConversation = async (req, res) => {
    try {
        const { participants } = req.body;

        if (!participants || !Array.isArray(participants) || participants.length < 2) {
            return res.status(400).send('At least two participants are required to create a conversation');
        }

        // Convert all IDs to ObjectId
        const participantIds = participants.map(id => new ObjectId(id));

        // Check if conversation between same participants already exists
        const existingConversation = await conversationsCollection.findOne({
            participants: { $all: participantIds, $size: participantIds.length }
        });

        if (existingConversation) {
            return res.status(200).send({
                message: 'Conversation already exists',
                conversation: existingConversation
            });
        }

        // Create new conversation
        const newConversation = {
            participants: participantIds,
            lastMessage: null,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await conversationsCollection.insertOne(newConversation);

        res.status(201).send({
            message: 'Conversation created successfully',
            conversation: { _id: result.insertedId, ...newConversation }
        });
    } catch (error) {
        console.error('Error creating conversation:', error);
        res.status(500).send(error.message);
    }
};

/**
 * 💬 Get all conversations for a specific user
 * Params: userId
 */
const getConversations = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!ObjectId.isValid(userId)) {
            return res.status(400).send('Invalid userId');
        }

        const conversations = await conversationsCollection
            .find({ participants: { $in: [new ObjectId(userId)] } })
            .sort({ updatedAt: -1 })
            .toArray();

        res.status(200).send(conversations);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).send(error.message);
    }
};

module.exports = {
    createConversation,
    getConversations
};
