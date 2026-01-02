import { ProfileService } from '@/services/profile-service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, ...data } = body;

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    // Check if profile already exists
    const existing = await ProfileService.getByAddress(address);
    if (existing) {
      return NextResponse.json(
        { error: 'Profile already exists' },
        { status: 409 }
      );
    }

    const profile = await ProfileService.create(address, data);

    return NextResponse.json(profile, { status: 201 });
  } catch (error) {
    console.error('Profile creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create profile' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const filter = searchParams.get('filter') as 'all' | 'verified' | 'new' | null;

    const profiles = await ProfileService.getExploreProfiles({
      limit,
      offset,
      filter: filter || 'all',
    });

    return NextResponse.json({
      data: profiles,
      pagination: {
        limit,
        offset,
        hasMore: profiles.length === limit,
      },
    });
  } catch (error) {
    console.error('Profiles fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profiles' },
      { status: 500 }
    );
  }
}
