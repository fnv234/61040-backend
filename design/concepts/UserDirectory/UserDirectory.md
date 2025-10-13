# UserDirectory Concept Specification

## Overview
The UserDirectory concept manages user accounts, their saved places, and preferences for the matcha tracking application.

## State

### Types
- `UserId`: Unique identifier for a user
- `PlaceId`: Unique identifier for a place

### State Components
- `users`: A collection of `User` objects, each containing:
  - `_id`: UserId - unique identifier
  - `displayName`: string - user's display name
  - `email`: string - user's email address
  - `savedPlaces`: PlaceId[] - array of saved place IDs
  - `preferences`: Record<string, any> - user preferences as key-value pairs

## Actions

### `register_user({userId, displayName, email})`
Creates a new user account.

**Parameters:**
- `userId`: UserId - unique identifier for the user
- `displayName`: string - user's display name
- `email`: string - user's email address

**Returns:** UserId | {error: string} - the created user ID or error object

**Preconditions:**
- `userId` must not already exist
- `displayName` must be non-empty
- `email` must be non-empty

**Postconditions:**
- A new user is added to the users collection
- `savedPlaces` is initialized as an empty array
- `preferences` is initialized as an empty object

### `save_place({userId, placeId})`
Adds a place to a user's saved places list.

**Parameters:**
- `userId`: UserId - the user saving the place
- `placeId`: PlaceId - the place to save

**Returns:** Record<PropertyKey, never> | {error: string} - empty object on success or error object

**Preconditions:**
- The user with `userId` must exist
- If the place is already saved, no error is thrown (idempotent operation)

**Postconditions:**
- The place is added to the user's `savedPlaces` array if not already present

### `unsave_place({userId, placeId})`
Removes a place from a user's saved places list.

**Parameters:**
- `userId`: UserId - the user unsaving the place
- `placeId`: PlaceId - the place to unsave

**Returns:** Record<PropertyKey, never> | {error: string} - empty object on success or error object

**Preconditions:**
- The user with `userId` must exist
- The place must be in the user's `savedPlaces` array

**Postconditions:**
- The place is removed from the user's `savedPlaces` array

### `update_preferences({userId, newPrefs})`
Updates a user's preferences.

**Parameters:**
- `userId`: UserId - the user to update
- `newPrefs`: Record<string, any> - new preferences to set

**Returns:** Record<PropertyKey, never> | {error: string} - empty object on success or error object

**Preconditions:**
- The user with `userId` must exist

**Postconditions:**
- The user's `preferences` are completely replaced with `newPrefs`

## Queries

### `get_saved_places({userId})`
Retrieves all saved places for a user.

**Parameters:**
- `userId`: UserId - the user to query

**Returns:** PlaceId[] | {error: string} - array of saved place IDs or error object

**Preconditions:**
- The user with `userId` must exist

### `get_user_info({userId})`
Retrieves basic user information.

**Parameters:**
- `userId`: UserId - the user to query

**Returns:** {displayName: string, email: string} | {error: string} - user info or error object

**Preconditions:**
- The user with `userId` must exist
