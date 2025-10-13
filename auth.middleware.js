
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./config');

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')?.[1];

    if (!token) {
        return res.status(401).send('Access denied. No token provided.');
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(400).send('Invalid token.');
    }
};

module.exports = authMiddleware;
