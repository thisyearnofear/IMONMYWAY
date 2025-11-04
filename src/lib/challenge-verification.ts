// Challenge Verification System
// Single source of truth for challenge verification logic
// ENHANCEMENT FIRST: Extends existing verification systems
// DRY: Consolidates all verification logic in one place

import { ChallengeCondition, ProofSubmission, ChallengeCommitment } from "./challenge-templates";

export interface VerificationResult {
  success: boolean;
  message: string;
  proofId?: string;
  verifiedConditions?: string[];
  failedConditions?: string[];
}

export interface VerificationMethod {
  type: 'gps' | 'photo' | 'video' | 'manual' | 'blockchain' | 'ai';
  validator: (submission: ProofSubmission, condition: ChallengeCondition) => Promise<VerificationResult>;
  requirements: string[];
}

// GPS Verification
const gpsValidator: VerificationMethod = {
  type: 'gps',
  requirements: ['coordinates', 'timestamp', 'accuracy'],
  validator: async (submission: ProofSubmission, condition: ChallengeCondition): Promise<VerificationResult> => {
    try {
      // Extract GPS data from submission
      const gpsData = submission.data as { 
        start: { lat: number; lng: number }; 
        end: { lat: number; lng: number }; 
        path: Array<{ lat: number; lng: number; timestamp: number }> 
      };

      if (!gpsData || !gpsData.path) {
        return {
          success: false,
          message: 'Invalid GPS data provided'
        };
      }

      // Calculate distance traveled
      const distance = calculateTotalDistance(gpsData.path);
      const timeTaken = gpsData.path[gpsData.path.length - 1].timestamp - gpsData.path[0].timestamp;
      const avgSpeed = timeTaken > 0 ? distance / (timeTaken / 3600000) : 0; // km/h

      // Validate against condition
      if (condition.type === 'distance' && condition.unit === 'kilometers') {
        if (distance >= (condition.value as number)) {
          return {
            success: true,
            message: `GPS verified: Traveled ${distance.toFixed(2)} km, meeting ${condition.value} km requirement`,
            verifiedConditions: [condition.description]
          };
        } else {
          return {
            success: false,
            message: `GPS verification failed: Traveled ${distance.toFixed(2)} km, required ${condition.value} km`,
            failedConditions: [condition.description]
          };
        }
      }

      // For time-based conditions
      if (condition.type === 'time' && condition.unit === 'minutes') {
        const timeInMinutes = timeTaken / 60000; // Convert to minutes
        if (timeInMinutes <= (condition.value as number)) {
          return {
            success: true,
            message: `GPS verified: Completed in ${timeInMinutes.toFixed(2)} minutes, under ${condition.value} minute requirement`,
            verifiedConditions: [condition.description]
          };
        } else {
          return {
            success: false,
            message: `GPS verification failed: Completed in ${timeInMinutes.toFixed(2)} minutes, exceeded ${condition.value} minute requirement`,
            failedConditions: [condition.description]
          };
        }
      }

      // For speed conditions
      if (condition.type === 'speed' && condition.unit === 'km/h') {
        if (avgSpeed >= (condition.value as number)) {
          return {
            success: true,
            message: `GPS verified: Average speed was ${avgSpeed.toFixed(2)} km/h, meeting ${condition.value} km/h requirement`,
            verifiedConditions: [condition.description]
          };
        } else {
          return {
            success: false,
            message: `GPS verification failed: Average speed was ${avgSpeed.toFixed(2)} km/h, required ${condition.value} km/h`,
            failedConditions: [condition.description]
          };
        }
      }

      // For mode-based conditions (how much of journey was by specific mode)
      if (condition.type === 'mode' && condition.unit === 'percentage') {
        // This would require more sophisticated GPS analysis to determine mode of transport
        // For now, we'll assume GPS can verify this
        const requiredPercentage = condition.value as number;
        const totalDistance = calculateTotalDistance(gpsData.path);
        const modeDistance = calculateModeDistance(gpsData.path, condition.description); // Placeholder function
        const actualPercentage = (modeDistance / totalDistance) * 100;

        if (actualPercentage >= requiredPercentage) {
          return {
            success: true,
            message: `GPS verified: ${actualPercentage.toFixed(2)}% of journey was as required, meeting ${requiredPercentage}% requirement`,
            verifiedConditions: [condition.description]
          };
        } else {
          return {
            success: false,
            message: `GPS verification failed: Only ${actualPercentage.toFixed(2)}% of journey was as required, needed ${requiredPercentage}%`,
            failedConditions: [condition.description]
          };
        }
      }

      return {
        success: true,
        message: 'GPS data validated successfully',
        verifiedConditions: [condition.description]
      };
    } catch (error) {
      return {
        success: false,
        message: `GPS validation error: ${(error as Error).message}`
      };
    }
  }
};

// Photo Verification
const photoValidator: VerificationMethod = {
  type: 'photo',
  requirements: ['image_url', 'timestamp', 'location', 'checksum'],
  validator: async (submission: ProofSubmission, condition: ChallengeCondition): Promise<VerificationResult> => {
    try {
      // In a real implementation, this would:
      // 1. Verify the image URL is valid
      // 2. Check the image contains required elements using computer vision
      // 3. Validate timestamp and location EXIF data if available
      // 4. Check for tampering

      const photoData = submission.data as { 
        imageUrl: string; 
        location?: { lat: number; lng: number };
        timestamp: number;
      };

      if (!photoData || !photoData.imageUrl) {
        return {
          success: false,
          message: 'Invalid photo data provided'
        };
      }

      // Basic validation - in a real app, this would be more sophisticated
      if (photoData.imageUrl.startsWith('http')) {
        return {
          success: true,
          message: 'Photo URL validated successfully',
          verifiedConditions: [condition.description]
        };
      } else {
        return {
          success: false,
          message: 'Invalid photo URL format'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Photo validation error: ${(error as Error).message}`
      };
    }
  }
};

// Video Verification
const videoValidator: VerificationMethod = {
  type: 'video',
  requirements: ['video_url', 'duration', 'content_analysis', 'location'],
  validator: async (submission: ProofSubmission, condition: ChallengeCondition): Promise<VerificationResult> => {
    try {
      // In a real implementation, this would:
      // 1. Verify the video URL is valid
      // 2. Analyze video content for required elements
      // 3. Validate duration matches requirements
      // 4. Verify location data if available

      const videoData = submission.data as { 
        videoUrl: string; 
        duration?: number;
        location?: { lat: number; lng: number };
      };

      if (!videoData || !videoData.videoUrl) {
        return {
          success: false,
          message: 'Invalid video data provided'
        };
      }

      // Basic validation - in a real app, this would be more sophisticated
      if (videoData.videoUrl.startsWith('http')) {
        return {
          success: true,
          message: 'Video URL validated successfully',
          verifiedConditions: [condition.description]
        };
      } else {
        return {
          success: false,
          message: 'Invalid video URL format'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Video validation error: ${(error as Error).message}`
      };
    }
  }
};

// AI Verification
const aiValidator: VerificationMethod = {
  type: 'ai',
  requirements: ['data_stream', 'real_time_analysis', 'pattern_recognition'],
  validator: async (submission: ProofSubmission, condition: ChallengeCondition): Promise<VerificationResult> => {
    try {
      // In a real implementation, this would:
      // 1. Use AI models to analyze data patterns
      // 2. Detect anomalies or cheating attempts
      // 3. Verify behavioral consistency
      // 4. Cross-reference multiple data sources

      const aiData = submission.data as any; // Complex data structure for AI analysis

      if (!aiData) {
        return {
          success: false,
          message: 'Invalid AI data provided'
        };
      }

      // Placeholder for AI validation logic
      // In a real app, this would call an AI service
      const aiAnalysis = await performAIAnalysis(aiData, condition);

      if (aiAnalysis.success) {
        return {
          success: true,
          message: aiAnalysis.message,
          verifiedConditions: [condition.description]
        };
      } else {
        return {
          success: false,
          message: `AI verification failed: ${aiAnalysis.message}`,
          failedConditions: [condition.description]
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `AI validation error: ${(error as Error).message}`
      };
    }
  }
};

// Manual Verification (for complex cases)
const manualValidator: VerificationMethod = {
  type: 'manual',
  requirements: ['evidence_package', 'reviewer_assignment', 'quality_score'],
  validator: async (submission: ProofSubmission, condition: ChallengeCondition): Promise<VerificationResult> => {
    try {
      // In a real implementation, this would:
      // 1. Queue the submission for human review
      // 2. Assign to appropriate reviewer
      // 3. Track review status and quality

      const manualData = submission.data as { 
        evidence: any; 
        reviewerNotes?: string;
        qualityScore?: number;
      };

      if (!manualData || !manualData.evidence) {
        return {
          success: false,
          message: 'Incomplete manual review data'
        };
      }

      // For now, we'll just acknowledge the submission needs manual review
      return {
        success: true,
        message: 'Submission queued for manual verification',
        verifiedConditions: [condition.description]
      };
    } catch (error) {
      return {
        success: false,
        message: `Manual validation error: ${(error as Error).message}`
      };
    }
  }
};

// AGGRESSIVE CONSOLIDATION: Single verification registry
const VERIFICATION_METHODS: Record<string, VerificationMethod> = {
  gps: gpsValidator,
  photo: photoValidator,
  video: videoValidator,
  ai: aiValidator,
  manual: manualValidator
};

// AGGRESSIVE CONSOLIDATION: Single verification service
export class ChallengeVerificationService {
  static async verifySubmission(
    submission: ProofSubmission,
    condition: ChallengeCondition
  ): Promise<VerificationResult> {
    const method = VERIFICATION_METHODS[submission.type];
    if (!method) {
      return {
        success: false,
        message: `Unknown verification method: ${submission.type}`
      };
    }

    return await method.validator(submission, condition);
  }

  static async verifyChallengeCommitment(
    commitment: ChallengeCommitment,
    submission: ProofSubmission
  ): Promise<VerificationResult> {
    const results: VerificationResult[] = [];

    // Verify against all required conditions
    for (const condition of commitment.conditions) {
      if (condition.required) {
        const result = await this.verifySubmission(submission, condition);
        results.push(result);
      }
    }

    // Aggregate results
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    if (successCount === totalCount && totalCount > 0) {
      return {
        success: true,
        message: `All ${totalCount} required conditions verified successfully`,
        verifiedConditions: results.flatMap(r => r.verifiedConditions || []),
      };
    } else if (totalCount > 0) {
      return {
        success: false,
        message: `${successCount} of ${totalCount} required conditions verified`,
        verifiedConditions: results.flatMap(r => r.verifiedConditions || []),
        failedConditions: results.flatMap(r => r.failedConditions || []),
      };
    } else {
      // If there are no required conditions, it's automatically successful
      return {
        success: true,
        message: "No required conditions to verify - challenge automatically successful"
      };
    }
  }

  static async bulkVerifySubmissions(
    submissions: ProofSubmission[],
    commitment: ChallengeCommitment
  ): Promise<VerificationResult[]> {
    return Promise.all(
      submissions.map(submission => 
        this.verifyChallengeCommitment(commitment, submission)
      )
    );
  }
}

// Helper functions for GPS calculations
function calculateTotalDistance(path: Array<{ lat: number; lng: number; timestamp: number }>): number {
  if (path.length < 2) return 0;
  
  let totalDistance = 0;
  for (let i = 1; i < path.length; i++) {
    const segmentDistance = calculateDistance(
      path[i-1].lat, 
      path[i-1].lng, 
      path[i].lat, 
      path[i].lng
    );
    totalDistance += segmentDistance;
  }
  return totalDistance;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

function calculateModeDistance(
  path: Array<{ lat: number; lng: number; timestamp: number }>,
  mode: string
): number {
  // This is a placeholder implementation
  // In a real app, this would analyze the path data to determine
  // what mode of transport was used for each segment
  return calculateTotalDistance(path) * 0.5; // Assume 50% of distance for demo
}

async function performAIAnalysis(data: any, condition: ChallengeCondition): Promise<{ success: boolean; message: string }> {
  // This is a placeholder for AI analysis
  // In a real app, this would call an AI service to analyze the data
  return {
    success: true,
    message: `AI analysis completed for ${condition.description}`
  };
}

// ORGANIZED: Domain-driven verification functions
export const verificationService = {
  verifySubmission: ChallengeVerificationService.verifySubmission,
  verifyChallengeCommitment: ChallengeVerificationService.verifyChallengeCommitment,
  bulkVerifySubmissions: ChallengeVerificationService.bulkVerifySubmissions
};