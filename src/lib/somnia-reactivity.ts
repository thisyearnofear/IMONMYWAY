// Somnia Reactivity Service — real-time on-chain event streaming
// Uses WebSocket subscriptions to stream agent activity to the frontend

import { getNetworkConfig } from '@/contracts/addresses';
import { AGENT_ABI } from '@/lib/contracts';
import { ethers } from 'ethers';

export interface AgentActivityEvent {
  type: 'decision' | 'commitment_created' | 'commitment_settled' | 'social_update' | 'deadline_check' | 'proposal_handled' | 'system';
  commitmentId: string;
  timestamp: number;
  data: Record<string, any>;
}

type ActivityCallback = (event: AgentActivityEvent) => void;

class SomniaReactivityService {
  private ws: WebSocket | null = null;
  private subscriptionId: string | null = null;
  private callbacks: Set<ActivityCallback> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private agentIface: ethers.Interface;
  private _lastConnectedAddress: string | null = null;

  constructor() {
    // Cache the interface once — avoids creating a new instance per message
    this.agentIface = new ethers.Interface(AGENT_ABI);
  }

  async connect(agentContractAddress: string): Promise<void> {
    const config = getNetworkConfig();
    const wsUrl = config.wsUrl;

    if (!wsUrl) {
      console.warn('WebSocket URL not configured — falling back to polling');
      return;
    }

    this._lastConnectedAddress = agentContractAddress;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('Somnia WebSocket connected');
        this.reconnectAttempts = 0;
        this.subscribe(agentContractAddress);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Capture subscription ID from the subscription response
          if (data.id === 1 && data.result) {
            this.subscriptionId = data.result;
            return;
          }

          if (data.method === 'eth_subscription') {
            this.handleSubscriptionEvent(data.params);
          }
        } catch (error) {
          console.warn('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('Somnia WebSocket disconnected');
        this.attemptReconnect(agentContractAddress);
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect to Somnia WebSocket:', error);
    }
  }

  private subscribe(contractAddress: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const subscribeMsg = {
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_subscribe',
      params: [
        'logs',
        {
          address: contractAddress,
          topics: [],
        },
      ],
    };

    this.ws.send(JSON.stringify(subscribeMsg));
  }

  private handleSubscriptionEvent(params: any): void {
    if (!params?.result) return;

    const log = params.result;

    try {
      const parsed = this.agentIface.parseLog({
        topics: log.topics,
        data: log.data,
      });

      if (!parsed) return;

      const event = this.mapParsedEvent(parsed, log);
      if (event) {
        this.callbacks.forEach(cb => cb(event));
      }
    } catch {
      // Log might be from a different contract or ABI mismatch — skip
    }
  }

  private mapParsedEvent(parsed: ethers.LogDescription, log: any): AgentActivityEvent | null {
    const timestamp = Math.floor(Date.now() / 1000);

    switch (parsed.name) {
      case 'AgentDecisionMade':
        return {
          type: 'decision',
          commitmentId: parsed.args.commitmentId,
          timestamp,
          data: {
            requestId: parsed.args.requestId.toString(),
            requestType: parsed.args.requestType,
            decision: parsed.args.decision,
          },
        };

      case 'AgentCreatedCommitment':
        return {
          type: 'commitment_created',
          commitmentId: parsed.args.commitmentId,
          timestamp,
          data: {
            principal: parsed.args.principal,
            pace: parsed.args.pace.toString(),
            reasoning: parsed.args.reasoning,
          },
        };

      case 'AgentSettledCommitment':
        return {
          type: 'commitment_settled',
          commitmentId: parsed.args.commitmentId,
          timestamp,
          data: {
            success: parsed.args.success,
            reasoning: parsed.args.reasoning,
          },
        };

      case 'AgentSocialUpdate':
        return {
          type: 'social_update',
          commitmentId: parsed.args.commitmentId,
          timestamp,
          data: {
            eventType: parsed.args.eventType,
            message: parsed.args.message,
          },
        };

      default:
        return null;
    }
  }

  onActivity(callback: ActivityCallback): () => void {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Restart the connection — resets the reconnect counter.
   * Useful when maxReconnectAttempts was exhausted.
   */
  restart(): void {
    this.disconnect();
    this.reconnectAttempts = 0;
    if (this._lastConnectedAddress) {
      this.connect(this._lastConnectedAddress);
    }
  }

  private attemptReconnect(contractAddress: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached — call restart() to retry');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    setTimeout(() => this.connect(contractAddress), delay);
  }

  disconnect(): void {
    if (this.ws) {
      if (this.subscriptionId) {
        const unsubscribeMsg = {
          jsonrpc: '2.0',
          id: 2,
          method: 'eth_unsubscribe',
          params: [this.subscriptionId],
        };
        this.ws.send(JSON.stringify(unsubscribeMsg));
      }
      this.ws.close();
      this.ws = null;
      this.subscriptionId = null;
    }
    this.callbacks.clear();
  }

  /**
   * Query historical agent events from the contract via RPC.
   * Used to seed the UI on cold mount — then the WebSocket stream takes over.
   */
  async queryHistory(
    provider: ethers.Provider,
    contractAddress: string,
    options?: { fromBlock?: number; toBlock?: number; limit?: number }
  ): Promise<AgentActivityEvent[]> {
    let latest: number;
    try {
      latest = await Promise.race([
        provider.getBlockNumber(),
        new Promise<number>(r => setTimeout(() => r(0), 5_000)),
      ]);
    } catch {
      latest = 0;
    }
    const { fromBlock = Math.max(0, latest - 100), toBlock = 'latest', limit = 50 } = options ?? {};

    const logPromise = provider.getLogs({ address: contractAddress, fromBlock, toBlock });
    let logs: ethers.Log[];
    try {
      logs = await Promise.race([
        logPromise,
        new Promise<never>((_, r) => setTimeout(() => r(new Error('getLogs timeout')), 10_000)),
      ]);
    } catch {
      return [];
    }
    const events: AgentActivityEvent[] = [];

    for (const log of logs) {
      try {
        const parsed = this.agentIface.parseLog({
          topics: log.topics as string[],
          data: log.data as string,
        });
        if (!parsed) continue;

        const event = this.mapParsedEvent(parsed, log);
        if (event) events.push(event);
      } catch {
        continue;
      }
    }

    return events
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }
}

export const somniaReactivity = new SomniaReactivityService();
