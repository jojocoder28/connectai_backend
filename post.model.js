const postSchema = {
    $jsonSchema: {
        bsonType: "object",
        required: ["text", "authorID", "timestamp"],
        properties: {
            text: {
                bsonType: "string",
                description: "must be a string and is required"
            },
            media: {
                bsonType: "string",
                description: "must be a string"
            },
            authorID: {
                bsonType: "objectId",
                description: "must be an objectId and is required"
            },
            tags: {
                bsonType: "array",
                items: {
                    bsonType: "string"
                }
            },
            mentions: {
                bsonType: "array",
                items: {
                    bsonType: "objectId"
                }
            },
            likes: {
                bsonType: "array",
                items: {
                    bsonType: "objectId"
                }
            },
            comments: {
                bsonType: "array",
                items: {
                    bsonType: "object",
                    required: ["userID", "text", "timestamp"],
                    properties: {
                        userID: {
                            bsonType: "objectId"
                        },
                        text: {
                            bsonType: "string"
                        },
                        timestamp: {
                            bsonType: "date"
                        }
                    }
                }
            },
            timestamp: {
                bsonType: "date",
                description: "must be a date and is required"
            },
            sharedFrom: {
                bsonType: "objectId"
            }
        }
    }
};

module.exports = postSchema;