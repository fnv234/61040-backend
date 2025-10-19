---
timestamp: 'Sun Oct 19 2025 11:02:08 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_110208.5962f5a3.md]]'
content_id: cdfd8d64f72e284067910c817500daae684e8d5563916ccd44d6ba0654e30788
---

# trace:

1. **Initial State**: No user has any recommendations.
2. **Principle - Compute and Cache**:
   * `refresh_recommendations` is called for `userA` with specific `savedPlaces`, `preferences`, and `triedPlaces`.
   * `compute_suggestions` is invoked, which, given the inputs (e.g., `savedPlaces: [place1, place2]`, `triedPlaces: [place3]`), returns a set of places like `[place1, place2, place4]`.
   * These computed suggestions are stored in the `recommendations` collection for `userA`.
   * The `lastUpdated` timestamp for `userA` is recorded as `now()`.
   * `get_recommendations` is called for `userA`.
   * Because the `lastUpdated` timestamp is recent, the cached recommendations (`[place1, place2, place4]`) are returned directly.
3. **Principle - Refresh on Change**:
   * `refresh_recommendations` is called again for `userA`, but with an updated `triedPlaces` list (`[place3, place4]`).
   * `compute_suggestions` is invoked again, now excluding `place4`. It returns `[place1, place2]`.
   * These new suggestions replace the old ones in the `recommendations` collection.
   * The `lastUpdated` timestamp for `userA` is updated to the new `now()`.
   * `get_recommendations` is called for `userA` (conceptually, time might have passed or a new call is made). If the recommendations were still considered recent, they would be served from cache. If the `get_recommendations` logic checks staleness, it would verify the timestamp.
4. **Stale Recommendations Fetching**:
   * For `userB`, recommendations are manually inserted, and the `lastUpdated` timestamp is set to be significantly in the past.
   * `get_recommendations` is called for `userB`.
   * Since the `lastUpdated` timestamp is stale, the system bypasses the cache and calls `compute_suggestions`.
   * `compute_suggestions` is executed with `userB`'s context, resulting in a new set of recommendations (e.g., `[place4]`).
   * These new recommendations are cached, and `lastUpdated` is updated.
5. **Clear Recommendations**:
   * `refresh_recommendations` is called for `userA` to populate some data.
   * `clear_recommendations` is called for `userA`.
   * The entries for `userA` are removed from both `recommendations` and `lastUpdated` collections.
   * Subsequent calls to `_get_user_recommendations` and `_get_last_updated` for `userA` will reflect the absence of data (empty recommendations, and an error for missing timestamp).
