# PlaceDirectory Concept Specification

## Overview
The PlaceDirectory concept manages information about matcha places, including their locations, preparation styles, pricing, and other details.

## State

### Types
- `PlaceId`: Unique identifier for a place
- `URL`: String representing a URL

### State Components
- `places`: A collection of `Place` objects, each containing:
  - `_id`: PlaceId - unique identifier
  - `name`: string - the name of the place
  - `address`: string - the physical address
  - `coordinates`: [number, number] - geographical coordinates [longitude, latitude]
  - `preparationStyles`: string[] - array of preparation styles offered
  - `priceRange`: string - price range indicator (e.g., "$", "$$", "$$$")
  - `hours`: string (optional) - operating hours
  - `photos`: URL[] (optional) - array of photo URLs

## Actions

### `create_place({name, address, coords, styles, priceRange, hours?, photos?})`
Adds a new place to the directory.

**Parameters:**
- `name`: string - the name of the place
- `address`: string - the physical address
- `coords`: [number, number] - geographical coordinates [longitude, latitude]
- `styles`: string[] - preparation styles offered
- `priceRange`: string - price range indicator
- `hours`: string (optional) - operating hours
- `photos`: URL[] (optional) - photo URLs

**Returns:** PlaceId | {error: string} - the created place ID or error object

**Preconditions:**
- `name` must be non-empty
- `address` must be non-empty

**Postconditions:**
- A new place is added to the places collection
- The place has a unique `_id`

### `edit_place({placeId, name?, address?, coords?, styles?, priceRange?, hours?, photos?})`
Updates an existing place with new information.

**Parameters:**
- `placeId`: PlaceId - the place to update
- `name`: string (optional) - new name
- `address`: string (optional) - new address
- `coords`: [number, number] (optional) - new coordinates
- `styles`: string[] (optional) - new preparation styles
- `priceRange`: string (optional) - new price range
- `hours`: string (optional) - new operating hours
- `photos`: URL[] (optional) - new photo URLs

**Returns:** Record<PropertyKey, never> | {error: string} - empty object on success or error object

**Preconditions:**
- The place with `placeId` must exist

**Postconditions:**
- Only the specified fields are updated
- Other fields remain unchanged

### `delete_place({placeId})`
Removes a place from the directory.

**Parameters:**
- `placeId`: PlaceId - the place to delete

**Returns:** Record<PropertyKey, never> | {error: string} - empty object on success or error object

**Preconditions:**
- The place with `placeId` must exist

**Postconditions:**
- The place is removed from the places collection

## Queries

### `find_nearby({coords, radius})`
Finds places within a specified radius of given coordinates.

**Parameters:**
- `coords`: [number, number] - center coordinates [longitude, latitude]
- `radius`: number - search radius in kilometers

**Returns:** PlaceId[] - array of place IDs within the radius

**Preconditions:**
- `radius` must be greater than 0

### `search_by_name({query})`
Searches for places by name using case-insensitive matching.

**Parameters:**
- `query`: string - search term

**Returns:** PlaceId[] - array of matching place IDs

### `filter_places({priceRange?, hours?, style?})`
Filters places based on specified criteria.

**Parameters:**
- `priceRange`: string (optional) - exact price range match
- `hours`: string (optional) - exact hours match
- `style`: string (optional) - preparation style to filter by

**Returns:** PlaceId[] - array of place IDs matching the criteria

### `get_details({placeId})`
Retrieves detailed information about a specific place.

**Parameters:**
- `placeId`: PlaceId - the place to get details for

**Returns:** Place | {error: string} - place details or error object

**Preconditions:**
- The place with `placeId` must exist
