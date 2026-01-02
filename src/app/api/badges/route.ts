import { BadgeService } from '@/services/badge-service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');

    let badges;
    if (category) {
      badges = await BadgeService.getBadgesByCategory(category);
    } else {
      badges = await BadgeService.getAllBadges();
    }

    return NextResponse.json({
      data: badges,
      count: badges.length,
    });
  } catch (error) {
    console.error('Badges fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch badges' },
      { status: 500 }
    );
  }
}
