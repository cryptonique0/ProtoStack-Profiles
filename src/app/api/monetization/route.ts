import { MonetizationService } from '@/services/monetization-service';
import { NextRequest, NextResponse } from 'next/server';

const service = new MonetizationService(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'getSubscriptionConfig': {
        const creatorAddress = searchParams.get('creatorAddress');
        if (!creatorAddress) {
          return NextResponse.json({ error: 'Missing creatorAddress' }, { status: 400 });
        }
        const config = await service.getSubscriptionConfig(creatorAddress);
        return NextResponse.json({ config });
      }

      case 'getUserSubscriptions': {
        const userAddress = searchParams.get('userAddress');
        if (!userAddress) {
          return NextResponse.json({ error: 'Missing userAddress' }, { status: 400 });
        }
        const subscriptions = await service.getUserSubscriptions(userAddress);
        return NextResponse.json({ subscriptions });
      }

      case 'getCreatorSubscribers': {
        const creatorAddress = searchParams.get('creatorAddress');
        const limit = parseInt(searchParams.get('limit') || '50');
        if (!creatorAddress) {
          return NextResponse.json({ error: 'Missing creatorAddress' }, { status: 400 });
        }
        const subscribers = await service.getCreatorSubscribers(creatorAddress, limit);
        return NextResponse.json({ subscribers });
      }

      case 'hasActiveSubscription': {
        const subscriberAddress = searchParams.get('subscriberAddress');
        const creatorAddress = searchParams.get('creatorAddress');
        if (!subscriberAddress || !creatorAddress) {
          return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }
        const hasSubscription = await service.hasActiveSubscription(
          subscriberAddress,
          creatorAddress
        );
        return NextResponse.json({ hasSubscription });
      }

      case 'getTipsReceived': {
        const creatorAddress = searchParams.get('creatorAddress');
        const limit = parseInt(searchParams.get('limit') || '50');
        if (!creatorAddress) {
          return NextResponse.json({ error: 'Missing creatorAddress' }, { status: 400 });
        }
        const tips = await service.getTipsReceived(creatorAddress, limit);
        return NextResponse.json({ tips });
      }

      case 'getTipsSent': {
        const userAddress = searchParams.get('userAddress');
        const limit = parseInt(searchParams.get('limit') || '50');
        if (!userAddress) {
          return NextResponse.json({ error: 'Missing userAddress' }, { status: 400 });
        }
        const tips = await service.getTipsSent(userAddress, limit);
        return NextResponse.json({ tips });
      }

      case 'getFeeSplitConfig': {
        const creatorAddress = searchParams.get('creatorAddress');
        if (!creatorAddress) {
          return NextResponse.json({ error: 'Missing creatorAddress' }, { status: 400 });
        }
        const config = await service.getFeeSplitConfig(creatorAddress);
        return NextResponse.json({ config });
      }

      case 'getTopSupporters': {
        const creatorAddress = searchParams.get('creatorAddress');
        const limit = parseInt(searchParams.get('limit') || '10');
        if (!creatorAddress) {
          return NextResponse.json({ error: 'Missing creatorAddress' }, { status: 400 });
        }
        const supporters = await service.getTopSupporters(creatorAddress, limit);
        return NextResponse.json({ supporters });
      }

      case 'getPremiumThemes': {
        const limit = parseInt(searchParams.get('limit') || '50');
        const themes = await service.getPremiumThemes(limit);
        return NextResponse.json({ themes });
      }

      case 'getPremiumTheme': {
        const themeId = searchParams.get('themeId');
        if (!themeId) {
          return NextResponse.json({ error: 'Missing themeId' }, { status: 400 });
        }
        const theme = await service.getPremiumTheme(themeId);
        return NextResponse.json({ theme });
      }

      case 'getUserThemes': {
        const userAddress = searchParams.get('userAddress');
        if (!userAddress) {
          return NextResponse.json({ error: 'Missing userAddress' }, { status: 400 });
        }
        const themes = await service.getUserThemes(userAddress);
        return NextResponse.json({ themes });
      }

      case 'getActiveTheme': {
        const userAddress = searchParams.get('userAddress');
        if (!userAddress) {
          return NextResponse.json({ error: 'Missing userAddress' }, { status: 400 });
        }
        const theme = await service.getActiveTheme(userAddress);
        return NextResponse.json({ theme });
      }

      case 'canAccessTheme': {
        const userAddress = searchParams.get('userAddress');
        const themeId = searchParams.get('themeId');
        if (!userAddress || !themeId) {
          return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }
        const canAccess = await service.canAccessTheme(userAddress, themeId);
        return NextResponse.json({ canAccess });
      }

      case 'getMonetizationStats': {
        const creatorAddress = searchParams.get('creatorAddress');
        if (!creatorAddress) {
          return NextResponse.json({ error: 'Missing creatorAddress' }, { status: 400 });
        }
        const stats = await service.getMonetizationStats(creatorAddress);
        return NextResponse.json({ stats });
      }

      case 'getTopEarnersByTips': {
        const limit = parseInt(searchParams.get('limit') || '10');
        const earners = await service.getTopEarnersByTips(limit);
        return NextResponse.json({ earners });
      }

      case 'getTopEarnersBySubscribers': {
        const limit = parseInt(searchParams.get('limit') || '10');
        const earners = await service.getTopEarnersBySubscribers(limit);
        return NextResponse.json({ earners });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Monetization GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'setSubscriptionConfig': {
        const { creatorAddress, subscriptionPrice, isAcceptingSubscribers, benefits } = body;
        if (!creatorAddress || !subscriptionPrice) {
          return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }
        const config = await service.setSubscriptionConfig({
          creatorAddress,
          subscriptionPrice,
          isAcceptingSubscribers: isAcceptingSubscribers !== false,
          benefits,
        });
        return NextResponse.json({ config });
      }

      case 'recordSubscription': {
        const {
          tokenId,
          creatorAddress,
          subscriberAddress,
          pricePerMonth,
          expiresAt,
          transactionHash,
        } = body;
        if (
          !tokenId ||
          !creatorAddress ||
          !subscriberAddress ||
          !pricePerMonth ||
          !expiresAt ||
          !transactionHash
        ) {
          return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }
        const subscription = await service.recordSubscription({
          tokenId,
          creatorAddress,
          subscriberAddress,
          pricePerMonth,
          expiresAt: new Date(expiresAt),
          transactionHash,
        });
        return NextResponse.json({ subscription });
      }

      case 'updateSubscriptionStatus': {
        const { tokenId, isActive } = body;
        if (tokenId === undefined || isActive === undefined) {
          return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }
        const subscription = await service.updateSubscriptionStatus(tokenId, isActive);
        return NextResponse.json({ subscription });
      }

      case 'recordTip': {
        const { fromAddress, toAddress, amount, tokenType, message, transactionHash, platformFee } =
          body;
        if (!fromAddress || !toAddress || !amount || !transactionHash) {
          return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }
        const tip = await service.recordTip({
          fromAddress,
          toAddress,
          amount,
          tokenType,
          message,
          transactionHash,
          platformFee,
        });
        return NextResponse.json({ tip });
      }

      case 'setFeeSplitConfig': {
        const { creatorAddress, recipients } = body;
        if (!creatorAddress || !recipients) {
          return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }
        const config = await service.setFeeSplitConfig({ creatorAddress, recipients });
        return NextResponse.json({ config });
      }

      case 'createPremiumTheme': {
        const {
          name,
          description,
          previewImageUrl,
          cssCode,
          gatingNftAddress,
          gatingBadgeId,
          price,
          createdBy,
        } = body;
        if (!name || !cssCode || !createdBy) {
          return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }
        const theme = await service.createPremiumTheme({
          name,
          description,
          previewImageUrl,
          cssCode,
          gatingNftAddress,
          gatingBadgeId,
          price,
          createdBy,
        });
        return NextResponse.json({ theme });
      }

      case 'unlockTheme': {
        const { userAddress, themeId, transactionHash } = body;
        if (!userAddress || !themeId) {
          return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }
        const userTheme = await service.unlockTheme(userAddress, themeId, transactionHash);
        return NextResponse.json({ userTheme });
      }

      case 'setActiveTheme': {
        const { userAddress, themeId } = body;
        if (!userAddress || !themeId) {
          return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }
        const userTheme = await service.setActiveTheme(userAddress, themeId);
        return NextResponse.json({ userTheme });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Monetization POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
