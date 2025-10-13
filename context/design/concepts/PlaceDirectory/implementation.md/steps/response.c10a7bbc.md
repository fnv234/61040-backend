---
timestamp: 'Sun Oct 12 2025 20:38:08 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_203808.3f1eb195.md]]'
content_id: c10a7bbcb5eef3058b8fb50c111c2bad607f511d30260df230b45571c8e75f30
---

# response:

```typescript
import { Collection, Db } from "npm:mongodb";
import { ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Generic types of this concept
type PlaceId = ID;
type URL = string; // Assuming URL is a string for simplicity

// Constants for collection prefixes
const PREFIX = "PlaceDirectory" + ".";

// State interfaces
interface Place {
  _id: PlaceId;
  name: string;
  address: string;
  coordinates: [number, number]; // [longitude, latitude]
  preparationStyles: string[];
  priceRange: string;
  hours?: string;
  photos?: URL[];
}

export default class PlaceDirectoryConcept {
  places: Collection<Place>;

  constructor(private readonly db: Db) {
    this.places = this.db.collection(PREFIX + "places");
  }

  /**
   * Adds a new place with the given attributes to the set of Places.
   * @param name The name of the place.
   * @param address The address of the place.
   * @param coords The geographical coordinates of the place [longitude, latitude].
   * @param styles The set of preparation styles offered by the place.
   * @param priceRange The price range of the place.
   * @param hours The operating hours of the place (optional).
   * @returns The unique identifier of the newly created place.
   */
  create_place({
    name,
    address,
    coords,
    styles,
    priceRange,
    hours,
  }: {
    name: string;
    address: string;
    coords: [number, number];
    styles: string[];
    priceRange: string;
    hours?: string;
  }): PlaceId {
    if (!name || !address) {
      throw new Error("Name and address must be non-empty.");
    }

    const placeId: PlaceId = freshID();
    const newPlace: Place = {
      _id: placeId,
      name,
      address,
      coordinates: coords,
      preparationStyles: styles,
      priceRange,
      hours,
      photos: [], // Initialize photos as an empty array
    };

    this.places.insertOne(newPlace);
    return placeId;
  }

  /**
   * Updates an existing place with the given attributes.
   * @param placeId The ID of the place to update.
   * @param name The new name of the place (optional).
   * @param address The new address of the place (optional).
   * @param coords The new geographical coordinates of the place (optional).
   * @param styles The new set of preparation styles offered by the place (optional).
   * @param priceRange The new price range of the place (optional).
   * @param hours The new operating hours of the place (optional).
   * @param photos The new set of photo URLs for the place (optional).
   * @returns An empty object upon successful update.
   */
  edit_place({
    placeId,
    name,
    address,
    coords,
    styles,
    priceRange,
    hours,
    photos,
  }: {
    placeId: PlaceId;
    name?: string;
    address?: string;
    coords?: [number, number];
    styles?: string[];
    priceRange?: string;
    hours?: string;
    photos?: URL[];
  }): Record<PropertyKey, never> {
    const update: Partial<Place> = {};
    if (name !== undefined) update.name = name;
    if (address !== undefined) update.address = address;
    if (coords !== undefined) update.coordinates = coords;
    if (styles !== undefined) update.preparationStyles = styles;
    if (priceRange !== undefined) update.priceRange = priceRange;
    if (hours !== undefined) update.hours = hours;
    if (photos !== undefined) update.photos = photos;

    const result = this.places.updateOne({ _id: placeId }, { $set: update });

    if (result.matchedCount === 0) {
      throw new Error(`Place with ID ${placeId} not found.`);
    }

    return {};
  }

  /**
   * Removes a place from the set of Places.
   * @param placeId The ID of the place to delete.
   * @returns An empty object upon successful deletion.
   */
  delete_place({ placeId }: { placeId: PlaceId }): Record<PropertyKey, never> {
    const result = this.places.deleteOne({ _id: placeId });

    if (result.deletedCount === 0) {
      throw new Error(`Place with ID ${placeId} not found.`);
    }

    return {};
  }

  /**
   * Finds places within a specified radius of given coordinates.
   * @param coords The geographical coordinates [longitude, latitude].
   * @param radius The search radius in kilometers.
   * @returns A set of place IDs that are within the specified radius.
   */
  find_nearby({
    coords,
    radius,
  }: {
    coords: [number, number];
    radius: number;
  }): PlaceId[] {
    if (radius <= 0) {
      throw new Error("Radius must be greater than 0.");
    }

    // Using MongoDB's built-in geospatial query $nearSphere for efficiency
    const nearbyPlaces = this.places
      .find({
        coordinates: {
          $nearSphere: {
            $geometry: {
              type: "Point",
              coordinates: coords, // [longitude, latitude]
            },
            $maxDistance: radius * 1000, // Convert radius to meters for $maxDistance
          },
        },
      })
      .toArray();

    return nearbyPlaces.map((p) => p._id);
  }

  /**
   * Searches for places by name.
   * @param query The search query string.
   * @returns A set of place IDs whose names contain the query string.
   */
  search_by_name({ query }: { query: string }): PlaceId[] {
    const results = this.places
      .find({
        name: { $regex: query, $options: "i" }, // Case-insensitive search
      })
      .toArray();

    return results.map((p) => p._id);
  }

  /**
   * Filters places based on price range, hours, and preparation style.
   * @param priceRange The desired price range (optional).
   * @param hours The desired operating hours (optional).
   * @param style The desired preparation style (optional).
   * @returns A set of place IDs matching the filter criteria.
   */
  filter_places({
    priceRange,
    hours,
    style,
  }: {
    priceRange?: string;
    hours?: string;
    style?: string;
  }): PlaceId[] {
    const filter: any = {};
    if (priceRange !== undefined && priceRange !== null) {
      filter.priceRange = priceRange;
    }
    if (hours !== undefined && hours !== null) {
      filter.hours = hours;
    }
    if (style !== undefined && style !== null) {
      filter.preparationStyles = { $in: [style] };
    }

    const results = this.places.find(filter).toArray();
    return results.map((p) => p._id);
  }

  /**
   * Retrieves the detailed information for a specific place.
   * @param placeId The ID of the place to get details for.
   * @returns The complete Place object.
   */
  get_details({ placeId }: { placeId: PlaceId }): Place {
    const place = this.places.findOne({ _id: placeId });

    if (!place) {
      throw new Error(`Place with ID ${placeId} not found.`);
    }

    return place;
  }
}
```
