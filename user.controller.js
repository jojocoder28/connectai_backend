
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');

const { Database } = require('./database');
const { databaseConfiguration } = require('./config');
const { JWT_SECRET } = require('./config');

const { databaseName, collectionName } = databaseConfiguration;
const connection = Database.connection;
const database = connection.db(databaseName);
const collection = database.collection(collectionName);

const registerUser = async (req, res) => {
    try {
        const { name, email, password, dob, gender } = req.body;

        const existingUser = await collection.findOne({ email });
        if (existingUser) {
            return res.status(400).send('User already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            name,
            email,
            password: hashedPassword,
            dob: new Date(dob),
            gender,
            followers: [],
            following: []
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
            email: user.email,
            dob: user.dob,
            gender: user.gender,
            followers: user.followers,
            following: user.following
        };


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

const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, bio, avatar, interests } = req.body;

        const updatedFields = {};
        if (name) updatedFields.name = name;
        if (bio) updatedFields.bio = bio;
        if (avatar) updatedFields.avatar = avatar;
        if (interests) updatedFields.interests = interests;

        const result = await collection.updateOne(
            { _id: new ObjectId(userId) },
            { $set: updatedFields }
        );

        if (result.matchedCount === 0) {
            return res.status(404).send('User not found');
        }

        res.status(200).send('User profile updated successfully');
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

module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    followUser,
    unfollowUser,
    setUserMood
};
