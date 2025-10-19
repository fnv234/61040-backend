---
timestamp: 'Sun Oct 19 2025 10:14:21 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_101421.ce79d9ba.md]]'
content_id: c6bd755ecb865ed7bcc7144caee2f2ce59f1dfef5f122d29e15eafe6a90979a2
---

# response:

```typescript
import { Collection, Db, WithId } from "npm:mongodb";
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
   * Registers a new user with the provided details.
   * @param userId The unique identifier for the user.
   * @param displayName The display name of the user.
   * @param email The email address of the user.
   * @returns The userId of the newly registered user, or an error object.
   */
  async register_user({
    userId,
    displayName,
    email,
  }: {
    userId: UserId;
    displayName: string;
    email: string;
  }): Promise<UserId | { error: string }> {
    // requires: userId not in {u.userId | u in the set of Users} and displayName, email are non-empty
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

    // effects: adds new User with given attributes and empty savedPlaces, preferences to the set of Users
    await this.users.insertOne(newUser);
    return userId;
  }

  /**
   * Saves a place for a given user.
   * @param userId The ID of the user.
   * @param placeId The ID of the place to save.
   * @returns An empty object if successful, or an error object.
   */
  async save_place({
    userId,
    placeId,
  }: {
    userId: UserId;
    placeId: PlaceId;
  }): Promise<Empty | { error: string }> {
    // requires: userId in {u.userId | u in the set of Users}
    const user = await this.users.findOne({ _id: userId });
    if (!user) {
      return { error: `User with userId ${userId} not found.` };
    }

    // effects: update user u where u.userId = userId: u.savedPlaces' = u.savedPlaces + {placeId}
    if (user.savedPlaces.includes(placeId)) {
      // Place is already saved, no change needed, but not an error.
      return {};
    }
    await this.users.updateOne(
      { _id: userId },
      { $push: { savedPlaces: placeId } },
    );

    // --- SYNC IMPLEMENTATION FOR SavedPlaceRecommendationSync ---
    // Trigger a refresh for the specific user whose saved places changed.
    await refreshRecommendationsAfterNewLog(this.db, userId as ID);
    // --- END SYNC IMPLEMENTATION ---
    
    return {};
  }

  /**
   * Unsaves a place for a given user.
   * @param userId The ID of the user.
   * @param placeId The ID of the place to unsave.
   * @returns An empty object if successful, or an error object.
   */
  async unsave_place({
    userId,
    placeId,
  }: {
    userId: UserId;
    placeId: PlaceId;
  }): Promise<Empty | { error: string }> {
    // requires: userId in {u.userId | u in the set of Users} and placeId in user.savedPlaces
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

    // effects: update user u where u.userId = userId: u.savedPlaces' = u.savedPlaces - {placeId}
    await this.users.updateOne(
      { _id: userId },
      { $pull: { savedPlaces: placeId } },
    );
    return {};
  }

  /**
   * Updates the preferences for a given user.
   * @param userId The ID of the user.
   * @param newPrefs The new preferences map.
   * @returns An empty object if successful, or an error object.
   */
  async update_preferences({
    userId,
    newPrefs,
  }: {
    userId: UserId;
    newPrefs: Record<string, string>;
  }): Promise<Empty | { error: string }> {
    // requires: userId in {u.userId | u in the set of Users}
    const user = await this.users.findOne({ _id: userId });
    if (!user) {
      return { error: `User with userId ${userId} not found.` };
    }

    // effects: update user u where u.userId = userId: u.preferences' = newPrefs
    await this.users.updateOne(
      { _id: userId },
      { $set: { preferences: newPrefs } },
    );

    // --- SYNC IMPLEMENTATION FOR PreferenceRecommendationSync ---
    // Trigger a refresh for the specific user whose preferences changed.
    await refreshRecommendationsAfterNewLog(this.db, userId as ID);
    // --- END SYNC IMPLEMENTATION ---

    return {};
  }

  /**
   * Retrieves the saved places for a given user.
   * @param userId The ID of the user.
   * @returns A set of PlaceIds, or an error object.
   */
  async get_saved_places(
    { userId }: { userId: UserId },
  ): Promise<PlaceId[] | { error: string }> {
    // requires: userId in {u.userId | u in the set of Users}
    const user = await this.users.findOne({ _id: userId });
    if (!user) {
      return { error: `User with userId ${userId} not found.` };
    }

    // effects: return u.savedPlaces where u.userId = userId
    return user.savedPlaces;
  }
}
```
