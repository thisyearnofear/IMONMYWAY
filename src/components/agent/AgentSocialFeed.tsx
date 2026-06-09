"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { type AgentActivityEvent } from '@/lib/somnia-reactivity';

interface AgentSocialFeedProps {
  posts: AgentActivityEvent[];
}

const EVENT_ICONS: Record<string, string> = {
  commitment_started: '🚀',
  pace_decided: '🏃',
  halfway_check: '📍',
  deadline_approaching: '⏰',
  settlement_success: '🏆',
  settlement_failure: '😤',
  proposal_received: '📨',
  proposal_accepted: '🤝',
  proposal_rejected: '❌',
};

export function AgentSocialFeed({ posts }: AgentSocialFeedProps) {
  return (
    <div className="bg-gradient-to-br from-gold/10 to-violet/10 border border-gold/20 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white/90 uppercase tracking-wider">Agent Social Feed</h3>
        <span className="text-xs font-mono text-white/40">{posts.length} posts</span>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-white/40 text-xs font-mono">
            Agent will post social updates as it manages commitments autonomously
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          <AnimatePresence>
            {posts.map((post, i) => (
              <motion.div
                key={`${post.commitmentId}-${post.timestamp}-${i}`}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white/5 border border-white/10 rounded-lg p-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-gold/20 to-violet/20 border border-gold/30 rounded-lg flex items-center justify-center text-sm flex-shrink-0">
                    {EVENT_ICONS[post.data.eventType] || '💬'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-gold/80">@punctuality_agent</span>
                      <span className="text-[10px] font-mono text-white/30">
                        {new Date(post.timestamp * 1000).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-white/80 leading-relaxed">
                      {post.data.message}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        post.data.eventType?.includes('success') ? 'bg-green-500/20 text-green-400' :
                        post.data.eventType?.includes('failure') || post.data.eventType?.includes('rejected') ? 'bg-red-500/20 text-red-400' :
                        'bg-white/10 text-white/50'
                      }`}>
                        {post.data.eventType?.replace(/_/g, ' ') || 'update'}
                      </span>
                      <span className="text-[10px] font-mono text-white/30 truncate">
                        {post.commitmentId.slice(0, 10)}...
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
