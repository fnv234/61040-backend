---
timestamp: 'Sun Oct 12 2025 20:45:25 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_204525.16a66984.md]]'
content_id: 4e1d50bd263c3f87b9eca325454ca39b46491c384b7860c974e307887fde051e
---

# response:

```typescript
import { assertEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts"; // Assuming ID is a string with type branding

import UserDirectoryConcept from "./UserDirectoryConcept.ts";

Deno.test("UserDirectoryConcept - Registration and Basic Operations", async (t) => {
  const [db, client] = await testDb();
  const userDirectory = new UserDirectoryConcept(db);

  // Define some mock IDs
  const userIdAlice = "user:Alice" as ID;
  const userIdBob = "user:Bob" as ID;
  const placeId1 = "place:EiffelTower" as ID;
  const placeId2 = "place:Louvre" as ID;

  await t.step("requires: User registration with non-existent userId and non-empty details", async () => {
    const result = await userDirectory.register_user({
      userId: userIdAlice,
      displayName: "Alice Smith",
      email: "alice@example.com",
    });
    assertEquals(result, userIdAlice, "Should successfully register Alice.");
  });

  await t.step("requires: User registration fails if userId already exists", async () => {
    const result = await userDirectory.register_user({
      userId: userIdAlice, // Alice already exists
      displayName: "Alice S.",
      email: "alice.s@example.com",
    });
    assertEquals(result.error, "User with userId user:Alice already exists.", "Should not register user if userId exists.");
  });

  await t.test("requires: User registration fails with empty displayName", async () => {
    const result = await userDirectory.register_user({
      userId: userIdBob,
      displayName: "",
      email: "bob@example.com",
    });
    assertEquals(result.error, "DisplayName and email cannot be empty.", "Should not register user with empty displayName.");
  });

  await t.test("requires: User registration fails with empty email", async () => {
    const result = await userDirectory.register_user({
      userId: userIdBob,
      displayName: "Bob Johnson",
      email: "",
    });
    assertEquals(result.error, "DisplayName and email cannot be empty.", "Should not register user with empty email.");
  });

  // Register Bob for subsequent tests
  await userDirectory.register_user({
    userId: userIdBob,
    displayName: "Bob Johnson",
    email: "bob@example.com",
  });

  await t.step("save_place: Requires user to exist and adds place to savedPlaces", async () => {
    const result = await userDirectory.save_place({ userId: userIdAlice, placeId: placeId1 });
    assertEquals(result, {}, "Should successfully save place for Alice.");

    const alice = await userDirectory.users.findOne({ _id: userIdAlice });
    assertEquals(alice?.savedPlaces.includes(placeId1), true, "Alice should have placeId1 saved.");
  });

  await t.step("save_place: Requires userId to exist", async () => {
    const result = await userDirectory.save_place({ userId: "nonexistent:user" as ID, placeId: placeId1 });
    assertEquals(result.error, "User with userId nonexistent:user not found.", "Should return error if user does not exist.");
  });

  await t.step("save_place: Does not error if place is already saved", async () => {
    // Save placeId1 for Alice again
    const result = await userDirectory.save_place({ userId: userIdAlice, placeId: placeId1 });
    assertEquals(result, {}, "Saving an already saved place should not error.");
    const alice = await userDirectory.users.findOne({ _id: userIdAlice });
    assertEquals(alice?.savedPlaces.length, 1, "Number of saved places should not increase.");
  });

  await t.step("save_place: Can save multiple places", async () => {
    const result = await userDirectory.save_place({ userId: userIdAlice, placeId: placeId2 });
    assertEquals(result, {}, "Should successfully save placeId2 for Alice.");

    const alice = await userDirectory.users.findOne({ _id: userIdAlice });
    assertEquals(alice?.savedPlaces.length, 2, "Alice should have two places saved.");
    assertEquals(alice?.savedPlaces.includes(placeId2), true, "Alice should have placeId2 saved.");
  });

  await t.step("get_saved_places: Returns saved places for a user", async () => {
    const places = await userDirectory.get_saved_places({ userId: userIdAlice });
    assertEquals(Array.isArray(places), true, "Should return an array of places.");
    assertEquals(places.length, 2, "Alice should have 2 saved places.");
    assertEquals(places.includes(placeId1), true, "PlaceId1 should be in Alice's saved places.");
    assertEquals(places.includes(placeId2), true, "PlaceId2 should be in Alice's saved places.");
  });

  await t.step("get_saved_places: Returns empty array for user with no saved places", async () => {
    const places = await userDirectory.get_saved_places({ userId: userIdBob });
    assertEquals(Array.isArray(places), true, "Should return an array for Bob.");
    assertEquals(places.length, 0, "Bob should have 0 saved places.");
  });

  await t.step("get_saved_places: Requires userId to exist", async () => {
    const result = await userDirectory.get_saved_places({ userId: "nonexistent:user" as ID });
    assertEquals(result.error, "User with userId nonexistent:user not found.", "Should return error if user does not exist.");
  });

  await t.step("unsave_place: Requires user to exist and place to be saved", async () => {
    const result = await userDirectory.unsave_place({ userId: userIdAlice, placeId: placeId1 });
    assertEquals(result, {}, "Should successfully unsave placeId1 for Alice.");

    const alice = await userDirectory.users.findOne({ _id: userIdAlice });
    assertEquals(alice?.savedPlaces.length, 1, "Alice should have 1 saved place left.");
    assertEquals(alice?.savedPlaces.includes(placeId1), false, "Alice should no longer have placeId1 saved.");
  });

  await t.step("unsave_place: Requires userId to exist", async () => {
    const result = await userDirectory.unsave_place({ userId: "nonexistent:user" as ID, placeId: placeId1 });
    assertEquals(result.error, "User with userId nonexistent:user not found.", "Should return error if user does not exist.");
  });

  await t.step("unsave_place: Requires placeId to be in savedPlaces", async () => {
    const result = await userDirectory.unsave_place({ userId: userIdAlice, placeId: "nonexistent:place" as ID });
    assertEquals(result.error, "PlaceId nonexistent:place not found in saved places for user user:Alice.", "Should return error if placeId is not saved.");
  });

  await t.step("update_preferences: Updates user preferences", async () => {
    const newPrefs = { theme: "dark", language: "en" };
    const result = await userDirectory.update_preferences({ userId: userIdAlice, newPrefs });
    assertEquals(result, {}, "Should successfully update preferences for Alice.");

    const alice = await userDirectory.users.findOne({ _id: userIdAlice });
    assertEquals(alice?.preferences, newPrefs, "Alice's preferences should be updated.");
  });

  await t.step("update_preferences: Requires userId to exist", async () => {
    const newPrefs = { theme: "dark" };
    const result = await userDirectory.update_preferences({ userId: "nonexistent:user" as ID, newPrefs });
    assertEquals(result.error, "User with userId nonexistent:user not found.", "Should return error if user does not exist.");
  });

  // Test principle: each user maintains independent saved places and preferences
  await t.step("Principle: Alice and Bob's saved places and preferences are independent", async () => {
    // Alice's state
    const aliceSavedPlaces = await userDirectory.get_saved_places({ userId: userIdAlice });
    assertEquals(aliceSavedPlaces.length, 1, "Alice should still have 1 saved place.");
    assertEquals(aliceSavedPlaces.includes(placeId2), true, "Alice should still have placeId2 saved.");

    const aliceUser = await userDirectory.users.findOne({ _id: userIdAlice });
    assertEquals(aliceUser?.preferences.theme, "dark", "Alice's theme preference should remain.");

    // Bob's state
    const bobSavedPlaces = await userDirectory.get_saved_places({ userId: userIdBob });
    assertEquals(bobSavedPlaces.length, 0, "Bob should have 0 saved places.");

    const bobUser = await userDirectory.users.findOne({ _id: userIdBob });
    assertEquals(bobUser?.preferences, {}, "Bob's preferences should remain empty.");
  });

  await client.close();
});
```
