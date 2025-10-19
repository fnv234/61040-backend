[@concept-design-overview](../../background/concept-design-overview.md)

[@concept-specifications](../../background/concept-specifications.md)

[@implementing-concepts](../../background/implementing-concepts.md)

[@no_mistakes](../../no_mistakes.md)

## FOR REFERENCE - full implementation in src/concepts/PlaceDirectory/PlaceDirectoryConcept.ts

# implement: PlaceDirectory

# file: src/PlaceDirectory/PlaceDirectoryConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";
import { refreshRecommendationsAfterNewLog } from "../../syncs/recommendations.ts"; // Import the sync function

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
   * create_place(name: String, address: String, coords: (Float, Float), styles: set String, priceRange: String, hours: String?): PlaceId
   *
   * **requires** name and address are non-empty
   * **effects** adds new Place with placeId and all given attributes to the set of Places
   *
   * @param name The name of the place.
   * @param address The address of the place.
   * @param coords The geographical coordinates of the place [longitude, latitude].
   * @param styles The set of preparation styles offered by the place.
   * @param priceRange The price range of the place.
   * @param hours The operating hours of the place (optional).
   * @param photos The set of photo URLs for the place (optional).
   * @returns A dictionary with the unique identifier of the newly created place, or an error object.
   */
  async create_place({
    name,
    address,
    coords,
    styles,
    priceRange,
    hours,
    photos,
  }: {
    name: string;
    address: string;
    coords: [number, number];
    styles: string[];
    priceRange: string;
    hours?: string;
    photos?: URL[];
  }): Promise<{ placeId: PlaceId } | { error: string }> {
    if (!name || !address) {
      return { error: "Name and address must be non-empty." };
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
      photos: photos || [], // Use provided photos or empty array
    };

    await this.places.insertOne(newPlace);

    // --- SYNC IMPLEMENTATION FOR GlobalPlaceRecommendationSync ---
    // When a new place is added, we need to re-evaluate recommendations for all users.
    const userCollection = this.db.collection("UserDirectory.users");
    const allUsers = await userCollection.find({}, { projection: { _id: 1 } }).toArray();
    for (const user of allUsers) {
      await refreshRecommendationsAfterNewLog(this.db, user._id.toString() as ID);
    }
    // --- END SYNC IMPLEMENTATION ---
    return { placeId };
  }

  /**
   * edit_place(placeId: PlaceId, name: String?, address: String?, coords: (Float, Float)?, styles: set String?, priceRange: String?, hours: String?, photos: set URL?)
   *
   * **requires** placeId in {p.placeId | p in the set of Places}
   * **effects** update place where p.placeId = placeId with any non-null parameters
   *
   * @param placeId The ID of the place to update.
   * @param name The new name of the place (optional).
   * @param address The new address of the place (optional).
   * @param coords The new geographical coordinates of the place (optional).
   * @param styles The new set of preparation styles offered by the place (optional).
   * @param priceRange The new price range of the place (optional).
   * @param hours The new operating hours of the place (optional).
   * @param photos The new set of photo URLs for the place (optional).
   * @returns An empty dictionary upon successful update, or an error object.
   */
  async edit_place({
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
  }): Promise<Record<PropertyKey, never> | { error: string }> {
    const update: Partial<Place> = {};
    if (name !== undefined) update.name = name;
    if (address !== undefined) update.address = address;
    if (coords !== undefined) update.coordinates = coords;
    if (styles !== undefined) update.preparationStyles = styles;
    if (priceRange !== undefined) update.priceRange = priceRange;
    if (hours !== undefined) update.hours = hours;
    if (photos !== undefined) update.photos = photos;

    if (Object.keys(update).length === 0) {
      return { error: "No update fields provided." };
    }

    const result = await this.places.updateOne({ _id: placeId }, { $set: update });

    if (result.matchedCount === 0) {
      return { error: `Place with ID ${placeId} not found.` };
    }

    return {};
  }

  /**
   * delete_place(placeId: PlaceId)
   *
   * **requires** placeId in {p.placeId | p in the set of Places}
   * **effects** removes p where p.placeId = placeId from the set of Places
   *
   * @param placeId The ID of the place to delete.
   * @returns An empty dictionary upon successful deletion, or an error object.
   */
  async delete_place(
    { placeId }: { placeId: PlaceId },
  ): Promise<Record<PropertyKey, never> | { error: string }> {
    const result = await this.places.deleteOne({ _id: placeId });

    if (result.deletedCount === 0) {
      return { error: `Place with ID ${placeId} not found.` };
    }

    return {};
  }

  /**
   * _find_nearby(coords: (Float, Float), radius: Float): set PlaceId
   *
   * **requires** radius > 0
   * **effects** return {p.placeId | p in the set of Places and distance(p.coordinates, coords) <= radius}
   *
   * @param coords The reference coordinates [longitude, latitude].
   * @param radius The search radius in kilometers.
   * @returns A dictionary with a set of PlaceIds that are nearby.
   */
  async _find_nearby({
    coords,
    radius,
  }: {
    coords: [number, number];
    radius: number;
  }): Promise<{ placeIds: PlaceId[] } | { error: string }> {
    if (radius <= 0) {
      return { error: "Radius must be greater than 0." };
    }

    // For testing purposes, use a simple distance calculation instead of MongoDB geospatial queries
    // This avoids the need for geospatial indexes and configuration.
    const allPlaces = await this.places.find({}).toArray();

    const nearbyPlaces = allPlaces.filter((place) => {
      const [lon1, lat1] = coords;
      const [lon2, lat2] = place.coordinates;

      // Simple Euclidean distance approximation, scaled for rough km.
      // (1 degree of latitude approx 111 km, longitude varies)
      const dx = (lon2 - lon1) * Math.cos((lat1 + lat2) / 2 * Math.PI / 180); // Adjust for longitude scaling
      const dy = lat2 - lat1;
      const distance = Math.sqrt(dx * dx + dy * dy) * 111.32; // Approx km per degree

      return distance <= radius;
    });

    return { placeIds: nearbyPlaces.map((p) => p._id) };
  }

  /**
   * _search_by_name(query: String): set PlaceId
   *
   * **effects** return {p.placeId | p in the set of Places and query in p.name}
   *
   * @param query The search query string.
   * @returns A dictionary with a set of PlaceIds matching the name query.
   */
  async _search_by_name(
    { query }: { query: string },
  ): Promise<{ placeIds: PlaceId[] }> {
    const results = await this.places
      .find({
        name: { $regex: query, $options: "i" }, // Case-insensitive search
      })
      .toArray();

    return { placeIds: results.map((p) => p._id) };
  }

  /**
   * _filter_places(priceRange: String?, hours: String?, style: String?): set PlaceId
   *
   * **effects** return {p.placeId | p in the set of Places
   *   and (priceRange = null or p.priceRange = priceRange)
   *   and (hours = null or p.hours = hours)
   *   and (style = null or style in p.preparationStyles)}
   *
   * @param priceRange The desired price range (optional).
   * @param hours The desired operating hours (optional).
   * @param style The desired preparation style (optional).
   * @returns A dictionary with a set of PlaceIds matching the filter criteria.
   */
  async _filter_places({
    priceRange,
    hours,
    style,
  }: {
    priceRange?: string;
    hours?: string;
    style?: string;
  }): Promise<{ placeIds: PlaceId[] }> {
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

    const results = await this.places.find(filter).toArray();
    return { placeIds: results.map((p) => p._id) };
  }

  /**
   * _get_details(placeId: PlaceId): Place
   *
   * **requires** placeId in {p.placeId | p in the set of Places}
   * **effects** return p where p.placeId = placeId
   *
   * @param placeId The ID of the place to retrieve details for.
   * @returns A dictionary with the Place object, or an error object.
   */
  async _get_details(
    { placeId }: { placeId: PlaceId },
  ): Promise<{ place: Place } | { error: string }> {
    const place = await this.places.findOne({ _id: placeId });

    if (!place) {
      return { error: `Place with ID ${placeId} not found.` };
    }

    return { place };
  }
}
```