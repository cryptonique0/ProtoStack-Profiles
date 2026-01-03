import CirclesService from '@/services/circles-service';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getCirclesService() {
  return new CirclesService(supabaseUrl, supabaseKey);
}

// GET - Fetch circles, members, leaderboard
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const circleId = searchParams.get('circleId');
    const userAddress = searchParams.get('userAddress');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const service = getCirclesService();

    if (action === 'getCircle' && circleId) {
      const circle = await service.getCircle(circleId);
      return NextResponse.json({ circle });
    }

    if (action === 'getPublic') {
      const circles = await service.getPublicCircles(limit, offset);
      return NextResponse.json({ circles });
    }

    if (action === 'getByCreator' && userAddress) {
      const circles = await service.getCirclesByCreator(userAddress);
      return NextResponse.json({ circles });
    }

    if (action === 'getUserCircles' && userAddress) {
      const circles = await service.getUserCircles(userAddress);
      return NextResponse.json({ circles });
    }

    if (action === 'search') {
      const query = searchParams.get('query') || '';
      const circles = await service.searchCircles(query, limit);
      return NextResponse.json({ circles });
    }

    if (action === 'getMembers' && circleId) {
      const members = await service.getCircleMembers(circleId, limit);
      return NextResponse.json({ members });
    }

    if (action === 'getLeaderboard' && circleId) {
      const leaderboard = await service.getLeaderboard(circleId, limit);
      return NextResponse.json({ leaderboard });
    }

    if (action === 'getMemberRank' && circleId && userAddress) {
      const rank = await service.getMemberRank(circleId, userAddress);
      return NextResponse.json({ rank });
    }

    if (action === 'getActivity' && circleId) {
      const activity = await service.getCircleActivity(circleId, limit, offset);
      return NextResponse.json({ activity });
    }

    if (action === 'getPosts' && circleId) {
      const posts = await service.getCirclePosts(circleId, limit, offset);
      return NextResponse.json({ posts });
    }

    if (action === 'getComments') {
      const postId = searchParams.get('postId');
      if (!postId) {
        return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
      }
      const comments = await service.getPostComments(postId);
      return NextResponse.json({ comments });
    }

    if (action === 'getGatingRules' && circleId) {
      const rules = await service.getGatingRules(circleId);
      return NextResponse.json({ rules });
    }

    if (action === 'canAccess' && circleId && userAddress) {
      const canAccess = await service.canAccessCircle(userAddress, circleId);
      return NextResponse.json({ canAccess });
    }

    if (action === 'isMember' && circleId && userAddress) {
      const isMember = await service.isMember(circleId, userAddress);
      return NextResponse.json({ isMember });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Circles GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch circles data' },
      { status: 500 }
    );
  }
}

// POST - Create circle, join, post, etc.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userAddress, action, ...payload } = body;

    if (!userAddress) {
      return NextResponse.json({ error: 'User address required' }, { status: 400 });
    }

    const service = getCirclesService();

    if (action === 'createCircle') {
      const circle = await service.createCircle(userAddress, payload);
      return NextResponse.json({ circle });
    }

    if (action === 'joinCircle') {
      const { circleId } = payload;
      if (!circleId) {
        return NextResponse.json({ error: 'Circle ID required' }, { status: 400 });
      }

      const canAccess = await service.canAccessCircle(userAddress, circleId);
      if (!canAccess) {
        return NextResponse.json({ error: 'You cannot access this circle' }, { status: 403 });
      }

      const member = await service.addMember(circleId, userAddress, 'member');
      return NextResponse.json({ member });
    }

    if (action === 'leaveCircle') {
      const { circleId } = payload;
      if (!circleId) {
        return NextResponse.json({ error: 'Circle ID required' }, { status: 400 });
      }

      await service.removeMember(circleId, userAddress);
      return NextResponse.json({ success: true });
    }

    if (action === 'createPost') {
      const { circleId, title, content, mediaUrls } = payload;
      if (!circleId || !content) {
        return NextResponse.json({ error: 'Circle ID and content required' }, { status: 400 });
      }

      const post = await service.createPost({
        circleId,
        authorAddress: userAddress,
        title,
        content,
        mediaUrls,
      });

      return NextResponse.json({ post });
    }

    if (action === 'interactWithPost') {
      const { postId, interactionType } = payload;
      if (!postId || !interactionType) {
        return NextResponse.json(
          { error: 'Post ID and interaction type required' },
          { status: 400 }
        );
      }

      const interaction = await service.interactWithPost(
        postId,
        userAddress,
        interactionType as 'like' | 'dislike' | 'share'
      );

      return NextResponse.json({ interaction });
    }

    if (action === 'addComment') {
      const { postId, content } = payload;
      if (!postId || !content) {
        return NextResponse.json({ error: 'Post ID and content required' }, { status: 400 });
      }

      const comment = await service.addComment({
        postId,
        authorAddress: userAddress,
        content,
        parentCommentId: payload.parentCommentId,
      });

      return NextResponse.json({ comment });
    }

    if (action === 'addGatingRule') {
      const { circleId, ...rule } = payload;
      if (!circleId) {
        return NextResponse.json({ error: 'Circle ID required' }, { status: 400 });
      }

      const gatingRule = await service.addGatingRule(circleId, rule);
      return NextResponse.json({ gatingRule });
    }

    if (action === 'createInvite') {
      const { circleId, invitedAddress } = payload;
      if (!circleId) {
        return NextResponse.json({ error: 'Circle ID required' }, { status: 400 });
      }

      const invite = await service.createInvite(circleId, userAddress, invitedAddress);
      return NextResponse.json({ invite });
    }

    if (action === 'useInvite') {
      const { inviteCode } = payload;
      if (!inviteCode) {
        return NextResponse.json({ error: 'Invite code required' }, { status: 400 });
      }

      const circleId = await service.useInvite(inviteCode, userAddress);
      return NextResponse.json({ circleId, success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Circles POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process circles request' },
      { status: 500 }
    );
  }
}
