# 🟣 Kocteau – Architecture & Development Plan

## Component Structure

### Shared Components (`/components`)

#### UI Primitives (`/components/ui`)

* Base components from shadcn/ui
* All reusable UI primitives

#### Feature Components (`/components`)

* `review-card.tsx` – Reusable review card (variants: default, compact, detailed)
* `write-review-dialog.tsx` – Modal/Drawer for writing reviews (responsive)
* `header.tsx` – Main header with search and actions
* `app-sidebar.tsx` – Navigation sidebar

### Routes Structure (`/app`)

```
app/
├── (app)/                    # Authenticated routes
│   ├── layout.tsx            # Layout with sidebar and header
│   ├── page.tsx              # Home feed (Server Component)
│   ├── discover/
│   │   └── page.tsx          # Song discovery
│   ├── song/
│   │   └── [id]/
│   │       └── page.tsx      # Song detail (Server Component)
│   ├── review/
│   │   └── [id]/
│   │       └── page.tsx      # Review detail (Server Component)
│   ├── u/
│   │   └── [username]/
│   │       └── page.tsx      # User profile (Server Component)
│   ├── artists/
│   │   ├── page.tsx          # Artists list
│   │   └── [id]/
│   │       └── page.tsx      # Artist profile (Server Component)
│   ├── reviews/
│   │   └── page.tsx          # My reviews
│   ├── lists/
│   │   └── page.tsx          # User lists
│   └── settings/
│       └── page.tsx          # Settings
└── (auth)/                   # Authentication routes
    ├── layout.tsx
    ├── login/
    │   └── page.tsx
    └── signup/
        └── page.tsx
```

## Architecture Principles

### Server-First Approach

1. **Server Components by default**

   * All pages are Server Components
   * Use `"use client"` only when necessary (interactivity, hooks, state)

2. **Server Actions for mutations**

   * Create/update/delete reviews
   * Like/unlike logic
   * Song uploads
   * Location: `/app/actions/` or inline inside Server Components

3. **Data Fetching**

   * Use Supabase server client (`lib/supabase/server.ts`)
   * Never expose unsafe queries from the client
   * Respect RLS (Row Level Security)

### Responsive Components

1. **Breakpoints**

   * Mobile: < 768px
   * Tablet: 768px – 1024px
   * Desktop: > 1024px

2. **Adaptive Components**

   * `WriteReviewDialog`: Dialog (desktop) / Drawer (mobile)
   * `ReviewCard`: Variants depending on context
   * Navigation: Sidebar (desktop) / Sheet (mobile)

### Visual Design

1. **Color Scheme**

   * Primarily black and white
   * No colored ratings (use font weight instead)
   * Subtle gray gradients in avatars
   * Accent color only for primary actions

2. **Typography**

   * Geist / System fonts
   * Clear hierarchy using font weights
   * Responsive sizing

3. **Spacing**

   * Consistent with Tailwind scale
   * Responsive padding (p-4 md:p-6 lg:p-8)

## Data Flows

### Create Review

1. User clicks “Write Review”
2. Opens `WriteReviewDialog` (responsive)
3. User searches/selects a song
4. User completes rating, title (optional), and body
5. Submit → Server Action → Supabase insert
6. Redirect or data refresh

### Like/Unlike Review

1. User clicks like
2. Client Component handles optimistic UI
3. Server Action updates Supabase
4. Data revalidation

### Song Upload (Artist)

1. User with role “artist” accesses upload
2. Form: title, cover (optional), audio
3. Upload to Supabase Storage
4. Server Action creates DB entry
5. Redirect to song page

## Next Steps

1. ✅ Reusable ReviewCard component
2. ✅ Responsive WriteReviewDialog
3. ✅ TrackPage as Server Component
4. ⏳ Integrate real Supabase queries
5. ⏳ Server Actions for mutations
6. ⏳ Complete authentication system
7. ⏳ Song upload for artists
8. ⏳ Functional search system
