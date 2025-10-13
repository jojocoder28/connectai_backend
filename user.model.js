
const userSchema = {
    $jsonSchema: {
        bsonType: "object",
        required: ["name", "email", "password", "dob", "gender"],
        properties: {
            name: {
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
            }
        }
    }
};

module.exports = userSchema;
