
const { ObjectId } = require('mongodb');
const { Database } = require('./database');
const { databaseConfiguration, cloudinaryConfiguration } = require('./config');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

cloudinary.config(cloudinaryConfiguration);

const { databaseName } = databaseConfiguration;
const postsCollection = Database.connection.db(databaseName).collection('posts');
const usersCollection = Database.connection.db(databaseName).collection('users');

const createPost = async (req, res) => {
    try {
        const { text, tags, location } = req.body;
        const authorID = req.user.userId;
        let mediaUrl = null;

        if (req.file) {
            const streamUpload = (req) => {
                return new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        (error, result) => {
                            if (result) {
                                resolve(result);
                            } else {
                                reject(error);
                            }
                        }
                    );
                    streamifier.createReadStream(req.file.buffer).pipe(stream);
                });
            };

            const result = await streamUpload(req);
            mediaUrl = result.secure_url;
        }

        let tagsArray = [];
        if (tags) {
            if (Array.isArray(tags)) {
                tagsArray = tags;
            } else if (typeof tags === 'string') {
                tagsArray = tags.split(',').map(tag => tag.trim());
            }
        }

        const mentions = [];
        const mentionRegex = /@(\w+)/g;
        let match;
        while ((match = mentionRegex.exec(text)) !== null) {
            const username = match[1];
            const user = await usersCollection.findOne({ username });
            if (user) {
                mentions.push(user._id);
            }
        }

        const newPost = {
            text,
            authorID: new ObjectId(authorID),
            tags: tagsArray,
            mentions,
            location: location || null,
            likes: [],
            comments: [],
            timestamp: new Date(),
            ...(mediaUrl && { media: mediaUrl })
        };

        const result = await postsCollection.insertOne(newPost);
        res.status(201).send({ postId: result.insertedId });
    } catch (error) {
        if (error.code === 121) { // MongoDB validation error code
            res.status(400).send({ message: 'Post validation failed', details: error.errInfo.details });
        } else {
            res.status(500).send(error.message);
        }
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

const getPostsByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        const posts = await postsCollection.find({ authorID: new ObjectId(userId) }).toArray();
        res.status(200).send(posts);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const getPostsByUsername = async (req, res) => {
    try {
        const { username } = req.params;
        const user = await usersCollection.findOne({ username });
        if (!user) {
            return res.status(404).send('User not found');
        }
        const posts = await postsCollection.find({ authorID: user._id }).toArray();
        res.status(200).send(posts);
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

const getFeed = async (req, res) => {
    try {
        const userId = req.user.userId;
        const currentUser = await usersCollection.findOne({ _id: new ObjectId(userId) });

        if (!currentUser) {
            return res.status(404).send('User not found');
        }

        const following = currentUser.following || [];
        const friends = currentUser.friends || [];
        const authors = [...new Set([...following, ...friends, new ObjectId(userId)].map(id => id.toString()))].map(id => new ObjectId(id));

        const userInterests = currentUser.interests || [];

        const feedPosts = await postsCollection.find({ authorID: { $in: authors } }).toArray();

        const scoredPosts = feedPosts.map(post => {
            let interestScore = 0;
            if (post.tags && userInterests.length > 0) {
                const matchingTags = post.tags.filter(tag => userInterests.includes(tag));
                interestScore = matchingTags.length;
            }

            const recencyScore = new Date(post.timestamp).getTime();
            const totalScore = (interestScore * 100000000000) + recencyScore;

            return { ...post, score: totalScore };
        });

        const sortedFeed = scoredPosts.sort((a, b) => b.score - a.score);

        res.status(200).send(sortedFeed);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

module.exports = {
    createPost,
    getPostById,
    getPostsByUserId,
    getPostsByUsername,
    likePost,
    commentPost,
    sharePost,
    deletePost,
    getFeed
};
