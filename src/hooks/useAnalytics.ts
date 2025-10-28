import { useEffect, useCallback } from 'react';

interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
}

// Simple analytics tracker (in a real app, this would integrate with your analytics service)
class SimpleAnalyticsTracker {
  private events: AnalyticsEvent[] = [];
  
  trackEvent(event: AnalyticsEvent) {
    // In a real implementation, this would send to Google Analytics, Mixpanel, etc.
    this.events.push(event);
    console.log('Analytics Event:', event);
    
    // Here you would typically send to your analytics service:
    // gtag('event', event.action, {
    //   event_category: event.category,
    //   event_label: event.label,
    //   value: event.value
    // });
  }
  
  trackPageView(page: string) {
    console.log('Page View:', page);
    // gtag('config', 'GA_MEASUREMENT_ID', {
    //   page_path: page
    // });
  }
  
  getEvents() {
    return [...this.events];
  }
}

const analyticsTracker = new SimpleAnalyticsTracker();

// Hook for tracking analytics events
export function useAnalytics() {
  const trackEvent = useCallback((event: AnalyticsEvent) => {
    analyticsTracker.trackEvent(event);
  }, []);
  
  const trackPageView = useCallback((page: string) => {
    analyticsTracker.trackPageView(page);
  }, []);
  
  const trackJourneySelect = useCallback((journeyId: string) => {
    trackEvent({
      category: 'Journey',
      action: 'Select',
      label: journeyId
    });
  }, [trackEvent]);
  
  const trackJourneyFilter = useCallback((filter: string) => {
    trackEvent({
      category: 'Journey',
      action: 'Filter',
      label: filter
    });
  }, [trackEvent]);
  
  const trackJourneySearch = useCallback((searchTerm: string) => {
    trackEvent({
      category: 'Journey',
      action: 'Search',
      label: searchTerm
    });
  }, [trackEvent]);
  
  const trackVisualizationInteraction = useCallback((interactionType: string) => {
    trackEvent({
      category: 'Visualization',
      action: 'Interact',
      label: interactionType
    });
  }, [trackEvent]);
  
  const trackError = useCallback((errorType: string, errorMessage: string) => {
    trackEvent({
      category: 'Error',
      action: 'Occurred',
      label: `${errorType}: ${errorMessage}`
    });
  }, [trackEvent]);
  
  return {
    trackEvent,
    trackPageView,
    trackJourneySelect,
    trackJourneyFilter,
    trackJourneySearch,
    trackVisualizationInteraction,
    trackError
  };
}

// Export the tracker for direct access if needed
export { analyticsTracker };