---
timestamp: 'Sun Oct 19 2025 11:29:05 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_112905.6774871c.md]]'
content_id: 7ebd1e9132374593e1e16d798989b2265ac04427f075ce1e19a19c0f85a8a81b
---

# file: src/UserDirectory/UserDirectoryConcept.test.ts

```typescript
import { assertEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import UserDirectoryConcept from "./UserDirectoryConcept.ts";
import { ID } from "@utils/types.ts";

Deno.test("UserDirectoryConcept", async (t) => {
  const [db, client] = await testDb();

  const userDirectory = new UserDirectoryConcept(db);

  // Helper to generate fake IDs
  const fakeUserId = (name: string) => `user:${name}` as ID;
  const fakePlaceId = (name: string) => `place:${name}` as ID;

  try {
    // Clear user collection before tests to ensure a clean state
    await db.collection("UserDirectory.users").deleteMany({});

    await t.step("register_user should create a new user", async () => {
      const userId = fakeUserId("Alice");
      const displayName = "Alice Wonderland";
      const email = "alice@example.com";

      const result = await userDirectory.register_user({
        userId,
        displayName,
        email,
      });

      if ("error" in result) throw new Error(result.error);
      assertEquals(result, { userId }, "Should return the created user ID wrapped in a dictionary");

      const user = await db.collection("UserDirectory.users").findOne({
        _id: userId,
      });
      assertEquals(user?.displayName, displayName, "DisplayName should match");
      assertEquals(user?.email, email, "Email should match");
      assertEquals(
        user?.savedPlaces,
        [],
        "Saved places should be empty initially",
      );
      assertEquals(
        user?.preferences,
        {},
        "Preferences should be empty initially",
      );
    });

    await t.step("register_user should return error if user already exists", async () => {
      const userId = fakeUserId("Bob");
      const displayName = "Bob The Builder";
      const email = "bob@example.com";

      // First registration should succeed
      const initialResult = await userDirectory.register_user({ userId, displayName, email });
      if ("error" in initialResult) throw new Error(initialResult.error);

      // Second registration with the same userId should return error
      const result = await userDirectory.register_user({
        userId,
        displayName,
        email,
      });
      assertEquals(result, {
        error: `User with userId ${userId} already exists.`,
      });
    });

    await t.step(
      "register_user should return error with empty displayName or email",
      async () => {
        const userId1 = fakeUserId("Charlie");
        const userId2 = fakeUserId("Diana");

        const resultEmptyName = await userDirectory.register_user({
          userId: userId1,
          displayName: "",
          email: "charlie@example.com",
        });
        assertEquals(resultEmptyName, {
          error: "DisplayName and email cannot be empty.",
        });

        const resultEmptyEmail = await userDirectory.register_user({
          userId: userId2,
          displayName: "Diana",
          email: "",
        });
        assertEquals(resultEmptyEmail, {
          error: "DisplayName and email cannot be empty.",
        });
      },
    );

    await t.step(
      "save_place should add a place to a user's saved places",
      async () => {
        const userId = fakeUserId("David");
        const placeId1 = fakePlaceId("Park");
        const placeId2 = fakePlaceId("Museum");

        const registerResult = await userDirectory.register_user({
          userId,
          displayName: "David",
          email: "david@example.com",
        });
        if ("error" in registerResult) throw new Error(registerResult.error);

        // Save the first place
        const result1 = await userDirectory.save_place({
          userId,
          placeId: placeId1,
        });
        assertEquals(result1, {}, "Should return empty object on success");

        const savedPlaces1Result = await userDirectory._get_saved_places({ userId });
        if ("error" in savedPlaces1Result) throw new Error(savedPlaces1Result.error);
        assertEquals(
          savedPlaces1Result.placeIds,
          [placeId1],
          "Should contain the first saved place",
        );

        // Save the second place
        const result2 = await userDirectory.save_place({
          userId,
          placeId: placeId2,
        });
        assertEquals(result2, {}, "Should return empty object on success");

        const savedPlaces2Result = await userDirectory._get_saved_places({ userId });
        if ("error" in savedPlaces2Result) throw new Error(savedPlaces2Result.error);
        assertEquals(
          savedPlaces2Result.placeIds,
          [placeId1, placeId2],
          "Should contain both saved places",
        );
      },
    );

    await t.step(
      "save_place should not add a place if it's already saved",
      async () => {
        const userId = fakeUserId("Eve");
        const placeId = fakePlaceId("Cafe");

        const registerResult = await userDirectory.register_user({
          userId,
          displayName: "Eve",
          email: "eve@example.com",
        });
        if ("error" in registerResult) throw new Error(registerResult.error);

        await userDirectory.save_place({ userId, placeId });

        const savedPlacesBeforeResult = await userDirectory._get_saved_places({ userId });
        if ("error" in savedPlacesBeforeResult) throw new Error(savedPlacesBeforeResult.error);
        assertEquals(
          savedPlacesBeforeResult.placeIds.length,
          1,
          "Saved places should have 1 item before re-saving",
        );

        const result = await userDirectory.save_place({ userId, placeId });
        assertEquals(
          result,
          {},
          "Should return empty object even if already saved",
        );

        const savedPlacesAfterResult = await userDirectory._get_saved_places({ userId });
        if ("error" in savedPlacesAfterResult) throw new Error(savedPlacesAfterResult.error);
        assertEquals(
          savedPlacesAfterResult.placeIds.length,
          1,
          "Saved places should still have 1 item after re-saving",
        );
        assertEquals(
          savedPlacesAfterResult.placeIds,
          [placeId],
          "The saved place should remain the same",
        );
      },
    );

    await t.step("save_place should return error if user not found", async () => {
      const nonExistentUserId = fakeUserId("Ghost");
      const placeId = fakePlaceId("Spooky House");

      const result = await userDirectory.save_place({
        userId: nonExistentUserId,
        placeId,
      });
      assertEquals(result, {
        error: `User with userId ${nonExistentUserId} not found.`,
      });
    });

    await t.step(
      "unsave_place should remove a place from a user's saved places",
      async () => {
        const userId = fakeUserId("Frank");
        const placeId1 = fakePlaceId("Beach");
        const placeId2 = fakePlaceId("Mountain");

        const registerResult = await userDirectory.register_user({
          userId,
          displayName: "Frank",
          email: "frank@example.com",
        });
        if ("error" in registerResult) throw new Error(registerResult.error);

        await userDirectory.save_place({ userId, placeId: placeId1 });
        await userDirectory.save_place({ userId, placeId: placeId2 });

        const savedPlacesBeforeResult = await userDirectory._get_saved_places({ userId });
        if ("error" in savedPlacesBeforeResult) throw new Error(savedPlacesBeforeResult.error);
        assertEquals(
          savedPlacesBeforeResult.placeIds,
          [placeId1, placeId2],
          "User should have two saved places initially",
        );

        // Unsave the first place
        const result1 = await userDirectory.unsave_place({
          userId,
          placeId: placeId1,
        });
        assertEquals(result1, {}, "Should return empty object on success");

        const savedPlaces1Result = await userDirectory._get_saved_places({ userId });
        if ("error" in savedPlaces1Result) throw new Error(savedPlaces1Result.error);
        assertEquals(
          savedPlaces1Result.placeIds,
          [placeId2],
          "Should contain only the second saved place",
        );

        // Unsave the second place
        const result2 = await userDirectory.unsave_place({
          userId,
          placeId: placeId2,
        });
        assertEquals(result2, {}, "Should return empty object on success");

        const savedPlaces2Result = await userDirectory._get_saved_places({ userId });
        if ("error" in savedPlaces2Result) throw new Error(savedPlaces2Result.error);
        assertEquals(
          savedPlaces2Result.placeIds,
          [],
          "Saved places should be empty after unsaving both",
        );
      },
    );

    await t.step("unsave_place should return error if user not found", async () => {
      const nonExistentUserId = fakeUserId("Ghost");
      const placeId = fakePlaceId("Haunted Mansion");

      const result = await userDirectory.unsave_place({
        userId: nonExistentUserId,
        placeId,
      });
      assertEquals(result, {
        error: `User with userId ${nonExistentUserId} not found.`,
      });
    });

    await t.step("unsave_place should return error if place not saved", async () => {
      const userId = fakeUserId("Grace");
      const placeId = fakePlaceId("Library");
      const notSavedPlaceId = fakePlaceId("Zoo");

      const registerResult = await userDirectory.register_user({
        userId,
        displayName: "Grace",
        email: "grace@example.com",
      });
      if ("error" in registerResult) throw new Error(registerResult.error);

      await userDirectory.save_place({ userId, placeId }); // Save one place

      const result = await userDirectory.unsave_place({
        userId,
        placeId: notSavedPlaceId,
      });
      assertEquals(result, {
        error:
          `PlaceId ${notSavedPlaceId} not found in saved places for user ${userId}.`,
      });
    });

    await t.step(
      "update_preferences should update a user's preferences",
      async () => {
        const userId = fakeUserId("Heidi");
        const initialPrefs = { theme: "dark", notifications: "email" };
        const updatedPrefs = { theme: "light", language: "en" };

        const registerResult = await userDirectory.register_user({
          userId,
          displayName: "Heidi",
          email: "heidi@example.com",
        });
        if ("error" in registerResult) throw new Error(registerResult.error);

        await userDirectory.update_preferences({
          userId,
          newPrefs: initialPrefs,
        });

        const user1 = await db.collection("UserDirectory.users").findOne({
          _id: userId,
        });
        assertEquals(
          user1?.preferences,
          initialPrefs,
          "Preferences should be updated to initialPrefs",
        );

        await userDirectory.update_preferences({
          userId,
          newPrefs: updatedPrefs,
        });
        const user2 = await db.collection("UserDirectory.users").findOne({
          _id: userId,
        });
        assertEquals(
          user2?.preferences,
          updatedPrefs,
          "Preferences should be updated to updatedPrefs",
        );
      },
    );

    await t.step("update_preferences should return error if user not found", async () => {
      const nonExistentUserId = fakeUserId("Ghost");
      const prefs = { setting: "value" };

      const result = await userDirectory.update_preferences({
        userId: nonExistentUserId,
        newPrefs: prefs,
      });
      assertEquals(result, {
        error: `User with userId ${nonExistentUserId} not found.`,
      });
    });

    await t.step(
      "_get_saved_places should return the saved places for a user",
      async () => {
        const userId = fakeUserId("Ivy");
        const placeId1 = fakePlaceId("Cinema");
        const placeId2 = fakePlaceId("Park");

        const registerResult = await userDirectory.register_user({
          userId,
          displayName: "Ivy",
          email: "ivy@example.com",
        });
        if ("error" in registerResult) throw new Error(registerResult.error);

        await userDirectory.save_place({ userId, placeId: placeId1 });
        await userDirectory.save_place({ userId, placeId: placeId2 });

        const savedPlacesResult = await userDirectory._get_saved_places({ userId });
        if ("error" in savedPlacesResult) throw new Error(savedPlacesResult.error);
        assertEquals(
          savedPlacesResult.placeIds,
          [placeId1, placeId2],
          "Should return the correct list of saved places",
        );
      },
    );

    await t.step(
      "_get_saved_places should return an empty array for a user with no saved places",
      async () => {
        const userId = fakeUserId("Jack");

        const registerResult = await userDirectory.register_user({
          userId,
          displayName: "Jack",
          email: "jack@example.com",
        });
        if ("error" in registerResult) throw new Error(registerResult.error);

        const savedPlacesResult = await userDirectory._get_saved_places({ userId });
        if ("error" in savedPlacesResult) throw new Error(savedPlacesResult.error);
        assertEquals(savedPlacesResult.placeIds, [], "Should return an empty array");
      },
    );

    await t.step("_get_saved_places should return error if user not found", async () => {
      const nonExistentUserId = fakeUserId("Ghost");

      const result = await userDirectory._get_saved_places({
        userId: nonExistentUserId,
      });
      assertEquals(result, {
        error: `User with userId ${nonExistentUserId} not found.`,
      });
    });

    await t.step(
      "variant: preferences can be simple key-value pairs or complex nested structures",
      async () => {
        const userSimple = fakeUserId("SimplePrefs");
        const userComplex = fakeUserId("ComplexPrefs");

        // Register both users
        await userDirectory.register_user({
          userId: userSimple,
          displayName: "Simple User",
          email: "simple@example.com",
        });
        await userDirectory.register_user({
          userId: userComplex,
          displayName: "Complex User",
          email: "complex@example.com",
        });

        // Variant 1: Simple preferences with basic key-value pairs
        const simplePrefs = {
          theme: "dark",
          language: "en",
        };
        await userDirectory.update_preferences({
          userId: userSimple,
          newPrefs: simplePrefs,
        });

        // Variant 2: Complex preferences with structured data (stored as strings)
        const complexPrefs = {
          theme: "light",
          language: "ja",
          notifications: "email,push",
          dietary: "vegan,gluten-free",
          pricePreference: "$$-$$$",
        };
        await userDirectory.update_preferences({
          userId: userComplex,
          newPrefs: complexPrefs,
        });

        // Verify both variants are stored correctly
        const simpleUser = await db.collection("UserDirectory.users").findOne({
          _id: userSimple,
        });
        assertEquals(simpleUser?.preferences, simplePrefs);
        assertEquals(Object.keys(simpleUser?.preferences || {}).length, 2);

        const complexUser = await db.collection("UserDirectory.users").findOne({
          _id: userComplex,
        });
        assertEquals(complexUser?.preferences, complexPrefs);
        assertEquals(Object.keys(complexUser?.preferences || {}).length, 5);

        // Verify preferences can be updated independently
        await userDirectory.update_preferences({
          userId: userSimple,
          newPrefs: { theme: "light" }, // Only one preference
        });

        const updatedSimpleUser = await db.collection("UserDirectory.users").findOne({
          _id: userSimple,
        });
        assertEquals(updatedSimpleUser?.preferences, { theme: "light" });

        console.log("✓ Variant verified: Preferences support both simple and complex structures");
      },
    );

    await t.step(
      "principle: each user maintains independent saved places and preferences",
      async () => {
        // Clear users for this principle test to ensure clean state
        await db.collection("UserDirectory.users").deleteMany({});

        const userIdAlice = fakeUserId("AliceP");
        const userIdBob = fakeUserId("BobP");

        const placeIdAlice1 = fakePlaceId("Alice_Place1");
        const placeIdAlice2 = fakePlaceId("Alice_Place2");
        const placeIdBob1 = fakePlaceId("Bob_Place1");

        const alicePrefs = { theme: "dark" };
        const bobPrefs = { theme: "light", language: "fr" };

        // Alice registers
        await userDirectory.register_user({
          userId: userIdAlice,
          displayName: "Alice",
          email: "alice@example.com",
        });
        // Bob registers
        await userDirectory.register_user({
          userId: userIdBob,
          displayName: "Bob",
          email: "bob@example.com",
        });

        // Alice saves places and updates preferences
        await userDirectory.save_place({
          userId: userIdAlice,
          placeId: placeIdAlice1,
        });
        await userDirectory.save_place({
          userId: userIdAlice,
          placeId: placeIdAlice2,
        });
        await userDirectory.update_preferences({
          userId: userIdAlice,
          newPrefs: alicePrefs,
        });

        // Bob saves places and updates preferences
        await userDirectory.save_place({
          userId: userIdBob,
          placeId: placeIdBob1,
        });
        await userDirectory.update_preferences({
          userId: userIdBob,
          newPrefs: bobPrefs,
        });

        // Verify Alice's state
        const aliceUser = await db.collection("UserDirectory.users").findOne({
          _id: userIdAlice,
        });
        const aliceSavedPlacesResult = await userDirectory._get_saved_places({ userId: userIdAlice });
        if ("error" in aliceSavedPlacesResult) throw new Error(aliceSavedPlacesResult.error);
        assertEquals(
          aliceSavedPlacesResult.placeIds,
          [placeIdAlice1, placeIdAlice2],
          "Alice's saved places should be correct",
        );
        assertEquals(
          aliceUser?.preferences,
          alicePrefs,
          "Alice's preferences should be correct",
        );

        // Verify Bob's state
        const bobUser = await db.collection("UserDirectory.users").findOne({
          _id: userIdBob,
        });
        const bobSavedPlacesResult = await userDirectory._get_saved_places({ userId: userIdBob });
        if ("error" in bobSavedPlacesResult) throw new Error(bobSavedPlacesResult.error);
        assertEquals(
          bobSavedPlacesResult.placeIds,
          [placeIdBob1],
          "Bob's saved places should be correct",
        );
        assertEquals(
          bobUser?.preferences,
          bobPrefs,
          "Bob's preferences should be correct",
        );

        // Verify that Alice's actions did not affect Bob
        const bobUserAfterAliceActions = await db.collection(
          "UserDirectory.users",
        ).findOne({ _id: userIdBob });
        const bobSavedPlacesAfterAliceResult = await userDirectory._get_saved_places({ userId: userIdBob });
        if ("error" in bobSavedPlacesAfterAliceResult) throw new Error(bobSavedPlacesAfterAliceResult.error);
        assertEquals(
          bobSavedPlacesAfterAliceResult.placeIds,
          [placeIdBob1],
          "Bob's saved places should remain unchanged after Alice's actions",
        );
        assertEquals(
          bobUserAfterAliceActions?.preferences,
          bobPrefs,
          "Bob's preferences should remain unchanged after Alice's actions",
        );

        // Verify that Bob's actions did not affect Alice
        const aliceUserAfterBobActions = await db.collection(
          "UserDirectory.users",
        ).findOne({ _id: userIdAlice });
        const aliceSavedPlacesAfterBobResult = await userDirectory._get_saved_places({ userId: userIdAlice });
        if ("error" in aliceSavedPlacesAfterBobResult) throw new Error(aliceSavedPlacesAfterBobResult.error);
        assertEquals(aliceSavedPlacesAfterBobResult.placeIds, [
          placeIdAlice1,
          placeIdAlice2,
        ], "Alice's saved places should remain unchanged after Bob's actions");
        assertEquals(
          aliceUserAfterBobActions?.preferences,
          alicePrefs,
          "Alice's preferences should remain unchanged after Bob's actions",
        );
      },
    );
  } finally {
    await client.close();
  }
});
```
