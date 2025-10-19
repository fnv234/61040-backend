---
timestamp: 'Fri Oct 17 2025 11:46:51 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251017_114651.e2d4386d.md]]'
content_id: ba336c5a46bf9a4b0e03585a72f7047f4be5f227c94b49fb9638c4428aeca7a0
---

# file: src/ExperienceLog/ExperienceLogConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { GeminiLLM } from "../../../gemini-llm.ts";
import { validateGeneratedSummary } from "./validators.ts";
import { ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

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

  async createLog(
    userId: UserId,
    placeId: PlaceId,
    rating: number,
    sweetness: number,
    strength: number,
    notes?: string,
    photo?: string,
  ): Promise<Log> {
    if (rating < 1 || rating > 5) throw new Error("Rating must be 1–5");
    if (sweetness < 1 || sweetness > 5) {
      throw new Error("Sweetness must be 1–5");
    }
    if (strength < 1 || strength > 5) throw new Error("Strength must be 1–5");

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
    return log;
  }

  async updateLog(logId: LogId, updates: Partial<Log>): Promise<Log> {
    const result = await this.logs.updateOne(
      { _id: logId },
      { $set: updates },
    );

    if (result.matchedCount === 0) {
      throw new Error("Log not found");
    }

    const updatedLog = await this.logs.findOne({ _id: logId });
    if (!updatedLog) throw new Error("Log not found after update");
    return updatedLog;
  }

  async deleteLog(logId: LogId): Promise<void> {
    const result = await this.logs.deleteOne({ _id: logId });
    if (result.deletedCount === 0) {
      throw new Error("Log not found");
    }
  }

  async getTriedPlaces(userId: UserId): Promise<PlaceId[]> {
    const logs = await this.logs.find({ userId }).toArray();
    const places = new Set<PlaceId>();
    for (const log of logs) {
      places.add(log.placeId);
    }
    return Array.from(places);
  }

  async getUserLogs(userId: UserId): Promise<Log[]> {
    return await this.logs.find({ userId }).toArray();
  }

  async getPlaceLogs(userId: UserId, placeId: PlaceId): Promise<Log[]> {
    return await this.logs.find({ userId, placeId }).toArray();
  }

  async getAverageRating(userId: UserId, placeId: PlaceId): Promise<number> {
    const logs = await this.getPlaceLogs(userId, placeId);
    if (logs.length === 0) return 0;
    return logs.reduce((sum, l) => sum + l.rating, 0) / logs.length;
  }

  // AI-Augmented Action
  async generateProfileSummary(
    userId: UserId,
    llm: GeminiLLM,
  ): Promise<string> {
    const logs = await this.getUserLogs(userId);
    if (logs.length === 0) {
      throw new Error("No logs for this user");
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
      throw error;
    }

    return summary;
  }
}
```
