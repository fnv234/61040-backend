---
timestamp: 'Sun Oct 19 2025 11:29:16 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_112916.6b929dc2.md]]'
content_id: 0ba97142e943c558aabd4bdc4027546ad08eeb6aaa579cf8befb46f5a0505aba
---

# file: src/ExperienceLog/ExperienceLogConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { GeminiLLM } from "../../../gemini-llm.ts";
import { validateGeneratedSummary } from "./validators.ts"; // Assuming this exists for validation
import { ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";
import { refreshRecommendationsAfterNewLog } from "../../syncs/recommendations.ts";

// Generic types of this concept
type LogId = ID;
type UserId = ID;
type PlaceId = ID;

// Constants for collection prefixes
const PREFIX = "ExperienceLog" + ".";

export interface Log {
  _id: LogId;
  userId: UserId;
  placeId: PlaceId;
  timestamp: Date;
  rating: number;
  sweetness: number;
  strength: number;
  notes?: string;
  photo?: string;
}

export default class ExperienceLogConcept {
  private logs: Collection<Log>;

  constructor(private readonly db: Db) {
    this.logs = this.db.collection(PREFIX + "logs");
  }

  /**
   * create_log(userId: User, placeId: Place, rating: Integer, sweetness: Integer, strength: Integer): LogId
   *
   * **requires** rating is in the inclusive range [1,5], sweetness is in [1,5], strength is in [1,5]
   * **effects** adds new Log with new logId, given params, timestamp = now() to the set of Logs
   *
   * @param userId - The ID of the user.
   * @param placeId - The ID of the place.
   * @param rating - The rating (1-5).
   * @param sweetness - The sweetness level (1-5).
   * @param strength - The strength level (1-5).
   * @param notes - Optional notes.
   * @param photo - Optional photo URL.
   * @returns A dictionary with the ID of the created log, or an error object.
   */
  async create_log(
    { userId, placeId, rating, sweetness, strength, notes, photo }: {
      userId: UserId;
      placeId: PlaceId;
      rating: number;
      sweetness: number;
      strength: number;
      notes?: string;
      photo?: string;
    },
  ): Promise<{ logId: LogId } | { error: string }> {
    if (rating < 1 || rating > 5) return { error: "Rating must be 1–5" };
    if (sweetness < 1 || sweetness > 5) {
      return { error: "Sweetness must be 1–5" };
    }
    if (strength < 1 || strength > 5) return { error: "Strength must be 1–5" };

    const logId: LogId = freshID();
    const log: Log = {
      _id: logId,
      userId,
      placeId,
      timestamp: new Date(),
      rating,
      sweetness,
      strength,
      notes,
      photo,
    };

    await this.logs.insertOne(log);

    // --- SYNC IMPLEMENTATION FOR ExperienceRecommendationSync ---
    await refreshRecommendationsAfterNewLog(this.db, userId);
    // --- END SYNC IMPLEMENTATION ---

    return { logId };
  }

  /**
   * update_log(logId: LogId, rating?: Integer, sweetness?: Integer, strength?: Integer, notes?: String, photo?: String)
   *
   * **requires** logId in {log.logId | log in the set of Logs} and if rating given then rating is in the inclusive range [1,5]
   * **effects** update log where log.logId = logId with non-null parameters
   *
   * @param logId - The ID of the log to update.
   * @param updates - Partial updates for the log.
   * @returns A dictionary with the updated log, or an error object.
   */
  async update_log(
    { logId, rating, sweetness, strength, notes, photo }: {
      logId: LogId;
      rating?: number;
      sweetness?: number;
      strength?: number;
      notes?: string;
      photo?: string;
    },
  ): Promise<{ log: Log } | { error: string }> {
    const updateFields: Partial<Log> = {};
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) return { error: "Rating must be 1–5" };
      updateFields.rating = rating;
    }
    if (sweetness !== undefined) {
      if (sweetness < 1 || sweetness > 5) {
        return { error: "Sweetness must be 1–5" };
      }
      updateFields.sweetness = sweetness;
    }
    if (strength !== undefined) {
      if (strength < 1 || strength > 5) {
        return { error: "Strength must be 1–5" };
      }
      updateFields.strength = strength;
    }
    if (notes !== undefined) updateFields.notes = notes;
    if (photo !== undefined) updateFields.photo = photo;

    if (Object.keys(updateFields).length === 0) {
      return { error: "No update fields provided." };
    }

    const result = await this.logs.updateOne(
      { _id: logId },
      { $set: updateFields },
    );

    if (result.matchedCount === 0) {
      return { error: "Log not found" };
    }

    const updatedLog = await this.logs.findOne({ _id: logId });
    if (!updatedLog) {
      // This case should ideally not happen if matchedCount > 0, but for type safety.
      return { error: "Log not found after update, unexpected state." };
    }
    return { log: updatedLog };
  }

  /**
   * delete_log(logId: LogId)
   *
   * **requires** logId in {log.logId | log in Logs}
   * **effects** Logs' = Logs - {log | log.logId = logId}
   *
   * @param logId - The ID of the log to delete.
   * @returns An empty dictionary upon success, or an error object.
   */
  async delete_log(
    { logId }: { logId: LogId },
  ): Promise<Record<PropertyKey, never> | { error: string }> {
    const result = await this.logs.deleteOne({ _id: logId });
    if (result.deletedCount === 0) {
      return { error: "Log not found" };
    }
    return {};
  }

  /**
   * _get_user_logs(userId: User): set Log
   *
   * **effects** return {log | log in the set of Logs and log.userId = userId}
   *
   * @param userId - The user ID.
   * @returns A dictionary with an array of logs for the user.
   */
  async _get_user_logs(
    { userId }: { userId: UserId },
  ): Promise<{ logs: Log[] }> {
    const userLogs = await this.logs.find({ userId }).toArray();
    return { logs: userLogs };
  }

  /**
   * _get_place_logs(userId: User, placeId: Place): set Log
   *
   * **effects** return {log | log in the set of Logs and log.userId = userId and log.placeId = placeId}
   *
   * @param userId - The user ID.
   * @param placeId - The place ID.
   * @returns A dictionary with an array of logs for the user at a specific place.
   */
  async _get_place_logs(
    { userId, placeId }: { userId: UserId; placeId: PlaceId },
  ): Promise<{ logs: Log[] }> {
    const placeLogs = await this.logs.find({ userId, placeId }).toArray();
    return { logs: placeLogs };
  }

  /**
   * _get_average_rating(userId: User, placeId: Place): Float
   *
   * **effects** return average of {log.rating | log in the set of Logs and log.userId = userId and log.placeId = placeId}
   *
   * @param userId - The user ID.
   * @param placeId - The place ID.
   * @returns A dictionary with the average rating, or an error object.
   */
  async _get_average_rating(
    { userId, placeId }: { userId: UserId; placeId: PlaceId },
  ): Promise<{ averageRating: number } | { error: string }> {
    const logs = await this._get_place_logs({ userId, placeId });
    if (logs.logs.length === 0) {
      return { error: "No logs found for this user and place." };
    }
    const averageRating = logs.logs.reduce((sum, l) => sum + l.rating, 0) /
      logs.logs.length;
    return { averageRating };
  }

  /**
   * _get_tried_places(userId: User): set Place
   *
   * **effects** return {log.placeId | log in Logs and log.userId = userId}
   *
   * @param userId - The user ID.
   * @returns A dictionary with a set of place IDs the user has tried.
   */
  async _get_tried_places(
    { userId }: { userId: UserId },
  ): Promise<{ places: PlaceId[] }> {
    const logs = await this.logs.find({ userId }).toArray();
    const places = new Set<PlaceId>();
    for (const log of logs) {
      places.add(log.placeId);
    }
    return { places: Array.from(places) };
  }

  /**
   * generate_profile_summary(userId: User, llm: GeminiLLM): String
   *
   * **requires** there exists at least one log in the set of Logs with log.userId = userId
   * **effects** calls llm with the user's Logs (ratings, sweetness, strength, notes, and places)
   *   and returns a concise textual summary describing the user's preferences and patterns
   * **validators**
   *   - summary must not mention places not in user's logs
   *   - summary must be <= 3 sentences
   *   - sentiment of summary should align with overall average rating
   *
   * @param userId - The user ID.
   * @param llm - The LLM instance.
   * @returns A dictionary with the profile summary string, or an error object.
   */
  async generate_profile_summary(
    { userId, llm }: { userId: UserId; llm: GeminiLLM },
  ): Promise<{ summary: string } | { error: string }> {
    const logsResult = await this._get_user_logs({ userId });
    const logs = logsResult.logs;
    if (logs.length === 0) {
      return { error: "No logs for this user" };
    }

    const avgRating = logs.reduce((sum, l) => sum + l.rating, 0) / logs.length;
    const avgSweetness = logs.reduce((sum, l) => sum + l.sweetness, 0) /
      logs.length;
    const avgStrength = logs.reduce((sum, l) => sum + l.strength, 0) /
      logs.length;
    const places = [...new Set(logs.map((l) => l.placeId))];

    const last3 = logs.slice(-3);

    const prompt = `
        You are an assistant that summarizes a user's matcha tasting history.
        Generate a concise, factual profile (2–3 sentences) in the second person.

        User ID: ${userId}
        Average rating: ${avgRating.toFixed(1)}
        Average sweetness: ${avgSweetness.toFixed(1)}
        Average strength: ${avgStrength.toFixed(1)}
        Places tried: ${places.join(", ")}
        Recent logs:
        ${
      last3
        .map(
          (l) =>
            `- ${l.placeId}, rating ${l.rating}, sweetness ${l.sweetness}, strength ${l.strength}, notes: "${
              l.notes ?? ""
            }"`,
        )
        .join("\n")
    }

        Guidelines:
        - Mention only places listed above (no new ones).
        - If ratings for a place are both high and low, describe it as a mixed experience rather than consistent.
        - Base tone on the average rating:
        - below 3 -> critical or neutral tone,
        - around 3 -> balanced tone,
        - above 3 -> positive tone.
        - Highlight consistent preferences (sweetness/strength).
        - Avoid exaggeration or assumptions beyond the data.
        - Keep <= 3 sentences.
        `;

    const response = await llm.executeLLM(prompt);
    const summary = response.trim();

    try {
      validateGeneratedSummary(
        summary,
        logs.map((l) => ({ placeId: l.placeId, rating: l.rating })),
      );
    } catch (error) {
      console.error("❌ Validation failed for generated summary:");
      console.error((error as Error).message);
      return { error: `Summary validation failed: ${(error as Error).message}` };
    }

    return { summary };
  }
}
```
