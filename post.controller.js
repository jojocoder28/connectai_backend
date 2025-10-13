
const { ObjectId } = require('mongodb');
const { Database } = require('./database');
const { databaseConfiguration } = require('./config');

const { databaseName } = databaseConfiguration;
const postsCollection = Database.connection.db(databaseName).collection('posts');

const createPost = async (req, res) => {
    try {
        const { text, media, tags, location } = req.body;
        const authorID = req.user.userId;

        const newPost = {
            text,
            media,
            authorID: new ObjectId(authorID),
            tags: tags || [],
            location: location || null,
            likes: [],
            comments: [],
            timestamp: new Date()
        };

        const result = await postsCollection.insertOne(newPost);
        res.status(201).send({ postId: result.insertedId });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const getPostById = async (req, res) => {
    try {
        const { postId } = req.params;
        const post = await postsCollection.findOne({ _id: new ObjectId(postId) });

        if (!post) {
            return res.status(404).send('Post not found');
        }

        const postWithCounts = {
            ...post,
            likesCount: post.likes.length,
            commentsCount: post.comments.length
        };

        res.status(200).send(postWithCounts);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const likePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user.userId;

        const post = await postsCollection.findOne({ _id: new ObjectId(postId) });

        if (!post) {
            return res.status(404).send('Post not found');
        }

        const isLiked = post.likes.some(id => id.equals(new ObjectId(userId)));

        if (isLiked) {
            await postsCollection.updateOne(
                { _id: new ObjectId(postId) },
                { $pull: { likes: new ObjectId(userId) } }
            );
        } else {
            await postsCollection.updateOne(
                { _id: new ObjectId(postId) },
                { $addToSet: { likes: new ObjectId(userId) } }
            );
        }

        res.status(200).send('Post like status updated');
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const commentPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { text } = req.body;
        const userId = req.user.userId;

        const comment = {
            userID: new ObjectId(userId),
            text,
            timestamp: new Date()
        };

        await postsCollection.updateOne(
            { _id: new ObjectId(postId) },
            { $push: { comments: comment } }
        );

        res.status(201).send('Comment added successfully');
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const sharePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user.userId;

        const originalPost = await postsCollection.findOne({ _id: new ObjectId(postId) });

        if (!originalPost) {
            return res.status(404).send('Post not found');
        }

        const newPost = {
            text: originalPost.text,
            media: originalPost.media,
            authorID: new ObjectId(userId),
            tags: originalPost.tags,
            location: originalPost.location,
            likes: [],
            comments: [],
            timestamp: new Date(),
            sharedFrom: new ObjectId(postId)
        };

        const result = await postsCollection.insertOne(newPost);
        res.status(201).send({ postId: result.insertedId });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const deletePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user.userId;

        const post = await postsCollection.findOne({ _id: new ObjectId(postId) });

        if (!post) {
            return res.status(404).send('Post not found');
        }

        if (!post.authorID.equals(new ObjectId(userId))) {
            return res.status(403).send('You are not authorized to delete this post');
        }

        await postsCollection.deleteOne({ _id: new ObjectId(postId) });

        res.status(200).send('Post deleted successfully');
    } catch (error) {
        res.status(500).send(error.message);
    }
};

module.exports = {
    createPost,
    getPostById,
    likePost,
    commentPost,
    sharePost,
    deletePost
};
