"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/PremiumButton";
import { ChallengeCommitment, ProofSubmission } from "@/lib/challenge-templates";
import { verificationService } from "@/lib/challenge-verification";

interface ChallengeStatusProps {
    challenge: ChallengeCommitment;
    onProofSubmit?: (proof: ProofSubmission) => void;
    className?: string;
}

export function ChallengeStatus({
    challenge,
    onProofSubmit,
    className = ""
}: ChallengeStatusProps) {
    const [isSubmittingProof, setIsSubmittingProof] = useState(false);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'text-yellow-400 bg-yellow-500/10';
            case 'in-progress': return 'text-blue-400 bg-blue-500/10';
            case 'completed': return 'text-green-400 bg-green-500/10';
            case 'failed': return 'text-red-400 bg-red-500/10';
            case 'verified': return 'text-emerald-400 bg-emerald-500/10';
            default: return 'text-gray-400 bg-gray-500/10';
        }
    };

    const getVerificationStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'text-yellow-400';
            case 'verified': return 'text-green-400';
            case 'rejected': return 'text-red-400';
            default: return 'text-gray-400';
        }
    };

    const handleProofUpload = async (file: File, type: 'photo' | 'video' | 'document') => {
        if (!onProofSubmit) return;

        setIsSubmittingProof(true);
        try {
            // In a real app, this would upload to a file service
            const mockUrl = URL.createObjectURL(file);

            const proof: ProofSubmission = {
                id: `proof-${Date.now()}`,
                type,
                data: { url: mockUrl, filename: file.name, size: file.size },
                timestamp: new Date(),
                verified: false
            };

            onProofSubmit(proof);
        } catch (error) {
            console.error('Error submitting proof:', error);
        } finally {
            setIsSubmittingProof(false);
        }
    };

    const timeRemaining = challenge.deadline.getTime() - Date.now();
    const isExpired = timeRemaining <= 0;
    const hoursRemaining = Math.max(0, Math.floor(timeRemaining / (1000 * 60 * 60)));
    const minutesRemaining = Math.max(0, Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60)));

    return (
        <div className={cn("bg-white/5 rounded-xl p-4 border border-white/10", className)}>
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-bold text-white text-lg">{challenge.name}</h3>
                    <p className="text-white/70 text-sm">{challenge.description}</p>
                </div>
                <span className={cn("text-xs px-2 py-1 rounded-full font-medium", getStatusColor(challenge.status))}>
                    {challenge.status.replace('-', ' ').toUpperCase()}
                </span>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/70">Progress</span>
                    <span className="text-white">{challenge.currentProgress}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${challenge.currentProgress}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
            </div>

            {/* Time Remaining */}
            <div className="mb-4 p-3 bg-white/5 rounded-lg">
                <div className="flex justify-between items-center">
                    <span className="text-white/70 text-sm">Time Remaining</span>
                    <span className={cn("font-mono font-bold", isExpired ? "text-red-400" : "text-white")}>
                        {isExpired ? "EXPIRED" : `${hoursRemaining}h ${minutesRemaining}m`}
                    </span>
                </div>
            </div>

            {/* Verification Status */}
            {challenge.verificationStatus && (
                <div className="mb-4 p-3 bg-white/5 rounded-lg">
                    <div className="flex justify-between items-center">
                        <span className="text-white/70 text-sm">Verification</span>
                        <span className={cn("font-medium text-sm", getVerificationStatusColor(challenge.verificationStatus))}>
                            {challenge.verificationStatus.toUpperCase()}
                        </span>
                    </div>
                </div>
            )}

            {/* Proof Submissions */}
            {challenge.proofSubmissions && challenge.proofSubmissions.length > 0 && (
                <div className="mb-4">
                    <h4 className="text-white font-medium text-sm mb-2">Submitted Proofs</h4>
                    <div className="space-y-2">
                        {challenge.proofSubmissions.map((proof, index) => (
                            <div key={proof.id} className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">
                                        {proof.type === 'photo' ? '📷' : proof.type === 'video' ? '🎥' : '📄'}
                                    </span>
                                    <span className="text-white/80 text-sm">{proof.type}</span>
                                </div>
                                <span className={cn("text-xs px-2 py-1 rounded-full",
                                    proof.verified ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                                )}>
                                    {proof.verified ? "Verified" : "Pending"}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            {challenge.status === 'in-progress' && !isExpired && (
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => document.getElementById('photo-upload')?.click()}
                        disabled={isSubmittingProof}
                    >
                        📷 Photo Proof
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => document.getElementById('video-upload')?.click()}
                        disabled={isSubmittingProof}
                    >
                        🎥 Video Proof
                    </Button>

                    <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleProofUpload(e.target.files[0], 'photo')}
                    />
                    <input
                        id="video-upload"
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleProofUpload(e.target.files[0], 'video')}
                    />
                </div>
            )}

            {challenge.status === 'completed' && challenge.verificationStatus === 'pending' && (
                <div className="text-center p-3 bg-yellow-500/10 rounded-lg">
                    <p className="text-yellow-400 text-sm">⏳ Awaiting verification...</p>
                </div>
            )}

            {challenge.status === 'completed' && challenge.verificationStatus === 'verified' && (
                <div className="text-center p-3 bg-green-500/10 rounded-lg">
                    <p className="text-green-400 text-sm">✅ Challenge completed and verified!</p>
                </div>
            )}
        </div>
    );
}