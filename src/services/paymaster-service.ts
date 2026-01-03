import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * PaymasterService
 * Handles ERC-4337 Account Abstraction and gasless transactions
 * Sponsors gas for new users (profile edits, badge mints)
 */
export class PaymasterService {
  private supabase: SupabaseClient;
  private paymasterUrl: string;
  private bundlerUrl: string;
  private paymasterAddress: string;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    // These would be set from environment variables
    this.paymasterUrl = process.env.NEXT_PUBLIC_PAYMASTER_URL || '';
    this.bundlerUrl = process.env.NEXT_PUBLIC_BUNDLER_URL || '';
    this.paymasterAddress = process.env.NEXT_PUBLIC_PAYMASTER_ADDRESS || '';
  }

  // =============================================
  // PAYMASTER METHODS
  // =============================================

  /**
   * Check if user qualifies for gasless transactions
   * New users with no transactions get free gas
   */
  async qualifiesForGaslessTransaction(
    userAddress: string,
    operationType: string
  ): Promise<boolean> {
    // Check user's gasless transaction history
    const { data, error } = await this.supabase
      .from('gasless_transactions')
      .select('id')
      .eq('user_address', userAddress)
      .eq('operation_type', operationType)
      .eq('status', 'confirmed');

    if (error) throw error;

    // Allow gasless transactions based on operation type
    switch (operationType) {
      case 'profile_edit':
        // First 3 profile edits are gasless
        return (data?.length || 0) < 3;
      case 'badge_mint':
        // First 5 badge mints are gasless
        return (data?.length || 0) < 5;
      case 'profile_creation':
        // First profile creation is always gasless
        return (data?.length || 0) === 0;
      default:
        return false;
    }
  }

  /**
   * Get paymaster data for sponsoring a transaction
   * This would integrate with services like Pimlico, Biconomy, or Base's native paymaster
   */
  async getPaymasterData(userOperation: {
    sender: string;
    nonce: string;
    initCode: string;
    callData: string;
    callGasLimit: string;
    verificationGasLimit: string;
    preVerificationGas: string;
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
    paymasterAndData: string;
    signature: string;
  }) {
    try {
      // This is a placeholder - implement based on your paymaster provider
      // Example: Pimlico, Biconomy, or custom paymaster

      const response = await fetch(this.paymasterUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'pm_sponsorUserOperation',
          params: [
            userOperation,
            {
              entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789', // Standard EntryPoint
            },
          ],
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      return data.result;
    } catch (error) {
      console.error('Failed to get paymaster data:', error);
      throw error;
    }
  }

  /**
   * Submit a user operation to the bundler
   */
  async submitUserOperation(userOperation: any): Promise<string> {
    try {
      const response = await fetch(this.bundlerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_sendUserOperation',
          params: [
            userOperation,
            '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789', // Standard EntryPoint
          ],
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      // userOpHash
      return data.result;
    } catch (error) {
      console.error('Failed to submit user operation:', error);
      throw error;
    }
  }

  /**
   * Wait for user operation to be included in a block
   */
  async waitForUserOperation(
    userOpHash: string,
    timeout = 30000
  ): Promise<{
    transactionHash: string;
    blockNumber: number;
    success: boolean;
  }> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const response = await fetch(this.bundlerUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_getUserOperationReceipt',
            params: [userOpHash],
          }),
        });

        const data = await response.json();

        if (data.result) {
          return {
            transactionHash: data.result.receipt.transactionHash,
            blockNumber: parseInt(data.result.receipt.blockNumber, 16),
            success: data.result.success,
          };
        }
      } catch (error) {
        // Receipt not yet available, continue polling
      }

      // Wait 2 seconds before next poll
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    throw new Error('User operation timeout');
  }

  /**
   * Record a gasless transaction in database
   */
  async recordGaslessTransaction(transaction: {
    userAddress: string;
    userOperationHash: string;
    operationType: string;
    gasCost?: string;
  }) {
    const { data, error } = await this.supabase
      .from('gasless_transactions')
      .insert({
        user_address: transaction.userAddress,
        user_operation_hash: transaction.userOperationHash,
        operation_type: transaction.operationType,
        gas_cost: transaction.gasCost,
        paymaster_address: this.paymasterAddress,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update gasless transaction status
   */
  async updateGaslessTransaction(
    userOperationHash: string,
    update: {
      transactionHash?: string;
      status: 'confirmed' | 'failed';
      gasCost?: string;
    }
  ) {
    const { data, error } = await this.supabase
      .from('gasless_transactions')
      .update({
        transaction_hash: update.transactionHash,
        status: update.status,
        gas_cost: update.gasCost,
        confirmed_at: new Date().toISOString(),
      })
      .eq('user_operation_hash', userOperationHash)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get user's gasless transaction history
   */
  async getGaslessTransactions(userAddress: string, limit = 50) {
    const { data, error } = await this.supabase
      .from('gasless_transactions')
      .select('*')
      .eq('user_address', userAddress)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get total gas sponsored for user
   */
  async getTotalGasSponsored(userAddress: string): Promise<string> {
    const { data, error } = await this.supabase
      .from('gasless_transactions')
      .select('gas_cost')
      .eq('user_address', userAddress)
      .eq('status', 'confirmed');

    if (error) throw error;

    const total = (data || []).reduce((sum, tx) => {
      return sum + BigInt(tx.gas_cost || '0');
    }, BigInt(0));

    return total.toString();
  }

  /**
   * Get gasless transaction statistics
   */
  async getGaslessStats() {
    const { data, error } = await this.supabase
      .from('gasless_transactions')
      .select('operation_type, status, gas_cost')
      .eq('status', 'confirmed');

    if (error) throw error;

    const stats = {
      totalTransactions: data?.length || 0,
      totalGasSponsored: BigInt(0),
      byOperationType: {} as Record<string, number>,
    };

    (data || []).forEach((tx) => {
      stats.totalGasSponsored += BigInt(tx.gas_cost || '0');
      stats.byOperationType[tx.operation_type] =
        (stats.byOperationType[tx.operation_type] || 0) + 1;
    });

    return {
      ...stats,
      totalGasSponsored: stats.totalGasSponsored.toString(),
    };
  }

  // =============================================
  // HIGH-LEVEL GASLESS OPERATIONS
  // =============================================

  /**
   * Execute gasless profile edit
   */
  async executeGaslessProfileEdit(params: {
    userAddress: string;
    callData: string;
    targetContract: string;
  }): Promise<string> {
    // Check if user qualifies
    const qualifies = await this.qualifiesForGaslessTransaction(params.userAddress, 'profile_edit');

    if (!qualifies) {
      throw new Error('User does not qualify for gasless profile edit');
    }

    // Build user operation
    const userOp = await this.buildUserOperation({
      sender: params.userAddress,
      target: params.targetContract,
      callData: params.callData,
    });

    // Get paymaster sponsorship
    const paymasterData = await this.getPaymasterData(userOp);
    userOp.paymasterAndData = paymasterData.paymasterAndData;

    // Submit to bundler
    const userOpHash = await this.submitUserOperation(userOp);

    // Record in database
    await this.recordGaslessTransaction({
      userAddress: params.userAddress,
      userOperationHash: userOpHash,
      operationType: 'profile_edit',
    });

    return userOpHash;
  }

  /**
   * Execute gasless badge mint
   */
  async executeGaslessBadgeMint(params: {
    userAddress: string;
    callData: string;
    targetContract: string;
  }): Promise<string> {
    const qualifies = await this.qualifiesForGaslessTransaction(params.userAddress, 'badge_mint');

    if (!qualifies) {
      throw new Error('User does not qualify for gasless badge mint');
    }

    const userOp = await this.buildUserOperation({
      sender: params.userAddress,
      target: params.targetContract,
      callData: params.callData,
    });

    const paymasterData = await this.getPaymasterData(userOp);
    userOp.paymasterAndData = paymasterData.paymasterAndData;

    const userOpHash = await this.submitUserOperation(userOp);

    await this.recordGaslessTransaction({
      userAddress: params.userAddress,
      userOperationHash: userOpHash,
      operationType: 'badge_mint',
    });

    return userOpHash;
  }

  // =============================================
  // HELPER METHODS
  // =============================================

  /**
   * Build a user operation from parameters
   * This is a simplified version - implement based on your AA provider
   */
  private async buildUserOperation(params: { sender: string; target: string; callData: string }) {
    // This is a placeholder - implement based on your AA stack
    // Would typically use libraries like permissionless.js, userop, etc.

    return {
      sender: params.sender,
      nonce: '0x0', // Would fetch from entrypoint
      initCode: '0x', // Empty for existing accounts
      callData: params.callData,
      callGasLimit: '0x55555',
      verificationGasLimit: '0x55555',
      preVerificationGas: '0x55555',
      maxFeePerGas: '0x1',
      maxPriorityFeePerGas: '0x1',
      paymasterAndData: '0x',
      signature: '0x', // Would be signed by user's wallet
    };
  }

  /**
   * Estimate gas for a user operation
   */
  async estimateUserOperationGas(userOp: any): Promise<{
    callGasLimit: string;
    verificationGasLimit: string;
    preVerificationGas: string;
  }> {
    try {
      const response = await fetch(this.bundlerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_estimateUserOperationGas',
          params: [userOp, '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'],
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      return data.result;
    } catch (error) {
      console.error('Failed to estimate gas:', error);
      throw error;
    }
  }
}
