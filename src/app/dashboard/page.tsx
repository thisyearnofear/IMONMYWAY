/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@/hooks/useWallet';
import type { AgentCommitmentState, AgentConfig } from '@/services/contractService';
import { somniaReactivity, type AgentActivityEvent } from '@/lib/somnia-reactivity';
import { useNotifications } from '@/lib/notifications';
import { Card, CardContent, DataPanel, DataRow } from '@/components/ui/PremiumCard';
import { Button, LoadingSpinner } from '@/components/ui/PremiumButton';
import { AgentDecisionTimeline } from '@/components/agent/AgentDecisionTimeline';
import { AgentStatusView } from '@/components/agent/AgentStatusView';
import { AgentSocialFeed } from '@/components/agent/AgentSocialFeed';
import { OnboardingTooltip } from '@/components/ui/OnboardingTooltip';
import { getContractAddresses, getNetworkConfig } from '@/contracts/addresses';

const AGENT_ADDRESS = getContractAddresses().PunctualityAgent;

const now = Math.floor(Date.now() / 1000);

const DEMO_CONFIG: AgentConfig = {
  maxStake: '10',
  minReputation: BigInt(5000),
  autoAcceptProposals: true,
  autoPostSocial: true,
  personality: 'Motivational coach — encouraging, data-driven, celebrates small wins',
};

const DEMO_DECISIONS: AgentActivityEvent[] = [
  { type: 'commitment_created' as const, commitmentId: '0x7f3a8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f', timestamp: now - 3600, data: { principal: '0x1234567890abcdef1234567890abcdef12345678', pace: '390', reasoning: 'LLM chose pace: 390 sec/km, deadline in 2340 seconds' } },
  { type: 'decision' as const, commitmentId: '0x7f3a8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f', timestamp: now - 3500, data: { requestId: '42', requestType: 0, decision: 'Pace optimized for reputation 7200/10000' } },
  { type: 'commitment_settled' as const, commitmentId: '0x7f3a8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f', timestamp: now - 1800, data: { success: true, reasoning: 'On time — arrived 4 min early' } },
  { type: 'decision' as const, commitmentId: '0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1', timestamp: now - 900, data: { requestId: '43', requestType: 1, decision: 'Traffic delay: 180 seconds' } },
  { type: 'commitment_created' as const, commitmentId: '0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1', timestamp: now - 600, data: { principal: '0x1234567890abcdef1234567890abcdef12345678', pace: '420', reasoning: 'LLM chose pace: 420 sec/km, conservative for rain' } },
];

const DEMO_SOCIAL: AgentActivityEvent[] = [
  { type: 'social_update' as const, commitmentId: '0x7f3a8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f', timestamp: now - 3600, data: { eventType: 'commitment_created', message: 'Agent deployed! Staking 10 STT on a 5km run to the office. Pace: 6:30/km. Let\'s go! #IMONMYWAY' } },
  { type: 'social_update' as const, commitmentId: '0x7f3a8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f', timestamp: now - 1800, data: { eventType: 'arrived_on_time', message: 'Arrived 4 minutes early! Stake returned + 3 STT from bettors who doubted. Reputation climbing. #PunctualityPays' } },
  { type: 'social_update' as const, commitmentId: '0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1', timestamp: now - 600, data: { eventType: 'commitment_created', message: 'New commitment live: 3km walk in the rain. Playing it safe at 7:00/km. Weather-adjusted and reputation-aware. #SmartAgent' } },
];

const DEMO_ACTIVITY: AgentActivityEvent[] = [
  ...DEMO_DECISIONS,
  ...DEMO_SOCIAL,
  { type: 'social_update' as const, commitmentId: '0x7f3a8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f', timestamp: now - 2400, data: { eventType: 'halfway_check', message: 'Halfway there — 2.5km covered, on pace.' } },
  { type: 'decision' as const, commitmentId: '0x7f3a8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f', timestamp: now - 2000, data: { requestId: '44', requestType: 3, decision: 'Social update posted: halfway milestone' } },
].sort((a, b) => b.timestamp - a.timestamp);

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

  const loadAgentData = useCallback(async () => {
    if (!address || !AGENT_ADDRESS) return;
    setIsLoading(true);
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

        const count = await service.getActiveCommitmentCount(address);
        // For now, show count only — full commitment list will come from events

        const rep = await service.getUserReputation(address);
        setReputationScore(Number(rep));
      }
    } catch (err) {
      console.error('Failed to load agent data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (address) loadAgentData();
  }, [address, loadAgentData]);

  // Connect to Somnia reactivity for real-time events
  useEffect(() => {
    if (!AGENT_ADDRESS || !isAuthorized) return;

    somniaReactivity.connect(AGENT_ADDRESS);
    setReactivityConnected(true);

    const unsubscribe = somniaReactivity.onActivity((event) => {
      setActivityLog(prev => [event, ...prev].slice(0, 100));

      if (event.type === 'social_update') {
        setSocialPosts(prev => [event, ...prev].slice(0, 50));
      }
      if (event.type === 'decision' || event.type === 'commitment_created' || event.type === 'commitment_settled') {
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
      unsubscribe();
      somniaReactivity.disconnect();
    };
  }, [isAuthorized]);

  const networkConfig = getNetworkConfig();
  const isDemo = !isConnected;

  const displayConfig = isDemo ? DEMO_CONFIG : agentConfig;
  const displayDecisions = isDemo ? DEMO_DECISIONS : decisions;
  const displaySocial = isDemo ? DEMO_SOCIAL : socialPosts;
  const displayActivity = isDemo ? DEMO_ACTIVITY : activityLog;
  const displayBalance = isDemo ? '35' : agentBalance;
  const displayReputation = isDemo ? 7200 : reputationScore;

  if (!isDemo && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" color="purple" />
          <p className="text-white/60 text-sm">Loading agent state...</p>
        </div>
      </div>
    );
  }

  if (!isDemo && !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card variant="enhanced">
          <CardContent className="text-center py-12 px-16">
            <div className="text-4xl mb-4">⚙️</div>
            <h2 className="text-xl font-bold mb-2">No Active Agent</h2>
            <p className="text-white/60 mb-6 text-sm">Configure and authorize your agent first</p>
            <a
              href="/setup"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gold/20 border border-gold/40 rounded-lg text-sm text-white hover:bg-gold/30 transition-all"
            >
              Go to Setup →
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      {isDemo && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-violet-600/20 via-gold-500/10 to-violet-600/20 border-b border-violet-500/30 px-4 py-3"
        >
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 bg-violet-500/30 border border-violet-400/40 rounded text-[10px] font-mono uppercase tracking-wider text-violet-300">
                Demo
              </span>
              <p className="text-sm text-white/70">
                You&apos;re viewing a simulated agent. Connect your wallet to deploy your own.
              </p>
            </div>
            <Button onClick={connect} variant="primary" size="sm">
              Connect Wallet
            </Button>
          </div>
        </motion.div>
      )}

      {!isDemo && (
        <OnboardingTooltip
          id="dashboard-intro"
          message="This is your agent's brain. Watch its reasoning, commitment decisions, and social posts in real-time. Your agent operates fully autonomously."
        />
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
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gold via-violet to-gold bg-clip-text text-transparent">
                Agent Dashboard
              </h1>
              <p className="text-white/50 text-sm mt-1">
                Spectator view — your agent operates autonomously
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isDemo ? 'bg-amber-400' : reactivityConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
              <span className={`text-xs font-mono ${isDemo ? 'text-amber-400' : reactivityConnected ? 'text-green-400' : 'text-gray-400'}`}>
                {isDemo ? 'DEMO' : reactivityConnected ? 'LIVE' : 'DISCONNECTED'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <AgentStatusView
              config={displayConfig}
              balance={displayBalance}
              networkName={networkConfig.name}
              currency={networkConfig.nativeCurrency.symbol}
              reputationScore={displayReputation}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="md:col-span-2"
          >
            <AgentDecisionTimeline decisions={displayDecisions} />
          </motion.div>
        </div>

        {/* Social Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <AgentSocialFeed posts={displaySocial} />
        </motion.div>

        {/* Raw Activity Log */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-6"
        >
          <DataPanel title="Activity Log" status={isDemo ? 'offline' : reactivityConnected ? 'online' : 'offline'}>
            {displayActivity.length === 0 ? (
              <p className="text-white/40 text-xs font-mono py-4 text-center">
                Waiting for agent activity...
              </p>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-1">
                {displayActivity.map((event, i) => (
                  <div key={i} className="flex items-start gap-2 py-1.5 border-b border-white/5 last:border-0">
                    <span className="text-[10px] font-mono text-white/30 whitespace-nowrap mt-0.5">
                      {new Date(event.timestamp * 1000).toLocaleTimeString()}
                    </span>
                    <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                      event.type === 'decision' ? 'bg-blue-500/20 text-blue-400' :
                      event.type === 'commitment_created' ? 'bg-green-500/20 text-green-400' :
                      event.type === 'commitment_settled' ? 'bg-purple-500/20 text-purple-400' :
                      event.type === 'social_update' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-white/10 text-white/60'
                    }`}>
                      {event.type.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-white/70 truncate flex-1">
                      {event.data.reasoning || event.data.message || event.data.decision || event.commitmentId.slice(0, 10)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </DataPanel>
        </motion.div>
      </div>
    </div>
  );
}
