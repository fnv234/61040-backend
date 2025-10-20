---
timestamp: 'Mon Oct 20 2025 12:08:50 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_120850.7a670c7e.md]]'
content_id: d6f9ccbd4e04311a63d2394e10bfe61e3449ba10fc47474b847c3a9e67baaf95
---

# API Specification: PlaceDirectory Concept

**Purpose:** represent and manage known matcha-serving locations

***

## API Endpoints

### POST /api/PlaceDirectory/create\_place

**Description:** Adds a new place with its details to the directory.

**Requirements:**

* name and address are non-empty

**Effects:**

* adds new Place with placeId and all given attributes to the set of Places

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

***

### POST /api/PlaceDirectory/edit\_place

**Description:** Updates the attributes of an existing place.

**Requirements:**

* placeId in {p.placeId | p in the set of Places}

**Effects:**

* update place where p.placeId = placeId with any non-null parameters

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

***

### POST /api/PlaceDirectory/delete\_place

**Description:** Removes a place from the directory.

**Requirements:**

* placeId in {p.placeId | p in the set of Places}

**Effects:**

* removes p where p.placeId = placeId from the set of Places

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

***

### POST /api/PlaceDirectory/\_find\_nearby

**Description:** Finds place IDs within a specified radius of given coordinates.

**Requirements:**

* radius > 0

**Effects:**

* return {p.placeId | p in the set of Places and distance(p.coordinates, coords) <= radius}

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

***

### POST /api/PlaceDirectory/\_search\_by\_name

**Description:** Searches for place IDs whose names match a given query string.

**Requirements:**

* (none)

**Effects:**

* return {p.placeId | p in the set of Places and query in p.name}

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

***

### POST /api/PlaceDirectory/\_filter\_places

**Description:** Filters place IDs based on price range, operating hours, and/or preparation style.

**Requirements:**

* (none)

**Effects:**

* return {p.placeId | p in the set of Places
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

***

### POST /api/PlaceDirectory/\_get\_details

**Description:** Retrieves the full details of a specific place.

**Requirements:**

* placeId in {p.placeId | p in the set of Places}

**Effects:**

* return p where p.placeId = placeId

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

***
