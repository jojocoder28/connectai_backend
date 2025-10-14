const messageSchema = {
    $jsonSchema: {
        bsonType: "object",
        required: ["conversationId", "senderId", "messageType", "content"],
        properties: {
            conversationId: {
                bsonType: "objectId",
                description: "must be an objectId and is required"
            },
            senderId: {
                bsonType: "objectId",
                description: "must be an objectId and is required"
            },
            messageType: {
                bsonType: "string",
                "enum": ["text", "image", "video", "audio", "sticker", "emoji"],
                description: "can only be one of the enum values and is required"
            },
            content: {
                bsonType: "string",
                description: "must be a string and is required"
            },
            timestamp: {
                bsonType: "date",
                description: "must be a date and is required"
            }
        }
    }
};

module.exports = messageSchema;