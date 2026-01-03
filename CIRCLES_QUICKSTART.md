# 👥 Circles Quick Start Guide

Get the Circles/Communities feature running in 5 minutes.

## 1. Deploy Database Schema

Copy and paste this SQL into your Supabase SQL editor:

```bash
# Get the migration file
cat supabase/migrations/003_circles_schema.sql
```

Then paste the entire content into Supabase > SQL Editor > New Query, and click "Run".

**Expected result:** 11 tables created (circles, circle_members, circle_posts, etc.)

## 2. Import Components & Hooks

```typescript
// Import hooks
import { useCircles, useCircleContent, useCircleLeaderboard, useCircleInvites } from '@/hooks';

// Import components
import { CircleCard, CircleFeed, CircleLeaderboard, CircleHeader } from '@/components/circles';
```

## 3. Create Circles Page

```typescript
// src/app/circles/page.tsx
'use client';

import { useWeb3Profile } from '@/hooks';
import { useCircles } from '@/hooks';
import { CirclesGrid } from '@/components/circles';

export default function CirclesPage() {
  const { userAddress } = useWeb3Profile();
  const { circles, userCircles, fetchPublicCircles, joinCircle } = useCircles(userAddress);

  React.useEffect(() => {
    fetchPublicCircles();
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8">Circles</h1>
      <CirclesGrid
        circles={circles}
        userAddress={userAddress}
        onJoin={joinCircle}
      />
    </div>
  );
}
```

## 4. Create Circle Detail Page

```typescript
// src/app/circles/[id]/page.tsx
'use client';

import { useWeb3Profile } from '@/hooks';
import { useCircles, useCircleContent, useCircleLeaderboard } from '@/hooks';
import {
  CircleHeader,
  CircleFeed,
  CircleLeaderboard,
} from '@/components/circles';

export default function CircleDetailPage({ params }: { params: { id: string } }) {
  const { userAddress } = useWeb3Profile();
  const [circle, setCircle] = React.useState(null);
  const [isMember, setIsMember] = React.useState(false);
  const { joinCircle, leaveCircle } = useCircles(userAddress);

  React.useEffect(() => {
    // Fetch circle details
    fetch(`/api/circles?action=getCircle&circleId=${params.id}`)
      .then((r) => r.json())
      .then((data) => setCircle(data.circle));

    // Check membership
    fetch(
      `/api/circles?action=isMember&circleId=${params.id}&userAddress=${userAddress}`
    )
      .then((r) => r.json())
      .then((data) => setIsMember(data.isMember));
  }, [params.id, userAddress]);

  if (!circle) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <CircleHeader
        circle={circle}
        userAddress={userAddress}
        isMember={isMember}
        onJoinChange={() => setIsMember(!isMember)}
      />

      <div className="grid grid-cols-3 gap-6 mt-8">
        <div className="col-span-2">
          {isMember ? (
            <CircleFeed circleId={params.id} userAddress={userAddress} />
          ) : (
            <div className="bg-white rounded-lg p-8 text-center text-gray-500">
              Join the circle to see posts
            </div>
          )}
        </div>

        <div>
          <CircleLeaderboard circleId={params.id} limit={10} />
        </div>
      </div>
    </div>
  );
}
```

## 5. Test It Out

**Create a Circle:**

```typescript
const { createCircle } = useCircles(userAddress);

await createCircle({
  name: 'My Circle',
  description: 'Test circle',
  category: 'community',
  isPublic: true,
});
```

**Join a Circle:**

```typescript
await joinCircle('circle-id');
```

**Create a Post:**

```typescript
const { createPost } = useCircleContent(circleId);

await createPost(userAddress, 'Post Title', 'Post content here');
```

**Check Leaderboard:**

```typescript
const { leaderboard } = useCircleLeaderboard(circleId);
console.log(leaderboard); // Top members by points
```

## API Reference (Quick)

| Action           | Method | Params                                  |
| ---------------- | ------ | --------------------------------------- |
| Create circle    | POST   | `name, description, category, isPublic` |
| Join circle      | POST   | `circleId`                              |
| Create post      | POST   | `circleId, title, content`              |
| Like post        | POST   | `postId, interactionType:'like'`        |
| Get leaderboard  | GET    | `circleId, limit`                       |
| Get circle posts | GET    | `circleId, limit`                       |
| Search circles   | GET    | `query, limit`                          |

See [CIRCLES.md](./CIRCLES.md) for full API documentation.

## Next Steps

1. ✅ Deploy database schema
2. ✅ Create circles page
3. ✅ Create circle detail page
4. 📝 Add circle creation form
5. 📝 Add member management UI
6. 📝 Add gating rules UI

## Troubleshooting

**"No table" error:**

- Run the SQL migration again in Supabase
- Check `supabase/migrations/003_circles_schema.sql`

**"Unauthorized" error:**

- Check RLS policies in Supabase > Authentication > Policies
- Verify user is authenticated with `useWeb3Profile()`

**Components not showing:**

- Verify Tailwind CSS is configured
- Check `/src/components/circles/index.ts` exports

**API 404:**

- Ensure `/api/circles/route.ts` exists
- Check Next.js API routes structure

---

Need more help? See [CIRCLES_EXAMPLES.tsx](./CIRCLES_EXAMPLES.tsx) for 9 complete working examples.
