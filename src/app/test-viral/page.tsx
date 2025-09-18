'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ViralTestSuite from '../../components/testing/ViralTestSuite';
import { ComponentSystem } from '../../components/system/ComponentSystem';

interface TestResult {
  scenarioId: string;
  passed: boolean;
  metrics: Record<string, number>;
  feedback: string;
  timestamp: number;
}

export default function TestViralPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [showLiveDemo, setShowLiveDemo] = useState(false);
  const [demoStats, setDemoStats] = useState({
    shares: 0,
    achievements: 0,
    viralMoments: 0
  });

  const handleTestComplete = (results: TestResult[]) => {
    setTestResults(results);
    
    // Simulate analytics tracking
    console.log('Viral Test Results:', results);
    
    // Calculate viral metrics
    const viralScore = calculateViralScore(results);
    console.log('Viral Score:', viralScore);
  };

  const calculateViralScore = (results: TestResult[]): number => {
    let score = 0;
    let totalWeight = 0;

    results.forEach(result => {
      const weight = getTestWeight(result.scenarioId);
      totalWeight += weight;
      
      if (result.passed) {
        score += weight;
        
        // Bonus points for exceptional performance
        if (result.scenarioId === 'social-share' && result.metrics.clickTime < 1500) {
          score += weight * 0.2;
        }
        if (result.scenarioId === 'achievement-popup' && result.metrics.viewDuration > 3000) {
          score += weight * 0.3;
        }
        if (result.scenarioId === 'viral-moment' && result.metrics.timeToComplete < 15000) {
          score += weight * 0.5;
        }
      }
    });

    return totalWeight > 0 ? Math.round((score / totalWeight) * 100) : 0;
  };

  const getTestWeight = (scenarioId: string): number => {
    const weights = {
      'social-share': 3,
      'achievement-popup': 2,
      'viral-moment': 4
    };
    return weights[scenarioId as keyof typeof weights] || 1;
  };

  const handleDemoAction = (action: string) => {
    setDemoStats(prev => ({
      ...prev,
      [action]: prev[action as keyof typeof prev] + 1
    }));
  };

  const getViralPrediction = () => {
    if (testResults.length === 0) return null;

    const score = calculateViralScore(testResults);
    const passedTests = testResults.filter(r => r.passed).length;
    
    let prediction = '';
    let confidence = 0;
    let recommendations: string[] = [];

    if (score >= 85) {
      prediction = 'High viral potential! This UX is likely to drive significant organic sharing.';
      confidence = 90;
      recommendations = [
        'Deploy with confidence',
        'Monitor sharing metrics closely',
        'Consider A/B testing different viral triggers'
      ];
    } else if (score >= 70) {
      prediction = 'Good viral potential with room for optimization.';
      confidence = 75;
      recommendations = [
        'Optimize slower-performing elements',
        'Test with different user segments',
        'Consider additional gamification elements'
      ];
    } else if (score >= 50) {
      prediction = 'Moderate viral potential. Significant improvements needed.';
      confidence = 60;
      recommendations = [
        'Redesign underperforming components',
        'Simplify user interactions',
        'Add more compelling incentives to share'
      ];
    } else {
      prediction = 'Low viral potential. Major UX improvements required.';
      confidence = 40;
      recommendations = [
        'Complete UX redesign recommended',
        'Focus on user motivation and friction reduction',
        'Consider different viral mechanics'
      ];
    }

    return { prediction, confidence, recommendations, score };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <ComponentSystem>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Viral UX Testing Lab
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Test and validate the viral potential of your user experience with our comprehensive testing suite.
              Measure engagement, shareability, and viral mechanics effectiveness.
            </p>
          </motion.div>

          {/* Navigation Tabs */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-lg p-1 shadow-md">
              <button
                onClick={() => setShowLiveDemo(false)}
                className={`px-6 py-2 rounded-md transition-colors ${
                  !showLiveDemo 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Automated Tests
              </button>
              <button
                onClick={() => setShowLiveDemo(true)}
                className={`px-6 py-2 rounded-md transition-colors ${
                  showLiveDemo 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Live Demo
              </button>
            </div>
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {!showLiveDemo ? (
              <motion.div
                key="tests"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <ViralTestSuite onTestComplete={handleTestComplete} />

                {/* Results Analysis */}
                {testResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-12 bg-white rounded-xl shadow-lg p-8"
                  >
                    <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                      Viral Potential Analysis
                    </h3>

                    {(() => {
                      const analysis = getViralPrediction();
                      if (!analysis) return null;

                      return (
                        <div className="space-y-6">
                          {/* Score Display */}
                          <div className="text-center">
                            <div className="text-5xl font-bold text-blue-600 mb-2">
                              {analysis.score}
                            </div>
                            <div className="text-gray-600">Viral Score</div>
                            <div className="text-sm text-gray-500 mt-1">
                              Confidence: {analysis.confidence}%
                            </div>
                          </div>

                          {/* Prediction */}
                          <div className="bg-blue-50 rounded-lg p-6">
                            <h4 className="font-semibold text-blue-800 mb-2">Prediction</h4>
                            <p className="text-blue-700">{analysis.prediction}</p>
                          </div>

                          {/* Recommendations */}
                          <div className="bg-green-50 rounded-lg p-6">
                            <h4 className="font-semibold text-green-800 mb-3">Recommendations</h4>
                            <ul className="space-y-2">
                              {analysis.recommendations.map((rec, index) => (
                                <li key={index} className="flex items-start gap-2 text-green-700">
                                  <span className="text-green-500 mt-1">•</span>
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      );
                    })()}
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="demo"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Demo Stats */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
                    Live Demo Statistics
                  </h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-600">{demoStats.shares}</div>
                      <div className="text-sm text-blue-800">Shares</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-600">{demoStats.achievements}</div>
                      <div className="text-sm text-green-800">Achievements</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-purple-600">{demoStats.viralMoments}</div>
                      <div className="text-sm text-purple-800">Viral Moments</div>
                    </div>
                  </div>
                </div>

                {/* Live Components */}
                <div className="grid lg:grid-cols-2 gap-8">
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h4 className="text-lg font-semibold mb-4">Social Magnetism Demo</h4>
                    <div className="space-y-4">
                      <button
                        onClick={() => handleDemoAction('shares')}
                        className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Share Achievement 🚀
                      </button>
                      <button
                        onClick={() => handleDemoAction('viralMoments')}
                        className="w-full bg-purple-500 text-white py-3 px-4 rounded-lg hover:bg-purple-600 transition-colors"
                      >
                        Trigger Viral Moment ✨
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h4 className="text-lg font-semibold mb-4">Gamified Interface Demo</h4>
                    <div className="space-y-4">
                      <button
                        onClick={() => handleDemoAction('achievements')}
                        className="w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors"
                      >
                        Unlock Achievement 🏆
                      </button>
                      <button
                        onClick={() => handleDemoAction('shares')}
                        className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg hover:bg-orange-600 transition-colors"
                      >
                        Share Progress 📈
                      </button>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <h4 className="font-semibold text-yellow-800 mb-2">How to Test</h4>
                  <ul className="text-yellow-700 space-y-1 text-sm">
                    <li>• Interact with the components above to trigger viral moments</li>
                    <li>• Watch the statistics update in real-time</li>
                    <li>• Try different interaction patterns to see what drives engagement</li>
                    <li>• Pay attention to visual feedback and celebration animations</li>
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ComponentSystem>
    </div>
  );
}