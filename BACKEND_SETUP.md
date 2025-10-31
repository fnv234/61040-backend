# Backend Setup for Assignment 4c

## Changes Made

### 1. Configured Passthrough Routes (`src/concepts/Requesting/passthrough.ts`)

**Included Routes (Public - No Authentication Required):**
- `/api/PlaceDirectory/_find_nearby` - Public query to find nearby matcha places
- `/api/PlaceDirectory/_search_by_name` - Public query to search places by name
- `/api/PlaceDirectory/_filter_places` - Public query to filter places
- `/api/PlaceDirectory/_get_details` - Public query to get place details
- `/api/UserDirectory/register_user` - Allow new users to register

**Excluded Routes (Require Authentication via Syncs):**
- **ExperienceLog** - All routes (create_log, update_log, delete_log, etc.)
- **PlaceDirectory** - Write operations (create_place, edit_place, delete_place)
- **UserDirectory** - User-specific operations (save_place, unsave_place, update_preferences, _get_saved_places)
- **RecommendationEngine** - All routes (get_recommendations, refresh_recommendations, etc.)

### 2. Created Synchronizations (`src/syncs/authenticated_routes.sync.ts`)

Created syncs for all excluded routes that:
- Intercept `Requesting.request` actions
- Execute the corresponding concept action
- Respond with `Requesting.respond`

**Note:** These syncs currently pass through without authentication. To add proper authentication:
1. Add an Authenticating/Sessioning concept
2. Update syncs to include session validation in the `where` clause
3. Update frontend to pass session tokens in request bodies

### 3. Server Status

✅ Server starts successfully on port 8000
✅ All routes are properly configured (no unverified warnings)
✅ Syncs are registered and ready to handle excluded routes

## Running the Backend

```bash
# Build (regenerate imports and syncs)
deno run build

# Start server
deno run start
```

Server will be available at `http://localhost:8000/api/*`

## Next Steps for Full Authentication

1. **Add Authenticating Concept:**
   - Create `src/concepts/Authenticating/AuthenticatingConcept.ts`
   - Implement session management (create_session, validate_session, etc.)

2. **Update Syncs:**
   - Add `session` parameter to excluded routes
   - Add `where` clause to validate session before executing actions
   - Example:
   ```typescript
   where: async (frames) => {
     frames = await frames.query(Authenticating.validate_session, { session }, { userId });
     if (frames.length === 0) {
       // Invalid session - return error
       return new Frames({ ...frames[0], error: "Unauthorized" });
     }
     return frames;
   }
   ```

3. **Update Frontend:**
   - Store session token after login/registration
   - Include session token in all authenticated API calls
   - Example:
   ```typescript
   await apiClient.post('/ExperienceLog/create_log', {
     session: sessionToken,
     userId,
     placeId,
     rating,
     // ... other params
   })
   ```

## Deployment Considerations

- Backend is deployed at: `https://matchamatch-backend.onrender.com`
- Frontend `.env.production` configured with: `VITE_API_BASE_URL=https://matchamatch-backend.onrender.com/api`
- Make sure to set environment variables on Render:
  - `PORT` (if different from 8000)
  - `MONGODB_URI` (for database connection)
  - `GEMINI_API_KEY` (for AI features)
  - Any other required environment variables
