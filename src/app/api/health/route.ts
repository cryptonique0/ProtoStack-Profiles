import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

interface ServiceStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  latency?: number;
  message?: string;
}

interface BlockchainStatus extends ServiceStatus {
  blockNumber?: number;
  chainId?: number;
  gasPrice?: string;
}

interface ContractStatus extends ServiceStatus {
  address?: string;
  totalProfiles?: number;
}

interface EventLoopStatus {
  lag: number;
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
}

interface ZKProverStatus extends ServiceStatus {
  proverType?: 'snark' | 'stark' | 'plonk' | 'groth16' | 'unknown';
  version?: string;
  supportedCircuits?: string[];
}

interface ZKVerifierStatus extends ServiceStatus {
  contractAddress?: string;
  verificationsCount?: number;
}

interface ZKServicesStatus {
  prover?: ZKProverStatus;
  verifier?: ZKVerifierStatus;
  relayer?: ServiceStatus;
}

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  environment: string | undefined;
  version: string;
  services: {
    database: ServiceStatus;
    ipfs?: ServiceStatus;
    blockchain?: BlockchainStatus;
    contracts?: {
      profileRegistry?: ContractStatus;
    };
    zk?: ZKServicesStatus;
  };
  system: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      loadAverage: number[];
    };
    eventLoop?: EventLoopStatus;
  };
}

async function checkDatabaseHealth(): Promise<ServiceStatus> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      status: 'unhealthy',
      message: 'Database configuration missing',
    };
  }

  try {
    const startTime = Date.now();
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    // Simple query to check database connectivity
    const { error } = await supabase.from('profiles').select('id').limit(1);
    const latency = Date.now() - startTime;

    if (error) {
      // Check if it's just an empty table vs actual error
      if (error.code === 'PGRST116') {
        return { status: 'healthy', latency, message: 'Connected (no data)' };
      }
      return {
        status: 'unhealthy',
        latency,
        message: error.message,
      };
    }

    return {
      status: latency > 1000 ? 'degraded' : 'healthy',
      latency,
      message: latency > 1000 ? 'High latency detected' : undefined,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown database error',
    };
  }
}

async function checkIPFSHealth(): Promise<ServiceStatus> {
  const ipfsGateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io';

  try {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${ipfsGateway}/api/v0/version`, {
      method: 'POST',
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timeoutId);
    const latency = Date.now() - startTime;

    // If the gateway doesn't support the version endpoint, try a simple fetch
    if (!response || !response.ok) {
      // IPFS public gateways don't expose /api/v0, so just check if gateway is reachable
      const gatewayCheck = await fetch(ipfsGateway, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      }).catch(() => null);

      if (gatewayCheck) {
        return {
          status: 'healthy',
          latency,
          message: 'Gateway reachable',
        };
      }

      return {
        status: 'degraded',
        latency,
        message: 'IPFS gateway may be unavailable',
      };
    }

    return {
      status: latency > 2000 ? 'degraded' : 'healthy',
      latency,
    };
  } catch (error) {
    return {
      status: 'degraded',
      message: error instanceof Error ? error.message : 'IPFS check failed',
    };
  }
}

// ============ Blockchain RPC Health Check ============
async function checkBlockchainHealth(): Promise<BlockchainStatus> {
  // Get RPC URL from environment - prioritize custom RPC, fallback to Alchemy
  const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
  const customRpcUrl = process.env.NEXT_PUBLIC_RPC_URL;

  const rpcUrl =
    customRpcUrl || (alchemyKey ? `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}` : null);

  if (!rpcUrl) {
    return {
      status: 'degraded',
      message: 'No RPC URL configured, using public endpoint',
    };
  }

  try {
    const startTime = Date.now();

    // Batch RPC calls for efficiency
    const batchRequest = [
      { jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 },
      { jsonrpc: '2.0', method: 'eth_chainId', params: [], id: 2 },
      { jsonrpc: '2.0', method: 'eth_gasPrice', params: [], id: 3 },
    ];

    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batchRequest),
      signal: AbortSignal.timeout(10000),
    });

    const latency = Date.now() - startTime;

    if (!response.ok) {
      return {
        status: 'unhealthy',
        latency,
        message: `RPC returned ${response.status}`,
      };
    }

    const results = await response.json();

    // Parse results (handle both array and single response)
    const resultsArray = Array.isArray(results) ? results : [results];
    const blockNumberResult = resultsArray.find((r: { id: number }) => r.id === 1);
    const chainIdResult = resultsArray.find((r: { id: number }) => r.id === 2);
    const gasPriceResult = resultsArray.find((r: { id: number }) => r.id === 3);

    const blockNumber = blockNumberResult?.result
      ? parseInt(blockNumberResult.result, 16)
      : undefined;
    const chainId = chainIdResult?.result ? parseInt(chainIdResult.result, 16) : undefined;
    const gasPrice = gasPriceResult?.result
      ? `${(parseInt(gasPriceResult.result, 16) / 1e9).toFixed(2)} gwei`
      : undefined;

    return {
      status: latency > 3000 ? 'degraded' : 'healthy',
      latency,
      blockNumber,
      chainId,
      gasPrice,
      message: latency > 3000 ? 'High RPC latency' : undefined,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'RPC connection failed',
    };
  }
}

// ============ Smart Contract Health Check ============
async function checkContractHealth(): Promise<{ profileRegistry: ContractStatus }> {
  const contractAddress = process.env.NEXT_PUBLIC_PROFILE_REGISTRY_ADDRESS;
  const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
  const customRpcUrl = process.env.NEXT_PUBLIC_RPC_URL;

  const rpcUrl =
    customRpcUrl || (alchemyKey ? `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}` : null);

  if (!contractAddress) {
    return {
      profileRegistry: {
        status: 'degraded',
        message: 'Contract address not configured',
      },
    };
  }

  if (!rpcUrl) {
    return {
      profileRegistry: {
        status: 'degraded',
        address: contractAddress,
        message: 'No RPC URL for contract check',
      },
    };
  }

  try {
    const startTime = Date.now();

    // Check if contract exists by getting code at address
    const codeCheckRequest = {
      jsonrpc: '2.0',
      method: 'eth_getCode',
      params: [contractAddress, 'latest'],
      id: 1,
    };

    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(codeCheckRequest),
      signal: AbortSignal.timeout(10000),
    });

    const latency = Date.now() - startTime;

    if (!response.ok) {
      return {
        profileRegistry: {
          status: 'unhealthy',
          address: contractAddress,
          latency,
          message: 'Failed to query contract',
        },
      };
    }

    const result = await response.json();
    const code = result.result;

    // Check if contract has code (not just '0x')
    if (!code || code === '0x' || code === '0x0') {
      return {
        profileRegistry: {
          status: 'unhealthy',
          address: contractAddress,
          latency,
          message: 'No contract deployed at address',
        },
      };
    }

    // Try to call totalProfiles() or a similar view function
    // Function selector for common count functions
    // profileAddresses.length or similar - we'll try to get array length
    // keccak256("getProfileCount()") first 4 bytes would be the selector
    // For simplicity, we just verify contract exists

    return {
      profileRegistry: {
        status: latency > 2000 ? 'degraded' : 'healthy',
        address: contractAddress,
        latency,
        message: latency > 2000 ? 'High latency' : 'Contract accessible',
      },
    };
  } catch (error) {
    return {
      profileRegistry: {
        status: 'unhealthy',
        address: contractAddress,
        message: error instanceof Error ? error.message : 'Contract check failed',
      },
    };
  }
}

// ============ Zero Knowledge (ZK) Services Health Check ============
async function checkZKServicesHealth(): Promise<ZKServicesStatus> {
  const zkProverUrl = process.env.NEXT_PUBLIC_ZK_PROVER_URL || process.env.ZK_PROVER_URL;
  const zkVerifierAddress = process.env.NEXT_PUBLIC_ZK_VERIFIER_ADDRESS;
  const zkRelayerUrl = process.env.NEXT_PUBLIC_ZK_RELAYER_URL || process.env.ZK_RELAYER_URL;

  const results: ZKServicesStatus = {};

  // Check ZK Prover Service (e.g., Sindri, RapidSnark, custom prover)
  if (zkProverUrl) {
    results.prover = await checkZKProver(zkProverUrl);
  }

  // Check ZK Verifier Contract
  if (zkVerifierAddress) {
    results.verifier = await checkZKVerifier(zkVerifierAddress);
  }

  // Check ZK Relayer Service (for gasless ZK transactions)
  if (zkRelayerUrl) {
    results.relayer = await checkZKRelayer(zkRelayerUrl);
  }

  // If no ZK services configured, return degraded status with info message
  if (Object.keys(results).length === 0) {
    results.prover = {
      status: 'degraded',
      message: 'No ZK services configured',
    };
  }

  return results;
}

async function checkZKProver(proverUrl: string): Promise<ZKProverStatus> {
  try {
    const startTime = Date.now();

    // Try common ZK prover health endpoints
    const healthEndpoints = ['/health', '/api/health', '/api/v1/health', '/status', '/api/status'];

    let response: Response | null = null;
    let workingEndpoint = '';

    for (const endpoint of healthEndpoints) {
      try {
        response = await fetch(`${proverUrl}${endpoint}`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });
        if (response.ok) {
          workingEndpoint = endpoint;
          break;
        }
      } catch {
        continue;
      }
    }

    const latency = Date.now() - startTime;

    if (!response || !response.ok) {
      // Try a simple connectivity check
      try {
        const basicCheck = await fetch(proverUrl, {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000),
        });
        if (basicCheck) {
          return {
            status: 'degraded',
            latency,
            message: 'Prover reachable but health endpoint unavailable',
          };
        }
      } catch {
        // Prover not reachable
      }

      return {
        status: 'unhealthy',
        latency,
        message: 'ZK Prover service unreachable',
      };
    }

    // Try to parse prover info from response
    let proverInfo: {
      type?: string;
      version?: string;
      circuits?: string[];
      prover_type?: string;
      supported_circuits?: string[];
    } = {};

    try {
      proverInfo = await response.json();
    } catch {
      // Response may not be JSON
    }

    return {
      status: latency > 5000 ? 'degraded' : 'healthy',
      latency,
      proverType: (proverInfo.type ||
        proverInfo.prover_type ||
        'unknown') as ZKProverStatus['proverType'],
      version: proverInfo.version,
      supportedCircuits: proverInfo.circuits || proverInfo.supported_circuits,
      message: latency > 5000 ? 'High prover latency' : `Connected via ${workingEndpoint}`,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'ZK Prover check failed',
    };
  }
}

async function checkZKVerifier(verifierAddress: string): Promise<ZKVerifierStatus> {
  const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
  const customRpcUrl = process.env.NEXT_PUBLIC_RPC_URL;

  const rpcUrl =
    customRpcUrl || (alchemyKey ? `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}` : null);

  if (!rpcUrl) {
    return {
      status: 'degraded',
      contractAddress: verifierAddress,
      message: 'No RPC URL for verifier check',
    };
  }

  try {
    const startTime = Date.now();

    // Check if verifier contract exists
    const codeCheckRequest = {
      jsonrpc: '2.0',
      method: 'eth_getCode',
      params: [verifierAddress, 'latest'],
      id: 1,
    };

    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(codeCheckRequest),
      signal: AbortSignal.timeout(10000),
    });

    const latency = Date.now() - startTime;

    if (!response.ok) {
      return {
        status: 'unhealthy',
        contractAddress: verifierAddress,
        latency,
        message: 'Failed to query verifier contract',
      };
    }

    const result = await response.json();
    const code = result.result;

    if (!code || code === '0x' || code === '0x0') {
      return {
        status: 'unhealthy',
        contractAddress: verifierAddress,
        latency,
        message: 'No ZK verifier contract at address',
      };
    }

    // Contract exists - try to estimate verification count (optional)
    // This would require calling a specific function on the verifier
    // For now, we just confirm the contract is deployed

    return {
      status: latency > 2000 ? 'degraded' : 'healthy',
      contractAddress: verifierAddress,
      latency,
      message: 'ZK Verifier contract accessible',
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      contractAddress: verifierAddress,
      message: error instanceof Error ? error.message : 'ZK Verifier check failed',
    };
  }
}

async function checkZKRelayer(relayerUrl: string): Promise<ServiceStatus> {
  try {
    const startTime = Date.now();

    // Try common relayer health endpoints
    const healthEndpoints = ['/health', '/api/health', '/status', '/api/v1/status', '/ready'];

    let response: Response | null = null;

    for (const endpoint of healthEndpoints) {
      try {
        response = await fetch(`${relayerUrl}${endpoint}`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });
        if (response.ok) break;
      } catch {
        continue;
      }
    }

    const latency = Date.now() - startTime;

    if (!response || !response.ok) {
      // Try basic connectivity
      try {
        await fetch(relayerUrl, {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000),
        });
        return {
          status: 'degraded',
          latency,
          message: 'Relayer reachable but health endpoint unavailable',
        };
      } catch {
        return {
          status: 'unhealthy',
          latency,
          message: 'ZK Relayer unreachable',
        };
      }
    }

    return {
      status: latency > 3000 ? 'degraded' : 'healthy',
      latency,
      message: latency > 3000 ? 'High relayer latency' : 'ZK Relayer operational',
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'ZK Relayer check failed',
    };
  }
}

// ============ Event Loop Lag Check ============
function measureEventLoopLag(): Promise<EventLoopStatus> {
  return new Promise((resolve) => {
    const start = Date.now();

    // Schedule a callback and measure how long it takes to execute
    // This indicates if the event loop is blocked
    setImmediate(() => {
      const lag = Date.now() - start;

      let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
      let message: string | undefined;

      if (lag > 100) {
        status = 'unhealthy';
        message = 'Event loop severely blocked';
      } else if (lag > 50) {
        status = 'degraded';
        message = 'Event loop experiencing delays';
      }

      resolve({
        lag,
        status,
        message,
      });
    });
  });
}

function getSystemMetrics() {
  const memUsage = process.memoryUsage();
  const totalMemory = memUsage.heapTotal;
  const usedMemory = memUsage.heapUsed;

  return {
    memory: {
      used: Math.round(usedMemory / 1024 / 1024), // MB
      total: Math.round(totalMemory / 1024 / 1024), // MB
      percentage: Math.round((usedMemory / totalMemory) * 100),
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB - Resident Set Size
      external: Math.round(memUsage.external / 1024 / 1024), // MB
    },
    cpu: {
      loadAverage:
        typeof process.cpuUsage === 'function'
          ? [process.cpuUsage().user / 1000000, process.cpuUsage().system / 1000000]
          : [0, 0],
    },
  };
}

function determineOverallStatus(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  services: Record<string, any>,
  eventLoop?: EventLoopStatus
): 'healthy' | 'unhealthy' | 'degraded' {
  const statuses: ServiceStatus[] = [];

  // Recursively collect all status objects from nested services
  function collectStatuses(obj: unknown): void {
    if (!obj || typeof obj !== 'object') return;

    if ('status' in obj && typeof (obj as ServiceStatus).status === 'string') {
      statuses.push(obj as ServiceStatus);
    }

    for (const value of Object.values(obj)) {
      if (value && typeof value === 'object') {
        collectStatuses(value);
      }
    }
  }

  collectStatuses(services);

  // Include event loop status
  if (eventLoop) {
    statuses.push({ status: eventLoop.status });
  }

  if (statuses.some((s) => s.status === 'unhealthy')) {
    return 'unhealthy';
  }
  if (statuses.some((s) => s.status === 'degraded')) {
    return 'degraded';
  }
  return 'healthy';
}

export async function GET() {
  const startTime = Date.now();

  // Run health checks in parallel
  const [
    databaseHealth,
    ipfsHealth,
    blockchainHealth,
    contractHealth,
    zkServicesHealth,
    eventLoopHealth,
  ] = await Promise.all([
    checkDatabaseHealth(),
    checkIPFSHealth(),
    checkBlockchainHealth(),
    checkContractHealth(),
    checkZKServicesHealth(),
    measureEventLoopLag(),
  ]);

  const services = {
    database: databaseHealth,
    ipfs: ipfsHealth,
    blockchain: blockchainHealth,
    contracts: contractHealth,
    zk: zkServicesHealth,
  };

  const systemMetrics = getSystemMetrics();
  const overallStatus = determineOverallStatus(services, eventLoopHealth);

  const healthCheck: HealthCheckResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    services,
    system: {
      ...systemMetrics,
      eventLoop: eventLoopHealth,
    },
  };

  const responseTime = Date.now() - startTime;

  return NextResponse.json(
    { ...healthCheck, responseTime },
    {
      status: overallStatus === 'unhealthy' ? 503 : 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}
