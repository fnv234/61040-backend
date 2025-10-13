---
timestamp: 'Sun Oct 12 2025 20:41:58 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_204158.132264e1.md]]'
content_id: fab64b6984aef00bd2463dd8d36c73a1d278fcd206171db0afa5c4725d187203
---

# file: src/ExperienceLog/ExperienceLogConcept.ts

```typescript
import { GeminiLLM } from "../../../gemini-llm.ts";
import { validateGeneratedSummary } from "./validators.ts";

export interface Log {
  logId: string;
  userId: string;
  placeId: string;
  timestamp: Date;
  rating: number;
  sweetness: number;
  strength: number;
  notes?: string;
  photo?: string;
}

export class ExperienceLog {
  private logs: Map<string, Log> = new Map();
  private nextId = 1;

  createLog(
    userId: string,
    placeId: string,
    rating: number,
    sweetness: number,
    strength: number,
    notes?: string,
    photo?: string,
  ): Log {
    if (rating < 1 || rating > 5) throw new Error("Rating must be 1–5");
    if (sweetness < 1 || sweetness > 5) {
      throw new Error("Sweetness must be 1–5");
    }
    if (strength < 1 || strength > 5) throw new Error("Strength must be 1–5");

    const log: Log = {
      logId: `log-${this.nextId++}`,
      userId,
      placeId,
      timestamp: new Date(),
      rating,
      sweetness,
      strength,
      notes,
      photo,
    };

    this.logs.set(log.logId, log);
    return log;
  }

  updateLog(logId: string, updates: Partial<Log>): Log {
    const log = this.logs.get(logId);
    if (!log) throw new Error("Log not found");

    const updated: Log = { ...log, ...updates };
    this.logs.set(logId, updated);
    return updated;
  }

  deleteLog(logId: string): void {
    this.logs.delete(logId);
  }

  getTriedPlaces(userId: string): string[] {
    const places = new Set<string>();
    for (const log of this.logs.values()) {
      if (log.userId === userId) {
        places.add(log.placeId);
      }
    }
    return Array.from(places);
  }

  getUserLogs(userId: string): Log[] {
    return [...this.logs.values()].filter((l) => l.userId === userId);
  }

  getPlaceLogs(userId: string, placeId: string): Log[] {
    return this.getUserLogs(userId).filter((l) => l.placeId === placeId);
  }

  getAverageRating(userId: string, placeId: string): number {
    const logs = this.getPlaceLogs(userId, placeId);
    if (logs.length === 0) return 0;
    return logs.reduce((sum, l) => sum + l.rating, 0) / logs.length;
  }

  // AI-Augmented Action
  async generateProfileSummary(
    userId: string,
    llm: GeminiLLM,
  ): Promise<string> {
    const logs = this.getUserLogs(userId);
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
        - below 3 → critical or neutral tone,
        - around 3 → balanced tone,
        - above 3 → positive tone.
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
