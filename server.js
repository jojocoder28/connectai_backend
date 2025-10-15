
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const { Database, applySchemaValidation } = require('./database');
const { databaseConfiguration, serverConfiguration } = require('./config');
const userSchema = require('./user.model');
const postSchema = require('./post.model');
const notificationSchema = require('./notification.model');
const messageSchema = require('./message.model');
const conversationSchema = require('./conversation.model');

const { uri, databaseName } = databaseConfiguration;
const { port } = serverConfiguration;

Database.connectToDatabase(uri).then(async databaseClient => {
  const db = databaseClient.db(databaseName);
  await applySchemaValidation(db, 'users', userSchema);
  await applySchemaValidation(db, 'posts', postSchema);
  await applySchemaValidation(db, 'notifications', notificationSchema);
  await applySchemaValidation(db, 'messages', messageSchema);
  await applySchemaValidation(db, 'conversations', conversationSchema);

  const app = express();
  app.use(bodyParser.json());
  app.use(cors());

  const userRoutes = require('./user.routes');
  const postRoutes = require('./post.routes');
  const notificationRoutes = require('./notification.routes');
  const messageRoutes = require('./message.routes');
  const conversationRoutes = require('./conversation.routes');

  app.use('/users', userRoutes);
  app.use('/posts', postRoutes);
  app.use('/notifications', notificationRoutes);
  app.use('/messages', messageRoutes);
  app.use('/conversations', conversationRoutes);

  app.use('/', (_req, res) => res.status(200).send('API v1.0 is running...'));

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
  });
});
