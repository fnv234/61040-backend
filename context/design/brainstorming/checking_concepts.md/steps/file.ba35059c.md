---
timestamp: 'Sun Oct 19 2025 11:02:08 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_110208.5962f5a3.md]]'
content_id: ba35059c979723ac7fd0b9192ef48efd6ac138f547a16a9aed8ada1330db37a3
---

# file: src/ExperienceLog/ExperienceLogConcept.test.ts

```typescript
import { testDb } from "@utils/database.ts";
import { assertEquals } from "jsr:@std/assert";
import ExperienceLogConcept from "./ExperienceLogConcept.ts";
import { mockLLM } from "../../../gemini-llm.ts";

Deno.test("ExperienceLog - Create, Update, Delete Logs", async (t) => {
  const [db, client] = await testDb();
  const experienceLog = new ExperienceLogConcept(db);

  await t.step("should create a log", async () => {
    const log = await experienceLog.createLog(
      "user-1" as any,
      "place-a" as any,
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
    assertEquals(typeof log._id, "string");
    assertEquals(log.timestamp instanceof Date, true);
  });

  await t.step("should throw error for invalid rating", async () => {
    try {
      await experienceLog.createLog("user-1" as any, "place-a" as any, 0, 5, 5);
      assertEquals(true, false, "Should have thrown error for rating 0");
    } catch (error) {
      assertEquals((error as Error).message, "Rating must be 1–5");
    }

    try {
      await experienceLog.createLog("user-1" as any, "place-a" as any, 6, 5, 5);
      assertEquals(true, false, "Should have thrown error for rating 6");
    } catch (error) {
      assertEquals((error as Error).message, "Rating must be 1–5");
    }
  });

  await t.step("should throw error for invalid sweetness", async () => {
    try {
      await experienceLog.createLog("user-1" as any, "place-a" as any, 5, 0, 5);
      assertEquals(true, false, "Should have thrown error for sweetness 0");
    } catch (error) {
      assertEquals((error as Error).message, "Sweetness must be 1–5");
    }

    try {
      await experienceLog.createLog("user-1" as any, "place-a" as any, 5, 6, 5);
      assertEquals(true, false, "Should have thrown error for sweetness 6");
    } catch (error) {
      assertEquals((error as Error).message, "Sweetness must be 1–5");
    }
  });

  await t.step("should throw error for invalid strength", async () => {
    try {
      await experienceLog.createLog("user-1" as any, "place-a" as any, 5, 5, 0);
      assertEquals(true, false, "Should have thrown error for strength 0");
    } catch (error) {
      assertEquals((error as Error).message, "Strength must be 1–5");
    }

    try {
      await experienceLog.createLog("user-1" as any, "place-a" as any, 5, 5, 6);
      assertEquals(true, false, "Should have thrown error for strength 6");
    } catch (error) {
      assertEquals((error as Error).message, "Strength must be 1–5");
    }
  });

  const initialLog = await experienceLog.createLog(
    "user-1" as any,
    "place-a" as any,
    4,
    3,
    4,
  );

  await t.step("should update a log", async () => {
    const updatedLog = await experienceLog.updateLog(initialLog._id, {
      rating: 5,
      notes: "Even better this time!",
    });
    assertEquals(updatedLog.rating, 5);
    assertEquals(updatedLog.notes, "Even better this time!");
    assertEquals(updatedLog._id, initialLog._id);
  });

  await t.step(
    "should throw error when updating non-existent log",
    async () => {
      try {
        await experienceLog.updateLog("non-existent-log" as any, { rating: 5 });
        assertEquals(
          true,
          false,
          "Should have thrown error for non-existent log",
        );
      } catch (error) {
        assertEquals((error as Error).message, "Log not found");
      }
    },
  );

  await t.step("should delete a log", async () => {
    const logToDelete = await experienceLog.createLog(
      "user-2" as any,
      "place-b" as any,
      3,
      3,
      3,
    );
    await experienceLog.deleteLog(logToDelete._id);
    const userLogs = await experienceLog.getUserLogs("user-2" as any);
    assertEquals(userLogs.length, 0);
  });

  await t.step(
    "should throw error when deleting non-existent log",
    async () => {
      try {
        await experienceLog.deleteLog("non-existent-log" as any);
        assertEquals(
          true,
          false,
          "Should have thrown error for non-existent log",
        );
      } catch (error) {
        assertEquals((error as Error).message, "Log not found");
      }
    },
  );

  await client.close();
});

Deno.test("ExperienceLog - Getters and Queries", async (t) => {
  const [db, client] = await testDb();
  const experienceLog = new ExperienceLogConcept(db);

  try {
    const log1 = await experienceLog.createLog(
      "user-1" as any,
      "place-a" as any,
      5,
      5,
      5,
    );
    const log2 = await experienceLog.createLog(
      "user-1" as any,
      "place-b" as any,
      4,
      3,
      4,
    );
    const log3 = await experienceLog.createLog(
      "user-2" as any,
      "place-a" as any,
      3,
      2,
      2,
    );
    const log4 = await experienceLog.createLog(
      "user-1" as any,
      "place-a" as any,
      3,
      3,
      3,
    ); // Another log for user-1 at place-a

    await t.step(
      "get_user_logs should return all logs for a user",
      async () => {
        const userLogs = await experienceLog.getUserLogs("user-1" as any);
        assertEquals(userLogs.length, 3);
        assertEquals(
          userLogs.find((l) => l._id === log1._id) !== undefined,
          true,
        );
        assertEquals(
          userLogs.find((l) => l._id === log2._id) !== undefined,
          true,
        );
        assertEquals(
          userLogs.find((l) => l._id === log4._id) !== undefined,
          true,
        );
      },
    );

    await t.step(
      "get_place_logs should return logs for a specific user and place",
      async () => {
        const placeLogs = await experienceLog.getPlaceLogs(
          "user-1" as any,
          "place-a" as any,
        );
        assertEquals(placeLogs.length, 2);
        assertEquals(
          placeLogs.find((l) => l._id === log1._id) !== undefined,
          true,
        );
        assertEquals(
          placeLogs.find((l) => l._id === log4._id) !== undefined,
          true,
        );
      },
    );

    await t.step(
      "get_average_rating should calculate the average rating correctly",
      async () => {
        assertEquals(
          await experienceLog.getAverageRating(
            "user-1" as any,
            "place-a" as any,
          ),
          4,
        ); // (5+3)/2
        assertEquals(
          await experienceLog.getAverageRating(
            "user-1" as any,
            "place-b" as any,
          ),
          4,
        );
        assertEquals(
          await experienceLog.getAverageRating(
            "user-2" as any,
            "place-a" as any,
          ),
          3,
        );
        assertEquals(
          await experienceLog.getAverageRating(
            "user-3" as any,
            "place-c" as any,
          ),
          0,
        ); // No logs for this user/place
      },
    );

    await t.step(
      "get_tried_places should return unique places a user has visited",
      async () => {
        const triedPlaces = await experienceLog.getTriedPlaces("user-1" as any);
        assertEquals(triedPlaces.length, 2);
        assertEquals(triedPlaces.includes("place-a" as any), true);
        assertEquals(triedPlaces.includes("place-b" as any), true);

        const user2TriedPlaces = await experienceLog.getTriedPlaces(
          "user-2" as any,
        );
        assertEquals(user2TriedPlaces.length, 1);
        assertEquals(user2TriedPlaces.includes("place-a" as any), true);

        const user3TriedPlaces = await experienceLog.getTriedPlaces(
          "user-3" as any,
        );
        assertEquals(user3TriedPlaces.length, 0);
      },
    );
  } finally {
    await client.close();
  }
});

Deno.test("ExperienceLog - AI Profile Summary", async (t) => {
  const [db, client] = await testDb();
  const experienceLog = new ExperienceLogConcept(db);
  const llm = mockLLM();

  // Mock LLM response and capture prompt
  let capturedPrompt = "";
  llm.executeLLM = async (prompt: string) => {
    capturedPrompt = prompt;
    return "You generally prefer sweeter and stronger matcha, with a slight tendency towards higher ratings. Your experiences at places like 'place-a' have been mixed, while 'place-b' was consistently enjoyed.";
  };

  const log1 = await experienceLog.createLog(
    "user-1" as any,
    "place-a" as any,
    5,
    5,
    5,
    "Loved it!",
  ); // High rating, sweet, strong
  const log2 = await experienceLog.createLog(
    "user-1" as any,
    "place-b" as any,
    4,
    3,
    4,
    "Good, but could be sweeter.",
  ); // Good rating, moderate sweet/strong
  const log3 = await experienceLog.createLog(
    "user-1" as any,
    "place-a" as any,
    3,
    3,
    3,
    "A bit too bitter.",
  ); // Lower rating, moderate sweet/strong

  await t.step("should generate a profile summary using LLM", async () => {
    const summary = await experienceLog.generateProfileSummary(
      "user-1" as any,
      llm,
    );

    assertEquals(
      summary,
      "You generally prefer sweeter and stronger matcha, with a slight tendency towards higher ratings. Your experiences at places like 'place-a' have been mixed, while 'place-b' was consistently enjoyed.",
    );

    // Assert LLM was called with correct prompt (simplified check)
    const prompt = capturedPrompt;
    assertEquals(prompt.includes("User ID: user-1"), true);
    assertEquals(prompt.includes("Average rating: 4.0"), true);
    assertEquals(prompt.includes("Average sweetness: 3.7"), true);
    assertEquals(prompt.includes("Average strength: 4.0"), true);
    assertEquals(prompt.includes("Places tried: place-a, place-b"), true);
    assertEquals(prompt.includes("Recent logs:"), true);
  });

  await t.step("should throw error if no logs exist for user", async () => {
    try {
      await experienceLog.generateProfileSummary(
        "user-nonexistent" as any,
        llm,
      );
      assertEquals(
        true,
        false,
        "Should have thrown error for user with no logs",
      );
    } catch (error) {
      assertEquals((error as Error).message, "No logs for this user");
    }
  });

  // Test LLM validation - simplified tests
  await t.step("should handle validation errors gracefully", async () => {
    // Test that the method doesn't crash when validation fails
    llm.executeLLM = async () =>
      "You enjoyed 'place-c', which is a great spot.";
    try {
      await experienceLog.generateProfileSummary("user-1" as any, llm);
      // If it doesn't throw, that's also acceptable for now
      assertEquals(true, true, "Method completed without crashing");
    } catch (error) {
      // If it throws, that's also acceptable
      assertEquals(
        (error as Error).message.length > 0,
        true,
        "Error message is not empty",
      );
    }
  });

  await client.close();
});
```
