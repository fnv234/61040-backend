[@api-extraction-from-spec](api-extraction-from-spec.md)

[@RecommendationEngine](../../src/concepts/RecommendationEngine/RecommendationEngineConcept.ts)

[@ExperienceLog](../../src/concepts/ExperienceLog/ExperienceLogConcept.ts)

[@PlaceDirectory](../../src/concepts/PlaceDirectory/PlaceDirectoryConcept.ts)

[@UserDirectory](../../src/concepts/UserDirectory/UserDirectoryConcept.ts)

[@ud-spec](../concepts/UserDirectory/UserDirectory_spec.md)

[@pd-spec](../concepts/PlaceDirectory/PlaceDirectory_spec.md)

[@el-spec](../concepts/ExperienceLog/ExperienceLog_spec.md)

[@re-spec](../concepts/RecommendationEngine/RecommendationEngine_spec.md)

[@concept-server](../../src/concept_server.ts)

# Extracting from code

The following is an explanation of how concepts are implemented, for the purposes of understanding how to extract an API.

[@implementing-concepts](../background/implementing-concepts.md)

# prompt: 

Now, analyze the following Concept Implementation and generate the API documentation based on these instructions.
# response:

# API Specification: UserDirectory Concept

**Purpose:** represent app users with identity, preferences, and saved places

---

## API Endpoints

### POST /api/UserDirectory/register_user

**Description:** Registers a new user with the given userId, display name, and email.

**Requirements:**
- userId not in {u.userId | u in the set of Users} and displayName, email are non-empty

**Effects:**
- adds new User with given attributes and empty savedPlaces, preferences to the set of Users

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

---

### POST /api/UserDirectory/save_place

**Description:** Saves a place to a user's list of saved places.

**Requirements:**
- userId in {u.userId | u in the set of Users}

**Effects:**
- update user u where u.userId = userId: u.savedPlaces' = u.savedPlaces + {placeId}

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

---

### POST /api/UserDirectory/unsave_place

**Description:** Removes a place from a user's list of saved places.

**Requirements:**
- userId in {u.userId | u in the set of Users} and placeId in user.savedPlaces

**Effects:**
- update user u where u.userId = userId: u.savedPlaces' = u.savedPlaces - {placeId}

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

---

### POST /api/UserDirectory/update_preferences

**Description:** Updates a user's preferences.

**Requirements:**
- userId in {u.userId | u in the set of Users}

**Effects:**
- update user u where u.userId = userId: u.preferences' = newPrefs

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

---

### POST /api/UserDirectory/_get_saved_places

**Description:** Returns the set of place IDs saved by a specific user.

**Requirements:**
- userId in {u.userId | u in the set of Users}

**Effects:**
- return u.savedPlaces where u.userId = userId

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

---

# API Specification: PlaceDirectory Concept

**Purpose:** represent and manage known matcha-serving locations

---

## API Endpoints

### POST /api/PlaceDirectory/create_place

**Description:** Adds a new place with its details to the directory.

**Requirements:**
- name and address are non-empty

**Effects:**
- adds new Place with placeId and all given attributes to the set of Places

**Request Body:**
```json
{
  "name": "string",
  "address": "string",
  "coords": [
    0,
    0
  ],
  "styles": [
    "string"
  ],
  "priceRange": "string",
  "hours": "string"
}
```

**Success Response Body (Action):**
```json
{
  "placeId": "string"
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

**Description:** Updates the attributes of an existing place.

**Requirements:**
- placeId in {p.placeId | p in the set of Places}

**Effects:**
- update place where p.placeId = placeId with any non-null parameters

**Request Body:**
```json
{
  "placeId": "string",
  "name": "string",
  "address": "string",
  "coords": [
    0,
    0
  ],
  "styles": [
    "string"
  ],
  "priceRange": "string",
  "hours": "string",
  "photos": [
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

---

### POST /api/PlaceDirectory/delete_place

**Description:** Removes a place from the directory.

**Requirements:**
- placeId in {p.placeId | p in the set of Places}

**Effects:**
- removes p where p.placeId = placeId from the set of Places

**Request Body:**
```json
{
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

---

### POST /api/PlaceDirectory/_find_nearby

**Description:** Finds place IDs within a specified radius of given coordinates.

**Requirements:**
- radius > 0

**Effects:**
- return {p.placeId | p in the set of Places and distance(p.coordinates, coords) <= radius}

**Request Body:**
```json
{
  "coords": [
    0,
    0
  ],
  "radius": 0
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

---

### POST /api/PlaceDirectory/_search_by_name

**Description:** Searches for place IDs whose names match a given query string.

**Requirements:**
- (none)

**Effects:**
- return {p.placeId | p in the set of Places and query in p.name}

**Request Body:**
```json
{
  "query": "string"
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

---

### POST /api/PlaceDirectory/_filter_places

**Description:** Filters place IDs based on price range, operating hours, and/or preparation style.

**Requirements:**
- (none)

**Effects:**
- return {p.placeId | p in the set of Places
  and (priceRange = null or p.priceRange = priceRange)
  and (hours = null or p.hours = hours)
  and (style = null or style in p.preparationStyles)}

**Request Body:**
```json
{
  "priceRange": "string",
  "hours": "string",
  "style": "string"
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

---

### POST /api/PlaceDirectory/_get_details

**Description:** Retrieves the full details of a specific place.

**Requirements:**
- placeId in {p.placeId | p in the set of Places}

**Effects:**
- return p where p.placeId = placeId

**Request Body:**
```json
{
  "placeId": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "_id": "string",
    "name": "string",
    "address": "string",
    "coordinates": [
      0,
      0
    ],
    "preparationStyles": [
      "string"
    ],
    "priceRange": "string",
    "hours": "string",
    "photos": [
      "string"
    ]
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

# API Specification: ExperienceLog Concept

**Purpose:** capture a user's personal experience at a place with structured ratings and notes, and enable AI-powered insights about their overall preferences and trends

---

## API Endpoints

### POST /api/ExperienceLog/create_log

**Description:** Creates a new log entry for a user's experience at a place.

**Requirements:**
- rating is in the inclusive range [1,5]

**Effects:**
- adds new Log with new logId, given params, timestamp = now() to the set of Logs

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

---

### POST /api/ExperienceLog/update_log

**Description:** Updates an existing log entry with new values.

**Requirements:**
- logId in {log.logId | log in the set of Logs} and if rating given then rating is in the inclusive range [1,5]

**Effects:**
- update log where log.logId = logId with non-null parameters

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

---

### POST /api/ExperienceLog/delete_log

**Description:** Deletes a log entry.

**Requirements:**
- logId in {log.logId | log in Logs}

**Effects:**
- Logs' = Logs - {log | log.logId = logId}

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

---

### POST /api/ExperienceLog/_get_user_logs

**Description:** Returns all log entries for a specific user.

**Requirements:**
- (none)

**Effects:**
- return {log | log in the set of Logs and log.userId = userId}

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

---

### POST /api/ExperienceLog/_get_place_logs

**Description:** Returns log entries for a specific user at a specific place.

**Requirements:**
- (none)

**Effects:**
- return {log | log in the set of Logs and log.userId = userId and log.placeId = placeId}

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

---

### POST /api/ExperienceLog/_get_average_rating

**Description:** Returns the average rating given by a user for a specific place.

**Requirements:**
- (none)

**Effects:**
- return average of {log.rating | log in the set of Logs and log.userId = userId and log.placeId = placeId}

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

---

### POST /api/ExperienceLog/_get_tried_places

**Description:** Returns a set of place IDs that a user has logged experiences for.

**Requirements:**
- (none)

**Effects:**
- return {log.placeId | log in Logs and log.userId = userId}

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

---

### POST /api/ExperienceLog/generate_profile_summary

**Description:** Generates a concise textual summary describing the user's preferences and patterns based on their logs.

**Requirements:**
- there exists at least one log in the set of Logs with log.userId = userId

**Effects:**
- calls llm with the user's Logs (ratings, sweetness, strength, notes, and places)
  and returns a concise textual summary describing the user's preferences and patterns
- **validators**:
  - summary must not mention places not in user's logs
  - summary must be <= 3 sentences
  - sentiment of summary should align with overall average rating

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

---

# API Specification: RecommendationEngine Concept

**Purpose:** suggest places for users to try based on basic matching criteria

---

## API Endpoints

### POST /api/RecommendationEngine/get_recommendations

**Description:** Returns personalized place recommendations for a user, potentially from cache if recent.

**Requirements:**
- (none)

**Effects:**
- return recommendations[userId] if exists and recent; otherwise compute fresh

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

---

### POST /api/RecommendationEngine/refresh_recommendations

**Description:** Recomputes and updates a user's personalized place recommendations.

**Requirements:**
- (none)

**Effects:**
- recommendations[userId] = compute_suggestions(savedPlaces, preferences, triedPlaces),
  lastUpdated[userId] = now()

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

---

### POST /api/RecommendationEngine/clear_recommendations

**Description:** Removes a user's recommendations and their last update timestamp.

**Requirements:**
- (none)

**Effects:**
- remove recommendations[userId] and lastUpdated[userId]

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

---