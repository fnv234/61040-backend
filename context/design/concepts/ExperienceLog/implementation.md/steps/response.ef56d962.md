---
timestamp: 'Sun Oct 12 2025 20:39:32 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_203932.c9babf97.md]]'
content_id: ef56d96260ff151c6b7fa0eadb0dd805885ac0324e30765e7db7ce7d6228049d
---

# response:

```typescript
import { Collection, Db, ObjectId } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";
import { GeminiLLM } from "@utils/llm.ts"; // Assuming a GeminiLLM utility

// Generic types for this concept
type User = ID;
type Place = ID;
type LogId = ID;
type DateTime = Date;

// Prefix for MongoDB collection names
const PREFIX = "ExperienceLog" + ".";

/**
 * State for the ExperienceLog concept
 *
 * a set of Logs with
 *   a logId LogId
 *   a userId User
 *   a placeId Place
 *   a timestamp DateTime
 *   a rating Integer
 *   sweetness Integer
 *   strength Integer
 *   notes optional String
 *   photo optional String (URL)
 */
interface Log {
  _id: LogId;
  userId: User;
  placeId: Place;
  timestamp: DateTime;
  rating: number;
  sweetness: number;
  strength: number;
  notes?: string;
  photo?: string;
}

export default class ExperienceLogConcept {
  logs: Collection<Log>;

  constructor(private readonly db: Db) {
    this.logs = this.db.collection(PREFIX + "logs");
  }

  /**
   * Creates a new log entry for a user's experience at a place.
   * @param params - Parameters for creating the log.
   * @returns The ID of the newly created log.
   */
  async create_log({
    userId,
    placeId,
    rating,
    sweetness,
    strength,
  }: {
    userId: User;
    placeId: Place;
    rating: number;
    sweetness: number;
    strength: number;
  }): Promise<{ logId: LogId }> {
    // requires: rating is in the inclusive range [1,5]
    if (rating < 1 || rating > 5) {
      throw new Error("Rating must be between 1 and 5.");
    }

    const newLogId = freshID();
    const newLog: Log = {
      _id: newLogId,
      userId,
      placeId,
      timestamp: new Date(),
      rating,
      sweetness,
      strength,
      // notes and photo are optional and will be undefined if not provided
    };

    await this.logs.insertOne(newLog);

    // effects: adds new Log with new logId, given params, timestamp = now() to the set of Logs
    return { logId: newLogId };
  }

  /**
   * Updates an existing log entry.
   * @param params - Parameters for updating the log.
   * @returns An empty object upon successful update.
   */
  async update_log({
    logId,
    rating,
    sweetness,
    strength,
    notes,
    photo,
  }: {
    logId: LogId;
    rating?: number;
    sweetness?: number;
    strength?: number;
    notes?: string;
    photo?: string;
  }): Promise<Empty> {
    // requires: logId in {log.logId | log in the set of Logs}
    const existingLog = await this.logs.findOne({ _id: logId });
    if (!existingLog) {
      throw new Error(`Log with ID ${logId} not found.`);
    }

    // requires: if rating given then rating is in the inclusive range [1,5]
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      throw new Error("Rating must be between 1 and 5.");
    }

    const updateFields: Partial<Log> = {};
    if (rating !== undefined) updateFields.rating = rating;
    if (sweetness !== undefined) updateFields.sweetness = sweetness;
    if (strength !== undefined) updateFields.strength = strength;
    if (notes !== undefined) updateFields.notes = notes;
    if (photo !== undefined) updateFields.photo = photo;

    // effects: update log where log.logId = logId with non-null parameters
    await this.logs.updateOne({ _id: logId }, { $set: updateFields });

    return {};
  }

  /**
   * Deletes a log entry.
   * @param params - Parameters for deleting the log.
   * @returns An empty object upon successful deletion.
   */
  async delete_log({ logId }: { logId: LogId }): Promise<Empty> {
    // requires: logId in {log.logId | log in Logs}
    const result = await this.logs.deleteOne({ _id: logId });
    if (result.deletedCount === 0) {
      throw new Error(`Log with ID ${logId} not found.`);
    }

    // effects: Logs' = Logs - {log | log.logId = logId}
    return {};
  }

  /**
   * Retrieves all logs for a specific user.
   * @param params - The user ID.
   * @returns A set of logs belonging to the user.
   */
  async get_user_logs({ userId }: { userId: User }): Promise<Log[]> {
    // effects: return {log | log in the set of Logs and log.userId = userId}
    return await this.logs.find({ userId }).toArray();
  }

  /**
   * Retrieves all logs for a specific user at a specific place.
   * @param params - User ID and place ID.
   * @returns A set of logs for the user at the specified place.
   */
  async get_place_logs({
    userId,
    placeId,
  }: {
    userId: User;
    placeId: Place;
  }): Promise<Log[]> {
    // effects: return {log | log in the set of Logs and log.userId = userId and log.placeId = placeId}
    return await this.logs.find({ userId, placeId }).toArray();
  }

  /**
   * Calculates the average rating for a user at a specific place.
   * @param params - User ID and place ID.
   * @returns The average rating as a float.
   */
  async get_average_rating({
    userId,
    placeId,
  }: {
    userId: User;
    placeId: Place;
  }): Promise<{ averageRating: number }> {
    // effects: return average of {log.rating | log in the set of Logs and log.userId = userId and log.placeId = placeId}
    const result = await this.logs.aggregate([
      {
        $match: { userId, placeId },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
        },
      },
    ]).toArray();

    if (result.length === 0) {
      return { averageRating: 0 }; // Or throw an error if no logs exist
    }

    return { averageRating: result[0].averageRating };
  }

  /**
   * Retrieves all unique places a user has logged experiences for.
   * @param params - The user ID.
   * @returns A set of unique place IDs.
   */
  async get_tried_places({ userId }: { userId: User }): Promise<{ places: Place[] }> {
    // effects: return {log.placeId | log in Logs and log.userId = userId}
    const distinctPlaces = await this.logs.distinct("placeId", { userId });
    return { places: distinctPlaces };
  }

  /**
   * Generates a profile summary for a user using an AI model.
   * @param params - User ID and an LLM instance.
   * @returns A string containing the user's preference summary.
   */
  async generate_profile_summary({
    userId,
    llm,
  }: {
    userId: User;
    llm: GeminiLLM;
  }): Promise<{ summary: string }> {
    // requires: there exists at least one log in the set of Logs with log.userId = userId
    const userLogs = await this.get_user_logs({ userId });
    if (userLogs.length === 0) {
      throw new Error("User has no logs to generate a summary from.");
    }

    // Prepare data for the LLM
    const logDataForLLM = userLogs.map((log) => ({
      placeId: log.placeId,
      timestamp: log.timestamp,
      rating: log.rating,
      sweetness: log.sweetness,
      strength: log.strength,
      notes: log.notes,
      photo: log.photo,
    }));

    // effects: calls llm with the user's Logs (ratings, sweetness, strength, notes, and places)
    // and returns a concise textual summary describing the user's preferences and patterns
    const prompt = `Generate a concise textual summary (max 3 sentences) describing the user's preferences and patterns based on their experience logs. Do not mention places not in the logs. The sentiment of the summary should align with the user's overall average rating.

User's Experience Logs:
${JSON.stringify(logDataForLLM, null, 2)}
`;

    const summary = await llm.generateText(prompt);

    // validators:
    // - summary must not mention places not in user's logs
    // - summary must be <= 3 sentences
    // - sentiment of summary should align with overall average rating

    // Basic validation (more sophisticated validation would involve NLP)
    if (summary.split(". ").length > 3) {
      console.warn("Generated summary exceeds 3 sentences.");
      // Truncate for now, or implement a more robust summarization strategy
      summary = summary.split(". ").slice(0, 3).join(". ") + ".";
    }

    // Place check (simplified, assumes place IDs are directly mentioned if present)
    const triedPlaces = await this.get_tried_places({ userId });
    for (const place of triedPlaces.places) {
      if (summary.includes(place) && !logDataForLLM.some(log => log.placeId === place)) {
        console.warn(`Generated summary mentions place ${place} which is not in user's logs.`);
        // This is a complex validation to fix automatically. For now, warn.
      }
    }
    
    // Sentiment alignment is harder to auto-validate without an explicit sentiment analysis tool.
    // This would typically be done by a human reviewer or a separate LLM call.

    return { summary };
  }
}
```
