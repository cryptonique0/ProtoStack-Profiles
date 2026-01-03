// PAYMASTER examples
// Demonstrates hooks and helper flows

import React from 'react';
import { GaslessIndicator } from './src/components/monetization';
import { useGaslessStats, usePaymaster } from './src/hooks';

// 1) Gasless indicator + profile edit helper
export function GaslessProfileEditExample({ userAddress }: { userAddress: string }) {
  const { executeGaslessProfileEdit, checkQualification } = usePaymaster(userAddress);

  const onSave = async () => {
    const qualified = await checkQualification('profile_edit');
    if (!qualified?.qualifies) {
      alert('Not qualified for gasless edit');
      return;
    }
    await executeGaslessProfileEdit({ bio: 'New bio', avatarUrl: 'ipfs://avatar' });
  };

  return (
    <div>
      <GaslessIndicator userAddress={userAddress} operationType="profile_edit" />
      <button onClick={onSave}>Save Profile (Gasless)</button>
    </div>
  );
}

// 2) Gasless badge mint helper
export function GaslessBadgeMintExample({ userAddress }: { userAddress: string }) {
  const { executeGaslessBadgeMint } = usePaymaster(userAddress);

  const onMint = async () => {
    await executeGaslessBadgeMint('badge-123');
  };

  return (
    <div>
      <GaslessIndicator userAddress={userAddress} operationType="badge_mint" />
      <button onClick={onMint}>Mint Badge (Gasless)</button>
    </div>
  );
}

// 3) Custom UserOperation submission
export function CustomUserOpExample({ userAddress }: { userAddress: string }) {
  const { submitUserOperation, waitForConfirmation } = usePaymaster(userAddress);

  const onSend = async () => {
    const userOperation = {
      sender: userAddress,
      nonce: '0x0',
      initCode: '0x',
      callData: '0x',
      callGasLimit: '0x186a0',
      verificationGasLimit: '0x186a0',
      preVerificationGas: '0x5208',
      maxFeePerGas: '0x3b9aca00',
      maxPriorityFeePerGas: '0x3b9aca00',
      paymasterAndData: '0x',
      signature: '0x',
    };
    const res = await submitUserOperation(userOperation);
    if (res?.userOpHash) {
      await waitForConfirmation(res.userOpHash, 20000);
    }
  };

  return <button onClick={onSend}>Send Custom UserOperation</button>;
}

// 4) Check qualification directly
export function QualificationCheckExample({ userAddress }: { userAddress: string }) {
  const { checkQualification } = usePaymaster(userAddress);
  const [result, setResult] = React.useState<any>(null);

  const onCheck = async () => {
    const r = await checkQualification('profile_edit');
    setResult(r);
  };

  return (
    <div>
      <button onClick={onCheck}>Check Gasless Eligibility</button>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}

// 5) Admin stats view
export function GaslessStatsExample() {
  const { stats, isLoading, error } = useGaslessStats();

  if (isLoading) return <div>Loading stats...</div>;
  if (error) return <div>Error: {error}</div>;
  return (
    <div>
      <h3>Gasless Stats</h3>
      <pre>{JSON.stringify(stats, null, 2)}</pre>
    </div>
  );
}
