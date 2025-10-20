---
timestamp: 'Mon Oct 20 2025 12:08:50 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_120850.7a670c7e.md]]'
content_id: f09e773a4c5ba4c91d82b4014733a51c849a02a722c90107ce4f40a392da675c
---

# API Specification: UserDirectory Concept

**Purpose:** represent app users with identity, preferences, and saved places

***

## API Endpoints

### POST /api/UserDirectory/register\_user

**Description:** Registers a new user with the given userId, display name, and email.

**Requirements:**

* userId not in {u.userId | u in the set of Users} and displayName, email are non-empty

**Effects:**

* adds new User with given attributes and empty savedPlaces, preferences to the set of Users

**Request Body:**

```json
{
  "userId": "string",
  "displayName": "string",
  "email": "string"
}
```

**Success Response Body (Action):**

```json
{
  "userId": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/UserDirectory/save\_place

**Description:** Saves a place to a user's list of saved places.

**Requirements:**

* userId in {u.userId | u in the set of Users}

**Effects:**

* update user u where u.userId = userId: u.savedPlaces' = u.savedPlaces + {placeId}

**Request Body:**

```json
{
  "userId": "string",
  "placeId": "string"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/UserDirectory/unsave\_place

**Description:** Removes a place from a user's list of saved places.

**Requirements:**

* userId in {u.userId | u in the set of Users} and placeId in user.savedPlaces

**Effects:**

* update user u where u.userId = userId: u.savedPlaces' = u.savedPlaces - {placeId}

**Request Body:**

```json
{
  "userId": "string",
  "placeId": "string"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/UserDirectory/update\_preferences

**Description:** Updates a user's preferences.

**Requirements:**

* userId in {u.userId | u in the set of Users}

**Effects:**

* update user u where u.userId = userId: u.preferences' = newPrefs

**Request Body:**

```json
{
  "userId": "string",
  "newPrefs": {
    "string": "string"
  }
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/UserDirectory/\_get\_saved\_places

**Description:** Returns the set of place IDs saved by a specific user.

**Requirements:**

* userId in {u.userId | u in the set of Users}

**Effects:**

* return u.savedPlaces where u.userId = userId

**Request Body:**

```json
{
  "userId": "string"
}
```

**Success Response Body (Query):**

```json
[
  "string"
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***
