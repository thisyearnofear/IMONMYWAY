"use client";

import { useState } from "react";
import { useAchievements } from "@/hooks/useAchievements";
import { Button } from '@/components/ui/PremiumButton'
import { SuccessAnimation } from "@/components/ui/SuccessAnimation";

export function AchievementDisplay() {
  const {
    achievements,
    streak,
    showCelebration,
    dismissCelebration,
    getUnlockedAchievements,
    getProgressAchievements,
  } = useAchievements();

  const [showAll, setShowAll] = useState(false);

  const unlockedAchievements = getUnlockedAchievements();
  const progressAchievements = getProgressAchievements();

  const displayAchievements = showAll ? achievements : unlockedAchievements;

  return (
    <>
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Achievements</h2>
            <p className="text-sm text-gray-600">
              {unlockedAchievements.length} of {achievements.length} unlocked
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {streak.current}
            </div>
            <div className="text-xs text-gray-600">Day Streak</div>
          </div>
        </div>

        {/* Achievement Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {displayAchievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                achievement.unlocked
                  ? "border-green-200 bg-green-50 shadow-md"
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
                    achievement.unlocked ? "text-green-800" : "text-gray-600"
                  }`}
                >
                  {achievement.title}
                </h3>
                <p
                  className={`text-xs ${
                    achievement.unlocked ? "text-green-600" : "text-gray-500"
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
              </div>
            </div>
          ))}
        </div>

        {/* Show More/Less Button */}
        {achievements.length > unlockedAchievements.length && (
          <div className="text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll
                ? "Show Unlocked Only"
                : `Show All (${achievements.length})`}
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
