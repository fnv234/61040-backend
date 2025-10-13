[@implementation](implementation.md)

[@testing-concepts](../../background/testing-concepts.md)

[@no_mistakes](../../no_mistakes.md)


# test: PlaceDirectory

# file: src/PlaceDirectory/PlaceDirectory.test.ts
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

  await t.step("create_place - successful creation", async () => {
    const placeId = placeDirectory.create_place({
      name: "Example Cafe",
      address: "123 Main St",
      coords: [-74.006, 40.7128],
      styles: ["espresso", "pour-over"],
      priceRange: "$$",
      hours: "9am-5pm",
    });

    const createdPlace = await placeDirectory.get_details({ placeId });
    assertEquals(createdPlace.name, "Example Cafe");
    assertEquals(createdPlace.address, "123 Main St");
    assertEquals(createdPlace.coordinates, [-74.006, 40.7128]);
    assertEquals(createdPlace.preparationStyles, ["espresso", "pour-over"]);
    assertEquals(createdPlace.priceRange, "$$");
    assertEquals(createdPlace.hours, "9am-5pm");
  });

  await t.step("create_place - requires non-empty name and address", async () => {
    assertThrows(
      () =>
        placeDirectory.create_place({
          name: "",
          address: "123 Main St",
          coords: [-74.006, 40.7128],
          styles: ["espresso"],
          priceRange: "$$",
        }),
      Error,
      "Name and address must be non-empty.",
    );
    assertThrows(
      () =>
        placeDirectory.create_place({
          name: "Example Cafe",
          address: "",
          coords: [-74.006, 40.7128],
          styles: ["espresso"],
          priceRange: "$$",
        }),
      Error,
      "Name and address must be non-empty.",
    );
  });

  await t.step("edit_place - successful edit", async () => {
    const placeId = placeDirectory.create_place({
      name: "Original Name",
      address: "Old Address",
      coords: [0, 0],
      styles: ["style1"],
      priceRange: "$",
    });

    placeDirectory.edit_place({
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
    assertEquals(updatedPlace.name, "Updated Name");
    assertEquals(updatedPlace.address, "New Address");
    assertEquals(updatedPlace.coordinates, [1, 1]);
    assertEquals(updatedPlace.preparationStyles, ["style2", "style3"]);
    assertEquals(updatedPlace.priceRange, "$$$");
    assertEquals(updatedPlace.hours, "10am-6pm");
    assertEquals(updatedPlace.photos, ["http://example.com/photo.jpg"]);
  });

  await t.step("edit_place - updating only some fields", async () => {
    const placeId = placeDirectory.create_place({
      name: "Partial Update",
      address: "Original Address",
      coords: [0, 0],
      styles: ["style1"],
      priceRange: "$",
    });

    placeDirectory.edit_place({
      placeId,
      name: "Updated Name Only",
    });

    const updatedPlace = await placeDirectory.get_details({ placeId });
    assertEquals(updatedPlace.name, "Updated Name Only");
    assertEquals(updatedPlace.address, "Original Address"); // Should remain unchanged
  });

  await t.step("edit_place - placeId not found", async () => {
    const nonExistentPlaceId = "non_existent_id" as any; // Use type assertion for testing
    assertThrows(
      () =>
        placeDirectory.edit_place({
          placeId: nonExistentPlaceId,
          name: "Should not happen",
        }),
      Error,
      `Place with ID ${nonExistentPlaceId} not found.`,
    );
  });

  await t.step("delete_place - successful deletion", async () => {
    const placeId = placeDirectory.create_place({
      name: "To Be Deleted",
      address: "Deletion St",
      coords: [0, 0],
      styles: ["style1"],
      priceRange: "$",
    });

    placeDirectory.delete_place({ placeId });

    assertThrows(
      () => placeDirectory.get_details({ placeId }),
      Error,
      `Place with ID ${placeId} not found.`,
    );
  });

  await t.step("delete_place - placeId not found", async () => {
    const nonExistentPlaceId = "non_existent_id" as any;
    assertThrows(
      () => placeDirectory.delete_place({ placeId: nonExistentPlaceId }),
      Error,
      `Place with ID ${nonExistentPlaceId} not found.`,
    );
  });

  await t.step("find_nearby - finds places within radius", async () => {
    const place1Id = placeDirectory.create_place({
      name: "Near Cafe",
      address: "1 km away",
      coords: [-74.007, 40.713], // Slightly different coordinates
      styles: ["espresso"],
      priceRange: "$",
    });
    const place2Id = placeDirectory.create_place({
      name: "Far Cafe",
      address: "10 km away",
      coords: [-74.1, 40.8], // Further away coordinates
      styles: ["pour-over"],
      priceRange: "$$",
    });
    const place3Id = placeDirectory.create_place({
      name: "In Radius",
      address: "0.5 km away",
      coords: [-74.0065, 40.7129], // Very close coordinates
      styles: ["espresso"],
      priceRange: "$",
    });

    // Note: MongoDB's $nearSphere expects distance in meters.
    // 1 km = 1000 meters. We'll search for a radius of 1.5km (1500m)
    const nearby = placeDirectory.find_nearby({
      coords: [-74.006, 40.7128],
      radius: 1.5,
    });

    assertEquals(new Set(nearby), new Set([place1Id, place3Id]));
  });

  await t.step("find_nearby - requires radius > 0", async () => {
    assertThrows(
      () =>
        placeDirectory.find_nearby({
          coords: [-74.006, 40.7128],
          radius: 0,
        }),
      Error,
      "Radius must be greater than 0.",
    );
    assertThrows(
      () =>
        placeDirectory.find_nearby({
          coords: [-74.006, 40.7128],
          radius: -1,
        }),
      Error,
      "Radius must be greater than 0.",
    );
  });

  await t.step("search_by_name - finds places with matching name", async () => {
    placeDirectory.create_place({
      name: "Coffee Corner",
      address: "123 Main St",
      coords: [0, 0],
      styles: ["espresso"],
      priceRange: "$",
    });
    placeDirectory.create_place({
      name: "The Coffee Shop",
      address: "456 Oak Ave",
      coords: [0, 0],
      styles: ["pour-over"],
      priceRange: "$$",
    });
    placeDirectory.create_place({
      name: "Cafe Delight",
      address: "789 Pine Ln",
      coords: [0, 0],
      styles: ["espresso"],
      priceRange: "$",
    });

    const coffeePlaces = placeDirectory.search_by_name({ query: "Coffee" });
    assertEquals(coffeePlaces.length, 2);
    assertEquals(new Set(coffeePlaces), new Set(["Coffee Corner", "The Coffee Shop"])); // Place IDs will be generated

    const shopPlaces = placeDirectory.search_by_name({ query: "Shop" });
    assertEquals(shopPlaces.length, 1);
    assertEquals(new Set(shopPlaces), new Set(["The Coffee Shop"]));

    const emptyResult = placeDirectory.search_by_name({ query: "NonExistent" });
    assertEquals(emptyResult.length, 0);
  });

  await t.step("filter_places - filters by price range", async () => {
    const place1Id = placeDirectory.create_place({
      name: "Cheap Eats",
      address: "1",
      coords: [0, 0],
      styles: ["espresso"],
      priceRange: "$",
    });
    const place2Id = placeDirectory.create_place({
      name: "Mid Range",
      address: "2",
      coords: [0, 0],
      styles: ["espresso"],
      priceRange: "$$",
    });
    const place3Id = placeDirectory.create_place({
      name: "Expensive",
      address: "3",
      coords: [0, 0],
      styles: ["espresso"],
      priceRange: "$$$",
    });

    const cheapPlaces = placeDirectory.filter_places({ priceRange: "$" });
    assertEquals(cheapPlaces.length, 1);
    assertEquals(new Set(cheapPlaces), new Set([place1Id]));

    const midPlaces = placeDirectory.filter_places({ priceRange: "$$" });
    assertEquals(midPlaces.length, 1);
    assertEquals(new Set(midPlaces), new Set([place2Id]));
  });

  await t.step("filter_places - filters by hours", async () => {
    const place1Id = placeDirectory.create_place({
      name: "Morning Spot",
      address: "1",
      coords: [0, 0],
      styles: ["espresso"],
      priceRange: "$",
      hours: "9am-5pm",
    });
    const place2Id = placeDirectory.create_place({
      name: "Evening Spot",
      address: "2",
      coords: [0, 0],
      styles: ["espresso"],
      priceRange: "$",
      hours: "5pm-11pm",
    });

    const morningPlaces = placeDirectory.filter_places({ hours: "9am-5pm" });
    assertEquals(morningPlaces.length, 1);
    assertEquals(new Set(morningPlaces), new Set([place1Id]));
  });

  await t.step("filter_places - filters by style", async () => {
    const place1Id = placeDirectory.create_place({
      name: "Espresso Place",
      address: "1",
      coords: [0, 0],
      styles: ["espresso", "latte"],
      priceRange: "$",
    });
    const place2Id = placeDirectory.create_place({
      name: "Pour Over Place",
      address: "2",
      coords: [0, 0],
      styles: ["pour-over"],
      priceRange: "$",
    });

    const espressoPlaces = placeDirectory.filter_places({ style: "espresso" });
    assertEquals(espressoPlaces.length, 1);
    assertEquals(new Set(espressoPlaces), new Set([place1Id]));
  });

  await t.step("filter_places - combines filters", async () => {
    const place1Id = placeDirectory.create_place({
      name: "Filter Match",
      address: "1",
      coords: [0, 0],
      styles: ["espresso"],
      priceRange: "$$",
      hours: "9am-5pm",
    });
    placeDirectory.create_place({
      name: "No Match Price",
      address: "2",
      coords: [0, 0],
      styles: ["espresso"],
      priceRange: "$",
      hours: "9am-5pm",
    });
    placeDirectory.create_place({
      name: "No Match Style",
      address: "3",
      coords: [0, 0],
      styles: ["latte"],
      priceRange: "$$",
      hours: "9am-5pm",
    });
    placeDirectory.create_place({
      name: "No Match Hours",
      address: "4",
      coords: [0, 0],
      styles: ["espresso"],
      priceRange: "$$",
      hours: "10am-6pm",
    });

    const filtered = placeDirectory.filter_places({
      priceRange: "$$",
      hours: "9am-5pm",
      style: "espresso",
    });

    assertEquals(filtered.length, 1);
    assertEquals(new Set(filtered), new Set([place1Id]));
  });

  await t.step("get_details - retrieves correct place details", async () => {
    const placeId = placeDirectory.create_place({
      name: "Detailed Cafe",
      address: "123 Details Ln",
      coords: [-74.008, 40.7135],
      styles: ["iced coffee"],
      priceRange: "$",
      hours: "8am-4pm",
      photos: ["http://example.com/detail1.jpg", "http://example.com/detail2.jpg"],
    });

    const details = placeDirectory.get_details({ placeId });
    assertEquals(details.name, "Detailed Cafe");
    assertEquals(details.address, "123 Details Ln");
    assertEquals(details.coordinates, [-74.008, 40.7135]);
    assertEquals(details.preparationStyles, ["iced coffee"]);
    assertEquals(details.priceRange, "$");
    assertEquals(details.hours, "8am-4pm");
    assertEquals(details.photos, [
      "http://example.com/detail1.jpg",
      "http://example.com/detail2.jpg",
    ]);
  });

  await t.step("get_details - placeId not found", async () => {
    const nonExistentPlaceId = "non_existent_id" as any;
    assertThrows(
      () => placeDirectory.get_details({ placeId: nonExistentPlaceId }),
      Error,
      `Place with ID ${nonExistentPlaceId} not found.`,
    );
  });

  await client.close();
});

# trace:
/*
1. **Create a place**: Use `create_place` to add a new matcha-serving location with specific details.
2. **Retrieve details**: Use `get_details` to confirm the place was created correctly and its attributes are stored.
3. **Edit the place**: Use `edit_place` to modify some of the place's attributes (e.g., address, add a photo). Verify the changes with another `get_details` call.
4. **Search by name**: Use `search_by_name` to find the place using a partial or full name match.
5. **Find nearby**: Create a few more places at different distances and use `find_nearby` to verify that only places within the specified radius are returned.
6. **Filter places**: Create places with different price ranges, hours, and preparation styles. Use `filter_places` to test various filtering combinations.
7. **Delete a place**: Use `delete_place` to remove a place. Attempt to retrieve its details to confirm it's gone.
8. **Test error conditions**: Ensure that actions like `create_place` with invalid inputs, or operations on non-existent places, throw appropriate errors.
*/
```