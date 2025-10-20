---
timestamp: 'Mon Oct 20 2025 12:08:50 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_120850.7a670c7e.md]]'
content_id: 5971f4cf8c7bc78aafd0eef3a4fda4992a6913fd354e0e61a823fb5b2b7df5c9
---

# API Specification: ExperienceLog Concept

**Purpose:** capture a user's personal experience at a place with structured ratings and notes, and enable AI-powered insights about their overall preferences and trends

***

## API Endpoints

### POST /api/ExperienceLog/create\_log

**Description:** Creates a new log entry for a user's experience at a place.

**Requirements:**

* rating is in the inclusive range \[1,5]

**Effects:**

* adds new Log with new logId, given params, timestamp = now() to the set of Logs

**Request Body:**

```json
{
  "userId": "string",
  "placeId": "string",
  "rating": 0,
  "sweetness": 0,
  "strength": 0
}
```

**Success Response Body (Action):**

```json
{
  "logId": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/ExperienceLog/update\_log

**Description:** Updates an existing log entry with new values.

**Requirements:**

* logId in {log.logId | log in the set of Logs} and if rating given then rating is in the inclusive range \[1,5]

**Effects:**

* update log where log.logId = logId with non-null parameters

**Request Body:**

```json
{
  "logId": "string",
  "rating": 0,
  "sweetness": 0,
  "strength": 0,
  "notes": "string",
  "photo": "string"
}
```

**Success Response Body (Action):**

```json
{
  "log": {
    "_id": "string",
    "userId": "string",
    "placeId": "string",
    "timestamp": "string",
    "rating": 0,
    "sweetness": 0,
    "strength": 0,
    "notes": "string",
    "photo": "string"
  }
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/ExperienceLog/delete\_log

**Description:** Deletes a log entry.

**Requirements:**

* logId in {log.logId | log in Logs}

**Effects:**

* Logs' = Logs - {log | log.logId = logId}

**Request Body:**

```json
{
  "logId": "string"
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

### POST /api/ExperienceLog/\_get\_user\_logs

**Description:** Returns all log entries for a specific user.

**Requirements:**

* (none)

**Effects:**

* return {log | log in the set of Logs and log.userId = userId}

**Request Body:**

```json
{
  "userId": "string"
}
```

**Success Response Body (Query):**

```json
[
  {
    "_id": "string",
    "userId": "string",
    "placeId": "string",
    "timestamp": "string",
    "rating": 0,
    "sweetness": 0,
    "strength": 0,
    "notes": "string",
    "photo": "string"
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/ExperienceLog/\_get\_place\_logs

**Description:** Returns log entries for a specific user at a specific place.

**Requirements:**

* (none)

**Effects:**

* return {log | log in the set of Logs and log.userId = userId and log.placeId = placeId}

**Request Body:**

```json
{
  "userId": "string",
  "placeId": "string"
}
```

**Success Response Body (Query):**

```json
[
  {
    "_id": "string",
    "userId": "string",
    "placeId": "string",
    "timestamp": "string",
    "rating": 0,
    "sweetness": 0,
    "strength": 0,
    "notes": "string",
    "photo": "string"
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/ExperienceLog/\_get\_average\_rating

**Description:** Returns the average rating given by a user for a specific place.

**Requirements:**

* (none)

**Effects:**

* return average of {log.rating | log in the set of Logs and log.userId = userId and log.placeId = placeId}

**Request Body:**

```json
{
  "userId": "string",
  "placeId": "string"
}
```

**Success Response Body (Query):**

```json
[
  {
    "averageRating": 0
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/ExperienceLog/\_get\_tried\_places

**Description:** Returns a set of place IDs that a user has logged experiences for.

**Requirements:**

* (none)

**Effects:**

* return {log.placeId | log in Logs and log.userId = userId}

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

### POST /api/ExperienceLog/generate\_profile\_summary

**Description:** Generates a concise textual summary describing the user's preferences and patterns based on their logs.

**Requirements:**

* there exists at least one log in the set of Logs with log.userId = userId

**Effects:**

* calls llm with the user's Logs (ratings, sweetness, strength, notes, and places)
  and returns a concise textual summary describing the user's preferences and patterns
* **validators**:
  * summary must not mention places not in user's logs
  * summary must be <= 3 sentences
  * sentiment of summary should align with overall average rating

**Request Body:**

```json
{
  "userId": "string"
}
```

**Success Response Body (Action):**

```json
{
  "summary": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***
