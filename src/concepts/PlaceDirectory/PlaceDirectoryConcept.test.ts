import { assertEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import PlaceDirectoryConcept from "./PlaceDirectoryConcept.ts";
import { ID } from "@utils/types.ts";

Deno.test("PlaceDirectoryConcept", async (t) => {
  const [db, client] = await testDb();

  const placeDirectory = new PlaceDirectoryConcept(db);

  try {
    // Ensure a clean state for PlaceDirectory collection before tests
    await db.collection("PlaceDirectory.places").deleteMany({});

    await t.step("create_place - successful creation", async () => {
      const result = await placeDirectory.create_place({
        name: "Example Cafe",
        address: "123 Main St",
        coords: [-74.006, 40.7128],
        styles: ["espresso", "pour-over"],
        priceRange: "$$",
        hours: "9am-5pm",
      });

      if ("error" in result) throw new Error(`Failed to create place: ${result.error}`);
      const placeId = result.placeId;

      const createdPlaceResult = await placeDirectory._get_details({ placeId });
      if ("error" in createdPlaceResult) {
        throw new Error(`Failed to get place details: ${createdPlaceResult.error}`);
      }
      const createdPlace = createdPlaceResult.place;

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
      const creationResult = await placeDirectory.create_place({
        name: "Original Name",
        address: "Old Address",
        coords: [0, 0],
        styles: ["style1"],
        priceRange: "$",
      });
      if ("error" in creationResult) throw new Error(creationResult.error);
      const placeId = creationResult.placeId;

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

      const updatedPlaceResult = await placeDirectory._get_details({ placeId });
      if ("error" in updatedPlaceResult) {
        throw new Error(`Failed to get place details: ${updatedPlaceResult.error}`);
      }
      const updatedPlace = updatedPlaceResult.place;

      assertEquals(updatedPlace.name, "Updated Name");
      assertEquals(updatedPlace.address, "New Address");
      assertEquals(updatedPlace.coordinates, [1, 1]);
      assertEquals(updatedPlace.preparationStyles, ["style2", "style3"]);
      assertEquals(updatedPlace.priceRange, "$$$");
      assertEquals(updatedPlace.hours, "10am-6pm");
      assertEquals(updatedPlace.photos, ["http://example.com/photo.jpg"]);
    });

    await t.step("edit_place - updating only some fields", async () => {
      const creationResult = await placeDirectory.create_place({
        name: "Partial Update",
        address: "Original Address",
        coords: [0, 0],
        styles: ["style1"],
        priceRange: "$",
      });
      if ("error" in creationResult) throw new Error(creationResult.error);
      const placeId = creationResult.placeId;

      await placeDirectory.edit_place({
        placeId,
        name: "Updated Name Only",
      });

      const updatedPlaceResult = await placeDirectory._get_details({ placeId });
      if ("error" in updatedPlaceResult) {
        throw new Error(`Failed to get place details: ${updatedPlaceResult.error}`);
      }
      const updatedPlace = updatedPlaceResult.place;

      assertEquals(updatedPlace.name, "Updated Name Only");
      assertEquals(updatedPlace.address, "Original Address"); // Should remain unchanged
    });

    await t.step("edit_place - placeId not found", async () => {
      const nonExistentPlaceId = "non_existent_id" as ID;
      const result = await placeDirectory.edit_place({
        placeId: nonExistentPlaceId,
        name: "Should not happen",
      });
      assertEquals(result, { error: `Place with ID ${nonExistentPlaceId} not found.` });
    });

    await t.step("delete_place - successful deletion", async () => {
      const creationResult = await placeDirectory.create_place({
        name: "To Be Deleted",
        address: "Deletion St",
        coords: [0, 0],
        styles: ["style1"],
        priceRange: "$",
      });
      if ("error" in creationResult) throw new Error(creationResult.error);
      const placeId = creationResult.placeId;

      const deleteResult = await placeDirectory.delete_place({ placeId });
      assertEquals(deleteResult, {});

      const result = await placeDirectory._get_details({ placeId });
      assertEquals(result, { error: `Place with ID ${placeId} not found.` });
    });

    await t.step("delete_place - placeId not found", async () => {
      const nonExistentPlaceId = "non_existent_id" as ID;
      const result = await placeDirectory.delete_place({ placeId: nonExistentPlaceId });
      assertEquals(result, { error: `Place with ID ${nonExistentPlaceId} not found.` });
    });

    await t.step("_find_nearby - finds places within radius", async () => {
      await db.collection("PlaceDirectory.places").deleteMany({}); // Clear database for this test

      const place1Result = await placeDirectory.create_place({
        name: "Near Cafe",
        address: "1 km away",
        coords: [-74.007, 40.713],
        styles: ["espresso"],
        priceRange: "$",
      });
      if ("error" in place1Result) throw new Error(place1Result.error);
      const place1Id = place1Result.placeId;

      const place2Result = await placeDirectory.create_place({
        name: "Far Cafe",
        address: "10 km away",
        coords: [-74.1, 40.8],
        styles: ["pour-over"],
        priceRange: "$$",
      });
      if ("error" in place2Result) throw new Error(place2Result.error);
      const place2Id = place2Result.placeId;

      const place3Result = await placeDirectory.create_place({
        name: "In Radius",
        address: "0.5 km away",
        coords: [-74.0065, 40.7129],
        styles: ["espresso"],
        priceRange: "$",
      });
      if ("error" in place3Result) throw new Error(place3Result.error);
      const place3Id = place3Result.placeId;

      const nearbyResult = await placeDirectory._find_nearby({
        coords: [-74.006, 40.7128],
        radius: 1.5,
      });
      if ("error" in nearbyResult) throw new Error(nearbyResult.error);
      const nearby = nearbyResult.placeIds;

      assertEquals(new Set(nearby), new Set([place1Id, place3Id]));
    });

    await t.step("_find_nearby - requires radius > 0", async () => {
      const result1 = await placeDirectory._find_nearby({
        coords: [-74.006, 40.7128],
        radius: 0,
      });
      assertEquals(result1, { error: "Radius must be greater than 0." });

      const result2 = await placeDirectory._find_nearby({
        coords: [-74.006, 40.7128],
        radius: -1,
      });
      assertEquals(result2, { error: "Radius must be greater than 0." });
    });

    await t.step("_search_by_name - finds places with matching name", async () => {
      await db.collection("PlaceDirectory.places").deleteMany({}); // Clear database for this test

      const coffeeCornerResult = await placeDirectory.create_place({
        name: "Coffee Corner",
        address: "123 Main St",
        coords: [0, 0],
        styles: ["espresso"],
        priceRange: "$",
      });
      if ("error" in coffeeCornerResult) throw new Error(coffeeCornerResult.error);

      const theCoffeeShopResult = await placeDirectory.create_place({
        name: "The Coffee Shop",
        address: "456 Oak Ave",
        coords: [0, 0],
        styles: ["pour-over"],
        priceRange: "$$",
      });
      if ("error" in theCoffeeShopResult) throw new Error(theCoffeeShopResult.error);

      const cafeDelightResult = await placeDirectory.create_place({
        name: "Cafe Delight",
        address: "789 Pine Ln",
        coords: [0, 0],
        styles: ["espresso"],
        priceRange: "$",
      });
      if ("error" in cafeDelightResult) throw new Error(cafeDelightResult.error);

      const coffeePlacesResult = await placeDirectory._search_by_name({ query: "Coffee" });
      assertEquals(coffeePlacesResult.placeIds.length, 2);

      const shopPlacesResult = await placeDirectory._search_by_name({ query: "Shop" });
      assertEquals(shopPlacesResult.placeIds.length, 1);

      const emptyResult = await placeDirectory._search_by_name({ query: "NonExistent" });
      assertEquals(emptyResult.placeIds.length, 0);
    });

    await t.step("_filter_places - filters by price range", async () => {
      await db.collection("PlaceDirectory.places").deleteMany({}); // Clear database for this test

      const place1Result = await placeDirectory.create_place({
        name: "Cheap Eats",
        address: "1",
        coords: [0, 0],
        styles: ["espresso"],
        priceRange: "$",
      });
      if ("error" in place1Result) throw new Error(place1Result.error);
      const place1Id = place1Result.placeId;

      const place2Result = await placeDirectory.create_place({
        name: "Mid Range",
        address: "2",
        coords: [0, 0],
        styles: ["espresso"],
        priceRange: "$$",
      });
      if ("error" in place2Result) throw new Error(place2Result.error);
      const place2Id = place2Result.placeId;

      const place3Result = await placeDirectory.create_place({
        name: "Expensive",
        address: "3",
        coords: [0, 0],
        styles: ["espresso"],
        priceRange: "$$$",
      });
      if ("error" in place3Result) throw new Error(place3Result.error);

      const cheapPlacesResult = await placeDirectory._filter_places({ priceRange: "$" });
      assertEquals(cheapPlacesResult.placeIds.length, 1);
      assertEquals(new Set(cheapPlacesResult.placeIds), new Set([place1Id]));

      const midPlacesResult = await placeDirectory._filter_places({ priceRange: "$$" });
      assertEquals(midPlacesResult.placeIds.length, 1);
      assertEquals(new Set(midPlacesResult.placeIds), new Set([place2Id]));
    });

    await t.step("_filter_places - filters by hours", async () => {
      await db.collection("PlaceDirectory.places").deleteMany({}); // Clear database for this test

      const place1Result = await placeDirectory.create_place({
        name: "Morning Spot",
        address: "1",
        coords: [0, 0],
        styles: ["espresso"],
        priceRange: "$",
        hours: "9am-5pm",
      });
      if ("error" in place1Result) throw new Error(place1Result.error);
      const place1Id = place1Result.placeId;

      const place2Result = await placeDirectory.create_place({
        name: "Evening Spot",
        address: "2",
        coords: [0, 0],
        styles: ["espresso"],
        priceRange: "$",
        hours: "5pm-11pm",
      });
      if ("error" in place2Result) throw new Error(place2Result.error);

      const morningPlacesResult = await placeDirectory._filter_places({ hours: "9am-5pm" });
      assertEquals(morningPlacesResult.placeIds.length, 1);
      assertEquals(new Set(morningPlacesResult.placeIds), new Set([place1Id]));
    });

    await t.step("_filter_places - filters by style", async () => {
      await db.collection("PlaceDirectory.places").deleteMany({}); // Clear database for this test

      const place1Result = await placeDirectory.create_place({
        name: "Espresso Place",
        address: "1",
        coords: [0, 0],
        styles: ["espresso", "latte"],
        priceRange: "$",
      });
      if ("error" in place1Result) throw new Error(place1Result.error);
      const place1Id = place1Result.placeId;

      const place2Result = await placeDirectory.create_place({
        name: "Pour Over Place",
        address: "2",
        coords: [0, 0],
        styles: ["pour-over"],
        priceRange: "$",
      });
      if ("error" in place2Result) throw new Error(place2Result.error);

      const espressoPlacesResult = await placeDirectory._filter_places({ style: "espresso" });
      assertEquals(espressoPlacesResult.placeIds.length, 1);
      assertEquals(new Set(espressoPlacesResult.placeIds), new Set([place1Id]));
    });

    await t.step("_filter_places - combines filters", async () => {
      await db.collection("PlaceDirectory.places").deleteMany({}); // Clear database for this test

      const place1Result = await placeDirectory.create_place({
        name: "Filter Match",
        address: "1",
        coords: [0, 0],
        styles: ["espresso"],
        priceRange: "$$",
        hours: "9am-5pm",
      });
      if ("error" in place1Result) throw new Error(place1Result.error);
      const place1Id = place1Result.placeId;

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

      const filteredResult = await placeDirectory._filter_places({
        priceRange: "$$",
        hours: "9am-5pm",
        style: "espresso",
      });

      assertEquals(filteredResult.placeIds.length, 1);
      assertEquals(new Set(filteredResult.placeIds), new Set([place1Id]));
    });

    await t.step("_get_details - retrieves correct place details", async () => {
      await db.collection("PlaceDirectory.places").deleteMany({}); // Clear database for this test

      const creationResult = await placeDirectory.create_place({
        name: "Detailed Cafe",
        address: "123 Details Ln",
        coords: [-74.008, 40.7135],
        styles: ["iced coffee"],
        priceRange: "$",
        hours: "8am-4pm",
        photos: ["http://example.com/detail1.jpg", "http://example.com/detail2.jpg"],
      });
      if ("error" in creationResult) throw new Error(creationResult.error);
      const placeId = creationResult.placeId;

      const detailsResult = await placeDirectory._get_details({ placeId });
      if ("error" in detailsResult) {
        throw new Error(`Failed to get place details: ${detailsResult.error}`);
      }
      const details = detailsResult.place;

      assertEquals(details.name, "Detailed Cafe");
      assertEquals(details.address, "123 Details Ln");
      assertEquals(details.coordinates, [-74.008, 40.7135]);
      assertEquals(details.preparationStyles, ["iced coffee"]);
      assertEquals(details.priceRange, "$");
      assertEquals(details.hours, "8am-4pm");
      assertEquals(Array.isArray(details.photos), true);
      assertEquals(details.photos?.length, 2);
      assertEquals(details.photos?.[0], "http://example.com/detail1.jpg");
      assertEquals(details.photos?.[1], "http://example.com/detail2.jpg");
    });

    await t.step("_get_details - placeId not found", async () => {
      const nonExistentPlaceId = "non_existent_id" as ID;
      const result = await placeDirectory._get_details({ placeId: nonExistentPlaceId });
      assertEquals(result, { error: `Place with ID ${nonExistentPlaceId} not found.` });
    });

    await t.step(
      "principle: places store structured metadata and can be discovered through search and location-based queries",
      async () => {
        // Clear database for clean principle test
        await db.collection("PlaceDirectory.places").deleteMany({});

        // Step 1: Create places with rich structured metadata
        const zenTeaResult = await placeDirectory.create_place({
          name: "Zen Tea House",
          address: "100 Peaceful St",
          coords: [-74.006, 40.7128], // NYC coordinates
          styles: ["traditional", "ceremonial"],
          priceRange: "$$$",
          hours: "10am-8pm",
          photos: ["http://example.com/zen1.jpg"],
        });
        if ("error" in zenTeaResult) throw new Error(zenTeaResult.error);
        const zenTeaId = zenTeaResult.placeId;

        const modernMatchaResult = await placeDirectory.create_place({
          name: "Modern Matcha Bar",
          address: "200 Trendy Ave",
          coords: [-74.007, 40.713], // Very close to Zen Tea
          styles: ["modern", "latte"],
          priceRange: "$$",
          hours: "8am-6pm",
          photos: ["http://example.com/modern1.jpg", "http://example.com/modern2.jpg"],
        });
        if ("error" in modernMatchaResult) throw new Error(modernMatchaResult.error);
        const modernMatchaId = modernMatchaResult.placeId;

        const distantCafeResult = await placeDirectory.create_place({
          name: "Distant Matcha Cafe",
          address: "500 Far Away Blvd",
          coords: [-74.1, 40.8], // Much farther away
          styles: ["traditional"],
          priceRange: "$",
          hours: "9am-5pm",
        });
        if ("error" in distantCafeResult) throw new Error(distantCafeResult.error);
        const distantCafeId = distantCafeResult.placeId;

        // Step 2: Verify metadata is stored correctly
        const zenDetailsResult = await placeDirectory._get_details({ placeId: zenTeaId });
        if ("error" in zenDetailsResult) throw new Error(zenDetailsResult.error);
        const zenDetails = zenDetailsResult.place;
        assertEquals(zenDetails.name, "Zen Tea House");
        assertEquals(zenDetails.preparationStyles, ["traditional", "ceremonial"]);
        assertEquals(zenDetails.priceRange, "$$$");
        assertEquals(zenDetails.hours, "10am-8pm");
        assertEquals(zenDetails.photos?.length, 1);

        // Step 3: Discovery via name search
        const matchaPlacesResult = await placeDirectory._search_by_name({ query: "Matcha" });
        const matchaPlaces = matchaPlacesResult.placeIds;
        assertEquals(matchaPlaces.length, 2, "Should find 2 places with 'Matcha' in name");
        assertEquals(matchaPlaces.includes(modernMatchaId), true);
        assertEquals(matchaPlaces.includes(distantCafeId), true);

        const teaPlacesResult = await placeDirectory._search_by_name({ query: "Tea" });
        const teaPlaces = teaPlacesResult.placeIds;
        assertEquals(teaPlaces.length, 1, "Should find 1 place with 'Tea' in name");
        assertEquals(teaPlaces.includes(zenTeaId), true);

        // Step 4: Discovery via location-based search
        const nearbyResult = await placeDirectory._find_nearby({
          coords: [-74.006, 40.7128],
          radius: 1.5, // 1.5 km radius
        });
        if ("error" in nearbyResult) throw new Error(nearbyResult.error);
        const nearbyPlaces = nearbyResult.placeIds;
        assertEquals(nearbyPlaces.length, 2, "Should find 2 places within 1.5km");
        assertEquals(nearbyPlaces.includes(zenTeaId), true, "Zen Tea should be nearby");
        assertEquals(nearbyPlaces.includes(modernMatchaId), true, "Modern Matcha should be nearby");
        assertEquals(nearbyPlaces.includes(distantCafeId), false, "Distant Cafe should not be nearby");

        // Step 5: Discovery via attribute filtering (style)
        const traditionalResult = await placeDirectory._filter_places({ style: "traditional" });
        const traditionalPlaces = traditionalResult.placeIds;
        assertEquals(traditionalPlaces.length, 2, "Should find 2 traditional places");
        assertEquals(traditionalPlaces.includes(zenTeaId), true);
        assertEquals(traditionalPlaces.includes(distantCafeId), true);

        // Step 6: Discovery via attribute filtering (price range)
        const budgetResult = await placeDirectory._filter_places({ priceRange: "$" });
        const budgetPlaces = budgetResult.placeIds;
        assertEquals(budgetPlaces.length, 1, "Should find 1 budget place");
        assertEquals(budgetPlaces.includes(distantCafeId), true);

        // Step 7: Discovery via combined filters
        const traditionalAndAffordableResult = await placeDirectory._filter_places({
          style: "traditional",
          priceRange: "$",
        });
        const traditionalAndAffordable = traditionalAndAffordableResult.placeIds;
        assertEquals(traditionalAndAffordable.length, 1, "Should find 1 traditional budget place");
        assertEquals(traditionalAndAffordable.includes(distantCafeId), true);

        console.log("✓ Principle verified: Places store metadata → Discoverable by name, location, and attributes");
      },
    );
  } finally {
    await client.close();
  }
});