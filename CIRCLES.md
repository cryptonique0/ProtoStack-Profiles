# 👥 Circles / Communities Feature

## Overview

Circles brings mini-DAOs and communities to ProtoStack Profiles, enabling users to create, manage, and participate in groups with flexible gating mechanisms, shared activity feeds, and competitive leaderboards. Think GitHub organizations + Discord roles + Web3 identity.

## Key Features

### 1. Create Communities

- Public or private circles
- Customizable descriptions and categories
- Automatic role-based permission system
- Member count tracking

### 2. Flexible Access Gating

- **Badge Gating**: Require specific NFT badges
- **NFT Gating**: Require ownership of specific NFTs
- **Follower Gating**: Require minimum follower count
- **Reputation Gating**: Based on platform reputation
- **Custom Rules**: Combine multiple conditions

### 3. Shared Activity Feeds

- Real-time post creation and interactions
- Threaded comments on posts
- Activity logging with timestamps
- Member contributions tracking

### 4. Group Leaderboards

- Point-based ranking system
  - Posts: 10 points
  - Comments: 5 points
  - Likes received: 1 point each
- Member profiles with stats
- Rank tracking and achievements

### 5. Circle Roles & Permissions

- **Admin**: Full circle management, can remove members
- **Moderator**: Can moderate posts and comments
- **Member**: Full participation, can post and comment
- **Viewer**: Read-only access (for public circles)

## Database Schema

### Core Tables

**circles**

- `id`: UUID (primary key)
- `creatorAddress`: wallet address
- `name`: circle name
- `description`: optional description
- `category`: dao, community, club, etc.
- `isPublic`: boolean (public/private)
- `memberCount`: current member count
- `createdAt`, `updatedAt`: timestamps

**circle_members**

- `id`: UUID (primary key)
- `circleId`: reference to circle
- `memberAddress`: wallet address
- `role`: admin, moderator, member, viewer
- `joinedAt`: join timestamp
- `points`: leaderboard points
- `joinedAt`, `updatedAt`: timestamps

**circle_gating_rules**

- `id`: UUID (primary key)
- `circleId`: reference to circle
- `ruleType`: badge, nft, follower, reputation, custom
- `ruleData`: JSON config for the rule type
- `createdAt`: timestamp

**circle_posts**

- `id`: UUID (primary key)
- `circleId`: reference to circle
- `authorAddress`: post author wallet
- `title`: post title
- `content`: post content
- `mediaUrls`: optional array of media
- `likeCount`, `commentCount`: interaction counts
- `createdAt`, `updatedAt`: timestamps

**circle_comments**

- `id`: UUID (primary key)
- `postId`: reference to post
- `authorAddress`: comment author wallet
- `content`: comment text
- `createdAt`, `updatedAt`: timestamps

**circle_leaderboard**

- `id`: UUID (primary key)
- `circleId`: reference to circle
- `memberAddress`: wallet address
- `totalPoints`: accumulated points
- `postCount`, `commentCount`: contribution counts
- `lastUpdated`: timestamp

**circle_activity**

- `id`: UUID (primary key)
- `circleId`: reference to circle
- `memberAddress`: actor wallet
- `actionType`: post_created, comment_added, member_joined, etc.
- `resourceId`: ID of affected resource
- `createdAt`: timestamp

## API Endpoints

### GET Endpoints

#### Get Circle Details

```bash
GET /api/circles?action=getCircle&circleId=<id>
```

Returns complete circle info, member count, and gating rules.

#### Get Public Circles

```bash
GET /api/circles?action=getPublic&limit=50
```

Returns paginated list of public circles.

#### Get Circles by Creator

```bash
GET /api/circles?action=getByCreator&creatorAddress=<address>&limit=50
```

#### Get User's Circles

```bash
GET /api/circles?userAddress=<address>&action=getUserCircles
```

Returns all circles where user is a member.

#### Search Circles

```bash
GET /api/circles?action=search&query=<searchTerm>&limit=20
```

#### Get Circle Members

```bash
GET /api/circles?action=getMembers&circleId=<id>&limit=100
```

#### Get Leaderboard

```bash
GET /api/circles?action=getLeaderboard&circleId=<id>&limit=50
```

Returns ranked members by points.

#### Get Member Rank

```bash
GET /api/circles?action=getMemberRank&circleId=<id>&userAddress=<address>
```

#### Get Circle Activity

```bash
GET /api/circles?action=getActivity&circleId=<id>&limit=50
```

#### Get Circle Posts

```bash
GET /api/circles?action=getPosts&circleId=<id>&limit=20
```

#### Get Post Comments

```bash
GET /api/circles?action=getComments&postId=<id>&limit=50
```

#### Get Gating Rules

```bash
GET /api/circles?action=getGatingRules&circleId=<id>
```

#### Check Circle Access

```bash
GET /api/circles?action=canAccess&circleId=<id>&userAddress=<address>
```

#### Check Circle Membership

```bash
GET /api/circles?action=isMember&circleId=<id>&userAddress=<address>
```

### POST Endpoints

#### Create Circle

```bash
POST /api/circles
{
  "userAddress": "0x...",
  "action": "createCircle",
  "name": "DAO Founders",
  "description": "Exclusive founder community",
  "category": "dao",
  "isPublic": false
}
```

#### Join Circle

```bash
POST /api/circles
{
  "userAddress": "0x...",
  "action": "joinCircle",
  "circleId": "<id>"
}
```

#### Leave Circle

```bash
POST /api/circles
{
  "userAddress": "0x...",
  "action": "leaveCircle",
  "circleId": "<id>"
}
```

#### Create Post

```bash
POST /api/circles
{
  "userAddress": "0x...",
  "action": "createPost",
  "circleId": "<id>",
  "title": "Governance Proposal",
  "content": "Let's discuss...",
  "mediaUrls": ["https://..."]
}
```

#### Interact with Post

```bash
POST /api/circles
{
  "userAddress": "0x...",
  "action": "interactWithPost",
  "postId": "<id>",
  "interactionType": "like" | "share" | "dislike"
}
```

#### Add Comment

```bash
POST /api/circles
{
  "userAddress": "0x...",
  "action": "addComment",
  "postId": "<id>",
  "content": "Great idea!"
}
```

#### Add Gating Rule

```bash
POST /api/circles
{
  "userAddress": "0x...",
  "action": "addGatingRule",
  "circleId": "<id>",
  "ruleType": "badge",
  "ruleData": {
    "badgeId": "<badge-uuid>"
  }
}
```

#### Create Invite

```bash
POST /api/circles
{
  "userAddress": "0x...",
  "action": "createInvite",
  "circleId": "<id>",
  "invitedAddress": "0x..." // optional
}
```

Returns invite code that expires in 7 days.

#### Use Invite

```bash
POST /api/circles
{
  "userAddress": "0x...",
  "action": "useInvite",
  "inviteCode": "ABC123XYZ"
}
```

## React Hooks

### useCircles(userAddress)

Manage circles and membership.

```typescript
const {
  circles, // All fetched public circles
  userCircles, // Circles user is member of
  isLoading, // Loading state
  error, // Error message
  fetchUserCircles, // Refresh user circles
  fetchPublicCircles, // Refresh public circles
  createCircle, // Create new circle
  joinCircle, // Join existing circle
  leaveCircle, // Leave circle
  searchCircles, // Search circles
} = useCircles(userAddress);
```

### useCircleContent(circleId)

Manage posts and comments within a circle.

```typescript
const {
  posts, // Circle posts
  activity, // Activity feed
  isLoading, // Loading state
  error, // Error message
  fetchPosts, // Refresh posts
  fetchActivity, // Refresh activity
  createPost, // Create new post
  likePost, // Like a post
  addComment, // Add comment to post
} = useCircleContent(circleId);
```

### useCircleLeaderboard(circleId)

Access leaderboard data and rankings.

```typescript
const {
  leaderboard, // Array of ranked members
  userRank, // Current user's rank
  isLoading, // Loading state
  error, // Error message
  fetchLeaderboard, // Refresh leaderboard
  fetchUserRank, // Get user's rank
} = useCircleLeaderboard(circleId);
```

### useCircleInvites(userAddress)

Manage circle invitations.

```typescript
const {
  isLoading, // Loading state
  error, // Error message
  createInvite, // Generate invite code
  useInvite, // Redeem invite code
} = useCircleInvites(userAddress);
```

## Components

### CircleCard

Display circle information with join button.

```typescript
<CircleCard
  circle={circle}
  onJoin={handleJoin}
  isMember={false}
/>
```

### CircleFeed

Full post feed with creation form.

```typescript
<CircleFeed
  circleId="circle-uuid"
  userAddress="0x..."
/>
```

### CirclePostCard

Individual post display with interactions.

```typescript
<CirclePostCard
  post={post}
  userAddress="0x..."
  circleId="circle-uuid"
/>
```

### CircleLeaderboard

Ranked member list with points.

```typescript
<CircleLeaderboard
  circleId="circle-uuid"
  limit={10}
/>
```

### CircleHeader

Circle banner with title and stats.

```typescript
<CircleHeader
  circle={circle}
  userAddress="0x..."
  isMember={true}
  onJoinChange={handleJoinChange}
/>
```

### CircleJoinButton

Smart join/leave button with state.

```typescript
<CircleJoinButton
  circle={circle}
  userAddress="0x..."
  isMember={false}
  onJoinChange={handleJoinChange}
/>
```

### CirclesGrid

Grid layout for multiple circles.

```typescript
<CirclesGrid
  circles={circles}
  userAddress="0x..."
  userCircleIds={["id1", "id2"]}
  onJoin={handleJoin}
/>
```

## TypeScript Types

All types are exported from `@/types`:

```typescript
interface Circle {
  id: string;
  creatorAddress: string;
  name: string;
  description?: string;
  category?: string;
  isPublic: boolean;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CircleMember {
  id: string;
  circleId: string;
  memberAddress: string;
  role: 'admin' | 'moderator' | 'member' | 'viewer';
  points: number;
  joinedAt: string;
  updatedAt: string;
}

interface CirclePost {
  id: string;
  circleId: string;
  authorAddress: string;
  title: string;
  content: string;
  mediaUrls?: string[];
  likeCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CircleComment {
  id: string;
  postId: string;
  authorAddress: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface CircleLeaderboardEntry {
  memberAddress: string;
  totalPoints: number;
  postCount: number;
  commentCount: number;
  role: string;
}

interface CircleGatingRule {
  id: string;
  circleId: string;
  ruleType: 'badge' | 'nft' | 'follower' | 'reputation' | 'custom';
  ruleData: Record<string, any>;
  createdAt: string;
}

interface CircleActivity {
  id: string;
  circleId: string;
  memberAddress: string;
  actionType: string;
  resourceId: string;
  createdAt: string;
}

interface CircleInvite {
  id: string;
  circleId: string;
  inviteCode: string;
  invitedBy: string;
  invitedAddress?: string;
  usedBy?: string;
  expiresAt: string;
  createdAt: string;
}

interface CircleRolePermissions {
  role: string;
  canPost: boolean;
  canComment: boolean;
  canManageMembers: boolean;
  canModerateContent: boolean;
  canEditCircle: boolean;
}
```

## Security

### Row-Level Security (RLS)

- **Public circles**: Readable by all authenticated users
- **Private circles**: Only accessible to members
- **Posts**: Limited to circle members
- **Comments**: Limited to circle members
- **Leaderboard**: Public visibility

### Permission Checks

- Create posts: Must be member
- Add comments: Must be member
- Manage gating: Must be admin
- Remove members: Must be admin
- Create invites: Must be admin or moderator

## Architecture

### Service Layer (CirclesService)

Handles all business logic:

- Circle creation and management
- Member access control via gating rules
- Post and comment creation
- Leaderboard calculation and ranking
- Activity logging
- Invite generation and validation

### API Routes (/api/circles)

RESTful endpoints with:

- Parameter validation
- Permission checking
- Error handling
- Response formatting

### React Hooks

Provide stateful API access:

- Auto-fetching on mount
- Loading and error states
- Optimistic updates
- Automatic cache invalidation

### Database Functions

PostgreSQL helpers:

- `can_access_circle()`: Check member access
- `can_perform_action()`: Check action permissions
- `update_leaderboard_points()`: Calculate rankings

## Environment Variables

Required `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Getting Started

1. **Deploy Database Schema**
   - Run `supabase/migrations/003_circles_schema.sql` in Supabase
   - Or paste in Supabase SQL editor

2. **Import Components and Hooks**

   ```typescript
   import { useCircles, useCircleContent, useCircleLeaderboard } from '@/hooks';
   import { CircleCard, CircleFeed, CircleLeaderboard } from '@/components/circles';
   ```

3. **Create Circles Page**

   ```typescript
   export default function CirclesPage() {
     const { userAddress } = useWeb3Profile();
     const { userCircles, createCircle } = useCircles(userAddress);

     return (
       <div>
         <h1>My Circles</h1>
         <CirclesGrid circles={userCircles} />
       </div>
     );
   }
   ```

## Examples

See [CIRCLES_EXAMPLES.tsx](./CIRCLES_EXAMPLES.tsx) for 8+ complete working examples.

## Support

For issues or questions:

1. Check the API response error messages
2. Verify database migrations are applied
3. Ensure user is authenticated
4. Check RLS policies in Supabase dashboard

---

**Circles brings the power of DAOs and communities to individual profiles.**
