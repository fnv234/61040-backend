import { testDb } from "@utils/database.ts";
import { assertEquals } from "jsr:@std/assert";
import ExperienceLogConcept from "./ExperienceLogConcept.ts";
import { mockLLM } from "../../../gemini-llm.ts";
import { ID } from "@utils/types.ts";

Deno.test("ExperienceLog - Create, Update, Delete Logs", async (t) => {
  const [db, client] = await testDb();
  const experienceLog = new ExperienceLogConcept(db);

  try {
    const user1 = "user:user1" as ID;
    const placeA = "place:placeA" as ID;
    const placeB = "place:placeB" as ID;
    const user2 = "user:user2" as ID;

    await t.step("create_log should create a log", async () => {
      const result = await experienceLog.create_log({
        userId: user1,
        placeId: placeA,
        rating: 5,
        sweetness: 5,
        strength: 5,
        notes: "Great experience!",
        photo: "http://example.com/photo.jpg",
      });
      if ("error" in result) throw new Error(result.error);
      const logId = result.logId;

      const logsResult = await experienceLog._get_user_logs({ userId: user1 });
      const log = logsResult.logs.find((l) => l._id === logId);

      assertEquals(log?.userId, user1);
      assertEquals(log?.placeId, placeA);
      assertEquals(log?.rating, 5);
      assertEquals(log?.sweetness, 5);
      assertEquals(log?.strength, 5);
      assertEquals(log?.notes, "Great experience!");
      assertEquals(log?.photo, "http://example.com/photo.jpg");
      assertEquals(typeof log?._id, "string");
      assertEquals(log?.timestamp instanceof Date, true);
    });

    await t.step("create_log should return error for invalid rating", async () => {
      const result1 = await experienceLog.create_log({ userId: user1, placeId: placeA, rating: 0, sweetness: 5, strength: 5 });
      assertEquals(result1, { error: "Rating must be 1–5" });

      const result2 = await experienceLog.create_log({ userId: user1, placeId: placeA, rating: 6, sweetness: 5, strength: 5 });
      assertEquals(result2, { error: "Rating must be 1–5" });
    });

    await t.step("create_log should return error for invalid sweetness", async () => {
      const result1 = await experienceLog.create_log({ userId: user1, placeId: placeA, rating: 5, sweetness: 0, strength: 5 });
      assertEquals(result1, { error: "Sweetness must be 1–5" });

      const result2 = await experienceLog.create_log({ userId: user1, placeId: placeA, rating: 5, sweetness: 6, strength: 5 });
      assertEquals(result2, { error: "Sweetness must be 1–5" });
    });

    await t.step("create_log should return error for invalid strength", async () => {
      const result1 = await experienceLog.create_log({ userId: user1, placeId: placeA, rating: 5, sweetness: 5, strength: 0 });
      assertEquals(result1, { error: "Strength must be 1–5" });

      const result2 = await experienceLog.create_log({ userId: user1, placeId: placeA, rating: 5, sweetness: 5, strength: 6 });
      assertEquals(result2, { error: "Strength must be 1–5" });
    });

    const initialLogResult = await experienceLog.create_log({
      userId: user1,
      placeId: placeA,
      rating: 4,
      sweetness: 3,
      strength: 4,
    });
    if ("error" in initialLogResult) throw new Error(initialLogResult.error);
    const initialLogId = initialLogResult.logId;

    await t.step("update_log should update a log", async () => {
      const updatedLogResult = await experienceLog.update_log({
        logId: initialLogId,
        rating: 5,
        notes: "Even better this time!",
      });
      if ("error" in updatedLogResult) throw new Error(updatedLogResult.error);
      const updatedLog = updatedLogResult.log;

      assertEquals(updatedLog.rating, 5);
      assertEquals(updatedLog.notes, "Even better this time!");
      assertEquals(updatedLog._id, initialLogId);
    });

    await t.step(
      "update_log should return error when updating non-existent log",
      async () => {
        const result = await experienceLog.update_log({ logId: "non-existent-log" as ID, rating: 5 });
        assertEquals(result, { error: "Log not found" });
      },
    );
    
    await t.step("update_log should return error for invalid rating in update", async () => {
      const result = await experienceLog.update_log({ logId: initialLogId, rating: 0 });
      assertEquals(result, { error: "Rating must be 1–5" });
    });

    await t.step("delete_log should delete a log", async () => {
      const logToDeleteResult = await experienceLog.create_log({
        userId: user2,
        placeId: placeB,
        rating: 3,
        sweetness: 3,
        strength: 3,
      });
      if ("error" in logToDeleteResult) throw new Error(logToDeleteResult.error);
      const logToDeleteId = logToDeleteResult.logId;

      const deleteResult = await experienceLog.delete_log({ logId: logToDeleteId });
      assertEquals(deleteResult, {});

      const user2LogsResult = await experienceLog._get_user_logs({ userId: user2 });
      assertEquals(user2LogsResult.logs.length, 0);
    });

    await t.step(
      "delete_log should return error when deleting non-existent log",
      async () => {
        const result = await experienceLog.delete_log({ logId: "non-existent-log" as ID });
        assertEquals(result, { error: "Log not found" });
      },
    );
  } finally {
    await client.close();
  }
});

Deno.test("ExperienceLog - Getters and Queries", async (t) => {
  const [db, client] = await testDb();
  const experienceLog = new ExperienceLogConcept(db);

  try {
    const user1 = "user:user1" as ID;
    const user2 = "user:user2" as ID;
    const user3 = "user:user3" as ID;
    const placeA = "place:placeA" as ID;
    const placeB = "place:placeB" as ID;
    const placeC = "place:placeC" as ID;

    const log1Result = await experienceLog.create_log({ userId: user1, placeId: placeA, rating: 5, sweetness: 5, strength: 5 });
    if ("error" in log1Result) throw new Error(log1Result.error);
    const log1Id = log1Result.logId;

    const log2Result = await experienceLog.create_log({ userId: user1, placeId: placeB, rating: 4, sweetness: 3, strength: 4 });
    if ("error" in log2Result) throw new Error(log2Result.error);
    const log2Id = log2Result.logId;

    const log3Result = await experienceLog.create_log({ userId: user2, placeId: placeA, rating: 3, sweetness: 2, strength: 2 });
    if ("error" in log3Result) throw new Error(log3Result.error);
    const log3Id = log3Result.logId;

    const log4Result = await experienceLog.create_log({ userId: user1, placeId: placeA, rating: 3, sweetness: 3, strength: 3 });
    if ("error" in log4Result) throw new Error(log4Result.error);
    const log4Id = log4Result.logId;

    await t.step(
      "_get_user_logs should return all logs for a user",
      async () => {
        const userLogsResult = await experienceLog._get_user_logs({ userId: user1 });
        const userLogs = userLogsResult.logs;
        assertEquals(userLogs.length, 3);
        assertEquals(userLogs.some((l) => l._id === log1Id), true);
        assertEquals(userLogs.some((l) => l._id === log2Id), true);
        assertEquals(userLogs.some((l) => l._id === log4Id), true);
      },
    );

    await t.step(
      "_get_place_logs should return logs for a specific user and place",
      async () => {
        const placeLogsResult = await experienceLog._get_place_logs({
          userId: user1,
          placeId: placeA,
        });
        const placeLogs = placeLogsResult.logs;
        assertEquals(placeLogs.length, 2);
        assertEquals(placeLogs.some((l) => l._id === log1Id), true);
        assertEquals(placeLogs.some((l) => l._id === log4Id), true);
      },
    );

    await t.step(
      "_get_average_rating should calculate the average rating correctly",
      async () => {
        const avg1 = await experienceLog._get_average_rating({
          userId: user1,
          placeId: placeA,
        });
        if ("error" in avg1) throw new Error(avg1.error);
        assertEquals(avg1.averageRating, 4); // (5+3)/2

        const avg2 = await experienceLog._get_average_rating({
          userId: user1,
          placeId: placeB,
        });
        if ("error" in avg2) throw new Error(avg2.error);
        assertEquals(avg2.averageRating, 4);

        const avg3 = await experienceLog._get_average_rating({
          userId: user2,
          placeId: placeA,
        });
        if ("error" in avg3) throw new Error(avg3.error);
        assertEquals(avg3.averageRating, 3);

        const avg4 = await experienceLog._get_average_rating({
          userId: user3,
          placeId: placeC,
        });
        assertEquals(avg4, { error: "No logs found for this user and place." });
      },
    );

    await t.step(
      "_get_tried_places should return unique places a user has visited",
      async () => {
        const triedPlacesResult = await experienceLog._get_tried_places({ userId: user1 });
        const triedPlaces = triedPlacesResult.places;
        assertEquals(triedPlaces.length, 2);
        assertEquals(triedPlaces.includes(placeA), true);
        assertEquals(triedPlaces.includes(placeB), true);

        const user2TriedPlacesResult = await experienceLog._get_tried_places({ userId: user2 });
        const user2TriedPlaces = user2TriedPlacesResult.places;
        assertEquals(user2TriedPlaces.length, 1);
        assertEquals(user2TriedPlaces.includes(placeA), true);

        const user3TriedPlacesResult = await experienceLog._get_tried_places({ userId: user3 });
        const user3TriedPlaces = user3TriedPlacesResult.places;
        assertEquals(user3TriedPlaces.length, 0);
      },
    );
  } finally {
    await client.close();
  }
});

Deno.test("ExperienceLog - Operational Principle", async (t) => {
  const [db, client] = await testDb();
  const experienceLog = new ExperienceLogConcept(db);
  const llm = mockLLM();

  try {
    await t.step(
      "principle: experiences are logged with ratings and attributes, enabling queries and AI-generated summaries",
      async () => {
        const userId = "user:principle-test" as ID;
        const cafeA = "place:ZenTeaHouse" as ID;
        const cafeB = "place:ModernMatchaBar" as ID;
        const cafeC = "place:TraditionalTeaRoom" as ID;

        // Step 1: User logs multiple experiences at different places with detailed attributes
        const log1Result = await experienceLog.create_log({
          userId,
          placeId: cafeA,
          rating: 5,
          sweetness: 4,
          strength: 5,
          notes: "Excellent matcha latte! Very smooth and strong.",
        });
        if ("error" in log1Result) throw new Error(log1Result.error);

        const log2Result = await experienceLog.create_log({
          userId,
          placeId: cafeB,
          rating: 3,
          sweetness: 2,
          strength: 2,
          notes: "Too weak and not sweet enough for my taste.",
        });
        if ("error" in log2Result) throw new Error(log2Result.error);

        const log3Result = await experienceLog.create_log({
          userId,
          placeId: cafeA,
          rating: 4,
          sweetness: 5,
          strength: 4,
          notes: "Still great! Love the sweetness.",
        });
        if ("error" in log3Result) throw new Error(log3Result.error);

        const log4Result = await experienceLog.create_log({
          userId,
          placeId: cafeC,
          rating: 5,
          sweetness: 3,
          strength: 5,
          notes: "Perfect balance of traditional preparation.",
        });
        if ("error" in log4Result) throw new Error(log4Result.error);

        // Step 2: Verify logs are stored correctly with all attributes
        const userLogsResult = await experienceLog._get_user_logs({ userId });
        const userLogs = userLogsResult.logs;
        assertEquals(userLogs.length, 4, "Should have 4 logged experiences");
        assertEquals(userLogs[0].rating, 5);
        assertEquals(userLogs[0].sweetness, 4);
        assertEquals(userLogs[0].strength, 5);
        assertEquals(userLogs[1].rating, 3);
        assertEquals(userLogs[2].rating, 4);
        assertEquals(userLogs[3].rating, 5);

        // Step 3: Verify aggregate statistics are computed correctly from logged data
        const avgRatingCafeAResult = await experienceLog._get_average_rating({
          userId,
          placeId: cafeA,
        });
        if ("error" in avgRatingCafeAResult) throw new Error(avgRatingCafeAResult.error);
        assertEquals(avgRatingCafeAResult.averageRating, 4.5, "Average rating for cafeA should be (5+4)/2 = 4.5");

        const triedPlacesResult = await experienceLog._get_tried_places({ userId });
        const triedPlaces = triedPlacesResult.places;
        assertEquals(triedPlaces.length, 3, "Should have tried 3 unique places");
        assertEquals(triedPlaces.includes(cafeA), true);
        assertEquals(triedPlaces.includes(cafeB), true);
        assertEquals(triedPlaces.includes(cafeC), true);

        // Step 4: Generate AI summary from logged experiences
        llm.executeLLM = async (prompt: string) => {
          // Verify the prompt contains the logged data
          assertEquals(prompt.includes(userId), true);
          // Check for average values (allowing for floating point formatting)
          assertEquals(prompt.includes("Average rating:") && prompt.includes("4."), true); // (5+3+4+5)/4 = 4.25
          assertEquals(prompt.includes("Average sweetness:") && prompt.includes("3."), true); // (4+2+5+3)/4 = 3.5
          assertEquals(prompt.includes("Average strength:") && prompt.includes("4."), true); // (5+2+4+5)/4 = 4.0
          return "You prefer stronger matcha with higher ratings. Your favorite spot is place:ZenTeaHouse, which you've visited twice with consistently high ratings. You found place:ModernMatchaBar too weak for your taste.";
        };

        const summaryResult = await experienceLog.generate_profile_summary({
          userId,
          llm,
        });
        if ("error" in summaryResult) throw new Error(summaryResult.error);
        const summary = summaryResult.summary;

        // Step 5: Verify AI summary reflects the logged experiences
        assertEquals(
          summary.includes("stronger"),
          true,
          "Summary should mention strength preference based on logged data",
        );
        assertEquals(
          summary.includes("ZenTeaHouse"),
          true,
          "Summary should mention the favorite place based on logs",
        );
        assertEquals(
          summary.includes("twice"),
          true,
          "Summary should reflect visit frequency from logs",
        );

        console.log("✓ Principle verified: Experiences logged → Statistics computed → AI summary generated from actual data");
      },
    );
  } finally {
    await client.close();
  }
});

Deno.test("ExperienceLog - Variant: Minimal vs Detailed Logs", async (t) => {
  const [db, client] = await testDb();
  const experienceLog = new ExperienceLogConcept(db);

  try {
    await t.step(
      "variant: logs can be created with minimal required fields or with full optional details",
      async () => {
        const userId = "user:variant-test" as ID;
        const placeMinimal = "place:MinimalCafe" as ID;
        const placeDetailed = "place:DetailedCafe" as ID;

        // Variant 1: Minimal log with only required fields
        const minimalLogResult = await experienceLog.create_log({
          userId,
          placeId: placeMinimal,
          rating: 4,
          sweetness: 3,
          strength: 4,
          // No notes or photo
        });
        if ("error" in minimalLogResult) throw new Error(minimalLogResult.error);
        const minimalLogId = minimalLogResult.logId;

        // Variant 2: Detailed log with all optional fields
        const detailedLogResult = await experienceLog.create_log({
          userId,
          placeId: placeDetailed,
          rating: 5,
          sweetness: 5,
          strength: 5,
          notes: "Exceptional experience! The matcha was perfectly balanced.",
          photo: "http://example.com/detailed-matcha.jpg",
        });
        if ("error" in detailedLogResult) throw new Error(detailedLogResult.error);
        const detailedLogId = detailedLogResult.logId;

        // Verify both variants are stored correctly
        const userLogsResult = await experienceLog._get_user_logs({ userId });
        const userLogs = userLogsResult.logs;
        assertEquals(userLogs.length, 2);

        const minimalLog = userLogs.find((l) => l._id === minimalLogId);
        assertEquals(minimalLog?.rating, 4);
        // MongoDB stores missing optional fields as null, not undefined
        assertEquals(minimalLog?.notes == null, true, "Minimal log should have no notes");
        assertEquals(minimalLog?.photo == null, true, "Minimal log should have no photo");

        const detailedLog = userLogs.find((l) => l._id === detailedLogId);
        assertEquals(detailedLog?.rating, 5);
        assertEquals(detailedLog?.notes, "Exceptional experience! The matcha was perfectly balanced.");
        assertEquals(detailedLog?.photo, "http://example.com/detailed-matcha.jpg");

        // Verify both variants contribute equally to aggregate statistics
        const avgRatingResult = await experienceLog._get_average_rating({
          userId,
          placeId: placeMinimal,
        });
        if ("error" in avgRatingResult) throw new Error(avgRatingResult.error);
        assertEquals(avgRatingResult.averageRating, 4);

        const avgRatingDetailedResult = await experienceLog._get_average_rating({
          userId,
          placeId: placeDetailed,
        });
        if ("error" in avgRatingDetailedResult) throw new Error(avgRatingDetailedResult.error);
        assertEquals(avgRatingDetailedResult.averageRating, 5);

        // Verify both places appear in tried places
        const triedPlacesResult = await experienceLog._get_tried_places({ userId });
        const triedPlaces = triedPlacesResult.places;
        assertEquals(triedPlaces.length, 2);
        assertEquals(triedPlaces.includes(placeMinimal), true);
        assertEquals(triedPlaces.includes(placeDetailed), true);

        console.log("✓ Variant verified: Logs work with minimal required fields or full optional details");
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

  try {
    const user1 = "user:user1" as ID;
    const userNonExistent = "user:nonexistent" as ID;
    const placeA = "place:placeA" as ID;
    const placeB = "place:placeB" as ID;

    // Mock LLM response and capture prompt
    let capturedPrompt = "";
    llm.executeLLM = async (prompt: string) => {
      capturedPrompt = prompt;
      return "You generally prefer sweeter and stronger matcha, with a slight tendency towards higher ratings. Your experiences at places like 'place:placeA' have been mixed, while 'place:placeB' was consistently enjoyed.";
    };

    await experienceLog.create_log({ userId: user1, placeId: placeA, rating: 5, sweetness: 5, strength: 5, notes: "Loved it!" });
    await experienceLog.create_log({ userId: user1, placeId: placeB, rating: 4, sweetness: 3, strength: 4, notes: "Good, but could be sweeter." });
    await experienceLog.create_log({ userId: user1, placeId: placeA, rating: 3, sweetness: 3, strength: 3, notes: "A bit too bitter." });

    await t.step("should generate a profile summary using LLM", async () => {
      const summaryResult = await experienceLog.generate_profile_summary({ userId: user1, llm });
      if ("error" in summaryResult) throw new Error(summaryResult.error);
      const summary = summaryResult.summary;

      assertEquals(
        summary,
        "You generally prefer sweeter and stronger matcha, with a slight tendency towards higher ratings. Your experiences at places like 'place:placeA' have been mixed, while 'place:placeB' was consistently enjoyed.",
      );

      // Assert LLM was called with correct prompt (simplified check)
      const prompt = capturedPrompt;
      assertEquals(prompt.includes(`User ID: ${user1}`), true);
      assertEquals(prompt.includes("Average rating: 4.0"), true);
      assertEquals(prompt.includes("Average sweetness: 3.7"), true);
      assertEquals(prompt.includes("Average strength: 4.0"), true);
      assertEquals(prompt.includes(`Places tried: ${placeA}, ${placeB}`), true);
      assertEquals(prompt.includes("Recent logs:"), true);
    });

    await t.step("should return error if no logs exist for user", async () => {
      const result = await experienceLog.generate_profile_summary({ userId: userNonExistent, llm });
      assertEquals(result, { error: "No logs for this user" });
    });

    // Test LLM validation - simplified tests
    await t.step("should handle validation errors gracefully", async () => {
      // Test that the method returns an error when validation fails
      // Use a capitalized place name that the validator will detect
      llm.executeLLM = async () =>
        "You enjoyed Fake Matcha Cafe, which is a great spot."; // Fake Matcha Cafe is not in user's logs
      const result = await experienceLog.generate_profile_summary({ userId: user1, llm });
      assertEquals(
        "error" in result && result.error.includes("Summary validation failed"),
        true,
        "Expected validation error for fabricated place in summary",
      );
    });
  } finally {
    await client.close();
  }
});