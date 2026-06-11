/**
 * Push notification service for agent activity.
 * Uses Web Push API — requires service worker + VAPID key in production.
 * For now, uses in-app toast notifications as the delivery mechanism.
 */

import { useAddToast } from '@/components/unified/UnifiedToast';

export interface NotificationPayload {
  title: string;
  body: string;
  type: 'success' | 'error' | 'warning' | 'info';
  commitmentId?: string;
}

class NotificationService {
  private permission: NotificationPermission = 'default';

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) return 'denied';
    this.permission = await Notification.requestPermission();
    return this.permission;
  }

  isSupported(): boolean {
    return 'Notification' in window;
  }

  getPermission(): NotificationPermission {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
    return this.permission;
  }
}

export const notificationService = new NotificationService();

/**
 * Hook for sending notifications — uses toast as fallback.
 * In production, integrate with a push notification backend.
 */
export function useNotifications() {
  const addToast = useAddToast();

  const sendNotification = (payload: NotificationPayload) => {
    // Always show in-app toast
    addToast({
      message: `${payload.title}: ${payload.body}`,
      type: payload.type,
      duration: payload.type === 'error' ? 8000 : 5000,
    });

    // Also send browser notification if permitted
    if (notificationService.getPermission() === 'granted') {
      try {
        new Notification(payload.title, {
          body: payload.body,
          icon: '/IOMYfavicon.ico',
          tag: payload.commitmentId || 'imonmyway',
        });
      } catch {
        // Service worker not registered — toast is sufficient
      }
    }
  };

  const notifyCommitmentCreated = (commitmentId: string, stake: string) => {
    sendNotification({
      title: 'Commitment Created',
      body: `Your agent staked ${stake} STT on a new punctuality commitment`,
      type: 'success',
      commitmentId,
    });
  };

  const notifyBetPlaced = (commitmentId: string, amount: string, forOrAgainst: string) => {
    sendNotification({
      title: 'Bet Placed',
      body: `${amount} STT bet ${forOrAgainst} your commitment`,
      type: 'info',
      commitmentId,
    });
  };

  const notifyDeadlineApproaching = (commitmentId: string, minutesLeft: number) => {
    sendNotification({
      title: 'Deadline Approaching',
      body: `Only ${minutesLeft} minutes remaining on your commitment`,
      type: 'warning',
      commitmentId,
    });
  };

  const notifySettled = (commitmentId: string, success: boolean) => {
    sendNotification({
      title: success ? 'Commitment Fulfilled!' : 'Commitment Failed',
      body: success
        ? 'Your agent arrived on time — stake returned with winnings'
        : 'Your agent missed the deadline — stake distributed to bettors',
      type: success ? 'success' : 'error',
      commitmentId,
    });
  };

  const notifyReputationChanged = (newScore: number, tier: string) => {
    sendNotification({
      title: 'Reputation Updated',
      body: `Your reputation is now ${newScore} — ${tier} tier`,
      type: 'info',
    });
  };

  return {
    sendNotification,
    notifyCommitmentCreated,
    notifyBetPlaced,
    notifyDeadlineApproaching,
    notifySettled,
    notifyReputationChanged,
    requestPermission: () => notificationService.requestPermission(),
  };
}
