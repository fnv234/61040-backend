[@implementation](implementation.md)

[@testing-concepts](../../background/testing-concepts.md)

[@no_mistakes](../../no_mistakes.md)


# test: ExperienceLog

# file: src/ExperienceLog/ExperienceLogConcept.test.ts
# response:

```typescript
import { testDb } from "@utils/database.ts";
import { assertEquals, assertThrows } from "jsr:@std/assert";
import ExperienceLog from "./ExperienceLogConcept.ts";
import { mockLLM } from "../../../gemini-llm.ts";

Deno.test("ExperienceLog - Create, Update, Delete Logs", async (t) => {
  const [db, client] = await testDb();
  const experienceLog = new ExperienceLog(db);

  await t.step("should create a log", () => {
    const log = experienceLog.createLog(
      "user-1",
      "place-a",
      5,
      5,
      5,
      "Great experience!",
      "http://example.com/photo.jpg",
    );
    assertEquals(log.userId, "user-1");
    assertEquals(log.placeId, "place-a");
    assertEquals(log.rating, 5);
    assertEquals(log.sweetness, 5);
    assertEquals(log.strength, 5);
    assertEquals(log.notes, "Great experience!");
    assertEquals(log.photo, "http://example.com/photo.jpg");
    assertEquals(typeof log.logId, "string");
    assertEquals(log.logId.startsWith("log-"), true);
    assertEquals(log.timestamp instanceof Date, true);
  });

  await t.step("should throw error for invalid rating", () => {
    assertThrows(() =>
      experienceLog.createLog("user-1", "place-a", 0, 5, 5),
      "Rating must be 1–5",
    );
    assertThrows(() =>
      experienceLog.createLog("user-1", "place-a", 6, 5, 5),
      "Rating must be 1–5",
    );
  });

  await t.step("should throw error for invalid sweetness", () => {
    assertThrows(() =>
      experienceLog.createLog("user-1", "place-a", 5, 0, 5),
      "Sweetness must be 1–5",
    );
    assertThrows(() =>
      experienceLog.createLog("user-1", "place-a", 5, 6, 5),
      "Sweetness must be 1–5",
    );
  });

  await t.step("should throw error for invalid strength", () => {
    assertThrows(() =>
      experienceLog.createLog("user-1", "place-a", 5, 5, 0),
      "Strength must be 1–5",
    );
    assertThrows(() =>
      experienceLog.createLog("user-1", "place-a", 5, 5, 6),
      "Strength must be 1–5",
    );
  });

  const initialLog = experienceLog.createLog("user-1", "place-a", 4, 3, 4);

  await t.step("should update a log", () => {
    const updatedLog = experienceLog.updateLog(initialLog.logId, {
      rating: 5,
      notes: "Even better this time!",
    });
    assertEquals(updatedLog.rating, 5);
    assertEquals(updatedLog.notes, "Even better this time!");
    assertEquals(updatedLog.logId, initialLog.logId);
  });

  await t.step("should throw error when updating non-existent log", () => {
    assertThrows(() =>
      experienceLog.updateLog("non-existent-log", { rating: 5 }),
      "Log not found",
    );
  });

  await t.step("should delete a log", () => {
    const logToDelete = experienceLog.createLog("user-2", "place-b", 3, 3, 3);
    experienceLog.deleteLog(logToDelete.logId);
    assertEquals(experienceLog.getUserLogs("user-2").length, 0);
  });

  await t.step("should throw error when deleting non-existent log", () => {
    assertThrows(() => experienceLog.deleteLog("non-existent-log"));
  });

  await client.close();
});

Deno.test("ExperienceLog - Getters and Queries", async (t) => {
  const [db, client] = await testDb();
  const experienceLog = new ExperienceLog(db);

  const log1 = experienceLog.createLog("user-1", "place-a", 5, 5, 5);
  const log2 = experienceLog.createLog("user-1", "place-b", 4, 3, 4);
  const log3 = experienceLog.createLog("user-2", "place-a", 3, 2, 2);
  const log4 = experienceLog.createLog("user-1", "place-a", 3, 3, 3); // Another log for user-1 at place-a

  await t.step("get_user_logs should return all logs for a user", () => {
    const userLogs = experienceLog.getUserLogs("user-1");
    assertEquals(userLogs.length, 3);
    assertEquals(userLogs.find((l) => l.logId === log1.logId) !== undefined, true);
    assertEquals(userLogs.find((l) => l.logId === log2.logId) !== undefined, true);
    assertEquals(userLogs.find((l) => l.logId === log4.logId) !== undefined, true);
  });

  await t.step("get_place_logs should return logs for a specific user and place", () => {
    const placeLogs = experienceLog.getPlaceLogs("user-1", "place-a");
    assertEquals(placeLogs.length, 2);
    assertEquals(placeLogs.find((l) => l.logId === log1.logId) !== undefined, true);
    assertEquals(placeLogs.find((l) => l.logId === log4.logId) !== undefined, true);
  });

  await t.step("get_average_rating should calculate the average rating correctly", () => {
    assertEquals(experienceLog.getAverageRating("user-1", "place-a"), 4); // (5+3)/2
    assertEquals(experienceLog.getAverageRating("user-1", "place-b"), 4);
    assertEquals(experienceLog.getAverageRating("user-2", "place-a"), 3);
    assertEquals(experienceLog.getAverageRating("user-3", "place-c"), 0); // No logs for this user/place
  });

  await t.step("get_tried_places should return unique places a user has visited", () => {
    const triedPlaces = experienceLog.getTriedPlaces("user-1");
    assertEquals(triedPlaces.length, 2);
    assertEquals(triedPlaces.includes("place-a"), true);
    assertEquals(triedPlaces.includes("place-b"), true);

    const user2TriedPlaces = experienceLog.getTriedPlaces("user-2");
    assertEquals(user2TriedPlaces.length, 1);
    assertEquals(user2TriedPlaces.includes("place-a"), true);

    const user3TriedPlaces = experienceLog.getTriedPlaces("user-3");
    assertEquals(user3TriedPlaces.length, 0);
  });

  await client.close();
});

Deno.test("ExperienceLog - AI Profile Summary", async (t) => {
  const [db, client] = await testDb();
  const experienceLog = new ExperienceLog(db);
  const llm = mockLLM();

  // Mock LLM response
  llm.executeLLM.mockResolvedValue(
    "You generally prefer sweeter and stronger matcha, with a slight tendency towards higher ratings. Your experiences at places like 'place-a' have been mixed, while 'place-b' was consistently enjoyed.",
  );

  const log1 = experienceLog.createLog("user-1", "place-a", 5, 5, 5, "Loved it!"); // High rating, sweet, strong
  const log2 = experienceLog.createLog("user-1", "place-b", 4, 3, 4, "Good, but could be sweeter."); // Good rating, moderate sweet/strong
  const log3 = experienceLog.createLog("user-1", "place-a", 3, 3, 3, "A bit too bitter."); // Lower rating, moderate sweet/strong

  await t.step("should generate a profile summary using LLM", async () => {
    const summary = await experienceLog.generateProfileSummary("user-1", llm);

    assertEquals(
      summary,
      "You generally prefer sweeter and stronger matcha, with a slight tendency towards higher ratings. Your experiences at places like 'place-a' have been mixed, while 'place-b' was consistently enjoyed.",
    );

    // Assert LLM was called with correct prompt (simplified check)
    const prompt = llm.executeLLM.mock.calls[0]?.args[0];
    assertEquals(prompt.includes("User ID: user-1"), true);
    assertEquals(prompt.includes("Average rating: 4.0"), true);
    assertEquals(prompt.includes("Average sweetness: 3.7"), true);
    assertEquals(prompt.includes("Average strength: 4.0"), true);
    assertEquals(prompt.includes("Places tried: place-a, place-b"), true);
    assertEquals(prompt.includes("Recent logs:"), true);
  });

  await t.step("should throw error if no logs exist for user", async () => {
    await assertThrows(
      () => experienceLog.generateProfileSummary("user-nonexistent", llm),
      "No logs for this user",
    );
  });

  // Test LLM validation
  await t.step("should throw validation error if summary mentions un-tried places", async () => {
    llm.executeLLM.mockResolvedValue(
      "You enjoyed 'place-c', which is a great spot.",
    );
    await assertThrows(
      async () => await experienceLog.generateProfileSummary("user-1", llm),
      "Summary mentions place 'place-c' which user has not visited",
    );
  });

  await t.step("should throw validation error if summary is too long", async () => {
    llm.executeLLM.mockResolvedValue(
      "This is a very long summary that definitely exceeds the three-sentence limit for a concise user profile, designed to illustrate how the validation mechanism for summary length would trigger an error, ensuring that the output remains brief and to the point, as per the requirements.",
    );
    await assertThrows(
      async () => await experienceLog.generateProfileSummary("user-1", llm),
      "Summary must not exceed 3 sentences",
    );
  });

  await t.step("should throw validation error if summary sentiment is misaligned", async () => {
    // User's average rating is 4.0 (positive), but LLM generates a critical summary.
    llm.executeLLM.mockResolvedValue(
      "Your experiences have been largely disappointing.",
    );
    await assertThrows(
      async () => await experienceLog.generateProfileSummary("user-1", llm),
      "Summary sentiment is misaligned with the overall average rating",
    );
  });

  await client.close();
});

// Mocking the LLM for testing purposes
// In a real scenario, this would be imported from a separate utility file.
const mockLLM = () => {
  const executeLLM = deno.fn(); // Use deno.fn for mocking

  return {
    executeLLM,
  };
};
```

# trace:
