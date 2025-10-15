
const { ObjectId } = require('mongodb');
const { Database } = require('./database');
const { databaseConfiguration } = require('./config');

const { databaseName } = databaseConfiguration;
const notificationCollectionName = 'notifications';
const usersCollectionName = 'users';

const getNotifications = async (req, res) => {
    try {
        const userId = req.user.userId;
        const db = Database.connection.db(databaseName);
        const notificationsCollection = db.collection(notificationCollectionName);

        const notifications = await notificationsCollection.aggregate([
            { $match: { recipient: new ObjectId(userId), status: 'pending' } },
            {
                $lookup: {
                    from: usersCollectionName,
                    localField: 'sender',
                    foreignField: '_id',
                    as: 'senderInfo'
                }
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
                        email: '$senderInfo.email'
                    }
                }
            }
        ]).toArray();

        res.status(200).send(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).send(error.message);
    }
};

module.exports = { getNotifications };
