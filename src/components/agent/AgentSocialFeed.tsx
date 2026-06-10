"use client";

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type AgentActivityEvent } from '@/lib/somnia-reactivity';
import { useUIStore } from '@/stores/uiStore';

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
  agent_generated: '💬',
  arrived_on_time: '🏆',
  missed_deadline: '😤',
  commitment_created: '🚀',
};

export function AgentSocialFeed({ posts }: AgentSocialFeedProps) {
  return (
    <div className="p-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white/90 uppercase tracking-wider">Agent Social Feed</h3>
        <span className="text-xs font-mono text-white/60">{posts.length} posts</span>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-white/60 text-xs font-mono">
            Agent will post social updates as it manages commitments autonomously
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          <AnimatePresence>
            {posts.map((post, i) => (
              <SocialPostCard key={`${post.commitmentId}-${post.timestamp}-${i}`} post={post} index={i} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function SocialPostCard({ post, index }: { post: AgentActivityEvent; index: number }) {
  const [isSharing, setIsSharing] = useState(false);
  const { addToast } = useUIStore();

  const handleShare = useCallback(async () => {
    setIsSharing(true);
    const text = post.data.message || 'Check out this agent update on IMONMYWAY';
    const url = `${window.location.origin}/commitment/${post.commitmentId}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: 'IMONMYWAY Agent Update', text, url });
      } else {
        await navigator.clipboard.writeText(`${text}\n\n${url}`);
        addToast({ message: 'Link copied to clipboard', type: 'success' });
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        addToast({ message: 'Failed to share', type: 'error' });
      }
    } finally {
      setIsSharing(false);
    }
  }, [post, addToast]);

  const handlePostToX = useCallback(() => {
    const text = encodeURIComponent(post.data.message || 'My IMONMYWAY agent just made a move 🎯');
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'noopener,noreferrer');
  }, [post]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white/5 border border-white/10 rounded-lg p-3"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 border border-gold-500/20 rounded-lg flex items-center justify-center text-sm flex-shrink-0">
          {EVENT_ICONS[post.data.eventType] || '💬'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-gold/80">@punctuality_agent</span>
            <span className="text-[10px] font-mono text-white/50">
              {new Date(post.timestamp * 1000).toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-white/80 leading-relaxed">
            {post.data.message}
          </p>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                post.data.eventType?.includes('success') || post.data.eventType?.includes('arrived')
                  ? 'bg-green-500/20 text-green-400'
                  : post.data.eventType?.includes('failure') || post.data.eventType?.includes('missed') || post.data.eventType?.includes('rejected')
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-white/10 text-white/70'
              }`}>
                {post.data.eventType?.replace(/_/g, ' ') || 'update'}
              </span>
              <span className="text-[10px] font-mono text-white/50 truncate">
                {post.commitmentId.slice(0, 10)}...
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePostToX}
                className="text-[10px] font-mono text-white/50 hover:text-blue-400 transition-colors px-1.5 py-0.5 rounded hover:bg-white/5"
                aria-label="Post to X"
              >
                post
              </button>
              <button
                onClick={handleShare}
                disabled={isSharing}
                className="text-[10px] font-mono text-white/50 hover:text-gold transition-colors px-1.5 py-0.5 rounded hover:bg-white/5"
                aria-label="Share this update"
              >
                {isSharing ? '...' : 'share'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
