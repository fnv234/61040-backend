---
timestamp: 'Mon Oct 20 2025 12:08:50 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_120850.7a670c7e.md]]'
content_id: 0fffd74f26300f17bdb318bcf5b98e2aff827849d5e7a7c52bfd727ee468fa4f
---

# API Specification: RecommendationEngine Concept

**Purpose:** suggest places for users to try based on basic matching criteria

***

## API Endpoints

### POST /api/RecommendationEngine/get\_recommendations

**Description:** Returns personalized place recommendations for a user, potentially from cache if recent.

**Requirements:**

* (none)

**Effects:**

* return recommendations\[userId] if exists and recent; otherwise compute fresh

**Request Body:**

```json
{
  "userId": "string"
}
```

**Success Response Body (Action):**

```json
{
  "places": [
    "string"
  ]
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/RecommendationEngine/refresh\_recommendations

**Description:** Recomputes and updates a user's personalized place recommendations.

**Requirements:**

* (none)

**Effects:**

* recommendations\[userId] = compute\_suggestions(savedPlaces, preferences, triedPlaces),
  lastUpdated\[userId] = now()

**Request Body:**

```json
{
  "userId": "string",
  "savedPlaces": [
    "string"
  ],
  "preferences": {
    "string": "string"
  },
  "triedPlaces": [
    "string"
  ]
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

### POST /api/RecommendationEngine/clear\_recommendations

**Description:** Removes a user's recommendations and their last update timestamp.

**Requirements:**

* (none)

**Effects:**

* remove recommendations\[userId] and lastUpdated\[userId]

**Request Body:**

```json
{
  "userId": "string"
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
