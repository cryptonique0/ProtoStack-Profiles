import { useCallback, useEffect, useState } from 'react';

/**
 * Hook for paymaster / gasless transactions
 */
export function usePaymaster(userAddress: string) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [totalGasSponsored, setTotalGasSponsored] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user qualifies for gasless transaction
  const checkQualification = useCallback(
    async (operationType: string): Promise<boolean> => {
      if (!userAddress) return false;

      try {
        const response = await fetch(
          `/api/paymaster?action=qualifiesForGasless&userAddress=${userAddress}&operationType=${operationType}`
        );
        if (!response.ok) return false;

        const data = await response.json();
        return data.qualifies;
      } catch (err) {
        console.error('Failed to check qualification:', err);
        return false;
      }
    },
    [userAddress]
  );

  // Get user's gasless transaction history
  const fetchTransactions = useCallback(
    async (limit = 50) => {
      if (!userAddress) return;

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/paymaster?action=getGaslessTransactions&userAddress=${userAddress}&limit=${limit}`
        );
        if (!response.ok) throw new Error('Failed to fetch transactions');

        const data = await response.json();
        setTransactions(data.transactions || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    },
    [userAddress]
  );

  // Get total gas sponsored for user
  const fetchTotalGasSponsored = useCallback(async () => {
    if (!userAddress) return;

    try {
      const response = await fetch(
        `/api/paymaster?action=getTotalGasSponsored&userAddress=${userAddress}`
      );
      if (!response.ok) throw new Error('Failed to fetch total gas');

      const data = await response.json();
      setTotalGasSponsored(data.totalGas);
    } catch (err) {
      console.error('Failed to fetch total gas:', err);
    }
  }, [userAddress]);

  // Execute gasless profile edit
  const executeGaslessProfileEdit = useCallback(
    async (callData: string, targetContract: string): Promise<string> => {
      try {
        const response = await fetch('/api/paymaster', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'executeGaslessProfileEdit',
            userAddress,
            callData,
            targetContract,
          }),
        });

        if (!response.ok) throw new Error('Failed to execute gasless profile edit');

        const data = await response.json();
        await fetchTransactions();
        setError(null);
        return data.userOpHash;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        throw err;
      }
    },
    [userAddress, fetchTransactions]
  );

  // Execute gasless badge mint
  const executeGaslessBadgeMint = useCallback(
    async (callData: string, targetContract: string): Promise<string> => {
      try {
        const response = await fetch('/api/paymaster', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'executeGaslessBadgeMint',
            userAddress,
            callData,
            targetContract,
          }),
        });

        if (!response.ok) throw new Error('Failed to execute gasless badge mint');

        const data = await response.json();
        await fetchTransactions();
        setError(null);
        return data.userOpHash;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        throw err;
      }
    },
    [userAddress, fetchTransactions]
  );

  // Submit a generic user operation
  const submitUserOperation = useCallback(async (userOperation: any): Promise<string> => {
    try {
      const response = await fetch('/api/paymaster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submitUserOperation',
          userOperation,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit user operation');

      const data = await response.json();
      setError(null);
      return data.userOpHash;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      throw err;
    }
  }, []);

  // Wait for user operation confirmation
  const waitForConfirmation = useCallback(
    async (
      userOpHash: string,
      timeout = 30000
    ): Promise<{
      transactionHash: string;
      blockNumber: number;
      success: boolean;
    }> => {
      try {
        const response = await fetch('/api/paymaster', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'waitForUserOperation',
            userOpHash,
            timeout,
          }),
        });

        if (!response.ok) throw new Error('Failed to wait for confirmation');

        const data = await response.json();
        await fetchTransactions();
        setError(null);
        return data.receipt;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        throw err;
      }
    },
    [fetchTransactions]
  );

  // Get paymaster data for sponsoring
  const getPaymasterData = useCallback(async (userOperation: any) => {
    try {
      const response = await fetch('/api/paymaster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getPaymasterData',
          userOperation,
        }),
      });

      if (!response.ok) throw new Error('Failed to get paymaster data');

      const data = await response.json();
      return data.paymasterData;
    } catch (err) {
      console.error('Failed to get paymaster data:', err);
      throw err;
    }
  }, []);

  // Estimate gas for user operation
  const estimateGas = useCallback(async (userOperation: any) => {
    try {
      const response = await fetch('/api/paymaster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'estimateUserOperationGas',
          userOperation,
        }),
      });

      if (!response.ok) throw new Error('Failed to estimate gas');

      const data = await response.json();
      return data.gasEstimate;
    } catch (err) {
      console.error('Failed to estimate gas:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    if (userAddress) {
      fetchTransactions();
      fetchTotalGasSponsored();
    }
  }, [userAddress, fetchTransactions, fetchTotalGasSponsored]);

  return {
    transactions,
    totalGasSponsored,
    isLoading,
    error,
    checkQualification,
    fetchTransactions,
    fetchTotalGasSponsored,
    executeGaslessProfileEdit,
    executeGaslessBadgeMint,
    submitUserOperation,
    waitForConfirmation,
    getPaymasterData,
    estimateGas,
  };
}

/**
 * Hook for gasless stats (admin/analytics)
 */
export function useGaslessStats() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/paymaster?action=getGaslessStats');
      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      setStats(data.stats);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    fetchStats,
  };
}
