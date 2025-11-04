"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/PremiumButton";
import { ChallengeTemplate, ChallengeCondition, challengeService } from "@/lib/challenge-templates";
import { AIGeneratedChallenge, AIChallengePreferences, aiChallengeService } from "@/lib/ai-challenge-generator";
import { ChallengeCard } from "./ChallengeCard";
import { AIChallengePreferencesModal } from "./AIChallengePreferencesModal";

interface ChallengeBrowserProps {
  onSelectChallenge: (challenge: ChallengeTemplate) => void;
  className?: string;
}

export function ChallengeBrowser({
  onSelectChallenge,
  className = ""
}: ChallengeBrowserProps) {
  const [challenges, setChallenges] = useState<(ChallengeTemplate | AIGeneratedChallenge)[]>([]);
  const [filteredChallenges, setFilteredChallenges] = useState<(ChallengeTemplate | AIGeneratedChallenge)[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'popularity' | 'viral' | 'newest'>('popularity');
  const [isLoading, setIsLoading] = useState(true);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiPreferences, setAIPreferences] = useState<Partial<AIChallengePreferences>>({});

  // Initialize challenges
  useEffect(() => {
    setIsLoading(true);
    // In a real app, this would come from an API
    const allChallenges = challengeService.getTemplates();
    setChallenges(allChallenges);
    setFilteredChallenges(allChallenges);
    setIsLoading(false);
  }, []);

  // Filter and sort challenges
  useEffect(() => {
    let result = [...challenges];

    // Apply category filter
    if (selectedCategory !== 'all') {
      result = result.filter(challenge => challenge.category === selectedCategory);
    }

    // Apply search filter
    if (searchQuery) {
      result = result.filter(challenge =>
        challenge.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        challenge.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        challenge.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply sorting
    if (sortBy === 'popularity') {
      result.sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0));
    } else if (sortBy === 'viral') {
      result.sort((a, b) => b.viralFactor - a.viralFactor);
    } else if (sortBy === 'newest') {
      result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    setFilteredChallenges(result);
  }, [selectedCategory, searchQuery, sortBy, challenges]);

  const categories = [
    { id: 'all', name: 'All Challenges' },
    { id: 'adventure', name: 'Adventure' },
    { id: 'fitness', name: 'Fitness' },
    { id: 'social', name: 'Social' },
    { id: 'creative', name: 'Creative' },
    { id: 'viral', name: 'Viral' }
  ];

  const featuredChallenges = challenges.filter(c => c.popularityScore && c.popularityScore > 85);

  if (isLoading) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center", className)}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-white/70">Loading challenges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-8", className)}>
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Challenge Templates</h1>
        <p className="text-white/70 max-w-2xl mx-auto">
          Pick from our curated challenges or create your own. Each challenge comes with specific conditions,
          verification requirements, and rewards.
        </p>
      </div>

      {/* Featured Challenges */}
      {featuredChallenges.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>🌟</span> Featured Challenges
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredChallenges.slice(0, 3).map((challenge, index) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                onSelect={onSelectChallenge}
                isFeatured={true}
              />
            ))}
          </div>
        </section>
      )}

      {/* Filters and Search */}
      <section className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search challenges..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 text-white/50">
                🔍
              </div>
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id} className="bg-gray-800">
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-white/70 text-sm">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="popularity" className="bg-gray-800">Popularity</option>
              <option value="viral" className="bg-gray-800">Viral Potential</option>
              <option value="newest" className="bg-gray-800">Newest</option>
            </select>
          </div>
        </div>
      </section>

      {/* AI Challenge Generator */}
      <section className="mb-12">
        <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-2xl p-6 border border-purple-500/20">
          <div className="flex flex-col lg:flex-row gap-6 items-center">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                <span>🤖</span> AI Challenge Creator
              </h2>
              <p className="text-white/70 mb-4">
                Tell us your preferences and our AI will generate personalized challenges tailored just for you
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">AI-Powered</span>
                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">Dynamic</span>
                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">Personalized</span>
              </div>
            </div>
            <Button
              variant="gradient"
              onClick={() => setIsAIModalOpen(true)}
            >
              Create AI Challenge
            </Button>
          </div>
        </div>
      </section>

      {/* Multiplayer Challenge Section */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Multiplayer Challenges</h2>
          <Button
            variant="outline"
            onClick={() => {
              // ENHANCEMENT FIRST: Use existing AI modal with multiplayer preferences
              setAIPreferences({ socialPreference: 'friends' });
              setIsAIModalOpen(true);
            }}
          >
            Create Multiplayer Challenge
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {challenges
            .filter(c => (c as AIGeneratedChallenge).multiplayerOptions || c.tags.includes('social'))
            .slice(0, 3)
            .map((challenge, index) => (
              <motion.div
                key={`multi-${challenge.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative"
              >
                <ChallengeCard
                  challenge={challenge}
                  onSelect={onSelectChallenge}
                />
                <div className="absolute top-2 right-2 bg-blue-500/80 text-white text-xs px-2 py-1 rounded-full">
                  Multiplayer
                </div>
              </motion.div>
            ))}
        </div>
      </section>

      {/* Challenge Grid */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">
            All Challenges <span className="text-white/60 text-lg">({filteredChallenges.length})</span>
          </h2>
        </div>

        {filteredChallenges.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-white mb-2">No challenges found</h3>
            <p className="text-white/70 mb-4">Try adjusting your filters or search query</p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChallenges.map((challenge, index) => (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative"
              >
                <ChallengeCard
                  challenge={challenge}
                  onSelect={onSelectChallenge}
                />
                {(challenge as AIGeneratedChallenge).multiplayerOptions && (
                  <div className="absolute top-2 right-2 bg-blue-500/80 text-white text-xs px-2 py-1 rounded-full">
                    Multiplayer
                  </div>
                )}
                {(challenge as AIGeneratedChallenge).aiGenerationMetadata && (
                  <div className="absolute top-2 left-2 bg-purple-500/80 text-white text-xs px-2 py-1 rounded-full">
                    AI
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* AI Challenge Preferences Modal */}
      <AIChallengePreferencesModal
        isOpen={isAIModalOpen}
        onClose={() => {
          setIsAIModalOpen(false);
          setAIPreferences({});
        }}
        onChallengeGenerated={(aiChallenge) => {
          // ENHANCEMENT FIRST: Add AI challenge to existing challenges list
          setChallenges(prev => [aiChallenge, ...prev]);
          setIsAIModalOpen(false);
          setAIPreferences({});
        }}
        initialPreferences={aiPreferences}
      />
    </div>
  );
}