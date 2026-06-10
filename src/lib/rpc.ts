import { getNetworkConfig, getContractAddresses } from '@/contracts/addresses';

type JsonRpcResponse = { result?: unknown; error?: { message: string } };

export async function rpcCall<T = unknown>(method: string, params: unknown[]): Promise<T | null> {
  const url = getNetworkConfig().rpcUrl;
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 10_000);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method,
        params,
      }),
    });
    clearTimeout(id);
    const data: JsonRpcResponse = await res.json();
    if (data.error) {
      console.warn(`RPC error (${method}):`, data.error.message);
      return null;
    }
    return data.result as T;
  } catch (err) {
    console.warn(`RPC call failed (${method}):`, err);
    return null;
  }
}

export interface AgentStatus {
  balance: string;
  commitments: number;
}

function encodeAddress(addr: string): string {
  const stripped = addr.replace('0x', '').toLowerCase();
  const padded = stripped.padStart(64, '0');
  return '0x' + padded;
}

const AGENT_ADDRESS = getContractAddresses().PunctualityAgent;
const ACTIVE_COMMITMENT_COUNT_SIG = '0xe64f2e9a';

export async function fetchAgentStatus(): Promise<AgentStatus> {
  const balanceHex = await rpcCall<string>('eth_getBalance', [AGENT_ADDRESS, 'latest']);
  const balanceWei = balanceHex ? BigInt(balanceHex) : BigInt(0);

  const deployerAddress = '0x437D081d1Cfa5e5E30FE8E364f84b25904c8ebAc';
  const countData = ACTIVE_COMMITMENT_COUNT_SIG + encodeAddress(deployerAddress).slice(2);
  const countHex = await rpcCall<string>('eth_call', [{ to: AGENT_ADDRESS, data: countData }, 'latest']);
  const commitments = countHex ? Number(BigInt(countHex)) : 0;

  const balanceNum = Number(balanceWei) / 1e18;
  return {
    balance: balanceNum > 0 ? balanceNum.toFixed(1) + ' STT' : 'Unknown',
    commitments,
  };
}
