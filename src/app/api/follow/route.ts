import { FollowerService } from '@/services/follower-service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { followerAddress, followingAddress } = await request.json();

    if (!followerAddress || !followingAddress) {
      return NextResponse.json(
        { error: 'Both addresses are required' },
        { status: 400 }
      );
    }

    if (followerAddress.toLowerCase() === followingAddress.toLowerCase()) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      );
    }

    await FollowerService.follow(followerAddress, followingAddress);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    console.error('Follow error:', error);
    
    if (error.message === 'Already following this profile') {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to follow' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { followerAddress, followingAddress } = await request.json();

    if (!followerAddress || !followingAddress) {
      return NextResponse.json(
        { error: 'Both addresses are required' },
        { status: 400 }
      );
    }

    await FollowerService.unfollow(followerAddress, followingAddress);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unfollow error:', error);
    return NextResponse.json(
      { error: 'Failed to unfollow' },
      { status: 500 }
    );
  }
}
