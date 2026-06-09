// Somnia Reactivity Service — real-time on-chain event streaming
// Uses WebSocket subscriptions to stream agent activity to the frontend

import { getNetworkConfig } from '@/contracts/addresses';
import { AGENT_ABI, REGISTRY_ABI } from '@/lib/contracts';
import { ethers } from 'ethers';

export interface AgentActivityEvent {
  type: 'decision' | 'commitment_created' | 'commitment_settled' | 'social_update' | 'deadline_check' | 'proposal_handled';
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
  private contract: ethers.Contract | null = null;

  /**
   * Connect to Somnia WebSocket and subscribe to agent contract events
   */
  async connect(agentContractAddress: string): Promise<void> {
    const config = getNetworkConfig();
    const wsUrl = config.wsUrl;

    if (!wsUrl) {
      console.warn('WebSocket URL not configured — falling back to polling');
      return;
    }

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

  /**
   * Subscribe to agent contract events via eth_subscribe
   */
  private subscribe(contractAddress: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    // Subscribe to all logs from the agent contract
    const subscribeMsg = {
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_subscribe',
      params: [
        'logs',
        {
          address: contractAddress,
          topics: [], // all events
        },
      ],
    };

    this.ws.send(JSON.stringify(subscribeMsg));
  }

  /**
   * Handle incoming subscription events and dispatch to callbacks
   */
  private handleSubscriptionEvent(params: any): void {
    if (!params?.result) return;

    const log = params.result;
    const config = getNetworkConfig();

    // Parse the log using the agent ABI
    try {
      const iface = new ethers.Interface(AGENT_ABI);
      const parsed = iface.parseLog({
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

  /**
   * Map a parsed Solidity event to our frontend event type
   */
  private mapParsedEvent(parsed: ethers.LogDescription, log: any): AgentActivityEvent | null {
    const timestamp = Math.floor(Date.now() / 1000); // WebSocket doesn't give block timestamp

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

  /**
   * Register a callback for agent activity events
   */
  onActivity(callback: ActivityCallback): () => void {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Attempt reconnection with exponential backoff
   */
  private attemptReconnect(contractAddress: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    setTimeout(() => this.connect(contractAddress), delay);
  }

  /**
   * Disconnect and clean up
   */
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
}

export const somniaReactivity = new SomniaReactivityService();
