const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const { Database, applySchemaValidation } = require('./database');
const { databaseConfiguration, serverConfiguration } = require('./config');

// Schemas
const userSchema = require('./user.model');
const postSchema = require('./post.model');
// const messageSchema = require('./message.model');
// const conversationSchema = require('./conversation.model');

// Config
const { uri, databaseName } = databaseConfiguration;
const { port } = serverConfiguration;

Database.connectToDatabase(uri).then(async databaseClient => {
  const db = databaseClient.db(databaseName);

  // Apply schema validation for all collections
  await applySchemaValidation(db, 'users', userSchema);
  await applySchemaValidation(db, 'posts', postSchema);
  // await applySchemaValidation(db, 'messages', messageSchema);
  // await applySchemaValidation(db, 'conversations', conversationSchema);

  const app = express();
  app.use(bodyParser.json());
  app.use(cors());

  // Import routes
  const userRoutes = require('./user.routes');
  const postRoutes = require('./post.routes');
  // const messageRoutes = require('./message.routes');
  // const conversationRoutes = require('./conversation.routes');

  // Use routes
  app.use('/users', userRoutes);
  app.use('/posts', postRoutes);
  // app.use('/messages', messageRoutes);
  // app.use('/conversations', conversationRoutes);

  // Default route
  app.use('/', (_req, res) => res.status(200).send('API v1.0 is running...'));

  // Start server
  app.listen(port, () => {
    console.log(`✅ Server running at http://localhost:${port}/`);
  });
});
