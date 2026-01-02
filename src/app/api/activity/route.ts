import { ActivityService } from '@/services/activity-service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (address) {
      const activities = await ActivityService.getUserActivity(address, {
        limit,
        offset,
      });

      return NextResponse.json({
        data: activities,
        pagination: {
          limit,
          offset,
          hasMore: activities.length === limit,
        },
      });
    }

    // Global recent activity
    const activities = await ActivityService.getRecentActivity(limit);

    return NextResponse.json({
      data: activities,
      count: activities.length,
    });
  } catch (error) {
    console.error('Activity fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, type, title, description, metadata, txHash, chainId } = body;

    if (!address || !type || !title) {
      return NextResponse.json(
        { error: 'Address, type, and title are required' },
        { status: 400 }
      );
    }

    const activity = await ActivityService.createActivity({
      address,
      type,
      title,
      description,
      metadata,
      txHash,
      chainId,
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error('Activity creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    );
  }
}
