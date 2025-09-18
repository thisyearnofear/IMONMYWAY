'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Test scenarios for viral features
interface TestScenario {
  id: string;
  name: string;
  description: string;
  component: React.ComponentType<any>;
  metrics: string[];
  expectedOutcome: string;
}

interface TestResult {
  scenarioId: string;
  passed: boolean;
  metrics: Record<string, number>;
  feedback: string;
  timestamp: number;
}

interface ViralTestSuiteProps {
  onTestComplete?: (results: TestResult[]) => void;
  autoRun?: boolean;
}

// Mock components for testing
const MockSocialShare = ({ onShare }: { onShare: () => void }) => (
  <motion.button
    onClick={onShare}
    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    Share Achievement
  </motion.button>
);

const MockAchievementPopup = ({ achievement, onClose }: { achievement: string; onClose: () => void }) => (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    exit={{ scale: 0, opacity: 0 }}
    className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
  >
    <div className="bg-white rounded-xl p-6 max-w-sm mx-4">
      <h3 className="text-xl font-bold text-center mb-4">🎉 Achievement Unlocked!</h3>
      <p className="text-center text-gray-600 mb-4">{achievement}</p>
      <button
        onClick={onClose}
        className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors"
      >
        Awesome!
      </button>
    </div>
  </motion.div>
);

const MockViralMoment = ({ onTrigger }: { onTrigger: () => void }) => {
  const [streak, setStreak] = useState(0);
  
  const handleClick = () => {
    setStreak(prev => prev + 1);
    if (streak >= 4) {
      onTrigger();
      setStreak(0);
    }
  };

  return (
    <div className="text-center">
      <p className="mb-4">Click to build streak (5 clicks triggers viral moment)</p>
      <motion.button
        onClick={handleClick}
        className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Streak: {streak}/5
      </motion.button>
    </div>
  );
};

export default function ViralTestSuite({ onTestComplete, autoRun = false }: ViralTestSuiteProps) {
  const [currentTest, setCurrentTest] = useState<number>(-1);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showAchievement, setShowAchievement] = useState(false);
  const [testMetrics, setTestMetrics] = useState<Record<string, number>>({});
  const startTimeRef = useRef<number>(0);

  const testScenarios: TestScenario[] = [
    {
      id: 'social-share',
      name: 'Social Share Engagement',
      description: 'Test if users are likely to share achievements',
      component: MockSocialShare,
      metrics: ['clickTime', 'hoverDuration', 'shareRate'],
      expectedOutcome: 'Users should click within 3 seconds and hover for at least 500ms'
    },
    {
      id: 'achievement-popup',
      name: 'Achievement Celebration',
      description: 'Test achievement popup engagement and retention',
      component: MockAchievementPopup,
      metrics: ['viewDuration', 'interactionRate', 'emotionalResponse'],
      expectedOutcome: 'Users should view for at least 2 seconds and show positive engagement'
    },
    {
      id: 'viral-moment',
      name: 'Viral Moment Trigger',
      description: 'Test streak-based viral moment generation',
      component: MockViralMoment,
      metrics: ['streakCompletion', 'timeToComplete', 'retryRate'],
      expectedOutcome: 'Users should complete streak within 30 seconds with high retry rate'
    }
  ];

  useEffect(() => {
    if (autoRun && !isRunning) {
      startTestSuite();
    }
  }, [autoRun, isRunning]);

  const startTestSuite = () => {
    setIsRunning(true);
    setCurrentTest(0);
    setTestResults([]);
    startTimeRef.current = performance.now();
  };

  const recordMetric = (key: string, value: number) => {
    setTestMetrics(prev => ({ ...prev, [key]: value }));
  };

  const completeCurrentTest = (passed: boolean, feedback: string) => {
    if (currentTest === -1) return;

    const scenario = testScenarios[currentTest];
    const result: TestResult = {
      scenarioId: scenario.id,
      passed,
      metrics: { ...testMetrics },
      feedback,
      timestamp: Date.now()
    };

    setTestResults(prev => [...prev, result]);
    setTestMetrics({});

    // Move to next test or complete suite
    if (currentTest < testScenarios.length - 1) {
      setCurrentTest(prev => prev + 1);
      startTimeRef.current = performance.now();
    } else {
      completeTestSuite();
    }
  };

  const completeTestSuite = () => {
    setIsRunning(false);
    setCurrentTest(-1);
    
    if (onTestComplete) {
      onTestComplete(testResults);
    }
  };

  // Test-specific handlers
  const handleSocialShare = () => {
    const clickTime = performance.now() - startTimeRef.current;
    recordMetric('clickTime', clickTime);
    recordMetric('shareRate', 1);
    
    const passed = clickTime < 3000;
    completeCurrentTest(passed, passed ? 'Quick engagement!' : 'Slow to engage');
  };

  const handleAchievementClose = () => {
    const viewDuration = performance.now() - startTimeRef.current;
    recordMetric('viewDuration', viewDuration);
    recordMetric('interactionRate', 1);
    
    const passed = viewDuration > 2000;
    completeCurrentTest(passed, passed ? 'Good retention!' : 'Too quick to dismiss');
    setShowAchievement(false);
  };

  const handleViralMomentTrigger = () => {
    const timeToComplete = performance.now() - startTimeRef.current;
    recordMetric('timeToComplete', timeToComplete);
    recordMetric('streakCompletion', 1);
    
    const passed = timeToComplete < 30000;
    completeCurrentTest(passed, passed ? 'Great engagement!' : 'Took too long');
  };

  const getCurrentTestComponent = () => {
    if (currentTest === -1) return null;

    const scenario = testScenarios[currentTest];
    const props: any = {};

    switch (scenario.id) {
      case 'social-share':
        props.onShare = handleSocialShare;
        break;
      case 'achievement-popup':
        props.achievement = "First Time User!";
        props.onClose = handleAchievementClose;
        break;
      case 'viral-moment':
        props.onTrigger = handleViralMomentTrigger;
        break;
    }

    return React.createElement(scenario.component, props);
  };

  const getOverallScore = () => {
    if (testResults.length === 0) return 0;
    const passedTests = testResults.filter(r => r.passed).length;
    return Math.round((passedTests / testResults.length) * 100);
  };

  const getViralPotentialRating = () => {
    const score = getOverallScore();
    if (score >= 80) return { rating: 'High', color: 'text-green-500', emoji: '🚀' };
    if (score >= 60) return { rating: 'Medium', color: 'text-yellow-500', emoji: '📈' };
    return { rating: 'Low', color: 'text-red-500', emoji: '📉' };
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Viral UX Test Suite</h2>
        <p className="text-gray-600">Testing shareability and engagement potential</p>
      </div>

      {/* Test Progress */}
      {isRunning && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">
              Test {currentTest + 1} of {testScenarios.length}
            </h3>
            <div className="text-sm text-gray-500">
              {Math.round(((currentTest + 1) / testScenarios.length) * 100)}% Complete
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <motion.div
              className="bg-blue-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentTest + 1) / testScenarios.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {currentTest >= 0 && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-medium mb-2">
                {testScenarios[currentTest].name}
              </h4>
              <p className="text-gray-600 mb-4">
                {testScenarios[currentTest].description}
              </p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                {getCurrentTestComponent()}
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Expected: {testScenarios[currentTest].expectedOutcome}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Test Results */}
      {!isRunning && testResults.length > 0 && (
        <div className="mb-8">
          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-gray-800 mb-2">
              {getOverallScore()}%
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg">Viral Potential:</span>
              <span className={`text-lg font-semibold ${getViralPotentialRating().color}`}>
                {getViralPotentialRating().emoji} {getViralPotentialRating().rating}
              </span>
            </div>
          </div>

          <div className="grid gap-4">
            {testResults.map((result, index) => (
              <motion.div
                key={result.scenarioId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border-2 ${
                  result.passed 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">
                    {testScenarios.find(s => s.id === result.scenarioId)?.name}
                  </h4>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    result.passed 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {result.passed ? '✅ Passed' : '❌ Failed'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{result.feedback}</p>
                <div className="text-xs text-gray-500">
                  Metrics: {Object.entries(result.metrics).map(([key, value]) => 
                    `${key}: ${typeof value === 'number' ? Math.round(value) : value}`
                  ).join(', ')}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="text-center">
        {!isRunning ? (
          <motion.button
            onClick={startTestSuite}
            className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {testResults.length > 0 ? 'Run Tests Again' : 'Start Viral Test Suite'}
          </motion.button>
        ) : (
          <div className="text-gray-500">
            Testing in progress... Follow the instructions above
          </div>
        )}
      </div>

      {/* Achievement Popup */}
      <AnimatePresence>
        {showAchievement && currentTest === 1 && (
          <MockAchievementPopup
            achievement="First Time User!"
            onClose={handleAchievementClose}
          />
        )}
      </AnimatePresence>

      {/* Start achievement test */}
      {currentTest === 1 && !showAchievement && (
        <div className="fixed bottom-4 right-4">
          <motion.button
            onClick={() => {
              setShowAchievement(true);
              startTimeRef.current = performance.now();
            }}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Trigger Achievement
          </motion.button>
        </div>
      )}
    </div>
  );
}