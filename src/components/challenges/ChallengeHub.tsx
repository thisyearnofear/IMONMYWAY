"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/PremiumButton";
import { ChallengeCommitment } from "@/lib/challenge-templates";
import { ChallengeStatus } from "./ChallengeStatus";

interface ChallengeHubProps {
    userId: string;
    className?: string;
}

export function ChallengeHub({ userId, className = "" }: ChallengeHubProps) {
    const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'all'>('active');
    const [challenges, setChallenges] = useState<ChallengeCommitment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // ENHANCEMENT FIRST: Use existing challenge system
    useEffect(() => {
        // In a real app, this would fetch user's challenges from API
        const mockChallenges: ChallengeCommitment[] = [
            {
                id: 'london-to-france-eco',
                name: 'London to France Eco Challenge',
                description: 'Get from London to France with specific eco-friendly conditions',
                category: 'adventure',
                difficulty: 'hard',
                estimatedTime: 720,
                estimatedDistance: 500,
                stakeAmount: { min: 10, max: 100, suggested: 30 },
                conditions: [],
                proofRequirements: [],
                rewards: { achievement: 'Eco Adventurer', multiplier: 2.5 },
                socialImpact: true,
                viralFactor: 8,
                tags: ['adventure', 'eco'],
                isActive: true,
                createdAt: new Date('2025-01-15'),

                // Challenge commitment specific fields
                commitmentId: 'commit-123',
                userId,
                startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
                deadline: new Date(Date.now() + 10 * 60 * 60 * 1000), // 10 hours from now
                currentProgress: 35,
                status: 'in-progress',
                verificationStatus: 'pending',
                totalBetsFor: 150,
                totalBetsAgainst: 50,
                proofSubmissions: [
                    {
                        id: 'proof-1',
                        type: 'photo',
                        data: { url: '/mock-photo.jpg' },
                        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
                        verified: false
                    }
                ]
            }
        ];

        setChallenges(mockChallenges);
        setIsLoading(false);
    }, [userId]);

    const filteredChallenges = challenges.filter(challenge => {
        switch (activeTab) {
            case 'active':
                return ['pending', 'in-progress'].includes(challenge.status);
            case 'completed':
                return ['completed', 'verified', 'failed'].includes(challenge.status);
            default:
                return true;
        }
    });

    const tabs = [
        { id: 'active' as const, label: 'Active', count: challenges.filter(c => ['pending', 'in-progress'].includes(c.status)).length },
        { id: 'completed' as const, label: 'Completed', count: challenges.filter(c => ['completed', 'verified', 'failed'].includes(c.status)).length },
        { id: 'all' as const, label: 'All', count: challenges.length }
    ];

    if (isLoading) {
        return (
            <div className={cn("min-h-64 flex items-center justify-center", className)}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
                    <p className="text-white/70">Loading your challenges...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("space-y-6", className)}>
            {/* Header */}
            <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Your Challenges</h2>
                <p className="text-white/70">Track your active challenges and view your progress</p>
            </div>

            {/* Tabs */}
            <div className="flex justify-center">
                <div className="bg-white/5 rounded-xl p-1 border border-white/10">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            className={cn(
                                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                activeTab === tab.id
                                    ? "bg-blue-500 text-white"
                                    : "text-white/70 hover:text-white hover:bg-white/5"
                            )}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label} ({tab.count})
                        </button>
                    ))}
                </div>
            </div>

            {/* Challenge List */}
            <AnimatePresence mode="wait">
                {filteredChallenges.length === 0 ? (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="text-center py-12"
                    >
                        <div className="text-6xl mb-4">
                            {activeTab === 'active' ? '🎯' : activeTab === 'completed' ? '🏆' : '📋'}
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">
                            No {activeTab === 'all' ? '' : activeTab} challenges found
                        </h3>
                        <p className="text-white/70 mb-4">
                            {activeTab === 'active'
                                ? "Ready to start your first challenge?"
                                : "Complete some challenges to see them here"}
                        </p>
                        <Button variant="gradient" onClick={() => window.location.href = '/challenges'}>
                            Browse Challenges
                        </Button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                    >
                        {filteredChallenges.map((challenge, index) => (
                            <motion.div
                                key={challenge.commitmentId}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <ChallengeStatus
                                    challenge={challenge}
                                    onProofSubmit={(proof) => {
                                        // ENHANCEMENT FIRST: Update existing challenge state
                                        setChallenges(prev => prev.map(c =>
                                            c.commitmentId === challenge.commitmentId
                                                ? { ...c, proofSubmissions: [...(c.proofSubmissions || []), proof] }
                                                : c
                                        ));
                                    }}
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}