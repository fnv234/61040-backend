/**
 * Google Places API integration for fetching matcha places
 * 
 * To use this, you need a Google Cloud API key with Places API enabled.
 * Set the GOOGLE_PLACES_API_KEY environment variable.
 */

const GOOGLE_PLACES_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY") || "AIzaSyCJd_BgINcrz_IM2-YtuZCERyAPs1-lpMk";
const PLACES_API_URL = "https://maps.googleapis.com/maps/api/place";

export interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  price_level?: number;
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  types: string[];
  rating?: number;
  user_ratings_total?: number;
}

/**
 * Search for matcha-related places near a location
 */
export async function searchMatchaPlaces(
  lat: number,
  lng: number,
  radius: number = 5000
): Promise<GooglePlace[]> {
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn("GOOGLE_PLACES_API_KEY not set. Skipping Google Places search.");
    return [];
  }

  const queries = [
    "matcha cafe",
    "matcha tea",
    "japanese tea house",
    "tea shop matcha"
  ];

  const allPlaces: GooglePlace[] = [];
  const seenPlaceIds = new Set<string>();

  for (const query of queries) {
    try {
      const url = `${PLACES_API_URL}/textsearch/json?query=${encodeURIComponent(query)}&location=${lat},${lng}&radius=${radius}&key=${GOOGLE_PLACES_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK" && data.results) {
        for (const place of data.results) {
          if (!seenPlaceIds.has(place.place_id)) {
            seenPlaceIds.add(place.place_id);
            allPlaces.push(place);
          }
        }
      } else if (data.status === "ZERO_RESULTS") {
        console.log(`No results for query: ${query}`);
      } else {
        console.error(`Google Places API error for "${query}":`, data.status, data.error_message);
      }
    } catch (error) {
      console.error(`Error searching for "${query}":`, error);
    }
  }

  return allPlaces;
}

/**
 * Get detailed information about a specific place
 */
export async function getPlaceDetails(placeId: string): Promise<GooglePlace | null> {
  if (!GOOGLE_PLACES_API_KEY) {
    return null;
  }

  try {
    const url = `${PLACES_API_URL}/details/json?place_id=${placeId}&fields=name,formatted_address,geometry,price_level,opening_hours,photos,types,rating,user_ratings_total&key=${GOOGLE_PLACES_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.result) {
      return data.result;
    } else {
      console.error("Google Places API error:", data.status, data.error_message);
      return null;
    }
  } catch (error) {
    console.error("Error getting place details:", error);
    return null;
  }
}

/**
 * Convert Google Place to our Place format
 */
export function convertGooglePlaceToPlace(googlePlace: GooglePlace) {
  // Determine preparation styles based on place types and name
  const preparationStyles: string[] = [];
  const nameLower = googlePlace.name.toLowerCase();
  const typesStr = googlePlace.types.join(" ").toLowerCase();

  if (nameLower.includes("ceremonial") || typesStr.includes("tea_house")) {
    preparationStyles.push("Ceremonial");
  }
  if (nameLower.includes("latte") || nameLower.includes("cafe") || typesStr.includes("cafe")) {
    preparationStyles.push("Latte");
  }
  if (nameLower.includes("iced") || nameLower.includes("cold")) {
    preparationStyles.push("Iced");
  }
  
  // Default to Latte if no specific style detected
  if (preparationStyles.length === 0) {
    preparationStyles.push("Latte");
  }

  // Convert price level to our format
  let priceRange = "$$";
  if (googlePlace.price_level !== undefined) {
    switch (googlePlace.price_level) {
      case 0:
      case 1:
        priceRange = "$";
        break;
      case 2:
        priceRange = "$$";
        break;
      case 3:
        priceRange = "$$$";
        break;
      case 4:
        priceRange = "$$$$";
        break;
    }
  }

  // Get hours text
  const hours = googlePlace.opening_hours?.weekday_text?.join(", ") || "Hours not available";

  // Get photo URLs (first 3)
  const photos: string[] = [];
  if (googlePlace.photos && googlePlace.photos.length > 0) {
    for (let i = 0; i < Math.min(3, googlePlace.photos.length); i++) {
      const photoRef = googlePlace.photos[i].photo_reference;
      photos.push(`https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoRef}&key=${GOOGLE_PLACES_API_KEY}`);
    }
  }

  return {
    name: googlePlace.name,
    address: googlePlace.formatted_address,
    coordinates: [
      googlePlace.geometry.location.lng,
      googlePlace.geometry.location.lat
    ] as [number, number],
    preparationStyles,
    priceRange,
    hours,
    photos
  };
}
