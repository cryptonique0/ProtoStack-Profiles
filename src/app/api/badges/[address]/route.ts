import { BadgeService } from '@/services/badge-service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const badges = await BadgeService.getUserBadges(params.address);

    return NextResponse.json({
      data: badges,
      count: badges.length,
      totalPoints: badges.reduce((sum, b) => sum + b.points, 0),
    });
  } catch (error) {
    console.error('User badges fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch badges' },
      { status: 500 }
    );
  }
}
