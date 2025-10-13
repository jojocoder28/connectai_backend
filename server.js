
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const { Database, applySchemaValidation } = require('./database');
const { databaseConfiguration, serverConfiguration } = require('./config');
const userSchema = require('./user.model');
const postSchema = require('./post.model');

const { uri, databaseName } = databaseConfiguration;
const { port } = serverConfiguration;

Database.connectToDatabase(uri).then(async databaseClient => {
  const db = databaseClient.db(databaseName);
  await applySchemaValidation(db, 'users', userSchema);
  await applySchemaValidation(db, 'posts', postSchema);

  const app = express();
  app.use(bodyParser.json());
  app.use(cors());

  const userRoutes = require('./user.routes');
  const postRoutes = require('./post.routes');

  app.use('/users', userRoutes);
  app.use('/posts', postRoutes);

  app.use('/', (_req, res) => res.status(200).send('API v1.0 is running...'));

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
  });
});
