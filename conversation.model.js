const conversationSchema = {
    bsonType: "object",
    required: ["participants", "lastMessage"],
    properties: {
        participants: {
            bsonType: "array",
            items: {
                bsonType: "objectId"
            }
        },
        lastMessage: {
            bsonType: "objectId",
        }
    }
};

module.exports = conversationSchema;