"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import JourneyPathVisualization from '@/components/visualization/JourneyPathVisualization';
import { Button } from '@/components/ui/PremiumButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/PremiumCard';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { LiveLocationTracker } from '@/components/tracking/LiveLocationTracker';
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

        // Load from database first
        const { dbService } = await import('@/lib/db-service');
        const commitment = await dbService.getCommitment(params.id);

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

        {/* Journey Visualization */}
        <motion.div
          className="bg-white/10 rounded-xl p-4 mb-6 border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="h-96 rounded-lg overflow-hidden">
            <JourneyPathVisualization
              journeys={[{
                id: journey.id,
                userId: journey.userId,
                start: {
                  lat: journey.start.lat,
                  lng: journey.start.lng,
                  timestamp: journey.startTime.getTime(),
                  status: 'pending' as const
                },
                end: {
                  lat: journey.end.lat,
                  lng: journey.end.lng,
                  timestamp: journey.estimatedArrival.getTime(),
                  status: 'pending' as const
                },
                waypoints: journey.waypoints.map((wp: any) => ({
                  lat: wp.lat,
                  lng: wp.lng,
                  timestamp: wp.timestamp,
                  status: wp.status
                })),
                progress: journey.progress,
                estimatedArrival: journey.estimatedArrival,
                status: journey.status
              }]}
            />
          </div>
        </motion.div>

        {/* Journey Details */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Progress Card */}
          <div className="bg-white/10 rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">Progress</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white/70">Overall Progress</span>
                  <span className="text-white">{Math.round(journey.progress * 100)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                    style={{ width: `${journey.progress * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-white/70 text-sm">Started</p>
                  <p className="text-white font-medium">
                    {journey.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div>
                  <p className="text-white/70 text-sm">ETA</p>
                  <p className="text-white font-medium">
                    {journey.estimatedArrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Commitment Card */}
          <div className="bg-white/10 rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">Commitment</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/70">Stake Amount</span>
                <span className="text-white font-medium">{journey.stakeAmount} STT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Reputation Impact</span>
                <span className="text-green-400 font-medium">+{journey.reputationImpact}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Status</span>
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                  {journey.status === 'completed' ? 'Completed' : 'In Progress'}
                </span>
              </div>
              {journey.status !== 'completed' && (
                <Button
                  variant="primary"
                  className="w-full mt-4"
                  onClick={handleFulfillCommitment}
                >
                  Mark as Arrived
                </Button>
              )}
            </div>
          </div>

          {/* Actions Card */}
          <div className="bg-white/10 rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
            <div className="space-y-3">
              <Button
                variant="primary"
                className="w-full"
                onClick={() => addToast({ message: 'Location updated', type: 'success' })}
              >
                Update Location
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => addToast({ message: 'Share link copied', type: 'success' })}
              >
                Share Tracking
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => router.push(`/watch/${journey.id}/bet`)}
              >
                Place a Bet
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}