---
timestamp: 'Mon Oct 20 2025 12:07:20 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_120720.a19a9c79.md]]'
content_id: 15b5be931b9b15c125bd7365e0aa9705f790782c3b08eaff910191be84ce13b9
---

# file: src/concepts/UserDirectory/UserDirectoryConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { refreshRecommendationsAfterNewLog } from "../../syncs/recommendations.ts";

// Generic types of this concept
type UserId = ID;
type PlaceId = ID;

// Constants for collection names
const USERS_COLLECTION = "UserDirectory.users";

/**
 * Represents a user in the UserDirectory concept.
 */
interface User {
  _id: UserId; // This corresponds to userId in the specification
  displayName: string;
  email: string;
  preferences: Record<string, string>;
  savedPlaces: PlaceId[];
}

export default class UserDirectoryConcept {
  private users: Collection<User>;

  constructor(private readonly db: Db) {
    this.users = this.db.collection(USERS_COLLECTION);
  }

  /**
   * register_user(userId: UserId, displayName: String, email: String): UserId
   *
   * **requires** userId not in {u.userId | u in the set of Users} and displayName, email are non-empty
   * **effects** adds new User with given attributes and empty savedPlaces, preferences to the set of Users
   *
   * @param userId The unique identifier for the user.
   * @param displayName The display name of the user.
   * @param email The email address of the user.
   * @returns A dictionary with the userId of the newly registered user, or an error object.
   */
  async register_user({
    userId,
    displayName,
    email,
  }: {
    userId: UserId;
    displayName: string;
    email: string;
  }): Promise<{ userId: UserId } | { error: string }> {
    const existingUser = await this.users.findOne({ _id: userId });
    if (existingUser) {
      return { error: `User with userId ${userId} already exists.` };
    }
    if (!displayName || !email) {
      return { error: "DisplayName and email cannot be empty." };
    }

    const newUser: User = {
      _id: userId,
      displayName,
      email,
      preferences: {}, // initialized as empty
      savedPlaces: [], // initialized as empty
    };

    await this.users.insertOne(newUser);
    return { userId };
  }

  /**
   * save_place(userId: UserId, placeId: PlaceId)
   *
   * **requires** userId in {u.userId | u in the set of Users}
   * **effects** update user u where u.userId = userId: u.savedPlaces' = u.savedPlaces + {placeId}
   *
   * @param userId The ID of the user.
   * @param placeId The ID of the place to save.
   * @returns An empty dictionary if successful, or an error object.
   */
  async save_place({
    userId,
    placeId,
  }: {
    userId: UserId;
    placeId: PlaceId;
  }): Promise<Empty | { error: string }> {
    const user = await this.users.findOne({ _id: userId });
    if (!user) {
      return { error: `User with userId ${userId} not found.` };
    }

    if (user.savedPlaces.includes(placeId)) {
      return {}; // Already saved, no change needed.
    }

    await this.users.updateOne(
      { _id: userId },
      { $push: { savedPlaces: placeId } },
    );

    // --- SYNC IMPLEMENTATION FOR SavedPlaceRecommendationSync ---
    await refreshRecommendationsAfterNewLog(this.db, userId);
    // --- END SYNC IMPLEMENTATION ---

    return {};
  }

  /**
   * unsave_place(userId: UserId, placeId: PlaceId)
   *
   * **requires** userId in {u.userId | u in the set of Users} and placeId in user.savedPlaces
   * **effects** update user u where u.userId = userId: u.savedPlaces' = u.savedPlaces - {placeId}
   *
   * @param userId The ID of the user.
   * @param placeId The ID of the place to unsave.
   * @returns An empty dictionary if successful, or an error object.
   */
  async unsave_place({
    userId,
    placeId,
  }: {
    userId: UserId;
    placeId: PlaceId;
  }): Promise<Empty | { error: string }> {
    const user = await this.users.findOne({ _id: userId });
    if (!user) {
      return { error: `User with userId ${userId} not found.` };
    }
    if (!user.savedPlaces.includes(placeId)) {
      return {
        error:
          `PlaceId ${placeId} not found in saved places for user ${userId}.`,
      };
    }

    await this.users.updateOne(
      { _id: userId },
      { $pull: { savedPlaces: placeId } },
    );
    return {};
  }

  /**
   * update_preferences(userId: UserId, newPrefs: Map[String, String])
   *
   * **requires** userId in {u.userId | u in the set of Users}
   * **effects** update user u where u.userId = userId: u.preferences' = newPrefs
   *
   * @param userId The ID of the user.
   * @param newPrefs The new preferences map.
   * @returns An empty dictionary if successful, or an error object.
   */
  async update_preferences({
    userId,
    newPrefs,
  }: {
    userId: UserId;
    newPrefs: Record<string, string>;
  }): Promise<Empty | { error: string }> {
    const user = await this.users.findOne({ _id: userId });
    if (!user) {
      return { error: `User with userId ${userId} not found.` };
    }

    await this.users.updateOne(
      { _id: userId },
      { $set: { preferences: newPrefs } },
    );

    // --- SYNC IMPLEMENTATION FOR PreferenceRecommendationSync ---
    await refreshRecommendationsAfterNewLog(this.db, userId);
    // --- END SYNC IMPLEMENTATION ---

    return {};
  }

  /**
   * _get_saved_places(userId: UserId): set PlaceId
   *
   * **requires** userId in {u.userId | u in the set of Users}
   * **effects** return u.savedPlaces where u.userId = userId
   *
   * @param userId The ID of the user.
   * @returns A dictionary with a set of PlaceIds, or an error object.
   */
  async _get_saved_places(
    { userId }: { userId: UserId },
  ): Promise<{ placeIds: PlaceId[] } | { error: string }> {
    const user = await this.users.findOne({ _id: userId });
    if (!user) {
      return { error: `User with userId ${userId} not found.` };
    }

    return { placeIds: user.savedPlaces };
  }
}
```
