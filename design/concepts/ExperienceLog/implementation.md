[@concept-design-overview](../../background/concept-design-overview.md)

[@concept-specifications](../../background/concept-specifications.md)

[@implementing-concepts](../../background/implementing-concepts.md)

[@no_mistakes](../../no_mistakes.md)

# implement: ExperienceLog

# concept: ExperienceLog

* **concept** ExperienceLog[User, Place]

* **purpose**
    capture a user's personal experience at a place with structured ratings and notes,
    and enable AI-powered insights about their overall preferences and trends

* **principle**
    each log entry represents one user's assessment of one place at a specific time;
    users can track and reference their personal experiences;
    an AI model can generate summaries across a user’s logs to highlight patterns
    such as preferred sweetness, strength, or favorite places

* **state**

    a set of Logs with
        a logId LogId
        a userId User
        a placeId Place
        a timestamp DateTime
        a rating Integer
        sweetness Integer
        strength Integer
        notes optional String
        photo optional String (URL)

* **actions**

    create_log(userId: User, placeId: Place, rating: Integer, sweetness: Integer, strength: Integer): LogId
        **requires** rating is in the inclusive range [1,5]
        **effects** adds new Log with new logId, given params, timestamp = now() to the set of Logs

    update_log(logId: LogId, rating?: Integer, sweetness?: Integer, strength?: Integer, notes?: String, photo?: String)
        **requires** logId in {log.logId | log in the set of Logs} and if rating given then rating is in the inclusive range [1,5]
        **effects** update log where log.logId = logId with non-null parameters

    delete_log(logId: LogId)
        **requires** logId in {log.logId | log in Logs}
        **effects** Logs' = Logs - {log | log.logId = logId}

    get_user_logs(userId: User): set Log
        **effects** return {log | log in the set of Logs and log.userId = userId}

    get_place_logs(userId: User, placeId: Place): set Log
        **effects** return {log | log in the set of Logs and log.userId = userId and log.placeId = placeId}

    delete_log(logId: LogId)
        **requires** logId in {log.logId | log in the set of Logs}
        **effects** updates the set of Logs such that: logs' = logs - {log | log.logId = logId}

    get_average_rating(userId: User, placeId: Place): Float
        **effects** return average of {log.rating | log in the set of Logs and log.userId = userId and log.placeId = placeId}

    get_tried_places(userId: User): set Place
        **effects** return {log.placeId | log in Logs and log.userId = userId}

    async generate_profile_summary(userId: User, llm: GeminiLLM): String
        **requires** there exists at least one log in the set of Logs with log.userId = userId
        **effects** calls llm with the user's Logs (ratings, sweetness, strength, notes, and places)
                    and returns a concise textual summary describing the user's preferences and patterns
        **validators**
            - summary must not mention places not in user's logs
            - summary must be <= 3 sentences
            - sentiment of summary should align with overall average rating

* notes
    This augmented version of ExperienceLog integrates an AI model (GeminiLLM)
    to synthesize multiple logs into a readable "taste profile."
    The summary helps users recognize long-term trends and preferences
    that might be difficult to notice from individual entries alone.

    Any parameters marked with a ? at the end are optional.

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