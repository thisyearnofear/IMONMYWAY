"use client";

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/PremiumButton';
import { useUIStore } from '@/stores/uiStore';

interface ShareCommitmentButtonProps {
  commitmentId: string;
  stakeAmount?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function ShareCommitmentButton({
  commitmentId,
  stakeAmount,
  variant = 'secondary',
  size = 'sm',
}: ShareCommitmentButtonProps) {
  const [isSharing, setIsSharing] = useState(false);
  const { addToast } = useUIStore();

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/commitment/${commitmentId}`
    : '';

  const shareText = stakeAmount
    ? `I just placed a ${stakeAmount} STT punctuality bet on IMONMYWAY 🎯`
    : `Check out this punctuality commitment on IMONMYWAY 🎯`;

  const handleShare = useCallback(async () => {
    setIsSharing(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'IMONMYWAY — Punctuality Commitment',
          text: shareText,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
        addToast({ message: 'Link copied to clipboard', type: 'success' });
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        addToast({ message: 'Failed to share', type: 'error' });
      }
    } finally {
      setIsSharing(false);
    }
  }, [shareUrl, shareText, addToast]);

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleShare}
      disabled={isSharing || !shareUrl}
      aria-label="Share this commitment"
    >
      {isSharing ? 'Sharing...' : 'Share'}
    </Button>
  );
}
