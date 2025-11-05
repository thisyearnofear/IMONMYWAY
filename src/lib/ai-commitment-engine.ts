/**
 * AI Commitment Engine - CLEAN approach using on-chain + social data
 * 
 * PRINCIPLES FOLLOWED:
 * - ENHANCEMENT FIRST: Enhances existing blockchain + social data
 * - PREVENT BLOAT: No database, leverages existing social networks
 * - DRY: Single source of truth (blockchain + Farcaster/Twitter)
 * - CLEAN: Simple, focused functionality
 */

import { contractService } from '@/services/contractService';
import { veniceClient, isVeniceAvailable } from '@/lib/venice-client';

// Social proof interfaces
export interface SocialProof {
    platform: 'farcaster' | 'twitter';
    postId: string;
    reactions: number;
    comments: number;
    sentiment: 'positive' | 'neutral' | 'negative';
    timestamp: number;
}

export interface SocialReputation {
    totalProofs: number;
    avgReactions: number;
    sentimentScore: number; // -1 to 1
    socialCredibility: number; // 0 to 1
}

export interface AICommitmentSuggestion {
    estimatedPace: number;      // seconds per meter
    suggestedDeadline: number;  // minutes from now
    confidenceLevel: number;    // 0-1, how confident we are
    reasoning: string;          // Human-readable explanation
    socialBoost: number;        // 0-1, social reputation multiplier
    viralPotential: number;     // 0-1, likelihood of social sharing
}

export class AICommitmentEngine {

    /**
     * Get social reputation from Farcaster/Twitter activity
     */
    static async getSocialReputation(userAddress: string): Promise<SocialReputation> {
        try {
            // TODO: Integrate with Farcaster API
            // Query user's casts about punctuality commitments
            // Analyze reactions, comments, sentiment

            // TODO: Integrate with Twitter API  
            // Query tweets with commitment hashtags
            // Analyze engagement metrics

            // For now, return mock data
            return {
                totalProofs: 0,
                avgReactions: 0,
                sentimentScore: 0,
                socialCredibility: 0.5 // Neutral for new users
            };
        } catch (error) {
            console.error('Error fetching social reputation:', error);
            return {
                totalProofs: 0,
                avgReactions: 0,
                sentimentScore: 0,
                socialCredibility: 0.5
            };
        }
    }

    /**
     * Generate viral-ready commitment message for social sharing
     */
    static generateSocialMessage(
        suggestion: AICommitmentSuggestion,
        destination: string,
        context: 'work' | 'social' | 'urgent'
    ): string {
        const contextEmojis = {
            'work': '💼',
            'social': '🎉',
            'urgent': '🚨'
        };

        const emoji = contextEmojis[context];
        const confidence = Math.round(suggestion.confidenceLevel * 100);

        return `${emoji} Making a punctuality commitment! 
📍 Destination: ${destination}
⏰ AI suggests: ${suggestion.suggestedDeadline} minutes
🎯 Confidence: ${confidence}%
💰 Putting my money where my mouth is on @imonmyway

Will I make it on time? 🤔 #PunctualityChallenge #Web3 #IMONMYWAY`;
    }

    /**
     * Generate AI-powered commitment suggestions based on on-chain + social history
     */
    static async generateSuggestion(
        userAddress: string,
        distance: number, // meters
        context: 'work' | 'social' | 'urgent'
    ): Promise<AICommitmentSuggestion> {

        try {
            // Get user's historical performance from blockchain
            const history = await contractService.getUserPerformanceHistory(userAddress);

            // Get social reputation from Farcaster/Twitter
            const socialRep = await this.getSocialReputation(userAddress);

            // Try Venice AI enhancement first (if available and user has paid)
            if (await isVeniceAvailable() && history.length > 0) {
                console.log('🧠 Attempting Venice AI enhancement...');

                const veniceRecommendation = await veniceClient.generatePaceRecommendation(
                    userAddress,
                    history,
                    context,
                    distance / 1000 // Convert meters to km
                );

                if (veniceRecommendation) {
                    // Check if payment is required
                    if (veniceRecommendation.paymentRequired) {
                        console.log('💰 Payment required for Venice AI - falling back to rule-based');
                        return this.getRuleBasedRecommendation(history, context, distance, socialRep);
                    }

                    console.log('✅ Venice AI recommendation received:', veniceRecommendation);

                    // Enhance with blockchain data for social metrics
                    const socialBoost = socialRep.socialCredibility;
                    const viralPotential = Math.min(0.9, socialRep.totalProofs / 10 + socialRep.sentimentScore * 0.3);

                    return {
                        estimatedPace: veniceRecommendation.recommendedPace,
                        suggestedDeadline: Math.ceil((distance * veniceRecommendation.recommendedPace) / 60) + this.calculateBuffer(context, veniceRecommendation.confidence, history.length),
                        confidenceLevel: veniceRecommendation.confidence,
                        reasoning: `🤖 AI Enhanced: ${veniceRecommendation.reasoning}`,
                        socialBoost,
                        viralPotential
                    };
                }
            }

            // Fallback to rule-based algorithm
            console.log('⏭️ Using rule-based algorithm (Venice AI not available or payment required)');
            return this.getRuleBasedRecommendation(history, context, distance, socialRep);

        } catch (error) {
            console.error('Error generating AI suggestion:', error);
            return this.getNewUserSuggestion(distance, context);
        }
    }

    private static getNewUserSuggestion(distance: number, context: 'work' | 'social' | 'urgent'): AICommitmentSuggestion {
        // Conservative defaults for new users
        const conservativePace = 4.5; // ~17 min/mile walking pace
        const baseTime = (distance * conservativePace) / 60;

        const buffers = { 'urgent': 10, 'work': 15, 'social': 20 };
        const suggestedDeadline = Math.ceil(baseTime + buffers[context]);

        return {
            estimatedPace: conservativePace,
            suggestedDeadline,
            confidenceLevel: 0.3,
            reasoning: `New user - using conservative estimates. Complete more commitments to improve accuracy.`,
            socialBoost: 0.5, // Neutral for new users
            viralPotential: 0.8 // New users have high viral potential
        };
    }

    private static getStrugglingUserSuggestion(
        distance: number,
        context: 'work' | 'social' | 'urgent',
        totalAttempts: number
    ): AICommitmentSuggestion {
        // More conservative for users who haven't succeeded yet
        const conservativePace = 5.0; // Even slower
        const baseTime = (distance * conservativePace) / 60;

        const buffers = { 'urgent': 15, 'work': 20, 'social': 25 };
        const suggestedDeadline = Math.ceil(baseTime + buffers[context]);

        return {
            estimatedPace: conservativePace,
            suggestedDeadline,
            confidenceLevel: 0.2,
            reasoning: `Based on ${totalAttempts} previous attempts - using extra conservative timing to help you succeed.`,
            socialBoost: 0.3, // Lower for struggling users
            viralPotential: 0.9 // High viral potential for comeback stories
        };
    }

    private static calculateBuffer(context: string, consistency: number, historyLength: number): number {
        const baseBuffers = { 'urgent': 5, 'work': 10, 'social': 15 };
        let buffer = baseBuffers[context as keyof typeof baseBuffers] || 10;

        // Less consistent users need more buffer
        if (consistency < 0.5) {
            buffer += 10;
        } else if (consistency > 0.8) {
            buffer -= 5;
        }

        // More experienced users can have tighter buffers
        if (historyLength > 10) {
            buffer -= 3;
        }

        return Math.max(5, buffer);
    }

    private static generateReasoning(
        totalCommitments: number,
        successfulCommitments: number,
        consistency: number,
        context: string
    ): string {
        const successRate = (successfulCommitments / totalCommitments) * 100;

        let reasoning = `Based on ${totalCommitments} commitments (${successRate.toFixed(0)}% success rate). `;

        if (consistency > 0.7) {
            reasoning += "Your estimates are usually accurate. ";
        } else if (consistency < 0.4) {
            reasoning += "Added extra buffer since your estimates tend to be optimistic. ";
        }

        if (context === 'urgent') {
            reasoning += "Adjusted for urgent context - suggesting faster pace.";
        } else if (context === 'work') {
            reasoning += "Work context - balanced timing for professional punctuality.";
        } else {
            reasoning += "Social context - comfortable timing with flexibility.";
        }

        return reasoning;
    }

    private static getRuleBasedRecommendation(
        history: Array<any>,
        context: 'work' | 'social' | 'urgent',
        distance: number,
        socialRep: any
    ): AICommitmentSuggestion {
        if (history.length === 0) {
            return this.getNewUserSuggestion(distance, context);
        }

        // Analyze successful commitments only
        const successful = history.filter(h => h.successful);

        if (successful.length === 0) {
            return this.getStrugglingUserSuggestion(distance, context, history.length);
        }

        // Calculate average actual pace from successful commitments
        const actualPaces = successful.map(h => {
            const travelTime = h.actualArrivalTime - (h.arrivalDeadline - (h.estimatedDistance * h.estimatedPace));
            return travelTime / h.estimatedDistance;
        });

        const avgPace = actualPaces.reduce((sum, pace) => sum + pace, 0) / actualPaces.length;

        // Calculate consistency (how often estimates match reality)
        const estimateErrors = successful.map(h => {
            const actualPace = (h.actualArrivalTime - (h.arrivalDeadline - (h.estimatedDistance * h.estimatedPace))) / h.estimatedDistance;
            return Math.abs(h.estimatedPace - actualPace) / h.estimatedPace;
        });

        const avgError = estimateErrors.reduce((sum, err) => sum + err, 0) / estimateErrors.length;
        const consistency = Math.max(0, 1 - avgError);

        // Context-based adjustments
        const contextMultipliers = {
            'urgent': 0.85,   // 15% faster when urgent
            'work': 0.9,      // 10% faster for work
            'social': 1.0     // Normal pace for social
        };

        const adjustedPace = avgPace * contextMultipliers[context];

        // Calculate suggested deadline with buffer
        const baseTimeMinutes = (distance * adjustedPace) / 60;
        const bufferMinutes = this.calculateBuffer(context, consistency, history.length);
        const suggestedDeadline = Math.ceil(baseTimeMinutes + bufferMinutes);

        // Calculate social boost and viral potential
        const socialBoost = socialRep.socialCredibility;
        const viralPotential = Math.min(0.9, socialRep.totalProofs / 10 + socialRep.sentimentScore * 0.3);

        return {
            estimatedPace: adjustedPace,
            suggestedDeadline,
            confidenceLevel: Math.min(0.9, consistency * (history.length / 10)),
            reasoning: this.generateReasoning(history.length, successful.length, consistency, context),
            socialBoost,
            viralPotential
        };
    }
}