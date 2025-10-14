const { Database } = require('./database');
const { databaseName } = require('./config');

/**
 * Create a new conversation
 */
exports.createConversation = async (req, res) => {
    try {
        const { participants } = req.body;

        const dbClient = await Database.connectToDatabase(process.env.MONGO_URI || '');
        const db = dbClient.db(databaseName);
        const conversationsCollection = db.collection('conversations');

        const result = await conversationsCollection.insertOne({
            participants,
            createdAt: new Date()
        });

        res.status(201).json({ message: 'Conversation created successfully', conversation: result.ops?.[0] || result });
    } catch (error) {
        console.error('Error creating conversation:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get all conversations for a specific user
 */
exports.getConversations = async (req, res) => {
    try {
        const { userId } = req.params;

        const dbClient = await Database.connectToDatabase(process.env.MONGO_URI || '');
        const db = dbClient.db(databaseName);
        const conversationsCollection = db.collection('conversations');

        const conversations = await conversationsCollection.find({
            participants: userId
        }).toArray();

        res.status(200).json(conversations);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: error.message });
    }
};
