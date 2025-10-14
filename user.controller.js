
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

const { Database } = require('./database');
const { databaseConfiguration, cloudinaryConfig } = require('./config');
const { JWT_SECRET } = require('./config');

cloudinary.config(cloudinaryConfig);

const { databaseName, collectionName } = databaseConfiguration;
const connection = Database.connection;
const database = connection.db(databaseName);
const collection = database.collection(collectionName);

const registerUser = async (req, res) => {
    try {
        const { name, email, password, dob, gender, username } = req.body;

        const existingUser = await collection.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).send('User with that email or username already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            name,
            username,
            email,
            password: hashedPassword,
            dob: new Date(dob),
            gender,
            followers: [],
            following: [],
            friends: [],
            friendRequests: []
        };

        const result = await collection.insertOne(newUser);
        const token = jwt.sign({ userId: result.insertedId }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).send({ token });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await collection.findOne({ email });
        if (!user) {
            return res.status(404).send('User not found');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).send('Invalid password');
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
        const userProfile = {
            _id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            dob: user.dob,
            gender: user.gender,
            followers: user.followers,
            following: user.following,
            friends: user.friends
        };

        if (user.avatar) {
            userProfile.avatar = user.avatar;
        }

        res.status(200).send({ token, profile: userProfile });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const getUserProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await collection.findOne({ _id: new ObjectId(userId) });

        if (!user) {
            return res.status(404).send('User not found');
        }

        res.status(200).send(user);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const getUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await collection.findOne({ _id: new ObjectId(userId) });

        if (!user) {
            return res.status(404).send('User not found');
        }

        res.status(200).send(user);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const getUserByUsername = async (req, res) => {
    try {
        const username = req.params.username;
        const user = await collection.findOne({ username });

        if (!user) {
            return res.status(404).send('User not found');
        }

        res.status(200).send(user);
    } catch (error) {
        res.status(500).send(error.message);
    }
};


const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, bio, interests } = req.body;
        const updatedFields = {};
        if (name) updatedFields.name = name;
        if (bio) updatedFields.bio = bio;
        if (interests) updatedFields.interests = interests;

        const updateUser = async (fields) => {
            const result = await collection.updateOne(
                { _id: new ObjectId(userId) },
                { $set: fields }
            );
            if (result.matchedCount === 0) {
                return res.status(404).send('User not found');
            }
            res.status(200).send('User profile updated successfully');
        };

        if (req.file) {
            const uploadStream = cloudinary.uploader.upload_stream(
                { folder: 'avatars' },
                (error, result) => {
                    if (error) {
                        return res.status(500).send('Error uploading to Cloudinary');
                    }
                    updatedFields.avatar = result.secure_url;
                    updateUser(updatedFields);
                }
            );
            streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
        } else {
            updateUser(updatedFields);
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const followUser = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { followId } = req.params;

        await collection.updateOne(
            { _id: new ObjectId(userId) },
            { $addToSet: { following: new ObjectId(followId) } }
        );

        await collection.updateOne(
            { _id: new ObjectId(followId) },
            { $addToSet: { followers: new ObjectId(userId) } }
        );

        res.status(200).send('User followed successfully');
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const unfollowUser = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { unfollowId } = req.params;

        await collection.updateOne(
            { _id: new ObjectId(userId) },
            { $pull: { following: new ObjectId(unfollowId) } }
        );

        await collection.updateOne(
            { _id: new ObjectId(unfollowId) },
            { $pull: { followers: new ObjectId(userId) } }
        );

        res.status(200).send('User unfollowed successfully');
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const setUserMood = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { mood } = req.body;

        await collection.updateOne(
            { _id: new ObjectId(userId) },
            { $set: { mood } }
        );

        res.status(200).send('User mood updated successfully');
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const sendFriendRequest = async (req, res) => {
    try {
        const senderId = req.user.userId;
        const { userId: recipientId } = req.params;

        // Check if the recipient exists
        const recipient = await collection.findOne({ _id: new ObjectId(recipientId) });
        if (!recipient) {
            return res.status(404).send('Recipient not found');
        }

        // Check if a friend request has already been sent
        const existingRequest = recipient.friendRequests.find(
            (request) => request.userId.equals(new ObjectId(senderId))
        );
        if (existingRequest) {
            return res.status(400).send('Friend request already sent');
        }

        // Add friend request to recipient
        await collection.updateOne(
            { _id: new ObjectId(recipientId) },
            {
                $push: {
                    friendRequests: {
                        userId: new ObjectId(senderId),
                        status: 'pending'
                    }
                }
            }
        );

        res.status(200).send('Friend request sent');
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const respondToFriendRequest = async (req, res) => {
    try {
        const recipientId = req.user.userId;
        const { userId: senderId } = req.params;
        const { status } = req.body; // 'accepted' or 'rejected'

        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).send('Invalid status');
        }

        // Remove the friend request
        await collection.updateOne(
            { _id: new ObjectId(recipientId) },
            { $pull: { friendRequests: { userId: new ObjectId(senderId) } } }
        );

        if (status === 'accepted') {
            // Add to friends list for both users
            await collection.updateOne(
                { _id: new ObjectId(recipientId) },
                { $addToSet: { friends: new ObjectId(senderId), following: new ObjectId(senderId) } }
            );
            await collection.updateOne(
                { _id: new ObjectId(senderId) },
                { $addToSet: { friends: new ObjectId(recipientId), followers: new ObjectId(recipientId) } }
            );
        }

        res.status(200).send(`Friend request ${status}`);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const getNotifications = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const notifications = await collection.aggregate([
            { $match: { _id: new ObjectId(userId) } },
            { $unwind: '$friendRequests' },
            { $match: { 'friendRequests.status': 'pending' } },
            { 
                $lookup: {
                    from: 'users',
                    localField: 'friendRequests.userId',
                    foreignField: '_id',
                    as: 'senderInfo'
                }
            },
            { $unwind: '$senderInfo' },
            {
                $project: {
                    _id: 0,
                    status: '$friendRequests.status',
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
        res.status(500).send(error.message);
    }
};

const searchUsersByName = async (req, res) => {
    try {
        const { name } = req.query;

        if (!name) {
            return res.status(400).send('Search query is required');
        }

        const regex = new RegExp(name, 'i');

        const users = await collection.find({ name: regex }).toArray();

        res.status(200).send(users);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    getUserById,
    getUserByUsername,
    updateUserProfile,
    followUser,
    unfollowUser,
    setUserMood,
    sendFriendRequest,
    respondToFriendRequest,
    getNotifications,
    searchUsersByName
};
