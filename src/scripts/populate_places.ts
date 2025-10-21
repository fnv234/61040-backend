/**
 * Script to populate the database with matcha places from Google Places API
 * 
 * Usage:
 * 1. Set GOOGLE_PLACES_API_KEY environment variable
 * 2. Run: deno task populate-places
 * 
 * You can also specify a location:
 * deno task populate-places --lat=42.3601 --lng=-71.0942 --radius=10000
 */

import { getDb } from "@utils/database.ts";
import { searchMatchaPlaces, convertGooglePlaceToPlace } from "../utils/google_places.ts";
import { parseArgs } from "jsr:@std/cli/parse-args";

// Parse command-line arguments
const flags = parseArgs(Deno.args, {
  string: ["lat", "lng", "radius"],
  default: {
    lat: "42.3601",  // Boston/Cambridge default
    lng: "-71.0942",
    radius: "10000"  // 10km
  },
});

const lat = parseFloat(flags.lat);
const lng = parseFloat(flags.lng);
const radius = parseInt(flags.radius, 10);

async function main() {
  console.log("🍵 Matcha Places Database Population Script");
  console.log("==========================================\n");

  // Check for API key
  const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
  if (!apiKey) {
    console.error("❌ Error: GOOGLE_PLACES_API_KEY environment variable not set!");
    console.log("\nTo use this script:");
    console.log("1. Get a Google Places API key from: https://console.cloud.google.com/");
    console.log("2. Enable the Places API");
    console.log("3. Set the environment variable:");
    console.log("   export GOOGLE_PLACES_API_KEY='your-api-key-here'");
    console.log("\nOr run with the key:");
    console.log("   GOOGLE_PLACES_API_KEY='your-key' deno task populate-places\n");
    Deno.exit(1);
  }

  console.log(`📍 Searching for matcha places near: ${lat}, ${lng}`);
  console.log(`📏 Search radius: ${radius}m (${(radius / 1000).toFixed(1)}km)\n`);

  // Connect to database
  const [db] = await getDb();
  const placesCollection = db.collection("PlaceDirectory.places");

  // Search for places
  console.log("🔍 Searching Google Places API...");
  const googlePlaces = await searchMatchaPlaces(lat, lng, radius);
  
  if (googlePlaces.length === 0) {
    console.log("\n⚠️  No places found. Try:");
    console.log("   - Increasing the search radius");
    console.log("   - Changing the location");
    console.log("   - Checking your API key has Places API enabled\n");
    Deno.exit(0);
  }

  console.log(`✅ Found ${googlePlaces.length} places from Google\n`);

  // Convert and insert places
  let inserted = 0;
  let skipped = 0;

  for (const googlePlace of googlePlaces) {
    try {
      // Check if place already exists (by name and approximate location)
      const existing = await placesCollection.findOne({
        name: googlePlace.name,
        "coordinates.0": {
          $gte: googlePlace.geometry.location.lng - 0.001,
          $lte: googlePlace.geometry.location.lng + 0.001
        },
        "coordinates.1": {
          $gte: googlePlace.geometry.location.lat - 0.001,
          $lte: googlePlace.geometry.location.lat + 0.001
        }
      });

      if (existing) {
        console.log(`⏭️  Skipping "${googlePlace.name}" (already exists)`);
        skipped++;
        continue;
      }

      // Convert to our format
      const place = convertGooglePlaceToPlace(googlePlace);

      // Insert into database
      await placesCollection.insertOne({
        ...place,
        _id: crypto.randomUUID()
      });

      console.log(`✅ Added: ${place.name}`);
      console.log(`   📍 ${place.address}`);
      console.log(`   💰 ${place.priceRange} | 🍵 ${place.preparationStyles.join(", ")}\n`);
      inserted++;

    } catch (error) {
      console.error(`❌ Error adding "${googlePlace.name}":`, error.message);
    }
  }

  console.log("\n==========================================");
  console.log(`✅ Successfully added ${inserted} new places`);
  console.log(`⏭️  Skipped ${skipped} existing places`);
  console.log(`📊 Total places in database: ${await placesCollection.countDocuments()}`);
  console.log("==========================================\n");

  Deno.exit(0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  Deno.exit(1);
});
