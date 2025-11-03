"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import JourneyPathVisualization from '@/components/visualization/JourneyPathVisualization';
import { Button } from '@/components/ui/PremiumButton';
import { useUIStore } from '@/stores/uiStore';
import { useRouter } from 'next/navigation';
import { fulfillCommitmentAction, getCommitmentDetailsAction } from './actions';

export default function JourneyTrackingPage({ params }: any) {
  const [journey, setJourney] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useUIStore();
  const router = useRouter();
  
  // Mock data - in real implementation, this would come from API
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setJourney({
        id: params.id,
        userId: '0x1234567890abcdef',
        start: { lat: 40.7128, lng: -74.0060, name: 'New York' },
        end: { lat: 41.8781, lng: -87.6298, name: 'Chicago' },
        startTime: new Date(Date.now() - 3600000),
        estimatedArrival: new Date(Date.now() + 7200000),
        progress: 0.45,
        status: 'active',
        stakeAmount: '2.5',
        reputationImpact: 15,
        waypoints: [
          { lat: 40.7589, lng: -73.9851, timestamp: Date.now() - 3000000, status: 'completed' as const },
          { lat: 40.7505, lng: -73.9934, timestamp: Date.now() - 2400000, status: 'completed' as const },
          { lat: 40.7282, lng: -74.0776, timestamp: Date.now() - 1800000, status: 'completed' as const }
        ]
      });
      setIsLoading(false);
    }, 1000);
  }, [params.id]);
  
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