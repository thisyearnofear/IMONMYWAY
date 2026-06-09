"use client";

import { useState, useEffect } from 'react';
import { DataPanel, DataRow } from '@/components/ui/PremiumCard';
import { type AgentConfig } from '@/services/contractService';
import { useLLM } from '@/hooks/useLLM';
import { commitmentSummary } from '@/lib/llm/prompts';

interface AgentStatusViewProps {
  config: AgentConfig | null;
  balance: string;
  networkName: string;
  currency: string;
  reputationScore?: number;
}

export function AgentStatusView({ config, balance, networkName, currency, reputationScore }: AgentStatusViewProps) {
  const balanceNum = parseFloat(balance);
  const status = balanceNum > 32 ? 'online' : balanceNum > 0 ? 'warning' : 'offline';
  const { generate, isThinking } = useLLM();
  const [insight, setInsight] = useState<string | null>(null);

  useEffect(() => {
    if (!config || !reputationScore) return;
    let cancelled = false;

    const fetchInsight = async () => {
      const messages = commitmentSummary({
        deadline: Math.floor(Date.now() / 1000) + 7200,
        stake: config.maxStake,
        personality: config.personality,
        context: `Agent funded with ${parseFloat(balance).toFixed(1)} ${currency}`,
      });
      const response = await generate(messages);
      if (!cancelled && response) {
        setInsight(response.content);
      }
    };

    fetchInsight();
    return () => { cancelled = true; };
  }, [config?.personality, config?.maxStake, balance, reputationScore]);

  return (
    <DataPanel title="Agent" status={status}>
      <DataRow label="Network" value={networkName} />
      <DataRow label="Balance" value={`${parseFloat(balance).toFixed(1)} ${currency}`} status={balanceNum > 32 ? 'success' : 'warning'} />
      <DataRow label="Reactivity" value={balanceNum >= 32 ? 'FUNDED' : 'UNDERFUNDED'} status={balanceNum >= 32 ? 'success' : 'error'} />
      {reputationScore !== undefined && reputationScore > 0 && (
        <DataRow
          label="Reputation"
          value={`${reputationScore} / 10000`}
          status={reputationScore >= 7000 ? 'success' : reputationScore >= 5000 ? 'neutral' : 'warning'}
        />
      )}
      {config && (
        <>
          <DataRow label="Max Stake" value={`${parseFloat(config.maxStake).toFixed(0)} ${currency}`} />
          <DataRow label="Auto Social" value={config.autoPostSocial ? 'ON' : 'OFF'} status={config.autoPostSocial ? 'success' : 'neutral'} />
          <DataRow label="Auto Proposals" value={config.autoAcceptProposals ? 'ON' : 'OFF'} status={config.autoAcceptProposals ? 'success' : 'neutral'} />
        </>
      )}
      {(isThinking || insight) && (
        <div className="mt-2 pt-2 border-t border-white/5">
          <p className="text-[10px] text-white/30 uppercase tracking-wider font-mono mb-1">Agent Insight</p>
          <p className="text-xs text-white/60 italic">
            {isThinking ? 'Analyzing...' : insight}
          </p>
        </div>
      )}
    </DataPanel>
  );
}
