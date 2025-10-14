
const userSchema = {
    $jsonSchema: {
        bsonType: "object",
        required: ["name", "email", "password", "dob", "gender", "username"],
        properties: {
            name: {
                bsonType: "string",
                description: "must be a string and is required"
            },
            username: {
                bsonType: "string",
                description: "must be a string and is required"
            },
            email: {
                bsonType: "string",
                description: "must be a string and is required"
            },
            password: {
                bsonType: "string",
                description: "must be a string and is required"
            },
            bio: {
                bsonType: "string",
                description: "must be a string and is not required"
            },
            avatar: {
                bsonType: "string",
                description: "must be a string and is not required"
            },
            dob: {
                bsonType: "date",
                description: "must be a date and is required"
            },
            gender: {
                bsonType: "string",
                description: "must be a string and is required"
            },
            followers: {
                bsonType: "array",
                items: {
                    bsonType: "objectId"
                }
            },
            following: {
                bsonType: "array",
                items: {
                    bsonType: "objectId"
                }
            },
            friends: {
                bsonType: "array",
                items: {
                    bsonType: "objectId"
                }
            },
            friendRequests: {
                bsonType: "array",
                items: {
                    bsonType: "object",
                    required: ["userId", "status"],
                    properties: {
                        userId: {
                            bsonType: "objectId"
                        },
                        status: {
                            bsonType: "string",
                            "enum": ["pending", "accepted", "rejected"]
                        }
                    }
                }
            }
        }
    }
};

module.exports = userSchema;
