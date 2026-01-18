# TV Shows Implementation Plan for Bosnia Movie Rankings

**Created**: January 17, 2026  
**Status**: Planning Phase  
**Priority**: Medium-High

## Overview
This document outlines the comprehensive plan for adding TV Shows functionality to the Bosnia Movie Rankings application, allowing users to rank both movies and TV shows while maintaining the existing movie features.

## Current Architecture Summary
- **Database**: PostgreSQL with Prisma ORM, single `Movie` model
- **Backend**: Express.js with TypeScript, REST API
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **UI Pattern**: Separate pages with sidebar navigation, no tabs
- **Dashboard**: Shows "Top Movies" section with year selector

---

## Phase 1: Database Schema Design

### Recommended Approach: Single Media Table with Type Discriminator

```prisma
// Add to existing schema
model Media {
  id          String   @id @default(cuid())
  type        String   @default("movie") // "movie" or "tv_show"
  title       String
  year        Int      // Release year for movies, start year for shows
  description String?
  posterUrl   String?  @map("poster_url")
  watchedYear Int      @map("watched_year")
  addedBy     String   @map("added_by")
  createdAt   DateTime @default(now()) @map("created_at")
  
  // TV show specific fields (nullable)
  endYear     Int?     @map("end_year")     // For completed shows
  seasons     Int?     @default(1)          // Number of seasons
  episodes    Int?     @default(1)          // Total episodes
  status      String?  @default("ended")    // "ended", "ongoing", "cancelled"
  
  rankings Ranking[]
  
  @@map("media")
  @@index([type])
  @@index([watchedYear])
  @@index([year])
  @@index([status])
}

// Update Ranking model to reference Media instead of Movie
model Ranking {
  id          String   @id @default(cuid())
  userId      String   @map("user_id")
  mediaId     String   @map("media_id")  // Changed from movieId
  rating      Int      // 1-10 scale
  rankingYear Int      @map("ranking_year")
  description String?   @db.Text
  rankedAt    DateTime @default(now()) @map("ranked_at")
  updatedAt   DateTime @default(now()) @updatedAt @map("updated_at")
  
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  media Media @relation(fields: [mediaId], references: [id], onDelete: Cascade) // Changed from movie
  
  @@map("rankings")
  @@unique([userId, mediaId, rankingYear]) // Updated constraint
  @@index([rankingYear])
  @@index([userId, rankingYear])
  @@index([mediaId, rankingYear])
}
```

### Migration Strategy:
1. Create new `Media` table
2. Migrate all `Movie` records to `Media` with `type = "movie"`
3. Update `Ranking` foreign key from `movieId` to `mediaId`
4. Drop `Movie` table
5. Add TV show specific fields as nullable

---

## Phase 2: Backend API Changes

### 2.1 New Controllers:
- `showController.ts` (similar to `movieController.ts`)
- `mediaController.ts` (optional unified controller)

### 2.2 Updated Routes:
```typescript
// New routes
router.get('/shows', showController.getShows)
router.post('/shows', showController.createShow)
router.get('/shows/:id', showController.getShowById)
router.put('/shows/:id', showController.updateShow)
router.delete('/shows/:id', showController.deleteShow)
router.get('/shows/stats', showController.getShowStats)

// Updated existing routes to handle media type
router.get('/media', mediaController.getMedia) // Optional unified endpoint
```

### 2.3 Validation Schemas:
```typescript
// Extend existing validation
export const createShowSchema = createMovieSchema.extend({
  endYear: z.number().min(1900).max(new Date().getFullYear() + 10).optional(),
  seasons: z.number().min(1).max(100).optional(),
  episodes: z.number().min(1).max(5000).optional(),
  status: z.enum(['ended', 'ongoing', 'cancelled']).optional(),
})

export const mediaQuerySchema = movieQuerySchema.extend({
  type: z.enum(['movie', 'tv_show']).optional(),
  status: z.enum(['ended', 'ongoing', 'cancelled']).optional(),
  minSeasons: z.number().min(1).optional(),
  maxSeasons: z.number().min(1).optional(),
})
```

### 2.4 TMDB Service Updates:
- Add TV show search endpoints
- Different API endpoints for movies vs shows
- Map TV show specific fields (seasons, episodes, status)

---

## Phase 3: Frontend Architecture

### 3.1 Type Definitions:
```typescript
// Base interface
interface Media {
  id: string
  type: 'movie' | 'tv_show'
  title: string
  year: number
  description: string | null
  posterUrl: string | null
  watchedYear: number
  addedBy: string
  createdAt: string
  averageRating: number
  totalRankings: number
}

// Extended interfaces
interface Movie extends Media {
  type: 'movie'
  // Movie-specific fields if needed
}

interface TVShow extends Media {
  type: 'tv_show'
  endYear?: number
  seasons?: number
  episodes?: number
  status?: 'ended' | 'ongoing' | 'cancelled'
}
```

### 3.2 API Layer:
```typescript
// New API module
export const showApi = {
  getShows: (params?: {
    page?: number
    limit?: number
    year?: number
    watchedYear?: number
    search?: string
    sortBy?: 'title' | 'year' | 'watchedYear' | 'createdAt' | 'seasons'
    sortOrder?: 'asc' | 'desc'
    status?: 'ended' | 'ongoing' | 'cancelled'
    minSeasons?: number
    maxSeasons?: number
  }) => api.get('/shows', { params }),
  
  // ... similar to movieApi
}

// Optional unified media API
export const mediaApi = {
  getMedia: (params?: { type?: 'movie' | 'tv_show', ... }) => api.get('/media', { params }),
}
```

### 3.3 Navigation Updates:
```tsx
// Update Layout.tsx
const navItems = [
  { label: 'Dashboard', href: '/', icon: Home },
  { label: 'Movies', href: '/movies', icon: Film },
  { label: 'TV Shows', href: '/shows', icon: Tv }, // New
  { label: 'Global Rankings', href: '/rankings', icon: Star },
  { label: 'My Rankings', href: '/my-rankings', icon: User },
  { label: 'Users', href: '/users', icon: Users },
  { label: 'Edit Profile', href: '/profile', icon: Settings },
]
```

---

## Phase 4: UI Components

### 4.1 New Pages:
- `Shows.tsx` (similar to `Movies.tsx`)
- `ShowDetailsModal.tsx` (extends `MovieDetailsModal.tsx`)

### 4.2 Reusable Components:
```tsx
// MediaCard.tsx (generic component)
interface MediaCardProps {
  media: Media
  onViewDetails: (media: Media) => void
  onRate: (mediaId: string, title: string) => void
  // ... other props
}

// ShowsPage.tsx (uses MediaCard)
export default function ShowsPage() {
  // Similar to Movies.tsx but with show-specific filters
}

// AddShowModal.tsx (extends AddMovieModal)
export function AddShowModal({ onShowAdded }: { onShowAdded?: () => void }) {
  // Adds season/episode/status fields
}
```

### 4.3 Dashboard Updates:
```tsx
// Dashboard.tsx - Add Top TV Shows section
<div className="grid gap-8 lg:grid-cols-2">
  {/* Left column: Recent Activity */}
  <Card>
    <CardHeader>
      <CardTitle>Recent Activity</CardTitle>
    </CardHeader>
    <CardContent>{/* ... */}</CardContent>
  </Card>
  
  {/* Right column: Top Media */}
  <div className="space-y-6">
    {/* Top Movies */}
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Film className="h-5 w-5 mr-2" />
          Top Movies of {selectedYear}
        </CardTitle>
      </CardHeader>
      <CardContent>{/* Movie list */}</CardContent>
    </Card>
    
    {/* Top TV Shows */}
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Tv className="h-5 w-5 mr-2" />
          Top TV Shows of {selectedYear}
        </CardTitle>
      </CardHeader>
      <CardContent>{/* TV show list */}</CardContent>
    </Card>
  </div>
</div>
```

### 4.4 Enhanced Filters for TV Shows:
```tsx
// EnhancedShowFilters.tsx (extends EnhancedMovieFilters)
export function EnhancedShowFilters({
  // ... existing props
  status,
  onStatusChange,
  seasonsRange,
  onSeasonsRangeChange,
}) {
  // Adds:
  // - Status filter (ended/ongoing/cancelled)
  // - Seasons range filter
  // - Quick filters (Completed Series, Ongoing Series, Limited Series)
}
```

---

## Phase 5: External API Integration

### 5.1 TMDB TV Show Integration:
```typescript
// Extend tmdbService.ts
class TMDBService {
  async searchTVShows(query: string, year?: number) {
    // Different endpoint: /search/tv
  }
  
  async getTVShowDetails(tmdbId: number) {
    // Endpoint: /tv/{tv_id}
    // Includes: seasons, episodes, status, networks
  }
}
```

### 5.2 OMDB TV Show Support:
- OMDB already supports TV shows with `type=tv` parameter
- Update `omdbService.ts` to handle TV show type

---

## Phase 6: Data Migration & Backward Compatibility

### 6.1 Migration Script:
```sql
-- 1. Create Media table
-- 2. Insert all movies into Media with type='movie'
-- 3. Update Ranking table foreign key
-- 4. Drop Movie table (after verification)
-- 5. Add TV show specific columns
```

### 6.2 Backward Compatibility:
- Keep `/api/movies` endpoints working (redirect to `/api/media?type=movie`)
- Update frontend to use new endpoints gradually
- Provide migration guide for existing users

---

## Phase 7: Advanced Features (Future)

### 7.1 Season-Based Ratings:
```typescript
interface SeasonRating {
  seasonNumber: number
  rating: number
  comment?: string
}

// Could extend Ranking model or create separate SeasonRanking
```

### 7.2 Episode Tracking:
- Mark episodes as watched
- Episode-level ratings
- Progress tracking for ongoing shows

### 7.3 Show Networks/Streaming Services:
- Track where shows are available
- Filter by streaming service

---

## Implementation Priority Order

### High Priority (MVP):
1. Database schema migration
2. Basic TV show CRUD API
3. TV shows listing page
4. Add TV show modal
5. Dashboard Top TV Shows section
6. Navigation updates

### Medium Priority:
1. TV show specific filters
2. TV show details modal
3. TMDB TV show integration
4. Enhanced statistics for shows

### Low Priority:
1. Season-based ratings
2. Episode tracking
3. Streaming service integration
4. Advanced analytics

---

## Estimated Effort
- **Database/Backend**: 2-3 days
- **Frontend Components**: 3-4 days  
- **Testing & Polish**: 1-2 days
- **Total**: ~1-1.5 weeks for MVP

---

## Key Decisions Needed

1. **Database Schema**: Single table vs separate tables?
2. **Navigation**: Separate pages vs tabs?
3. **Rating System**: Same 1-10 scale for shows?
4. **Season Ratings**: Implement now or later?
5. **Backward Compatibility**: How to handle existing movie data?

## Recommendations

1. **Start with single Media table** - simpler migration, easier queries
2. **Keep separate Movies/Shows pages** - matches current pattern
3. **Use same 1-10 rating system** - consistency for users
4. **Defer season ratings** - implement as phase 2 feature
5. **Maintain backward compatibility** - redirect old movie endpoints

---

## Next Steps

1. Review and approve this implementation plan
2. Create detailed technical specifications for each phase
3. Set up development environment for testing
4. Begin with Phase 1 (Database Schema)
5. Implement incrementally with thorough testing at each phase

## Related Files
- Current schema: `/backend/prisma/schema.prisma`
- Movie controller: `/backend/src/controllers/movieController.ts`
- Movies page: `/frontend/src/pages/Movies.tsx`
- Dashboard: `/frontend/src/pages/Dashboard.tsx`
- API layer: `/frontend/src/lib/api.ts`

---

*Last Updated: January 17, 2026*  
*Document Version: 1.0*