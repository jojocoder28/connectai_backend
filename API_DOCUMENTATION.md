
# API Documentation

This document provides a detailed overview of the API endpoints for the social media application.

## Authentication

Most endpoints require authentication using a JSON Web Token (JWT). To authenticate, include the JWT in the `Authorization` header of your request, prefixed with `Bearer `.

**Example:** `Authorization: Bearer <your_jwt>`

## User API (`/users`)

### `POST /register`

Registers a new user.

**Request Body:**

```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "dob": "string (YYYY-MM-DD)",
  "gender": "string"
}
```

**Response:**

```json
{
  "token": "string (JWT)"
}
```

### `POST /login`

Logs in an existing user.

**Request Body:**

```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**

```json
{
  "token": "string (JWT)",
  "profile": {
    "_id": "string (ObjectId)",
    "name": "string",
    "email": "string",
    "dob": "date",
    "gender": "string",
    "followers": "array (ObjectId)",
    "following": "array (ObjectId)"
  }
}
```

### `GET /profile`

Retrieves the profile of the currently authenticated user.

**Authentication:** Required

**Response:**

A user object.

### `PUT /profile`

Updates the profile of the currently authenticated user.

**Authentication:** Required

**Request Body:**

```json
{
  "name": "string (optional)",
  "bio": "string (optional)",
  "avatar": "string (optional)",
  "interests": "array (optional)"
}
```

**Response:**

A success message.

### `POST /follow/:followId`

Follows another user.

**Authentication:** Required

**URL Parameters:**

*   `followId`: The ID of the user to follow.

**Response:**

A success message.

### `POST /unfollow/:unfollowId`

Unfollows another user.

**Authentication:** Required

**URL Parameters:**

*   `unfollowId`: The ID of the user to unfollow.

**Response:**

A success message.

### `PUT /mood`

Sets the mood of the currently authenticated user.

**Authentication:** Required

**Request Body:**

```json
{
  "mood": "string"
}
```

**Response:**

A success message.

## Post API (`/posts`)

### `POST /`

Creates a new post.

**Authentication:** Required

**Request Body:**

```json
{
  "text": "string",
  "media": "string (optional)",
  "tags": "array (optional)",
  "location": "string (optional)"
}
```

**Response:**

```json
{
  "postId": "string (ObjectId)"
}
```

### `GET /:postId`

Retrieves a post by its ID.

**URL Parameters:**

*   `postId`: The ID of the post to retrieve.

**Response:**

A post object with `likesCount` and `commentsCount`.

### `POST /like/:postId`

Likes or unlikes a post.

**Authentication:** Required

**URL Parameters:**

*   `postId`: The ID of the post to like/unlike.

**Response:**

A success message.

### `POST /comment/:postId`

Adds a comment to a post.

**Authentication:** Required

**URL Parameters:**

*   `postId`: The ID of the post to comment on.

**Request Body:**

```json
{
  "text": "string"
}
```

**Response:**

A success message.

### `POST /share/:postId`

Shares a post.

**Authentication:** Required

**URL Parameters:**

*   `postId`: The ID of the post to share.

**Response:**

```json
{
  "postId": "string (ObjectId)"
}
```

### `DELETE /:postId`

Deletes a post.

**Authentication:** Required

**URL Parameters:**

*   `postId`: The ID of the post to delete.

**Response:**

A success message.
