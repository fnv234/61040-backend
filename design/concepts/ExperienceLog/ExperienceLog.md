# ExperienceLog Concept Specification

## Overview
The ExperienceLog concept manages user matcha tasting logs, allowing users to record their experiences at different places with ratings, preferences, and notes.

## State

### Types
- `LogId`: Unique identifier for a log entry
- `UserId`: Unique identifier for a user
- `PlaceId`: Unique identifier for a place

### State Components
- `logs`: A collection of `Log` objects, each containing:
  - `_id`: LogId - unique identifier
  - `userId`: UserId - the user who created the log
  - `placeId`: PlaceId - the place being reviewed
  - `timestamp`: Date - when the log was created
  - `rating`: number (1-5) - overall rating of the experience
  - `sweetness`: number (1-5) - sweetness level preference
  - `strength`: number (1-5) - strength level preference
  - `notes`: string (optional) - additional notes about the experience
  - `photo`: string (optional) - URL to a photo of the experience

## Actions

### `createLog(userId, placeId, rating, sweetness, strength, notes?, photo?)`
Creates a new log entry for a user's experience at a place.

**Parameters:**
- `userId`: UserId - the user creating the log
- `placeId`: PlaceId - the place being reviewed
- `rating`: number - overall rating (must be 1-5)
- `sweetness`: number - sweetness preference (must be 1-5)
- `strength`: number - strength preference (must be 1-5)
- `notes`: string (optional) - additional notes
- `photo`: string (optional) - photo URL

**Returns:** Log - the created log entry

**Preconditions:**
- `rating` must be between 1 and 5
- `sweetness` must be between 1 and 5
- `strength` must be between 1 and 5

**Postconditions:**
- A new log entry is added to the logs collection
- The log has a unique `_id`
- The log has the current timestamp

### `updateLog(logId, updates)`
Updates an existing log entry with new information.

**Parameters:**
- `logId`: LogId - the log to update
- `updates`: Partial<Log> - the fields to update

**Returns:** Log - the updated log entry

**Preconditions:**
- The log with `logId` must exist
- If updating rating, sweetness, or strength, values must be 1-5

**Postconditions:**
- The specified fields of the log are updated
- Other fields remain unchanged

### `deleteLog(logId)`
Removes a log entry from the collection.

**Parameters:**
- `logId`: LogId - the log to delete

**Returns:** void

**Preconditions:**
- The log with `logId` must exist

**Postconditions:**
- The log is removed from the logs collection

## Queries

### `getTriedPlaces(userId)`
Returns all unique places a user has visited.

**Parameters:**
- `userId`: UserId - the user to query

**Returns:** PlaceId[] - array of unique place IDs the user has visited

### `getUserLogs(userId)`
Returns all logs created by a specific user.

**Parameters:**
- `userId`: UserId - the user to query

**Returns:** Log[] - array of all logs created by the user

### `getPlaceLogs(userId, placeId)`
Returns all logs for a specific user at a specific place.

**Parameters:**
- `userId`: UserId - the user to query
- `placeId`: PlaceId - the place to query

**Returns:** Log[] - array of logs for the user at the place

### `getAverageRating(userId, placeId)`
Calculates the average rating for a user at a specific place.

**Parameters:**
- `userId`: UserId - the user to query
- `placeId`: PlaceId - the place to query

**Returns:** number - average rating (0 if no logs exist)

## AI-Augmented Actions

### `generateProfileSummary(userId, llm)`
Generates an AI-powered summary of a user's matcha tasting profile based on their logs.

**Parameters:**
- `userId`: UserId - the user to generate a summary for
- `llm`: GeminiLLM - the LLM instance to use for generation

**Returns:** string - AI-generated profile summary

**Preconditions:**
- The user must have at least one log entry
- The LLM must be properly configured

**Postconditions:**
- A summary is generated based on the user's log history
- The summary is validated for accuracy and appropriateness

**Validation:**
- Summary must not reference places not in the user's logs
- Sentiment must be consistent with average ratings
- Summary must be concise (≤3 sentences, ≤120 words)
- Summary must end with proper punctuation
