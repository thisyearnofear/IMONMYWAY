"use client";

import { useState, useEffect } from "react";
import { Button } from '@/components/ui/PremiumButton'
import { SuccessAnimation } from "@/components/ui/SuccessAnimation";
import { useAIEngine } from '@/hooks/useAIEngine'

export function AchievementDisplay({ userId }: { userId?: string }) {
  // Mock achievements data
  const achievements = [
    { id: 'first_commitment', title: 'First Steps', description: 'Create your first commitment', icon: '🎯', unlocked: true },
    { id: 'punctual', title: 'Punctual', description: 'Arrive on time 5 times', icon: '⏰', unlocked: false, progress: 2, maxProgress: 5 },
    { id: 'streak', title: 'Consistent', description: 'Maintain a 7-day streak', icon: '🔥', unlocked: false, progress: 3, maxProgress: 7 }
  ];

  const streak = { current: 3, longest: 5 };
  const showCelebration = null as any;
  const dismissCelebration = () => {};

  const getUnlockedAchievements = () => achievements.filter(a => a.unlocked);
  const getProgressAchievements = () => achievements.filter(a => !a.unlocked && a.progress !== undefined);

  const [showAll, setShowAll] = useState(false);
  const { predictAchievements, aiPerformanceMetrics } = useAIEngine()
  const [predictedAchievements, setPredictedAchievements] = useState<any[]>([])
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false)

  // Load AI predictions when component mounts and userId is provided
  useEffect(() => {
    if (userId) {
      loadPredictedAchievements()
    }
  }, [userId])

  const loadPredictedAchievements = async () => {
    if (!userId || !predictAchievements) return
    
    setIsLoadingPredictions(true)
    try {
      const predictions = await predictAchievements(userId, 30)
      setPredictedAchievements(predictions.predictedAchievements)
    } catch (error) {
      console.error('Error loading achievement predictions:', error)
    } finally {
      setIsLoadingPredictions(false)
    }
  }

  const unlockedAchievements = getUnlockedAchievements();
  const progressAchievements = getProgressAchievements();

  const displayAchievements = showAll ? [...achievements, ...predictedAchievements.map((pred, index) => ({
    id: `predicted-${index}`,
    title: pred.achievementId.replace(/_/g, ' '),
    description: `AI predicts you'll unlock this in ${pred.timeframe} days`,
    icon: '🔮',
    unlocked: false,
    probability: pred.probability,
    timeframe: pred.timeframe
  }))] : [...unlockedAchievements, ...predictedAchievements.slice(0, 2).map((pred, index) => ({
    id: `predicted-${index}`,
    title: pred.achievementId.replace(/_/g, ' '),
    description: `AI predicts ${Math.round(pred.probability * 100)}% chance in ${pred.timeframe} days`,
    icon: '🔮',
    unlocked: false,
    probability: pred.probability,
    timeframe: pred.timeframe
  }))];

  return (
    <>
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Achievements</h2>
            <p className="text-sm text-gray-600">
              {unlockedAchievements.length} of {achievements.length + predictedAchievements.length} unlocked
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {streak.current}
            </div>
            <div className="text-xs text-gray-600">Day Streak</div>
          </div>
        </div>

        {/* AI Confidence Banner */}
        {aiPerformanceMetrics.modelConfidence > 0.7 && (
          <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <div className="flex items-center text-sm text-blue-800">
              <span className="mr-2">🤖</span>
              <span>AI predicts your next achievements with {Math.round(aiPerformanceMetrics.modelConfidence * 100)}% confidence</span>
              <button 
                onClick={loadPredictedAchievements}
                className="ml-auto text-blue-600 hover:text-blue-800 underline"
                disabled={isLoadingPredictions}
              >
                {isLoadingPredictions ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        )}

        {/* Achievement Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {displayAchievements.map((achievement: any) => (
            <div
              key={achievement.id}
              className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                achievement.unlocked
                  ? "border-green-200 bg-green-50 shadow-md"
                  : achievement.probability
                  ? "border-purple-200 bg-purple-50 opacity-90"
                  : "border-gray-200 bg-gray-50 opacity-60"
              }`}
            >
              <div className="text-center">
                <div
                  className={`text-3xl mb-2 ${
                    achievement.unlocked ? "animate-bounce-gentle" : ""
                  }`}
                >
                  {achievement.icon}
                </div>
                <h3
                  className={`font-semibold text-sm mb-1 ${
                    achievement.unlocked 
                      ? "text-green-800" 
                      : achievement.probability
                      ? "text-purple-800"
                      : "text-gray-600"
                  }`}
                >
                  {achievement.title}
                </h3>
                <p
                  className={`text-xs ${
                    achievement.unlocked 
                      ? "text-green-600" 
                      : achievement.probability
                      ? "text-purple-600"
                      : "text-gray-500"
                  }`}
                >
                  {achievement.description}
                </p>
                {achievement.progress !== undefined &&
                  !achievement.unlocked && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div
                          className="bg-blue-600 h-1 rounded-full transition-all duration-500"
                          style={{
                            width: `${
                              (achievement.progress /
                                (achievement.maxProgress || 1)) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {achievement.progress}/{achievement.maxProgress}
                      </div>
                    </div>
                  )}
                {achievement.probability && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Probability</span>
                      <span>{Math.round(achievement.probability * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                      <div
                        className="bg-purple-600 h-1 rounded-full transition-all duration-500"
                        style={{
                          width: `${achievement.probability * 100}%`,
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      in {achievement.timeframe} days
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Show More/Less Button */}
        {achievements.length + predictedAchievements.length > unlockedAchievements.length && (
          <div className="text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll
                ? "Show Unlocked Only"
                : `Show All (${achievements.length + predictedAchievements.length})`}
            </Button>
          </div>
        )}

        {/* Streak Info */}
        {streak.current > 0 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-orange-900">
                  🔥 Current Streak
                </h3>
                <p className="text-sm text-orange-700">
                  {streak.current} day{streak.current !== 1 ? "s" : ""} • Best:{" "}
                  {streak.longest} days
                </p>
              </div>
              <div className="text-2xl">
                {streak.current >= 7 ? "⚡" : streak.current >= 3 ? "🔥" : "✨"}
              </div>
            </div>
            
            {/* AI Streak Prediction */}
            {predictedAchievements.some(pred => pred.achievementId.includes('streak')) && (
              <div className="mt-3 pt-3 border-t border-orange-200">
                <div className="flex items-center text-sm text-purple-800">
                  <span className="mr-2">🔮</span>
                  <span>
                    AI predicts you'll extend your streak to {streak.current + 5} days 
                    with {Math.round(aiPerformanceMetrics.modelConfidence * 100)}% confidence
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Achievement Celebration */}
      {showCelebration && (
        <SuccessAnimation
          show={!!showCelebration}
          message={`Achievement Unlocked: ${showCelebration.title}!`}
          onComplete={dismissCelebration}
        />
      )}
    </>
  );
}
