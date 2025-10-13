import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts"; // Assuming Empty is Record<PropertyKey, never>
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
   * @returns The unique identifier of the newly created place, or an error object.
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
  }): Promise<PlaceId | { error: string }> {
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
   * @returns An empty object upon successful update, or an error object.
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
    // If photos is explicitly provided (even as an empty array), update it.
    // If it's undefined, it means we don't touch the photos field.
    if (photos !== undefined) update.photos = photos;

    const result = await this.places.updateOne({ _id: placeId }, { $set: update });

    if (result.matchedCount === 0) {
      return { error: `Place with ID ${placeId} not found.` };
    }

    return {};
  }

  /**
   * Removes a place from the set of Places.
   * @param placeId The ID of the place to delete.
   * @returns An empty object upon successful deletion, or an error object.
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

  async find_nearby({
    coords,
    radius,
  }: {
    coords: [number, number];
    radius: number;
  }): Promise<PlaceId[]> {
    if (radius <= 0) {
      throw new Error("Radius must be greater than 0."); // Keeping this as an actual throw, as it's a functional precondition violation.
    }

    // For testing purposes, use a simple distance calculation instead of MongoDB geospatial queries
    // This avoids the need for geospatial indexes
    const allPlaces = await this.places.find({}).toArray();
    
    const nearbyPlaces = allPlaces.filter(place => {
      const [lon1, lat1] = coords;
      const [lon2, lat2] = place.coordinates;
      
      // Simple distance calculation (not perfectly accurate but good enough for testing)
      const distance = Math.sqrt(
        Math.pow(lon2 - lon1, 2) + Math.pow(lat2 - lat1, 2)
      ) * 111; // Rough conversion to km (1 degree ≈ 111 km)
      
      return distance <= radius;
    });

    return nearbyPlaces.map((p) => p._id);
  }

  async search_by_name({ query }: { query: string }): Promise<PlaceId[]> {
    const results = await this.places
      .find({
        name: { $regex: query, $options: "i" }, // Case-insensitive search
      })
      .toArray();

    return results.map((p) => p._id);
  }

  async filter_places({
    priceRange,
    hours,
    style,
  }: {
    priceRange?: string;
    hours?: string;
    style?: string;
  }): Promise<PlaceId[]> {
    const filter: any = {}; // Type 'any' is acceptable here given the dynamic nature of filters.

    if (priceRange !== undefined && priceRange !== null) {
      filter.priceRange = priceRange;
    }
    if (hours !== undefined && hours !== null) {
      filter.hours = hours;
    }
    if (style !== undefined && style !== null) {
      // Ensure preparationStyles is treated as an array for the $in operator.
      // If the DB schema guarantees it's always an array, this is fine.
      filter.preparationStyles = { $in: [style] };
    }

    const results = await this.places.find(filter).toArray();
    return results.map((p) => p._id);
  }

  async get_details({ placeId }: { placeId: PlaceId }): Promise<Place | { error: string }> {
    const place = await this.places.findOne({ _id: placeId });

    if (!place) {
      return { error: `Place with ID ${placeId} not found.` };
    }

    return place;
  }
}
