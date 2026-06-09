"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@/hooks/useWallet';
import { useContractService } from '@/hooks/useContractService';
import { ContractService } from '@/services/contractService';
import { Card, CardContent, DataPanel, DataRow } from '@/components/ui/PremiumCard';
import { Button, LoadingSpinner } from '@/components/ui/PremiumButton';
import { OnboardingTooltip } from '@/components/ui/OnboardingTooltip';
import { useLLM } from '@/hooks/useLLM';
import { pacePreview } from '@/lib/llm/prompts';
import { ethers } from 'ethers';
import { getContractAddresses, getNetworkConfig } from '@/contracts/addresses';

const PERSONALITY_PRESETS = [
  {
    label: 'Disciplined',
    icon: '⚡',
    tagline: 'No excuses. Time is sacred.',
    value: 'Strict and disciplined. Never compromise on deadlines. Optimize for the fastest reliable pace. If the principal has a strong reputation, push for aggressive timelines. Punctuality failures are unacceptable — prioritize consistency over comfort.',
  },
  {
    label: 'Encouraging',
    icon: '🌟',
    tagline: 'Supportive coach. Celebrate progress.',
    value: 'Supportive and encouraging. Celebrate every on-time arrival and gently push for improvement after failures. Add extra buffer time for principals with lower reputation to build confidence. Frame setbacks as learning opportunities.',
  },
  {
    label: 'Competitive',
    icon: '🔥',
    tagline: 'Winning is everything.',
    value: 'Highly competitive and results-driven. Compare the principal to top performers. Use social pressure — mention how other agents are outperforming. Optimize for maximum stake returns. Trash talk is allowed when the principal underperforms.',
  },
  {
    label: 'Philosophical',
    icon: '🧠',
    tagline: 'Time is a river.',
    value: 'Thoughtful and philosophical. View punctuality as a virtue and a reflection of character. Reference stoic principles and the value of reliability. Choose moderate paces that balance well-being with accountability.',
  },
  {
    label: 'Aggressive Commuter',
    icon: '🏎️',
    tagline: 'Always rushing. Speed first.',
    value: 'Aggressive urban commuter. Always optimize for the fastest possible arrival time. Assume the principal can run, take shortcuts, and handle high-stress situations. Minimize buffer time. Speed is the only metric that matters — comfort and safety are secondary.',
  },
  {
    label: 'Zen Walker',
    icon: '🧘',
    tagline: 'The journey matters most.',
    value: 'Mindful and unhurried. The journey matters more than the destination. Choose comfortable walking paces with generous buffer time. Prioritize the principal\'s mental well-being. If a deadline is tight, suggest adjusting expectations rather than rushing.',
  },
];

const AGENT_CONTRACT_ADDRESS = getContractAddresses().PunctualityAgent;

export default function AgentSetupPage() {
  const { address, isConnected, connect, chainId } = useWallet();
  const { service } = useContractService();
  const [config, setConfig] = useState({
    maxStake: '10',
    minReputation: '0',
    autoAcceptProposals: false,
    autoPostSocial: true,
    personality: PERSONALITY_PRESETS[0].value,
  });
  const [fundingAmount, setFundingAmount] = useState('35');
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [agentStatus, setAgentStatus] = useState<'unknown' | 'authorized' | 'not_authorized'>('unknown');
  const [existingConfig, setExistingConfig] = useState<any>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { generate, isThinking, error: llmError } = useLLM();
  const [paceResult, setPaceResult] = useState<{ pace_min_per_km: number; buffer_minutes: number; confidence: number; reasoning: string } | null>(null);

  const checkAgentStatus = useCallback(async () => {
    if (!address || !AGENT_CONTRACT_ADDRESS) return;
    setIsChecking(true);
    try {
      const provider = new ethers.JsonRpcProvider(getNetworkConfig().rpcUrl);
      const service = new ContractService();
      const isAuthed = await service.isAgentAuthorized(address);
      setAgentStatus(isAuthed ? 'authorized' : 'not_authorized');
      if (isAuthed) {
        const cfg = await service.getAgentConfig(address);
        setExistingConfig(cfg);
      }
    } catch (err) {
      console.error('Failed to check agent status:', err);
    } finally {
      setIsChecking(false);
    }
  }, [address]);

  useEffect(() => {
    if (address) checkAgentStatus();
  }, [address, checkAgentStatus]);

  const handlePreviewPace = async () => {
    setPaceResult(null);
    const messages = pacePreview(config.personality, 5000, 5);
    const response = await generate(messages);
    if (response) {
      try {
        const parsed = JSON.parse(response.content);
        setPaceResult(parsed);
      } catch {
        setPaceResult({ pace_min_per_km: 8, buffer_minutes: 10, confidence: 70, reasoning: response.content.slice(0, 100) });
      }
    }
  };

  const handleAuthorize = async () => {
    if (!service) return;
    setIsAuthorizing(true);
    setError(null);
    setTxHash(null);
    try {
      await service.authorizeAgent({
        ...config,
        minReputation: BigInt(config.minReputation),
      }, fundingAmount);
      setAgentStatus('authorized');
      setExistingConfig(config);
    } catch (err: any) {
      setError(err.reason || err.message || 'Authorization failed');
    } finally {
      setIsAuthorizing(false);
    }
  };

  const handleRevoke = async () => {
    if (!service) return;
    try {
      await service.revokeAgent();
      setAgentStatus('not_authorized');
      setExistingConfig(null);
    } catch (err: any) {
      setError(err.reason || err.message || 'Revocation failed');
    }
  };

  const hasAgentContract = AGENT_CONTRACT_ADDRESS && AGENT_CONTRACT_ADDRESS.length > 0;

  return (
    <div className="min-h-screen pb-16">
      <OnboardingTooltip
        id="setup-config"
        message="Set your agent's personality, max stake per commitment, and fund it with STT for autonomous operation. The agent handles everything after this."
      />
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gold via-violet to-gold bg-clip-text text-transparent">
            Agent Configuration
          </h1>
          <p className="text-white/60 mt-2">
            Deploy your autonomous punctuality agent on Somnia
          </p>
        </motion.div>

        {/* Contract deployment warning */}
        {!hasAgentContract && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl"
          >
            <p className="text-yellow-400 text-sm font-medium">
              Agent contract not yet deployed
            </p>
            <p className="text-yellow-400/70 text-xs mt-1">
              Run the deploy script and paste the contract address into <code className="bg-white/10 px-1 rounded">addresses.ts</code>
            </p>
          </motion.div>
        )}

        {/* Wallet Connection */}
        {!isConnected ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card variant="enhanced">
              <CardContent className="text-center py-12">
                <div className="text-4xl mb-4">🔗</div>
                <h2 className="text-xl font-bold mb-2">Connect Wallet</h2>
                <p className="text-white/60 mb-6 text-sm">
                  Connect your wallet to configure and authorize your agent
                </p>
                <Button onClick={connect} variant="primary" size="lg">
                  Connect MetaMask
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Current Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <DataPanel
                title="Agent Status"
                status={agentStatus === 'authorized' ? 'online' : agentStatus === 'not_authorized' ? 'offline' : 'warning'}
              >
                <DataRow label="Wallet" value={`${address?.slice(0, 6)}...${address?.slice(-4)}`} />
                <DataRow label="Network" value={getNetworkConfig().name} status="neutral" />
                <DataRow
                  label="Agent Status"
                  value={agentStatus === 'authorized' ? 'ACTIVE' : agentStatus === 'not_authorized' ? 'INACTIVE' : 'CHECKING...'}
                  status={agentStatus === 'authorized' ? 'success' : 'warning'}
                />
                {existingConfig && (
                  <>
                    <DataRow label="Max Stake" value={`${existingConfig.maxStake} ${getNetworkConfig().nativeCurrency.symbol}`} />
                    <DataRow label="Auto Social" value={existingConfig.autoPostSocial ? 'YES' : 'NO'} />
                    <DataRow label="Auto Proposals" value={existingConfig.autoAcceptProposals ? 'YES' : 'NO'} />
                  </>
                )}
              </DataPanel>
            </motion.div>

            {/* Configuration Form */}
            {(agentStatus === 'not_authorized' || agentStatus === 'unknown') && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card variant="enhanced">
                  <CardContent>
                    <h3 className="text-lg font-bold mb-4">Agent Parameters</h3>

                    {/* Max Stake */}
                    <div className="mb-4">
                      <label className="text-xs text-white/60 uppercase tracking-wider font-mono block mb-1">
                        Max Stake per Commitment ({getNetworkConfig().nativeCurrency.symbol})
                      </label>
                      <input
                        type="number"
                        value={config.maxStake}
                        onChange={(e) => setConfig(c => ({ ...c, maxStake: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-gold/50 focus:outline-none"
                        min="1"
                        step="1"
                      />
                    </div>

                    {/* Min Reputation */}
                    <div className="mb-4">
                      <label className="text-xs text-white/60 uppercase tracking-wider font-mono block mb-1">
                        Minimum Counterparty Reputation
                      </label>
                      <input
                        type="number"
                        value={config.minReputation}
                        onChange={(e) => setConfig(c => ({ ...c, minReputation: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-gold/50 focus:outline-none"
                        min="0"
                      />
                    </div>

                    {/* Toggles */}
                    <div className="flex gap-4 mb-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.autoAcceptProposals}
                          onChange={(e) => setConfig(c => ({ ...c, autoAcceptProposals: e.target.checked }))}
                          className="w-4 h-4 rounded bg-white/10 border-white/20 text-gold focus:ring-gold/50"
                        />
                        <span className="text-sm text-white/80">Auto-accept proposals</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.autoPostSocial}
                          onChange={(e) => setConfig(c => ({ ...c, autoPostSocial: e.target.checked }))}
                          className="w-4 h-4 rounded bg-white/10 border-white/20 text-gold focus:ring-gold/50"
                        />
                        <span className="text-sm text-white/80">Auto social posts</span>
                      </label>
                    </div>

                    {/* Personality */}
                    <div className="mb-4">
                      <label className="text-xs text-white/60 uppercase tracking-wider font-mono block mb-2">
                        Personality
                      </label>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        {PERSONALITY_PRESETS.map((preset) => (
                          <button
                            key={preset.label}
                            onClick={() => setConfig(c => ({ ...c, personality: preset.value }))}
                            className={`p-3 rounded-lg text-left transition-all ${
                              config.personality === preset.value
                                ? 'bg-gold/20 border border-gold/40 text-white'
                                : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span>{preset.icon}</span>
                              <span className="text-sm font-medium">{preset.label}</span>
                            </div>
                            <p className="text-[10px] text-white/40 leading-tight">{preset.tagline}</p>
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={config.personality}
                        onChange={(e) => setConfig(c => ({ ...c, personality: e.target.value }))}
                        rows={2}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono focus:border-gold/50 focus:outline-none"
                        placeholder="Custom personality prompt..."
                      />
                    </div>

                    {/* Pace Preview */}
                    <div className="mb-4">
                      <label className="text-xs text-white/60 uppercase tracking-wider font-mono block mb-2">
                        Pace Preview
                      </label>
                      <button
                        onClick={handlePreviewPace}
                        disabled={isThinking}
                        className="w-full px-4 py-2 bg-violet/10 border border-violet/30 rounded-lg text-sm text-violet-300 hover:bg-violet/20 transition-all disabled:opacity-50"
                      >
                        {isThinking ? 'Thinking...' : 'Preview Agent Pace Recommendation'}
                      </button>
                      {llmError && (
                        <p className="text-xs text-red-400/70 mt-1">{llmError}</p>
                      )}
                      {paceResult && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2 p-3 bg-white/5 border border-white/10 rounded-lg"
                        >
                          <div className="flex items-center gap-4 mb-1">
                            <span className="text-xs text-white/50">Pace: <span className="text-white font-mono">{paceResult.pace_min_per_km} min/km</span></span>
                            <span className="text-xs text-white/50">Buffer: <span className="text-white font-mono">+{paceResult.buffer_minutes}m</span></span>
                            <span className={`text-xs font-mono ${paceResult.confidence >= 70 ? 'text-green-400' : 'text-yellow-400'}`}>{paceResult.confidence}%</span>
                          </div>
                          <p className="text-xs text-white/60 italic">{paceResult.reasoning}</p>
                          <p className="text-[10px] text-white/30 mt-1">Preview only — actual decision happens on-chain via Somnia LLM agent</p>
                        </motion.div>
                      )}
                    </div>

                    {/* Funding */}
                    <div className="mb-6">
                      <label className="text-xs text-white/60 uppercase tracking-wider font-mono block mb-1">
                        Agent Funding ({getNetworkConfig().nativeCurrency.symbol})
                      </label>
                      <input
                        type="number"
                        value={fundingAmount}
                        onChange={(e) => setFundingAmount(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-gold/50 focus:outline-none"
                        min="32"
                        step="1"
                      />
                      <p className="text-xs text-white/40 mt-1">
                        32 {getNetworkConfig().nativeCurrency.symbol} minimum for reactivity subscriptions + gas for agent calls
                      </p>
                    </div>

                    {/* Authorize Button */}
                    <Button
                      onClick={handleAuthorize}
                      variant="primary"
                      size="lg"
                      disabled={isAuthorizing || !hasAgentContract}
                      className="w-full"
                    >
                      {isAuthorizing ? (
                        <span className="flex items-center justify-center gap-2">
                          <LoadingSpinner size="sm" /> Authorizing...
                        </span>
                      ) : (
                        'Authorize Agent'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Authorized State — Show config + Revoke */}
            {agentStatus === 'authorized' && existingConfig && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
              >
                <Card variant="premium">
                  <CardContent>
                    <h3 className="text-lg font-bold mb-2">Active Configuration</h3>
                    <div className="space-y-1 text-sm">
                      <p className="text-white/60">Personality: <span className="text-white">{existingConfig.personality}</span></p>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <a
                        href="/dashboard"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gold/20 border border-gold/40 rounded-lg text-sm text-white hover:bg-gold/30 transition-all"
                      >
                        View Dashboard →
                      </a>
                      <button
                        onClick={handleRevoke}
                        className="px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400 hover:bg-red-500/20 transition-all"
                      >
                        Revoke Agent
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Error Display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
                >
                  <p className="text-red-400 text-sm">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
