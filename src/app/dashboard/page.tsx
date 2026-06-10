/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useWallet } from '@/hooks/useWallet';
import type { AgentCommitmentState, AgentConfig } from '@/services/contractService';
import { somniaReactivity, type AgentActivityEvent } from '@/lib/somnia-reactivity';
import { useNotifications } from '@/lib/notifications';
import { DataPanel } from '@/components/ui/PremiumCard';
import { Button, LoadingSpinner } from '@/components/ui/PremiumButton';
import { AgentDecisionTimeline } from '@/components/agent/AgentDecisionTimeline';
import { AgentStatusView } from '@/components/agent/AgentStatusView';
import { AgentSocialFeed } from '@/components/agent/AgentSocialFeed';
import { OnboardingTooltip } from '@/components/ui/OnboardingTooltip';
import { getContractAddresses, getNetworkConfig } from '@/contracts/addresses';
import { DEMO_EVENTS, DEMO_AGENT, DEMO_TXNS } from '@/lib/demo-data';

const AGENT_ADDRESS = getContractAddresses().PunctualityAgent;

export default function AgentDashboardPage() {
  const { address, isConnected, connect } = useWallet();
  const { notifyCommitmentCreated, notifySettled } = useNotifications();

  const notifyRef = useRef({ notifyCommitmentCreated, notifySettled });
  useEffect(() => {
    notifyRef.current = { notifyCommitmentCreated, notifySettled };
  });
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null);
  const [activeCommitments, setActiveCommitments] = useState<string[]>([]);
  const [commitmentStates, setCommitmentStates] = useState<AgentCommitmentState[]>([]);
  const [activityLog, setActivityLog] = useState<AgentActivityEvent[]>([]);
  const [socialPosts, setSocialPosts] = useState<AgentActivityEvent[]>([]);
  const [decisions, setDecisions] = useState<AgentActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reactivityConnected, setReactivityConnected] = useState(false);
  const [agentBalance, setAgentBalance] = useState<string>('0');
  const [reputationScore, setReputationScore] = useState<number>(0);
  const [lastEventTime, setLastEventTime] = useState<number>(0);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  // ── Read-only spectator: query historical events + stream live ──

  useEffect(() => {
    // No agent deployed on this network — show demo data instead of
    // hanging on "Loading agent state..." forever.
    if (!AGENT_ADDRESS) {
      setActivityLog(DEMO_EVENTS);
      setDecisions(DEMO_EVENTS);
      setIsDemo(true);
      setHistoryLoaded(true);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const init = async () => {
      const [{ ethers }] = await Promise.all([import('ethers')]);
      const provider = new ethers.JsonRpcProvider(getNetworkConfig().rpcUrl);

      const history = await somniaReactivity.queryHistory(provider, AGENT_ADDRESS, { limit: 100 });
      if (cancelled) return;

      const hasLive = history.length > 0;
      if (hasLive) {
        setActivityLog(history);
          setDecisions(history.filter(e => e.type === 'decision' || e.type === 'commitment_created' || e.type === 'commitment_settled' || e.type === 'system').slice(0, 50));
        setSocialPosts(history.filter(e => e.type === 'social_update').slice(0, 50));
        setLastEventTime(Date.now());
      } else {
        setActivityLog(DEMO_EVENTS);
        setDecisions(DEMO_EVENTS);
        setIsDemo(true);
      }
      setHistoryLoaded(true);
      setIsLoading(false);

      // Start WebSocket for live events (wallet not required — read-only)
      somniaReactivity.connect(AGENT_ADDRESS);
      setReactivityConnected(true);
    };

    init();

    const unsubscribeLive = somniaReactivity.onActivity((event) => {
      setActivityLog(prev => [event, ...prev].slice(0, 100));
      setLastEventTime(Date.now());

      if (event.type === 'social_update') {
        setSocialPosts(prev => [event, ...prev].slice(0, 50));
      }
      if (event.type === 'decision' || event.type === 'commitment_created' || event.type === 'commitment_settled' || event.type === 'system') {
        setDecisions(prev => [event, ...prev].slice(0, 50));
      }
      if (event.type === 'commitment_created') {
        notifyRef.current.notifyCommitmentCreated(event.commitmentId, event.data.pace || '0');
      }
      if (event.type === 'commitment_settled') {
        notifyRef.current.notifySettled(event.commitmentId, !!event.data.success);
      }
    });

    return () => {
      cancelled = true;
      unsubscribeLive();
      somniaReactivity.disconnect();
    };
  }, []);

  // ── Wallet-connected: load personal agent config ──

  const loadAgentData = useCallback(async () => {
    if (!address || !AGENT_ADDRESS) return;
    try {
      const [{ ethers }, { ContractService }] = await Promise.all([
        import('ethers'),
        import('@/services/contractService'),
      ]);
      const service = new ContractService();
      const authed = await service.isAgentAuthorized(address);
      setIsAuthorized(authed);

      if (authed) {
        const cfg = await service.getAgentConfig(address);
        setAgentConfig(cfg);

        const deposit = await service.getAgentDeposit();
        setAgentBalance(ethers.formatEther(deposit));

        const rep = await service.getUserReputation(address);
        setReputationScore(Number(rep));
      }
    } catch (err) {
      console.error('Failed to load agent data:', err);
    }
  }, [address]);

  useEffect(() => {
    if (address) loadAgentData();
  }, [address, loadAgentData]);

  const networkConfig = getNetworkConfig();
  const isSpectator = !historyLoaded;
  const hasActivity = activityLog.length > 0;

  if (isSpectator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" color="violet" />
          <p className="text-white/60 text-sm">Loading agent state...</p>
        </div>
      </div>
    );
  }

  if (isConnected && !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full border border-violet-500/30 flex items-center justify-center" style={{ background: 'radial-gradient(circle, rgba(110,43,242,0.15) 0%, transparent 70%)' }}>
            <span className="text-2xl">⚙️</span>
          </div>
          <h2 className="text-xl font-bold mb-2">No Active Agent</h2>
          <p className="text-white/70 mb-8 text-sm">Configure and authorize your agent first</p>
          <a
            href="/setup"
            className="inline-flex items-center gap-2 px-6 py-3 border border-gold-500/40 rounded-lg text-sm text-gold-500 hover:bg-gold-500/10 transition-all font-mono"
          >
            Go to Setup →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      {!isConnected && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-violet-600/20 via-gold-500/10 to-violet-600/20 border-b border-violet-500/30 px-4 py-3"
        >
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className={`px-2 py-0.5 border rounded text-[10px] font-mono uppercase tracking-wider ${
                hasActivity
                  ? 'bg-green-500/30 border-green-400/40 text-green-300'
                  : isDemo
                  ? 'bg-gold-500/20 border-gold-400/30 text-gold-400'
                  : 'bg-violet-500/30 border-violet-400/40 text-violet-300'
              }`}>
                {hasActivity ? 'Live' : isDemo ? 'Demo' : 'Spectator'}
              </span>
              <p className="text-sm text-white/70">
                {hasActivity
                  ? 'Viewing live agent activity from the contract. Connect to deploy your own.'
                  : isDemo
                  ? 'Live agent idle — showing proven on-chain demo. '
                  : 'No on-chain activity yet. Connect your wallet to deploy an agent.'}
                {isDemo && (
                  <div className="flex items-center gap-2">
                    <a href={DEMO_TXNS.deploy} target="_blank" rel="noopener noreferrer" className="text-gold-500 underline hover:text-gold-400 text-xs">
                      Deploy →
                    </a>
                    <span className="text-white/30">|</span>
                    <a href={DEMO_TXNS.callback} target="_blank" rel="noopener noreferrer" className="text-gold-500 underline hover:text-gold-400 text-xs">
                      LLM Callback →
                    </a>
                  </div>
                )}
              </p>
            </div>
            <Button onClick={connect} variant="primary" size="sm">
              Connect Wallet
            </Button>
          </div>
        </motion.div>
      )}

      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-gold via-violet to-gold bg-clip-text text-transparent">
                Agent Dashboard
              </h1>
              <p className="text-white/70 text-sm mt-1">
                {isConnected && isAuthorized
                  ? 'Your agent operates autonomously'
                  : 'Live on-chain agent activity'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <motion.div
                key={lastEventTime}
                className={`w-2 h-2 rounded-full ${reactivityConnected ? (hasActivity ? 'bg-green-400' : 'bg-amber-400') : 'bg-gray-400'}`}
                initial={{ boxShadow: '0 0 0 0 rgba(234,196,108,0)' }}
                animate={{ boxShadow: ['0 0 0 0 rgba(234,196,108,0)', '0 0 8px 2px rgba(234,196,108,0.6)', '0 0 0 0 rgba(234,196,108,0)'] }}
                transition={{ duration: 0.6 }}
              />
              <span className={`text-xs font-mono ${reactivityConnected ? (hasActivity ? 'text-green-400' : 'text-amber-400') : 'text-gray-400'}`}>
                {reactivityConnected ? (hasActivity ? 'LIVE' : 'STANDBY') : 'DISCONNECTED'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <AgentStatusView
              config={agentConfig}
              balance={agentBalance}
              networkName={networkConfig.name}
              currency={networkConfig.nativeCurrency.symbol}
              reputationScore={reputationScore}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="md:col-span-2"
          >
            <AgentDecisionTimeline decisions={decisions} />
          </motion.div>
        </div>

        {/* Divider */}
        <div className="px-4 py-2">
          <div className="divider divider-gold">
            <div className="line" />
            <div className="dot" />
            <div className="line" />
          </div>
        </div>

        {/* Social Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="section-zone-gold rounded-xl"
        >
          <AgentSocialFeed posts={socialPosts} />
        </motion.div>

        {/* Divider */}
        <div className="px-4 py-2">
          <div className="divider">
            <div className="line" />
            <div className="dot" />
            <div className="line" />
          </div>
        </div>

        {/* Raw Activity Log */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="section-zone-violet rounded-xl"
        >
          <DataPanel title="Activity Log" status={reactivityConnected ? 'online' : 'offline'}>
            {activityLog.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-white/60 text-xs font-mono mb-3">
                  No on-chain activity yet
                </p>
                <p className="text-white/40 text-[10px] font-mono mb-4">
                  Deploy an agent from the Setup page to see decisions, commitments, and social posts appear here in real-time.
                </p>
                <Link href="https://www.youtube.com/watch?v=demo">
                  <Button variant="outline" size="sm">
                    {isConnected ? 'Deploy Your Agent →' : 'Watch Demo Video →'}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-1">
                {activityLog.map((event, i) => {
                  const isSettlement = event.type === 'commitment_settled';
                  const isSuccess = isSettlement && event.data.success;
                  return (
                    <motion.div
                      key={`${event.commitmentId}-${event.timestamp}-${i}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`flex items-start gap-2 py-1.5 border-b border-white/5 last:border-0 ${
                        isSettlement ? (isSuccess ? 'bg-gold-500/5' : 'bg-red-500/5') : ''
                      }`}
                    >
                      <span className="text-[10px] font-mono text-white/50 whitespace-nowrap mt-0.5">
                        {new Date(event.timestamp * 1000).toLocaleTimeString()}
                      </span>
                      <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                        event.type === 'decision' ? 'bg-violet-500/20 text-violet-400' :
                        event.type === 'commitment_created' ? 'bg-green-500/20 text-green-400' :
                        isSettlement ? (isSuccess ? 'bg-gold-500/20 text-gold-500' : 'bg-red-500/20 text-red-400') :
                        event.type === 'social_update' ? 'bg-gold-500/15 text-gold-400' :
                        event.type === 'system' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-white/10 text-white/60'
                      }`}>
                        {event.type.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-white/70 truncate flex-1 font-mono">
                        {event.data.reasoning || event.data.message || event.data.decision || event.commitmentId.slice(0, 10)}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </DataPanel>
        </motion.div>
      </div>
    </div>
  );
}
