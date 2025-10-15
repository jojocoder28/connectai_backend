
const notificationSchema = {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["recipient", "sender", "type", "status", "createdAt"],
            properties: {
                recipient: {
                    bsonType: "objectId",
                    description: "must be an objectId and is required"
                },
                sender: {
                    bsonType: "objectId",
                    description: "must be an objectId and is required"
                },
                type: {
                    bsonType: "string",
                    "enum": ["friend-request", "like", "comment"],
                    description: "must be a string and is required"
                },
                status: {
                    bsonType: "string",
                    "enum": ["pending", "accepted", "rejected", "read"],
                    description: "must be a string and is required"
                },
                createdAt: {
                    bsonType: "date",
                    description: "must be a date and is required"
                }
            }
        }
    }
};

module.exports = notificationSchema;
