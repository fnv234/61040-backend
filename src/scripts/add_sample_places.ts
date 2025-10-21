/**
 * Add sample matcha places to the database for testing
 */

import { getDb } from "@utils/database.ts";

const samplePlaces = [
  {
    _id: crypto.randomUUID(),
    name: "Cha-An Tea House",
    address: "230 E 9th St, New York, NY 10003",
    coordinates: [-73.9857, 40.7282] as [number, number],
    preparationStyles: ["Ceremonial", "Latte", "Dessert"],
    priceRange: "$$",
    hours: "Mon-Sun: 1pm-10pm",
    photos: []
  },
  {
    _id: crypto.randomUUID(),
    name: "Matcha Cafe Maiko",
    address: "370 Lexington Ave, New York, NY 10017",
    coordinates: [-73.9771, 40.7505] as [number, number],
    preparationStyles: ["Latte", "Iced", "Dessert"],
    priceRange: "$",
    hours: "Mon-Sun: 11am-9pm",
    photos: []
  },
  {
    _id: crypto.randomUUID(),
    name: "Kettl Tea",
    address: "74 Orchard St, New York, NY 10002",
    coordinates: [-73.9904, 40.7176] as [number, number],
    preparationStyles: ["Ceremonial"],
    priceRange: "$$$",
    hours: "Wed-Sun: 11am-6pm",
    photos: []
  },
  {
    _id: crypto.randomUUID(),
    name: "Ippodo Tea Boston",
    address: "800 Boylston St, Boston, MA 02199",
    coordinates: [-71.0818, 42.3478] as [number, number],
    preparationStyles: ["Ceremonial", "Latte"],
    priceRange: "$$",
    hours: "Mon-Sat: 10am-8pm, Sun: 11am-7pm",
    photos: []
  },
  {
    _id: crypto.randomUUID(),
    name: "Tealuxe",
    address: "0 Brattle St, Cambridge, MA 02138",
    coordinates: [-71.1190, 42.3736] as [number, number],
    preparationStyles: ["Ceremonial", "Latte", "Iced"],
    priceRange: "$$",
    hours: "Mon-Sun: 8am-10pm",
    photos: []
  },
  {
    _id: crypto.randomUUID(),
    name: "Ogawa Coffee",
    address: "10 Milk St, Boston, MA 02108",
    coordinates: [-71.0570, 42.3577] as [number, number],
    preparationStyles: ["Latte", "Iced"],
    priceRange: "$$",
    hours: "Mon-Fri: 7am-7pm, Sat-Sun: 8am-6pm",
    photos: []
  },
  {
    _id: crypto.randomUUID(),
    name: "Gracenote Coffee",
    address: "108 Lincoln St, Boston, MA 02111",
    coordinates: [-71.0542, 42.3508] as [number, number],
    preparationStyles: ["Latte", "Iced"],
    priceRange: "$",
    hours: "Mon-Fri: 7am-5pm, Sat-Sun: 8am-4pm",
    photos: []
  },
  {
    _id: crypto.randomUUID(),
    name: "Cafe Madeleine",
    address: "517 Columbus Ave, Boston, MA 02118",
    coordinates: [-71.0788, 42.3429] as [number, number],
    preparationStyles: ["Latte", "Dessert"],
    priceRange: "$$",
    hours: "Mon-Sun: 7am-7pm",
    photos: []
  }
];

async function main() {
  console.log("🍵 Adding Sample Matcha Places");
  console.log("==============================\n");

  const [db] = await getDb();
  const placesCollection = db.collection("PlaceDirectory.places");

  let added = 0;
  let skipped = 0;

  for (const place of samplePlaces) {
    try {
      // Check if place already exists
      const existing = await placesCollection.findOne({ name: place.name });
      
      if (existing) {
        console.log(`⏭️  Skipping "${place.name}" (already exists)`);
        skipped++;
        continue;
      }

      await placesCollection.insertOne(place);
      console.log(`✅ Added: ${place.name}`);
      console.log(`   📍 ${place.address}`);
      console.log(`   💰 ${place.priceRange} | 🍵 ${place.preparationStyles.join(", ")}\n`);
      added++;
    } catch (error) {
      console.error(`❌ Error adding "${place.name}":`, error.message);
    }
  }

  console.log("\n==============================");
  console.log(`✅ Successfully added ${added} places`);
  console.log(`⏭️  Skipped ${skipped} existing places`);
  console.log(`📊 Total places in database: ${await placesCollection.countDocuments()}`);
  console.log("==============================\n");

  Deno.exit(0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  Deno.exit(1);
});
