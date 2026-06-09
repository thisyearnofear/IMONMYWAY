"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { type AgentActivityEvent } from '@/lib/somnia-reactivity';

interface AgentDecisionTimelineProps {
  decisions: AgentActivityEvent[];
}

const REQUEST_TYPE_LABELS: Record<number, string> = {
  0: 'Pace Decision',
  1: 'Context Fetch',
  2: 'Settlement',
  3: 'Social Update',
};

const DECISION_ICONS: Record<string, string> = {
  decision: '🧠',
  commitment_created: '📝',
  commitment_settled: '⚖️',
  social_update: '💬',
  deadline_check: '⏰',
  proposal_handled: '🤝',
};

export function AgentDecisionTimeline({ decisions }: AgentDecisionTimelineProps) {
  if (decisions.length === 0) {
    return (
      <div className="h-full bg-gradient-to-br from-gold/10 to-violet/10 border border-gold/20 rounded-xl p-4">
        <h3 className="text-sm font-bold text-white/90 uppercase tracking-wider mb-3">Decision Chain</h3>
        <div className="flex items-center justify-center h-24">
          <p className="text-white/40 text-xs font-mono text-center">
            No decisions yet — agent will reason autonomously when commitments are created
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-gold/10 to-violet/10 border border-gold/20 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-white/90 uppercase tracking-wider">Decision Chain</h3>
        <span className="text-xs font-mono text-white/40">{decisions.length} decisions</span>
      </div>
      <div className="space-y-2 max-h-40 overflow-y-auto">
        <AnimatePresence>
          {decisions.slice(0, 10).map((event, i) => (
            <motion.div
              key={`${event.commitmentId}-${event.timestamp}-${i}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-2 py-1.5 border-b border-white/5 last:border-0"
            >
              <span className="text-sm mt-0.5">{DECISION_ICONS[event.type] || '📋'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white/90">
                    {event.type === 'decision'
                      ? REQUEST_TYPE_LABELS[event.data.requestType] || 'Agent Decision'
                      : event.type === 'commitment_created'
                      ? 'Commitment Created'
                      : event.type === 'commitment_settled'
                      ? event.data.success ? 'Settled: SUCCESS' : 'Settled: FAILED'
                      : event.type.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] font-mono text-white/30">
                    {new Date(event.timestamp * 1000).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-[11px] text-white/60 truncate mt-0.5">
                  {event.data.reasoning || event.data.decision || event.data.pace
                    ? `${event.data.pace ? `Pace: ${Math.round(Number(event.data.pace) / 60)}:${String(Math.round(Number(event.data.pace) % 60)).padStart(2, '0')}/km` : ''} ${event.data.reasoning || ''}`
                    : `ID: ${event.commitmentId.slice(0, 10)}...`}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
