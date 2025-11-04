"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import JourneyPathVisualization from '@/components/visualization/JourneyPathVisualization';
import { Button } from '@/components/ui/PremiumButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/PremiumCard';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { LiveLocationTracker } from '@/components/tracking/LiveLocationTracker';
import { InteractiveJourneyTracker } from '@/components/tracking/InteractiveJourneyTracker';
import { SmartBettingInterface } from '@/components/ai/SmartBettingInterface';
import { ProgressDashboard } from '@/components/dashboard/ProgressDashboard';
import { SocialBettingFeed } from '@/components/social/SocialBettingFeed';
import { AchievementShowcase } from '@/components/achievements/AchievementShowcase';
import { useUIStore } from '@/stores/uiStore';
import { useWallet } from '@/hooks/useWallet';
import { useMobileExperience } from '@/hooks/useMobileExperience';
import { useRouter } from 'next/navigation';
import { realtimeService } from '@/lib/realtime-service';
import { fulfillCommitmentAction, getCommitmentDetailsAction } from './actions';

export default function JourneyTrackingPage({ params }: any) {
  const [journey, setJourney] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bettingData, setBettingData] = useState<{
    totalBetsFor: string;
    totalBetsAgainst: string;
    userBet: { amount: string; prediction: 'success' | 'failure' } | null;
    odds: { forSuccess: number; againstSuccess: number };
  }>({
    totalBetsFor: '0',
    totalBetsAgainst: '0',
    userBet: null,
    odds: { forSuccess: 2.0, againstSuccess: 2.0 }
  });
  const [betAmount, setBetAmount] = useState('');
  const [isBetting, setIsBetting] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const { addToast } = useUIStore();
  const { address, isConnected } = useWallet();
  const { triggerHaptic, isMobile } = useMobileExperience();
  const router = useRouter();

  // Load real commitment data from database and blockchain
  useEffect(() => {
    const loadCommitmentData = async () => {
      try {
        setIsLoading(true);

        let commitment = null;
        
        try {
          // Load from database first
          const { dbService } = await import('@/lib/db-service');
          commitment = await dbService.getCommitment(params.id);
        } catch (dbError) {
          console.warn('Database not available during build time:', dbError);
          // Return mock data during build time
          commitment = {
            id: params.id,
            userId: '0x1234567890123456789012345678901234567890',
            stakeAmount: '1000000000000000000',
            deadline: new Date(Date.now() + 3600000),
            startLatitude: 40.7128,
            startLongitude: -74.0060,
            targetLatitude: 40.7589,
            targetLongitude: -73.9851,
            estimatedDistance: 5.2,
            estimatedPace: 8.5,
            status: 'active',
            transactionHash: '0xmock',
            blockNumber: 12345678,
            gasUsed: '21000',
            actualArrivalTime: null,
            success: null,
            payoutAmount: null,
            createdAt: new Date(),
            updatedAt: new Date()
          };
        }

        if (!commitment) {
          setJourney(null);
          setIsLoading(false);
          return;
        }

        // Check if current user is the owner
        setIsOwner(commitment.userId === address);

        // Load blockchain data if available
        let blockchainData = null;
        if (window.ethereum && commitment.transactionHash) {
          try {
            const { BrowserProvider } = await import('ethers');
            const { ContractService } = await import('@/services/contractService');

            const provider = new BrowserProvider(window.ethereum);
            const contractService = new ContractService();

            blockchainData = await contractService.getCommitment(params.id);
          } catch (error) {
            console.warn('Could not load blockchain data:', error);
          }
        }

        // Combine database and blockchain data
        const journeyData = {
          id: commitment.id,
          userId: commitment.userId,
          start: {
            lat: commitment.startLatitude,
            lng: commitment.startLongitude,
            name: 'Start Location'
          },
          end: {
            lat: commitment.targetLatitude,
            lng: commitment.targetLongitude,
            name: 'Target Location'
          },
          startTime: new Date(commitment.createdAt),
          estimatedArrival: new Date(commitment.deadline),
          progress: commitment.status === 'completed' ? 1.0 : 0.45, // Mock progress for now
          status: commitment.status,
          stakeAmount: commitment.stakeAmount,
          reputationImpact: 15, // Mock for now
          waypoints: [], // Will be populated from real-time tracking
          blockchainData
        };

        setJourney(journeyData);

        // Load betting data
        if (blockchainData) {
          setBettingData({
            totalBetsFor: blockchainData.totalBetsFor.toString(),
            totalBetsAgainst: blockchainData.totalBetsAgainst.toString(),
            userBet: null, // TODO: Check if user has placed a bet
            odds: { forSuccess: 2.0, againstSuccess: 2.0 } // TODO: Calculate dynamic odds
          });
        }

        // Subscribe to real-time updates
        const unsubscribe = realtimeService.subscribeToBettingUpdates(params.id, (update) => {
          console.log('Betting update received:', update);
          // Update betting data in real-time
          setBettingData(prev => ({
            ...prev,
            totalBetsFor: update.prediction === 'success' ?
              (parseFloat(prev.totalBetsFor) + parseFloat(update.amount)).toString() :
              prev.totalBetsFor,
            totalBetsAgainst: update.prediction === 'failure' ?
              (parseFloat(prev.totalBetsAgainst) + parseFloat(update.amount)).toString() :
              prev.totalBetsAgainst
          }));
        });

        setIsLoading(false);

        return () => {
          unsubscribe();
        };
      } catch (error) {
        console.error('Error loading commitment data:', error);
        setJourney(null);
        setIsLoading(false);
      }
    };

    if (params.id) {
      loadCommitmentData();
    }
  }, [params.id, address]);

  // Real blockchain betting functionality
  const placeBet = async (prediction: 'success' | 'failure') => {
    if (!isConnected || !betAmount || !journey) {
      addToast({
        type: 'error',
        message: 'Please connect wallet and enter bet amount'
      });
      return;
    }

    if (bettingData.userBet) {
      addToast({
        type: 'warning',
        message: 'You have already placed a bet on this commitment'
      });
      return;
    }

    setIsBetting(true);
    triggerHaptic('light');

    try {
      // Place bet on blockchain
      const { BrowserProvider } = await import('ethers');
      const { ContractService } = await import('@/services/contractService');

      const provider = new BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();
      const contractService = new ContractService(signer);

      await contractService.placeBet(
        journey.id,
        prediction === 'success',
        betAmount
      );

      // Update local state
      setBettingData(prev => ({
        ...prev,
        userBet: { amount: betAmount, prediction },
        totalBetsFor: prediction === 'success' ?
          (parseFloat(prev.totalBetsFor) + parseFloat(betAmount)).toString() :
          prev.totalBetsFor,
        totalBetsAgainst: prediction === 'failure' ?
          (parseFloat(prev.totalBetsAgainst) + parseFloat(betAmount)).toString() :
          prev.totalBetsAgainst
      }));

      setBetAmount('');
      triggerHaptic('success');

      addToast({
        type: 'success',
        message: `Bet placed: ${betAmount} STT on ${prediction}!`
      });

      // Emit to real-time service
      realtimeService.emit('betting:placed', {
        commitmentId: journey.id,
        totalBets: parseInt(bettingData.totalBetsFor) + parseInt(bettingData.totalBetsAgainst) + 1,
        totalAmount: (parseFloat(bettingData.totalBetsFor) + parseFloat(bettingData.totalBetsAgainst) + parseFloat(betAmount)).toString()
      });

    } catch (error) {
      console.error('Error placing bet:', error);
      triggerHaptic('error');
      addToast({
        type: 'error',
        message: 'Failed to place bet. Please try again.'
      });
    } finally {
      setIsBetting(false);
    }
  };

  const handleFulfillCommitment = async () => {
    if (!journey) return;

    try {
      // In a real implementation, we would get the actual arrival location
      const arrivalLocation = {
        lat: journey.end.lat,
        lng: journey.end.lng
      };

      const result = await fulfillCommitmentAction(
        journey.id,
        journey.userId,
        arrivalLocation
      );

      if (result.success) {
        addToast({
          type: 'success',
          message: 'Commitment fulfilled successfully!'
        });

        // Update local state
        setJourney({
          ...journey,
          status: 'completed',
          progress: 1.0
        });
      } else {
        addToast({
          type: 'error',
          message: result.message
        });
      }
    } catch (error) {
      console.error('Error fulfilling commitment:', error);
      addToast({
        type: 'error',
        message: 'Failed to fulfill commitment'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 to-purple-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-white/80">Loading journey tracking...</p>
        </div>
      </div>
    );
  }

  if (!journey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 to-purple-950">
        <div className="text-center max-w-md p-6 bg-white/10 rounded-xl border border-white/20">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">Journey Not Found</h2>
          <p className="text-white/70 mb-4">
            The journey you're looking for doesn't exist or has expired.
          </p>
          <Button
            variant="primary"
            onClick={() => router.push('/watch')}
          >
            Back to Watch List
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 to-purple-950 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Journey Tracking</h1>
          <Button
            variant="outline"
            onClick={() => router.push('/watch')}
          >
            Back to List
          </Button>
        </div>

        {/* Enhanced Journey Visualization */}
        <motion.div
          className="bg-white/10 rounded-xl p-4 mb-6 border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <InteractiveJourneyTracker
            commitmentId={journey.id}
            startLocation={[journey.start.lat, journey.start.lng]}
            endLocation={[journey.end.lat, journey.end.lng]}
            currentLocation={journey.waypoints.length > 0 
              ? [journey.waypoints[journey.waypoints.length - 1].lat, journey.waypoints[journey.waypoints.length - 1].lng] 
              : undefined}
            progress={journey.progress}
            timeRemaining={Math.max(0, Math.floor((journey.estimatedArrival.getTime() - Date.now()) / 1000))}
            distanceRemaining={journey.estimatedDistance * (1 - journey.progress)}
          />
        </motion.div>

        {/* Progress Dashboard */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <ProgressDashboard
            currentProgress={journey.progress}
            timeRemaining={Math.max(0, Math.floor((journey.estimatedArrival.getTime() - Date.now()) / 1000))}
            distanceRemaining={journey.estimatedDistance * (1 - journey.progress)}
            reputationScore={journey.reputationImpact}
            streakCount={5} // Mock streak count
            onDashboardAction={(action) => {
              if (action === 'share') {
                navigator.clipboard.writeText(window.location.href);
                addToast({ message: 'Link copied to clipboard', type: 'success' });
              }
            }}
          />
        </motion.div>

        {/* Betting Interface */}
        {isConnected && !isOwner && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <SmartBettingInterface
              commitmentId={journey.id}
              stakeAmount={parseFloat(journey.stakeAmount)}
              deadline={journey.estimatedArrival}
              currentProgress={journey.progress}
              status={journey.status}
              destinationReached={journey.status === 'completed' ? true : false}
              estimatedArrival={journey.estimatedArrival}
              timeRemaining={Math.max(0, Math.floor((journey.estimatedArrival.getTime() - Date.now()) / 1000))}
            />
          </motion.div>
        )}

        {/* Social Betting Feed */}
        {isConnected && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <SocialBettingFeed
              bets={[
                {
                  id: '1',
                  user: 'Alex',
                  amount: '0.5',
                  type: 'for',
                  timestamp: new Date(Date.now() - 300000), // 5 minutes ago
                  isCurrentUser: false,
                  likes: 2,
                  likedByCurrentUser: false
                },
                {
                  id: '2',
                  user: 'You',
                  amount: '1.2',
                  type: 'against',
                  timestamp: new Date(Date.now() - 120000), // 2 minutes ago
                  isCurrentUser: true,
                  likes: 0,
                  likedByCurrentUser: false
                },
                {
                  id: '3',
                  user: 'Sam',
                  amount: '0.8',
                  type: 'for',
                  timestamp: new Date(Date.now() - 60000), // 1 minute ago
                  isCurrentUser: false,
                  likes: 1,
                  likedByCurrentUser: false
                }
              ]}
              commitmentId={journey.id}
              onBetAction={(betId, action) => {
                if (action === 'like') {
                  addToast({ message: 'Bet liked!', type: 'success' });
                } else if (action === 'share') {
                  addToast({ message: 'Bet shared!', type: 'success' });
                }
              }}
            />
          </motion.div>
        )}

        {/* Achievement Showcase */}
        {isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <AchievementShowcase
              achievements={[
                {
                  id: 'punctual-1',
                  title: 'First Commitment',
                  description: 'Complete your first punctuality commitment',
                  icon: '🎯',
                  unlocked: true,
                  unlockDate: new Date(Date.now() - 86400000), // 1 day ago
                  rarity: 'common'
                },
                {
                  id: 'punctual-2',
                  title: 'Early Bird',
                  description: 'Arrive 10 minutes early',
                  icon: '🐦',
                  unlocked: false,
                  progress: 0.7,
                  rarity: 'rare'
                },
                {
                  id: 'punctual-3',
                  title: 'Streak Master',
                  description: 'Maintain 7-day streak',
                  icon: '🔥',
                  unlocked: false,
                  progress: 0.4,
                  rarity: 'epic'
                }
              ]}
              onAchievementClick={(id) => {
                addToast({ message: `Achievement ${id} clicked`, type: 'info' });
              }}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}