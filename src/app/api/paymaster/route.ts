import { PaymasterService } from '@/services/paymaster-service';
import { NextRequest, NextResponse } from 'next/server';

const service = new PaymasterService(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'qualifiesForGasless': {
        const userAddress = searchParams.get('userAddress');
        const operationType = searchParams.get('operationType');
        if (!userAddress || !operationType) {
          return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }
        const qualifies = await service.qualifiesForGaslessTransaction(userAddress, operationType);
        return NextResponse.json({ qualifies });
      }

      case 'getGaslessTransactions': {
        const userAddress = searchParams.get('userAddress');
        const limit = parseInt(searchParams.get('limit') || '50');
        if (!userAddress) {
          return NextResponse.json({ error: 'Missing userAddress' }, { status: 400 });
        }
        const transactions = await service.getGaslessTransactions(userAddress, limit);
        return NextResponse.json({ transactions });
      }

      case 'getTotalGasSponsored': {
        const userAddress = searchParams.get('userAddress');
        if (!userAddress) {
          return NextResponse.json({ error: 'Missing userAddress' }, { status: 400 });
        }
        const totalGas = await service.getTotalGasSponsored(userAddress);
        return NextResponse.json({ totalGas });
      }

      case 'getGaslessStats': {
        const stats = await service.getGaslessStats();
        return NextResponse.json({ stats });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Paymaster GET error:', error);
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
      case 'getPaymasterData': {
        const { userOperation } = body;
        if (!userOperation) {
          return NextResponse.json({ error: 'Missing userOperation' }, { status: 400 });
        }
        const paymasterData = await service.getPaymasterData(userOperation);
        return NextResponse.json({ paymasterData });
      }

      case 'submitUserOperation': {
        const { userOperation } = body;
        if (!userOperation) {
          return NextResponse.json({ error: 'Missing userOperation' }, { status: 400 });
        }
        const userOpHash = await service.submitUserOperation(userOperation);
        return NextResponse.json({ userOpHash });
      }

      case 'waitForUserOperation': {
        const { userOpHash, timeout } = body;
        if (!userOpHash) {
          return NextResponse.json({ error: 'Missing userOpHash' }, { status: 400 });
        }
        const receipt = await service.waitForUserOperation(userOpHash, timeout);
        return NextResponse.json({ receipt });
      }

      case 'recordGaslessTransaction': {
        const { userAddress, userOperationHash, operationType, gasCost } = body;
        if (!userAddress || !userOperationHash || !operationType) {
          return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }
        const transaction = await service.recordGaslessTransaction({
          userAddress,
          userOperationHash,
          operationType,
          gasCost,
        });
        return NextResponse.json({ transaction });
      }

      case 'updateGaslessTransaction': {
        const { userOperationHash, transactionHash, status, gasCost } = body;
        if (!userOperationHash || !status) {
          return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }
        const transaction = await service.updateGaslessTransaction(userOperationHash, {
          transactionHash,
          status,
          gasCost,
        });
        return NextResponse.json({ transaction });
      }

      case 'executeGaslessProfileEdit': {
        const { userAddress, callData, targetContract } = body;
        if (!userAddress || !callData || !targetContract) {
          return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }
        const userOpHash = await service.executeGaslessProfileEdit({
          userAddress,
          callData,
          targetContract,
        });
        return NextResponse.json({ userOpHash });
      }

      case 'executeGaslessBadgeMint': {
        const { userAddress, callData, targetContract } = body;
        if (!userAddress || !callData || !targetContract) {
          return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }
        const userOpHash = await service.executeGaslessBadgeMint({
          userAddress,
          callData,
          targetContract,
        });
        return NextResponse.json({ userOpHash });
      }

      case 'estimateUserOperationGas': {
        const { userOperation } = body;
        if (!userOperation) {
          return NextResponse.json({ error: 'Missing userOperation' }, { status: 400 });
        }
        const gasEstimate = await service.estimateUserOperationGas(userOperation);
        return NextResponse.json({ gasEstimate });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Paymaster POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
