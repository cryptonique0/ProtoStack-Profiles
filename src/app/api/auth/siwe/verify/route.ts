import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { SiweMessage } from 'siwe';
import { authOptions } from '../../[...nextauth]/route';

export async function POST(request: NextRequest) {
  try {
    const { message, signature } = await request.json();

    if (!message || !signature) {
      return NextResponse.json(
        { error: 'Missing message or signature' },
        { status: 400 }
      );
    }

    // Get nonce from cookie
    const nonce = request.cookies.get('siwe-nonce')?.value;

    if (!nonce) {
      return NextResponse.json(
        { error: 'Nonce not found. Please try again.' },
        { status: 400 }
      );
    }

    const siweMessage = new SiweMessage(message);

    // Verify the nonce matches
    if (siweMessage.nonce !== nonce) {
      return NextResponse.json(
        { error: 'Invalid nonce' },
        { status: 400 }
      );
    }

    const result = await siweMessage.verify({
      signature,
      domain: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000').host,
      nonce,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const response = NextResponse.json({
      success: true,
      address: siweMessage.address,
      chainId: siweMessage.chainId,
    });

    // Clear the nonce cookie
    response.cookies.delete('siwe-nonce');

    return response;
  } catch (error) {
    console.error('SIWE verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.address) {
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }

  return NextResponse.json({
    authenticated: true,
    address: session.address,
    chainId: session.chainId,
  });
}
