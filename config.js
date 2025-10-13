require('dotenv').config();

module.exports = {
    JWT_SECRET: process.env.JWT_SECRET,
    serverConfiguration: {
        port: 3000,
    },

    databaseConfiguration: {
        uri: process.env.DATABASE_URI,
        databaseName: 'connectai',
        collectionName: 'users',
        usersCollectionSchema: {
            $jsonSchema: {
                bsonType: 'object',
                title: 'User Document Validation',
                required: ['name', 'email'],
                properties: {
                    name: {
                        bsonType: 'string',
                        description: '\'name\' must be a string and is required'
                    },
                    email: {
                        bsonType: 'string',
                        pattern: '^.+@.+$',
                        description: '\'email\' must be a valid email address and is required'
                    },
                    age: {
                        bsonType: 'int',
                        minimum: 0,
                        description: '\'age\' must be a non-negative integer if the field exists'
                    }
                }
            }
        }
    }
};
