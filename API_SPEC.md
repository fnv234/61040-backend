# API Specification: Matcha Tracker Backend

This document describes the REST API for the Matcha Tracker backend, which consists of four concepts: ExperienceLog, PlaceDirectory, UserDirectory, and RecommendationEngine.

**Base URL:** `http://localhost:8000/api`

**Content Type:** All requests and responses use `application/json`

**HTTP Method:** All endpoints use `POST`

---

## ExperienceLog Concept

**Purpose:** Capture a user's personal experience at a place with structured ratings and notes, and enable AI-powered insights about their overall preferences and trends.

### POST /api/ExperienceLog/create_log

**Description:** Creates a new experience log entry for a user at a specific place.

**Requirements:**
- `rating` must be in the inclusive range [1,5]
- `sweetness` must be in the inclusive range [1,5]
- `strength` must be in the inclusive range [1,5]

**Effects:**
- Adds a new Log with a new logId, given parameters, and timestamp = now() to the set of Logs
- Triggers a refresh of recommendations for the user

**Request Body:**
```json
{
  "userId": "string (ID)",
  "placeId": "string (ID)",
  "rating": "number (1-5)",
  "sweetness": "number (1-5)",
  "strength": "number (1-5)",
  "notes": "string (optional)",
  "photo": "string (URL, optional)"
}
```

**Success Response Body:**
```json
{
  "logId": "string (ID)"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/ExperienceLog/update_log

**Description:** Updates an existing experience log entry.

**Requirements:**
- `logId` must exist in the set of Logs
- If `rating` is provided, it must be in the inclusive range [1,5]
- If `sweetness` is provided, it must be in the inclusive range [1,5]
- If `strength` is provided, it must be in the inclusive range [1,5]

**Effects:**
- Updates the log where log.logId = logId with non-null parameters

**Request Body:**
```json
{
  "logId": "string (ID)",
  "rating": "number (1-5, optional)",
  "sweetness": "number (1-5, optional)",
  "strength": "number (1-5, optional)",
  "notes": "string (optional)",
  "photo": "string (URL, optional)"
}
```

**Success Response Body:**
```json
{
  "log": {
    "_id": "string (ID)",
    "userId": "string (ID)",
    "placeId": "string (ID)",
    "timestamp": "string (ISO date)",
    "rating": "number",
    "sweetness": "number",
    "strength": "number",
    "notes": "string (optional)",
    "photo": "string (optional)"
  }
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/ExperienceLog/delete_log

**Description:** Deletes an experience log entry.

**Requirements:**
- `logId` must exist in the set of Logs

**Effects:**
- Removes the log where log.logId = logId from the set of Logs

**Request Body:**
```json
{
  "logId": "string (ID)"
}
```

**Success Response Body:**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/ExperienceLog/_get_user_logs

**Description:** Retrieves all experience logs for a specific user.

**Effects:**
- Returns all logs where log.userId = userId

**Request Body:**
```json
{
  "userId": "string (ID)"
}
```

**Success Response Body:**
```json
{
  "logs": [
    {
      "_id": "string (ID)",
      "userId": "string (ID)",
      "placeId": "string (ID)",
      "timestamp": "string (ISO date)",
      "rating": "number",
      "sweetness": "number",
      "strength": "number",
      "notes": "string (optional)",
      "photo": "string (optional)"
    }
  ]
}
```

---

### POST /api/ExperienceLog/_get_place_logs

**Description:** Retrieves all experience logs for a specific user at a specific place.

**Effects:**
- Returns all logs where log.userId = userId and log.placeId = placeId

**Request Body:**
```json
{
  "userId": "string (ID)",
  "placeId": "string (ID)"
}
```

**Success Response Body:**
```json
{
  "logs": [
    {
      "_id": "string (ID)",
      "userId": "string (ID)",
      "placeId": "string (ID)",
      "timestamp": "string (ISO date)",
      "rating": "number",
      "sweetness": "number",
      "strength": "number",
      "notes": "string (optional)",
      "photo": "string (optional)"
    }
  ]
}
```

---

### POST /api/ExperienceLog/_get_average_rating

**Description:** Calculates the average rating for a user at a specific place.

**Effects:**
- Returns the average of all ratings for the user at the place

**Request Body:**
```json
{
  "userId": "string (ID)",
  "placeId": "string (ID)"
}
```

**Success Response Body:**
```json
{
  "averageRating": "number"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/ExperienceLog/_get_tried_places

**Description:** Retrieves all unique places a user has visited.

**Effects:**
- Returns all unique placeIds from logs where log.userId = userId

**Request Body:**
```json
{
  "userId": "string (ID)"
}
```

**Success Response Body:**
```json
{
  "places": ["string (ID)", "string (ID)", ...]
}
```

---

### POST /api/ExperienceLog/generate_profile_summary

**Description:** Generates an AI-powered summary of a user's matcha preferences based on their experience logs.

**Requirements:**
- There must exist at least one log for the user

**Effects:**
- Calls an LLM with the user's logs (ratings, sweetness, strength, notes, and places)
- Returns a concise textual summary describing the user's preferences and patterns

**Request Body:**
```json
{
  "userId": "string (ID)",
  "llm": "object (GeminiLLM instance)"
}
```

**Success Response Body:**
```json
{
  "summary": "string (max 3 sentences)"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

## PlaceDirectory Concept

**Purpose:** Represent and manage known matcha-serving locations.

### POST /api/PlaceDirectory/create_place

**Description:** Creates a new place in the directory.

**Requirements:**
- `name` and `address` must be non-empty

**Effects:**
- Adds a new Place with placeId and all given attributes to the set of Places

**Request Body:**
```json
{
  "name": "string",
  "address": "string",
  "coords": [number, number],
  "styles": ["string"],
  "priceRange": "string",
  "hours": "string (optional)",
  "photos": ["string (URL)"] 
}
```

**Success Response Body:**
```json
{
  "placeId": "string (ID)"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/PlaceDirectory/edit_place

**Description:** Updates an existing place's information.

**Requirements:**
- `placeId` must exist in the set of Places

**Effects:**
- Updates the place where p.placeId = placeId with any non-null parameters

**Request Body:**
```json
{
  "placeId": "string (ID)",
  "name": "string (optional)",
  "address": "string (optional)",
  "coords": [number, number] (optional),
  "styles": ["string"] (optional),
  "priceRange": "string (optional)",
  "hours": "string (optional)",
  "photos": ["string (URL)"] (optional)
}
```

**Success Response Body:**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/PlaceDirectory/delete_place

**Description:** Deletes a place from the directory.

**Requirements:**
- `placeId` must exist in the set of Places

**Effects:**
- Removes the place where p.placeId = placeId from the set of Places

**Request Body:**
```json
{
  "placeId": "string (ID)"
}
```

**Success Response Body:**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/PlaceDirectory/_find_nearby

**Description:** Finds places within a specified radius of given coordinates.

**Requirements:**
- `radius` must be greater than 0

**Effects:**
- Returns all placeIds where distance(p.coordinates, coords) <= radius

**Request Body:**
```json
{
  "coords": [number, number],
  "radius": "number (in km)"
}
```

**Success Response Body:**
```json
{
  "places": ["string (ID)", "string (ID)", ...]
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/PlaceDirectory/_search_by_name

**Description:** Searches for places by name (case-insensitive substring match).

**Effects:**
- Returns all placeIds where query is contained in p.name

**Request Body:**
```json
{
  "query": "string"
}
```

**Success Response Body:**
```json
{
  "places": ["string (ID)", "string (ID)", ...]
}
```

---

### POST /api/PlaceDirectory/_filter_places

**Description:** Filters places by price range, hours, and/or preparation style.

**Effects:**
- Returns all placeIds matching the provided filters (null filters are ignored)

**Request Body:**
```json
{
  "priceRange": "string (optional)",
  "hours": "string (optional)",
  "style": "string (optional)"
}
```

**Success Response Body:**
```json
{
  "places": ["string (ID)", "string (ID)", ...]
}
```

---

### POST /api/PlaceDirectory/_get_details

**Description:** Retrieves detailed information about a specific place.

**Requirements:**
- `placeId` must exist in the set of Places

**Effects:**
- Returns the place where p.placeId = placeId

**Request Body:**
```json
{
  "placeId": "string (ID)"
}
```

**Success Response Body:**
```json
{
  "place": {
    "_id": "string (ID)",
    "name": "string",
    "address": "string",
    "coordinates": [number, number],
    "preparationStyles": ["string"],
    "priceRange": "string",
    "hours": "string (optional)",
    "photos": ["string (URL)"]
  }
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

## UserDirectory Concept

**Purpose:** Represent app users with identity, preferences, and saved places.

### POST /api/UserDirectory/register_user

**Description:** Registers a new user in the system.

**Requirements:**
- `userId` must not already exist
- `displayName` and `email` must be non-empty

**Effects:**
- Adds a new User with given attributes and empty savedPlaces, preferences to the set of Users

**Request Body:**
```json
{
  "userId": "string (ID)",
  "displayName": "string",
  "email": "string"
}
```

**Success Response Body:**
```json
{
  "userId": "string (ID)"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/UserDirectory/save_place

**Description:** Adds a place to a user's saved places list.

**Requirements:**
- `userId` must exist in the set of Users

**Effects:**
- Adds placeId to user's savedPlaces set

**Request Body:**
```json
{
  "userId": "string (ID)",
  "placeId": "string (ID)"
}
```

**Success Response Body:**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/UserDirectory/unsave_place

**Description:** Removes a place from a user's saved places list.

**Requirements:**
- `userId` must exist in the set of Users
- `placeId` must be in user's savedPlaces

**Effects:**
- Removes placeId from user's savedPlaces set

**Request Body:**
```json
{
  "userId": "string (ID)",
  "placeId": "string (ID)"
}
```

**Success Response Body:**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/UserDirectory/update_preferences

**Description:** Updates a user's preferences.

**Requirements:**
- `userId` must exist in the set of Users

**Effects:**
- Replaces user's preferences with newPrefs

**Request Body:**
```json
{
  "userId": "string (ID)",
  "newPrefs": {
    "key1": "value1",
    "key2": "value2"
  }
}
```

**Success Response Body:**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/UserDirectory/_get_saved_places

**Description:** Retrieves a user's saved places.

**Requirements:**
- `userId` must exist in the set of Users

**Effects:**
- Returns user's savedPlaces set

**Request Body:**
```json
{
  "userId": "string (ID)"
}
```

**Success Response Body:**
```json
{
  "places": ["string (ID)", "string (ID)", ...]
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

## RecommendationEngine Concept

**Purpose:** Suggest places for users to try based on basic matching criteria.

### POST /api/RecommendationEngine/get_recommendations

**Description:** Retrieves personalized place recommendations for a user.

**Effects:**
- Returns cached recommendations if they exist and are recent
- Otherwise computes fresh recommendations

**Request Body:**
```json
{
  "userId": "string (ID)"
}
```

**Success Response Body:**
```json
{
  "recommendations": ["string (ID)", "string (ID)", ...]
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/RecommendationEngine/refresh_recommendations

**Description:** Forces a refresh of recommendations for a user based on their current data.

**Effects:**
- Computes new recommendations based on savedPlaces, preferences, and triedPlaces
- Updates recommendations[userId] and lastUpdated[userId]

**Request Body:**
```json
{
  "userId": "string (ID)",
  "savedPlaces": ["string (ID)"],
  "preferences": {
    "key1": "value1",
    "key2": "value2"
  },
  "triedPlaces": ["string (ID)"]
}
```

**Success Response Body:**
```json
{}
```

---

### POST /api/RecommendationEngine/clear_recommendations

**Description:** Clears all cached recommendations for a user.

**Effects:**
- Removes recommendations[userId] and lastUpdated[userId]

**Request Body:**
```json
{
  "userId": "string (ID)"
}
```

**Success Response Body:**
```json
{}
```

---

## Notes

- All IDs are UUID v7 strings
- Timestamps are ISO 8601 formatted strings
- Coordinates are [longitude, latitude] pairs
- Methods starting with `_` are queries that return data without side effects
- The backend automatically handles synchronization between concepts (e.g., creating a log triggers recommendation refresh)
