"use client";

import { useState } from "react";
import { InteractiveJourneyTracker } from "@/components/tracking/InteractiveJourneyTracker";
import { SmartBettingInterface } from "@/components/ai/SmartBettingInterface";
import { AIStakeInput } from "@/components/smart/AIStakeInput";
import { AchievementShowcase } from "@/components/achievements/AchievementShowcase";
import { ProgressDashboard } from "@/components/dashboard/ProgressDashboard";
import { SocialBettingFeed } from "@/components/social/SocialBettingFeed";
import { Button } from "@/components/ui/PremiumButton";

export default function DemoPage() {
  const [currentProgress, setCurrentProgress] = useState(0.65);
  const [timeRemaining, setTimeRemaining] = useState(1200); // 20 minutes
  const [distanceRemaining, setDistanceRemaining] = useState(3.5);

  // Update progress over time for demo purposes
  const incrementProgress = () => {
    setCurrentProgress(prev => Math.min(1.0, prev + 0.05));
    setTimeRemaining(prev => Math.max(0, prev - 300)); // 5 minutes less
    setDistanceRemaining(prev => Math.max(0, prev - 0.5)); // 0.5 km less
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 to-purple-950 p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-white mb-4">IMONMYWAY Enhanced UI Demo</h1>
          <p className="text-white/70">Interactive components with AI-powered features</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Interactive Journey Tracker */}
          <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">Interactive Journey Tracker</h2>
            <InteractiveJourneyTracker
              commitmentId="demo-commitment-1"
              startLocation={[40.7128, -74.0060]}
              endLocation={[40.7589, -73.9851]}
              currentLocation={[40.7350, -73.9900]}
              progress={currentProgress}
              timeRemaining={timeRemaining}
              distanceRemaining={distanceRemaining}
              enableSharing={true}
              enableSocialFeatures={true}
            />
            <div className="mt-4">
              <Button onClick={incrementProgress} variant="outline">
                Advance Journey
              </Button>
            </div>
          </div>

          {/* Smart Betting Interface */}
          <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">Smart Betting Interface</h2>
            <SmartBettingInterface
              commitmentId="demo-commitment-1"
              stakeAmount={10}
              deadline={new Date(Date.now() + 30 * 60 * 1000)}
              currentProgress={currentProgress}
              status="active"
              destinationReached={false}
              estimatedArrival={new Date(Date.now() + timeRemaining * 1000)}
              timeRemaining={timeRemaining}
            />
          </div>

          {/* AI Stake Input */}
          <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">AI Stake Input</h2>
            <AIStakeInput
              onStakeSet={(amount) => console.log('Stake set to:', amount)}
              userBalance="100.00"
              context={{
                distance: 5,
                timeAvailable: 30,
                destination: "Central Park"
              }}
            />
          </div>

          {/* Progress Dashboard */}
          <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">Progress Dashboard</h2>
            <ProgressDashboard
              currentProgress={currentProgress}
              timeRemaining={timeRemaining}
              distanceRemaining={distanceRemaining}
              reputationScore={785}
              streakCount={7}
              onDashboardAction={(action) => console.log('Dashboard action:', action)}
              nextAchievement={{
                title: "Early Bird",
                progress: 7,
                target: 10
              }}
            />
          </div>

          {/* Social Betting Feed */}
          <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">Social Betting Feed</h2>
            <SocialBettingFeed
              bets={[
                {
                  id: '1',
                  user: 'Alex',
                  amount: '0.5',
                  type: 'for',
                  timestamp: new Date(Date.now() - 300000),
                  isCurrentUser: false,
                  likes: 2
                },
                {
                  id: '2',
                  user: 'You',
                  amount: '1.2',
                  type: 'against',
                  timestamp: new Date(Date.now() - 120000),
                  isCurrentUser: true,
                  likes: 0
                },
                {
                  id: '3',
                  user: 'Sam',
                  amount: '0.8',
                  type: 'for',
                  timestamp: new Date(Date.now() - 60000),
                  isCurrentUser: false,
                  likes: 1
                }
              ]}
              commitmentId="demo-commitment-1"
              onBetAction={(betId, action) => console.log('Bet action:', betId, action)}
            />
          </div>

          {/* Achievement Showcase */}
          <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">Achievement Showcase</h2>
            <AchievementShowcase
              achievements={[
                {
                  id: 'punctual-1',
                  title: 'First Commitment',
                  description: 'Complete your first punctuality commitment',
                  icon: '🎯',
                  unlocked: true,
                  unlockDate: new Date(Date.now() - 86400000),
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
              onAchievementClick={(id) => console.log('Achievement clicked:', id)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}