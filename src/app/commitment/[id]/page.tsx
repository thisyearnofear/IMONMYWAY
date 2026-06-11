/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import "leaflet/dist/leaflet.css";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/PremiumButton';
import { Card, CardContent, DataPanel, DataRow } from '@/components/ui/PremiumCard';
import { RouteCardSkeleton } from '@/components/ui/LoadingSkeleton';
import { InteractiveJourneyTracker } from '@/components/tracking/InteractiveJourneyTracker';
import { AgentBettingView } from '@/components/agent/AgentBettingView';
import { AgentDecisionTimeline } from '@/components/agent/AgentDecisionTimeline';
import { AgentSocialFeed } from '@/components/agent/AgentSocialFeed';
import { useAddToast } from '@/components/unified/UnifiedToast';
import { useWallet } from '@/hooks/useWallet';
import { useRouter } from 'next/navigation';
import { fulfillCommitmentAction } from './actions';
import { somniaReactivity, type AgentActivityEvent } from '@/lib/somnia-reactivity';
import { getContractAddresses } from '@/contracts/addresses';

export default function CommitmentPage({ params }: any) {
  const [journey, setJourney] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bettingData, setBettingData] = useState({ totalBetsFor: '0', totalBetsAgainst: '0' });
  const [isOwner, setIsOwner] = useState(false);
  const [agentDecisions, setAgentDecisions] = useState<AgentActivityEvent[]>([]);
  const [agentSocialPosts, setAgentSocialPosts] = useState<AgentActivityEvent[]>([]);
  const [agentConnected, setAgentConnected] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const addToast = useAddToast();
  const { address, isConnected } = useWallet();
  const router = useRouter();

  // Countdown timer
  useEffect(() => {
    if (!journey?.deadline) return;
    const update = () => {
      const remaining = Math.max(0, Math.floor((journey.deadline.getTime() - Date.now()) / 1000));
      setTimeRemaining(remaining);
      // Derive progress from elapsed-vs-deadline (skip if already settled)
      if (journey.startTime && !journey.fulfilled) {
        const total = Math.max(1, journey.deadline.getTime() - journey.startTime.getTime());
        const elapsed = Math.max(0, Math.min(total, Date.now() - journey.startTime.getTime()));
        const next = elapsed / total;
        setJourney((prev: any) => (prev && Math.abs(prev.progress - next) > 0.001 ? { ...prev, progress: next } : prev));
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [journey?.deadline, journey?.startTime, journey?.fulfilled]);

  // Load commitment data from blockchain
  useEffect(() => {
    const loadCommitment = async () => {
      if (!params.id) return;
      setIsLoading(true);
      try {
        const [{ ethers }, { getReadOnlyContractService }] = await Promise.all([
          import('ethers'),
          import('@/services/contractService'),
        ]);
        const service = getReadOnlyContractService();
        const blockchainData = await service.getCommitment(params.id);

        if (blockchainData) {
          const startLat = Number(blockchainData.startLocation[0]) / 1e6;
          const startLng = Number(blockchainData.startLocation[1]) / 1e6;
          const endLat = Number(blockchainData.targetLocation[0]) / 1e6;
          const endLng = Number(blockchainData.targetLocation[1]) / 1e6;

          setJourney({
            id: params.id,
            userId: blockchainData.user,
            start: { lat: startLat, lng: startLng },
            end: { lat: endLat, lng: endLng },
            deadline: new Date(Number(blockchainData.arrivalDeadline) * 1000),
            startTime: new Date(Number(blockchainData.startTime) * 1000),
            progress: blockchainData.fulfilled
              ? 1.0
              : (() => {
                  const start = Number(blockchainData.startTime) * 1000;
                  const end = Number(blockchainData.arrivalDeadline) * 1000;
                  const total = Math.max(1, end - start);
                  const elapsed = Math.max(0, Math.min(total, Date.now() - start));
                  return elapsed / total;
                })(),
            status: blockchainData.fulfilled ? (blockchainData.successful ? 'completed' : 'failed') : 'active',
            stakeAmount: ethers.formatEther(blockchainData.stakeAmount),
            distance: Number(blockchainData.distance),
            pace: Number(blockchainData.pace),
            fulfilled: blockchainData.fulfilled,
          });

          setBettingData({
            totalBetsFor: ethers.formatEther(blockchainData.totalBetsFor),
            totalBetsAgainst: ethers.formatEther(blockchainData.totalBetsAgainst),
          });

          setIsOwner(blockchainData.user.toLowerCase() === address?.toLowerCase());
        }
      } catch (error) {
        console.warn('Could not load commitment:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCommitment();
  }, [params.id, address]);

  // Subscribe to agent activity via Somnia reactivity
  useEffect(() => {
    const agentAddress = getContractAddresses().PunctualityAgent;
    if (!agentAddress) return;

    somniaReactivity.connect(agentAddress);
    setAgentConnected(true);

    const cleanup = somniaReactivity.onActivity((event) => {
      if (['decision', 'commitment_created', 'commitment_settled'].includes(event.type)) {
        setAgentDecisions(prev => [event, ...prev].slice(0, 20));
      }
      if (event.type === 'social_update') {
        setAgentSocialPosts(prev => [event, ...prev].slice(0, 20));
      }
    });

    return () => { cleanup(); };
  }, []);

  const handleFulfill = async () => {
    if (!journey) return;
    try {
      const result = await fulfillCommitmentAction(journey.id, journey.userId, {
        lat: journey.end.lat,
        lng: journey.end.lng,
      });
      addToast({ type: result.success ? 'success' : 'error', message: result.message });
      if (result.success) setJourney({ ...journey, status: 'completed', progress: 1.0 });
    } catch {
      addToast({ type: 'error', message: 'Failed to fulfill commitment' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-16">
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          <RouteCardSkeleton />
          <RouteCardSkeleton />
        </div>
      </div>
    );
  }

  if (!journey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card variant="enhanced">
          <CardContent className="text-center py-12 px-16">
            <h2 className="text-xl font-bold mb-2">Commitment Not Found</h2>
            <p className="text-white/60 mb-4 text-sm">This commitment doesn&apos;t exist or has expired.</p>
            <Button variant="primary" onClick={() => router.push('/watch')}>Back to Watch</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center py-6">
          <h1 className="text-2xl font-bold text-white">Commitment</h1>
          <Button variant="outline" onClick={() => router.push('/watch')}>Back</Button>
        </div>

        {/* Commitment Status */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <DataPanel title="Commitment" status={journey.status === 'active' ? 'online' : journey.status === 'completed' ? 'online' : 'error'}>
            <DataRow label="Owner" value={`${journey.userId.slice(0, 6)}...${journey.userId.slice(-4)}`} />
            <DataRow label="Stake" value={`${journey.stakeAmount} STT`} status="neutral" />
            <DataRow label="Status" value={journey.status.toUpperCase()} status={journey.status === 'active' ? 'warning' : journey.status === 'completed' ? 'success' : 'error'} />
            <DataRow label="Deadline" value={journey.deadline.toLocaleString()} />
            <DataRow label="Time Left" value={timeRemaining > 0 ? `${Math.floor(timeRemaining / 60)}m ${timeRemaining % 60}s` : 'EXPIRED'} status={timeRemaining > 300 ? 'success' : timeRemaining > 0 ? 'warning' : 'error'} />
          </DataPanel>
        </motion.div>

        {/* Agent Activity */}
        {agentConnected && (
          <motion.div className="mt-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AgentDecisionTimeline decisions={agentDecisions} />
              <AgentSocialFeed posts={agentSocialPosts} />
            </div>
          </motion.div>
        )}

        {/* Map */}
        <motion.div className="mt-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <InteractiveJourneyTracker
              commitmentId={journey.id}
              startLocation={[journey.start.lat, journey.start.lng]}
              endLocation={[journey.end.lat, journey.end.lng]}
              progress={journey.progress}
              timeRemaining={timeRemaining}
              distanceRemaining={(journey.distance / 1000) * (1 - journey.progress)}
            />
          </div>
        </motion.div>

        {/* Betting Panel */}
        {!isOwner && journey.status === 'active' && (
          <motion.div className="mt-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <AgentBettingView
              commitmentId={journey.id}
              stakeAmount={parseFloat(journey.stakeAmount)}
              deadline={journey.deadline}
              currentProgress={journey.progress}
              status={journey.status}
              destinationReached={journey.fulfilled}
              timeRemaining={timeRemaining}
              totalBetsFor={bettingData.totalBetsFor}
              totalBetsAgainst={bettingData.totalBetsAgainst}
            />
          </motion.div>
        )}

        {/* Fulfill Button (owner only) */}
        {isOwner && journey.status === 'active' && (
          <motion.div className="mt-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Button onClick={handleFulfill} variant="primary" size="lg" className="w-full">
              Fulfill Commitment (I&apos;ve arrived)
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
