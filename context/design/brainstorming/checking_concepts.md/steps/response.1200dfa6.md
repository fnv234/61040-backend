---
timestamp: 'Sun Oct 19 2025 11:02:08 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_110208.5962f5a3.md]]'
content_id: 1200dfa6ce4f997bd1c2b1281749a0aa9f293e917952484c384e2df0a25b7841
---

# response:

```typescript
import {
  assertEquals,
  assertThrows,
} from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import PlaceDirectoryConcept from "./PlaceDirectoryConcept.ts";

Deno.test("PlaceDirectoryConcept", async (t) => {
  const [db, client] = await testDb();
  const placeDirectory = new PlaceDirectoryConcept(db);
  
  try {
    await db.collection("PlaceDirectory.places").deleteMany({});

  await t.step("create_place - successful creation", async () => {
    const placeId = await placeDirectory.create_place({
      name: "Example Cafe",
      address: "123 Main St",
      coords: [-74.006, 40.7128],
      styles: ["espresso", "pour-over"],
      priceRange: "$$",
      hours: "9am-5pm",
    });

    // Handle the return type properly
    if (typeof placeId === 'object' && 'error' in placeId) {
      throw new Error(`Failed to create place: ${placeId.error}`);
    }

    const createdPlace = await placeDirectory.get_details({ placeId });
    if (typeof createdPlace === 'object' && 'error' in createdPlace) {
      throw new Error(`Failed to get place details: ${createdPlace.error}`);
    }
    
    assertEquals(createdPlace.name, "Example Cafe");
    assertEquals(createdPlace.address, "123 Main St");
    assertEquals(createdPlace.coordinates, [-74.006, 40.7128]);
    assertEquals(createdPlace.preparationStyles, ["espresso", "pour-over"]);
    assertEquals(createdPlace.priceRange, "$$");
    assertEquals(createdPlace.hours, "9am-5pm");
  });

  await t.step("create_place - requires non-empty name and address", async () => {
    const result1 = await placeDirectory.create_place({
      name: "",
      address: "123 Main St",
      coords: [-74.006, 40.7128],
      styles: ["espresso"],
      priceRange: "$$",
    });
    assertEquals(result1, { error: "Name and address must be non-empty." });
    
    const result2 = await placeDirectory.create_place({
      name: "Example Cafe",
      address: "",
      coords: [-74.006, 40.7128],
      styles: ["espresso"],
      priceRange: "$$",
    });
    assertEquals(result2, { error: "Name and address must be non-empty." });
  });

  await t.step("edit_place - successful edit", async () => {
    const placeId = await placeDirectory.create_place({
      name: "Original Name",
      address: "Old Address",
      coords: [0, 0],
      styles: ["style1"],
      priceRange: "$",
    });

    if (typeof placeId === 'object' && 'error' in placeId) {
      throw new Error(`Failed to create place: ${placeId.error}`);
    }

    await placeDirectory.edit_place({
      placeId,
      name: "Updated Name",
      address: "New Address",
      coords: [1, 1],
      styles: ["style2", "style3"],
      priceRange: "$$$",
      hours: "10am-6pm",
      photos: ["http://example.com/photo.jpg"],
    });

    const updatedPlace = await placeDirectory.get_details({ placeId });
    if (typeof updatedPlace === 'object' && 'error' in updatedPlace) {
      throw new Error(`Failed to get place details: ${updatedPlace.error}`);
    }
    
    assertEquals(updatedPlace.name, "Updated Name");
    assertEquals(updatedPlace.address, "New Address");
    assertEquals(updatedPlace.coordinates, [1, 1]);
    assertEquals(updatedPlace.preparationStyles, ["style2", "style3"]);
    assertEquals(updatedPlace.priceRange, "$$$");
    assertEquals(updatedPlace.hours, "10am-6pm");
    assertEquals(updatedPlace.photos, ["http://example.com/photo.jpg"]);
  });

  await t.step("edit_place - updating only some fields", async () => {
    const placeId = await placeDirectory.create_place({
      name: "Partial Update",
      address: "Original Address",
      coords: [0, 0],
      styles: ["style1"],
      priceRange: "$",
    });

    if (typeof placeId === 'object' && 'error' in placeId) {
      throw new Error(`Failed to create place: ${placeId.error}`);
    }

    await placeDirectory.edit_place({
      placeId,
      name: "Updated Name Only",
    });

    const updatedPlace = await placeDirectory.get_details({ placeId });
    if (typeof updatedPlace === 'object' && 'error' in updatedPlace) {
      throw new Error(`Failed to get place details: ${updatedPlace.error}`);
    }
    
    assertEquals(updatedPlace.name, "Updated Name Only");
    assertEquals(updatedPlace.address, "Original Address"); // Should remain unchanged
  });

  await t.step("edit_place - placeId not found", async () => {
    const nonExistentPlaceId = "non_existent_id" as any; // Use type assertion for testing
    const result = await placeDirectory.edit_place({
      placeId: nonExistentPlaceId,
      name: "Should not happen",
    });
    assertEquals(result, { error: `Place with ID ${nonExistentPlaceId} not found.` });
  });

  await t.step("delete_place - successful deletion", async () => {
    const placeId = await placeDirectory.create_place({
      name: "To Be Deleted",
      address: "Deletion St",
      coords: [0, 0],
      styles: ["style1"],
      priceRange: "$",
    });

    if (typeof placeId === 'object' && 'error' in placeId) {
      throw new Error(`Failed to create place: ${placeId.error}`);
    }

    await placeDirectory.delete_place({ placeId });

    const result = await placeDirectory.get_details({ placeId });
    assertEquals(result, { error: `Place with ID ${placeId} not found.` });
  });

  await t.step("delete_place - placeId not found", async () => {
    const nonExistentPlaceId = "non_existent_id" as any;
    const result = await placeDirectory.delete_place({ placeId: nonExistentPlaceId });
    assertEquals(result, { error: `Place with ID ${nonExistentPlaceId} not found.` });
  });

  await t.step("find_nearby - finds places within radius", async () => {
    // Clear database before this test to ensure clean state
    await db.collection("PlaceDirectory.places").deleteMany({});
    
    const place1Id = await placeDirectory.create_place({
      name: "Near Cafe",
      address: "1 km away",
      coords: [-74.007, 40.713], // Slightly different coordinates
      styles: ["espresso"],
      priceRange: "$",
    });
    const place2Id = await placeDirectory.create_place({
      name: "Far Cafe",
      address: "10 km away",
      coords: [-74.1, 40.8], // Further away coordinates
      styles: ["pour-over"],
      priceRange: "$$",
    });
    const place3Id = await placeDirectory.create_place({
      name: "In Radius",
      address: "0.5 km away",
      coords: [-74.0065, 40.7129], // Very close coordinates
      styles: ["espresso"],
      priceRange: "$",
    });

    // Note: MongoDB's $nearSphere expects distance in meters.
    // 1 km = 1000 meters. We'll search for a radius of 1.5km (1500m)
    const nearby = await placeDirectory.find_nearby({
      coords: [-74.006, 40.7128],
      radius: 1.5,
    });

    assertEquals(new Set(nearby), new Set([place1Id, place3Id]));
  });

  await t.step("find_nearby - requires radius > 0", async () => {
    try {
      await placeDirectory.find_nearby({
        coords: [-74.006, 40.7128],
        radius: 0,
      });
      assertEquals(true, false, "Should have thrown error for radius 0");
    } catch (error) {
      assertEquals((error as Error).message, "Radius must be greater than 0.");
    }
    
    try {
      await placeDirectory.find_nearby({
        coords: [-74.006, 40.7128],
        radius: -1,
      });
      assertEquals(true, false, "Should have thrown error for negative radius");
    } catch (error) {
      assertEquals((error as Error).message, "Radius must be greater than 0.");
    }
  });

  await t.step("search_by_name - finds places with matching name", async () => {
    await placeDirectory.create_place({
      name: "Coffee Corner",
      address: "123 Main St",
      coords: [0, 0],
      styles: ["espresso"],
      priceRange: "$",
    });
    await placeDirectory.create_place({
      name: "The Coffee Shop",
      address: "456 Oak Ave",
      coords: [0, 0],
      styles: ["pour-over"],
      priceRange: "$$",
    });
    await placeDirectory.create_place({
      name: "Cafe Delight",
      address: "789 Pine Ln",
      coords: [0, 0],
      styles: ["espresso"],
      priceRange: "$",
    });

    const coffeePlaces = await placeDirectory.search_by_name({ query: "Coffee" });
    assertEquals(coffeePlaces.length, 2);
    // Note: We can't easily test exact place IDs since they're generated
    
    const shopPlaces = await placeDirectory.search_by_name({ query: "Shop" });
    assertEquals(shopPlaces.length, 1);
    
    const emptyResult = await placeDirectory.search_by_name({ query: "NonExistent" });
    assertEquals(emptyResult.length, 0);
  });

  await t.step("filter_places - filters by price range", async () => {
    // Clear database before this test to ensure clean state
    await db.collection("PlaceDirectory.places").deleteMany({});
    
    const place1Id = await placeDirectory.create_place({
      name: "Cheap Eats",
      address: "1",
      coords: [0, 0],
      styles: ["espresso"],
      priceRange: "$",
    });
    const place2Id = await placeDirectory.create_place({
      name: "Mid Range",
      address: "2",
      coords: [0, 0],
      styles: ["espresso"],
      priceRange: "$$",
    });
    const place3Id = await placeDirectory.create_place({
      name: "Expensive",
      address: "3",
      coords: [0, 0],
      styles: ["espresso"],
      priceRange: "$$$",
    });

    const cheapPlaces = await placeDirectory.filter_places({ priceRange: "$" });
    assertEquals(cheapPlaces.length, 1);
    assertEquals(new Set(cheapPlaces), new Set([place1Id]));

    const midPlaces = await placeDirectory.filter_places({ priceRange: "$$" });
    assertEquals(midPlaces.length, 1);
    assertEquals(new Set(midPlaces), new Set([place2Id]));
  });

  await t.step("filter_places - filters by hours", async () => {
    // Clear database before this test to ensure clean state
    await db.collection("PlaceDirectory.places").deleteMany({});
    
    const place1Id = await placeDirectory.create_place({
      name: "Morning Spot",
      address: "1",
      coords: [0, 0],
      styles: ["espresso"],
      priceRange: "$",
      hours: "9am-5pm",
    });
    const place2Id = await placeDirectory.create_place({
      name: "Evening Spot",
      address: "2",
      coords: [0, 0],
      styles: ["espresso"],
      priceRange: "$",
      hours: "5pm-11pm",
    });

    const morningPlaces = await placeDirectory.filter_places({ hours: "9am-5pm" });
    assertEquals(morningPlaces.length, 1);
    assertEquals(new Set(morningPlaces), new Set([place1Id]));
  });

  await t.step("filter_places - filters by style", async () => {
    // Clear database before this test to ensure clean state
    await db.collection("PlaceDirectory.places").deleteMany({});
    
    const place1Id = await placeDirectory.create_place({
      name: "Espresso Place",
      address: "1",
      coords: [0, 0],
      styles: ["espresso", "latte"],
      priceRange: "$",
    });
    const place2Id = await placeDirectory.create_place({
      name: "Pour Over Place",
      address: "2",
      coords: [0, 0],
      styles: ["pour-over"],
      priceRange: "$",
    });

    const espressoPlaces = await placeDirectory.filter_places({ style: "espresso" });
    assertEquals(espressoPlaces.length, 1);
    assertEquals(new Set(espressoPlaces), new Set([place1Id]));
  });

  await t.step("filter_places - combines filters", async () => {
    // Clear database before this test to ensure clean state
    await db.collection("PlaceDirectory.places").deleteMany({});
    
    const place1Id = await placeDirectory.create_place({
      name: "Filter Match",
      address: "1",
      coords: [0, 0],
      styles: ["espresso"],
      priceRange: "$$",
      hours: "9am-5pm",
    });
    await placeDirectory.create_place({
      name: "No Match Price",
      address: "2",
      coords: [0, 0],
      styles: ["espresso"],
      priceRange: "$",
      hours: "9am-5pm",
    });
    await placeDirectory.create_place({
      name: "No Match Style",
      address: "3",
      coords: [0, 0],
      styles: ["latte"],
      priceRange: "$$",
      hours: "9am-5pm",
    });
    await placeDirectory.create_place({
      name: "No Match Hours",
      address: "4",
      coords: [0, 0],
      styles: ["espresso"],
      priceRange: "$$",
      hours: "10am-6pm",
    });

    const filtered = await placeDirectory.filter_places({
      priceRange: "$$",
      hours: "9am-5pm",
      style: "espresso",
    });

    assertEquals(filtered.length, 1);
    assertEquals(new Set(filtered), new Set([place1Id]));
  });

  await t.step("get_details - retrieves correct place details", async () => {
    // Clear database before this test to ensure clean state
    await db.collection("PlaceDirectory.places").deleteMany({});
    
    const placeId = await placeDirectory.create_place({
      name: "Detailed Cafe",
      address: "123 Details Ln",
      coords: [-74.008, 40.7135],
      styles: ["iced coffee"],
      priceRange: "$",
      hours: "8am-4pm",
      photos: ["http://example.com/detail1.jpg", "http://example.com/detail2.jpg"],
    });

    if (typeof placeId === 'object' && 'error' in placeId) {
      throw new Error(`Failed to create place: ${placeId.error}`);
    }

    const details = await placeDirectory.get_details({ placeId });
    if (typeof details === 'object' && 'error' in details) {
      throw new Error(`Failed to get place details: ${details.error}`);
    }
    
    assertEquals(details.name, "Detailed Cafe");
    assertEquals(details.address, "123 Details Ln");
    assertEquals(details.coordinates, [-74.008, 40.7135]);
    assertEquals(details.preparationStyles, ["iced coffee"]);
    assertEquals(details.priceRange, "$");
    assertEquals(details.hours, "8am-4pm");
    // Check if photos field exists and has the expected values
    assertEquals(Array.isArray(details.photos), true);
    assertEquals(details.photos?.length, 2);
    assertEquals(details.photos?.[0], "http://example.com/detail1.jpg");
    assertEquals(details.photos?.[1], "http://example.com/detail2.jpg");
  });

  await t.step("get_details - placeId not found", async () => {
    const nonExistentPlaceId = "non_existent_id" as any;
    const result = await placeDirectory.get_details({ placeId: nonExistentPlaceId });
    assertEquals(result, { error: `Place with ID ${nonExistentPlaceId} not found.` });
  });

  } finally {
    await client.close();
  }
});
```
