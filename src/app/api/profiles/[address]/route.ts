import { ProfileService } from '@/services/profile-service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const profile = await ProfileService.getByAddress(params.address);

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // If profile is private, return limited info
    if (!profile.is_public) {
      return NextResponse.json({
        address: profile.address,
        ens_name: profile.ens_name,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        is_verified: profile.is_verified,
        is_public: false,
      });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    // TODO: Add authentication check
    const body = await request.json();

    const profile = await ProfileService.update(params.address, body);

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
