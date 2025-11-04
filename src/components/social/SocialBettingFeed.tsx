"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/PremiumButton";

interface Bet {
  id: string;
  user: string;
  amount: string;
  type: 'for' | 'against';
  timestamp: Date;
  isCurrentUser?: boolean;
  likes?: number;
  likedByCurrentUser?: boolean;
}

interface SocialBettingFeedProps {
  bets: Bet[];
  commitmentId: string;
  onBetAction?: (betId: string, action: 'like' | 'share' | 'comment') => void;
  className?: string;
  showCurrentUserBets?: boolean;
}

export function SocialBettingFeed({ 
  bets, 
  commitmentId,
  onBetAction,
  className = "",
  showCurrentUserBets = true
}: SocialBettingFeedProps) {
  const [expandedBet, setExpandedBet] = useState<string | null>(null);
  const [userInteractions, setUserInteractions] = useState<Record<string, boolean>>({});

  // Filter bets based on showCurrentUserBets setting
  const filteredBets = showCurrentUserBets 
    ? bets 
    : bets.filter(bet => !bet.isCurrentUser);

  const handleBetAction = (betId: string, action: 'like' | 'share' | 'comment') => {
    if (onBetAction) {
      onBetAction(betId, action);
    }
    
    if (action === 'like') {
      setUserInteractions(prev => ({
        ...prev,
        [betId]: !prev[betId]
      }));
    }
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    
    return Math.floor(seconds) + "s ago";
  };

  const getBetColor = (type: 'for' | 'against') => {
    return type === 'for' ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10';
  };

  const getBetEmoji = (type: 'for' | 'against') => {
    return type === 'for' ? '✅' : '❌';
  };

  return (
    <div className={cn("bg-gradient-to-br from-indigo-950/30 to-purple-950/30 rounded-2xl p-6 border border-white/20", className)}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white">Betting Feed</h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-white/70">Live</span>
        </div>
      </div>
      
      <div className="space-y-4">
        {filteredBets.length === 0 ? (
          <div className="text-center py-8 text-white/60">
            <div className="text-4xl mb-2">📊</div>
            <p>No bets yet. Be the first to place a bet!</p>
          </div>
        ) : (
          filteredBets.map((bet, index) => (
            <motion.div
              key={bet.id}
              className={cn(
                "bg-white/10 rounded-xl p-4 border border-white/10",
                bet.isCurrentUser ? "border-blue-400/50 bg-blue-500/10" : ""
              )}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -2 }}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${bet.type === 'for' ? 'from-green-500 to-emerald-500' : 'from-red-500 to-rose-500'} flex items-center justify-center text-lg`}>
                    {getBetEmoji(bet.type)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">
                        {bet.isCurrentUser ? 'You' : bet.user}
                      </span>
                      {bet.isCurrentUser && (
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                          Current User
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-white/70">
                      bet <span className={cn("font-medium", getBetColor(bet.type))}>
                        {bet.type === 'for' ? 'for success' : 'against success'}
                      </span> with <span className="font-bold text-white">{bet.amount} STT</span>
                    </div>
                    <div className="text-xs text-white/50 mt-1">
                      {formatTimeAgo(bet.timestamp)}
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBetAction(bet.id, 'like')}
                  className={cn(
                    "flex items-center gap-1",
                    userInteractions[bet.id] ? "text-red-400" : "text-white/60"
                  )}
                >
                  <span>{userInteractions[bet.id] ? '❤️' : '🤍'}</span>
                  <span>{bet.likes || 0}</span>
                </Button>
              </div>
              
              {/* Bet interaction buttons */}
              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBetAction(bet.id, 'like')}
                  className="text-xs flex-1"
                >
                  {userInteractions[bet.id] ? 'Unlike' : 'Like'} {bet.likes || 0}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBetAction(bet.id, 'share')}
                  className="text-xs flex-1"
                >
                  Share
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExpandedBet(expandedBet === bet.id ? null : bet.id)}
                  className="text-xs flex-1"
                >
                  {expandedBet === bet.id ? 'Hide' : 'More'}
                </Button>
              </div>
              
              {/* Expanded bet details */}
              <AnimatePresence>
                {expandedBet === bet.id && (
                  <motion.div
                    className="mt-3 p-3 bg-white/5 rounded-lg border border-white/10"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <div className="text-sm text-white/80">
                      <div className="font-medium mb-2">Bet Details</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="text-white/60">Bet ID:</div>
                        <div className="font-mono text-white/80">{bet.id.substring(0, 8)}...</div>
                        
                        <div className="text-white/60">Type:</div>
                        <div className={cn(getBetColor(bet.type))}>{bet.type}</div>
                        
                        <div className="text-white/60">Amount:</div>
                        <div className="text-white/80">{bet.amount} STT</div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>
      
      {/* Feed stats */}
      <div className="mt-6 pt-4 border-t border-white/10 flex justify-between text-sm text-white/60">
        <span>{filteredBets.length} bets</span>
        <span>Live updates</span>
      </div>
    </div>
  );
}