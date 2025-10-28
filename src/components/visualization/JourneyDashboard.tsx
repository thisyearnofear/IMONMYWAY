"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import JourneyPathVisualization from './JourneyPathVisualization';
import { Button } from '@/components/ui/PremiumButton';
import { Input } from '@/components/ui/Input';
import { useUIStore } from '@/stores/uiStore';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { useAnalytics } from '@/hooks/useAnalytics';

interface Journey {
  id: string;
  userId: string;
  start: { lat: number; lng: number; name: string };
  end: { lat: number; lng: number; name: string };
  startTime: Date;
  estimatedArrival: Date;
  actualArrival?: Date;
  status: 'planned' | 'active' | 'completed' | 'delayed';
  progress: number;
  stakeAmount: string;
  reputationImpact: number;
}

export default function JourneyDashboard({ 
  initialJourneys = [],
  onError
}: {
  initialJourneys?: Journey[];
  onError?: (error: Error) => void;
}) {
  const [journeys, setJourneys] = useState<Journey[]>(initialJourneys);
  const [selectedJourney, setSelectedJourney] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'delayed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isMobile } = useDeviceDetection();
  const { addToast } = useUIStore();
  const { trackJourneySelect, trackJourneyFilter, trackJourneySearch, trackError } = useAnalytics();
  
  // Mock data - in real implementation, this would come from API/db
  useEffect(() => {
    if (initialJourneys.length > 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call with potential error
      setTimeout(() => {
        // Simulate a 10% chance of error for testing
        if (Math.random() < 0.1) {
          throw new Error('Failed to load journey data');
        }
        
        const mockJourneys: Journey[] = [
          {
            id: 'journey_1',
            userId: '0x1234...',
            start: { lat: 40.7128, lng: -74.0060, name: 'New York' },
            end: { lat: 41.8781, lng: -87.6298, name: 'Chicago' },
            startTime: new Date(Date.now() - 3600000),
            estimatedArrival: new Date(Date.now() + 7200000),
            status: 'active',
            progress: 0.3,
            stakeAmount: '2.5',
            reputationImpact: 15
          },
          {
            id: 'journey_2',
            userId: '0x5678...',
            start: { lat: 34.0522, lng: -118.2437, name: 'Los Angeles' },
            end: { lat: 37.7749, lng: -122.4194, name: 'San Francisco' },
            startTime: new Date(Date.now() - 1800000),
            estimatedArrival: new Date(Date.now() - 600000),
            actualArrival: new Date(Date.now() - 300000),
            status: 'completed',
            progress: 1,
            stakeAmount: '1.8',
            reputationImpact: 10
          },
          {
            id: 'journey_3',
            userId: '0x9abc...',
            start: { lat: 47.6062, lng: -122.3321, name: 'Seattle' },
            end: { lat: 39.9526, lng: -75.1652, name: 'Philadelphia' },
            startTime: new Date(Date.now() - 7200000),
            estimatedArrival: new Date(Date.now() - 3600000),
            status: 'delayed',
            progress: 0.8,
            stakeAmount: '3.2',
            reputationImpact: -5
          }
        ];
        
        setJourneys(mockJourneys);
        setLoading(false);
      }, 1000);
    } catch (err: any) {
      console.error('Error loading journeys:', err);
      setError(err.message || 'Failed to load journey data');
      trackError('JourneyLoad', err.message || 'Failed to load journey data');
      setLoading(false);
      if (onError) {
        onError(err);
      }
    }
  }, [initialJourneys, onError, trackError]);
  
  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      setTimeout(() => {
        const mockJourneys: Journey[] = [
          {
            id: 'journey_1',
            userId: '0x1234...',
            start: { lat: 40.7128, lng: -74.0060, name: 'New York' },
            end: { lat: 41.8781, lng: -87.6298, name: 'Chicago' },
            startTime: new Date(Date.now() - 3600000),
            estimatedArrival: new Date(Date.now() + 7200000),
            status: 'active',
            progress: 0.3,
            stakeAmount: '2.5',
            reputationImpact: 15
          }
        ];
        
        setJourneys(mockJourneys);
        setLoading(false);
        addToast({ message: 'Data refreshed successfully', type: 'success' });
      }, 500);
    } catch (err: any) {
      console.error('Error retrying:', err);
      setError(err.message || 'Failed to refresh data');
      trackError('JourneyRetry', err.message || 'Failed to refresh data');
      setLoading(false);
      if (onError) {
        onError(err);
      }
      addToast({ message: 'Failed to refresh data', type: 'error' });
    }
  }, [addToast, onError, trackError]);
  
  const handleFilterChange = useCallback((newFilter: 'all' | 'active' | 'completed' | 'delayed') => {
    setFilter(newFilter);
    trackJourneyFilter(newFilter);
  }, [trackJourneyFilter]);
  
  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term);
    if (term) {
      trackJourneySearch(term);
    }
  }, [trackJourneySearch]);
  
  const handleJourneySelect = useCallback((journeyId: string) => {
    setSelectedJourney(journeyId);
    trackJourneySelect(journeyId);
  }, [trackJourneySelect]);
  
  const filteredJourneys = journeys.filter(journey => {
    // Apply status filter
    if (filter !== 'all' && journey.status !== filter) return false;
    
    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        journey.start.name.toLowerCase().includes(term) ||
        journey.end.name.toLowerCase().includes(term) ||
        journey.userId.toLowerCase().includes(term)
      );
    }
    
    return true;
  });
  
  const selectedJourneyData = selectedJourney 
    ? journeys.find(j => j.id === selectedJourney) 
    : null;
  
  const getStatusColor = (status: Journey['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'delayed': return 'text-red-600 bg-red-100';
      case 'active': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };
  
  const getStatusText = (status: Journey['status']) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'delayed': return 'Delayed';
      case 'active': return 'In Progress';
      default: return 'Planned';
    }
  };
  
  // Error state
  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
        <div className="text-3xl mb-2">⚠️</div>
        <h3 className="text-lg font-semibold text-white mb-2">Failed to Load Journeys</h3>
        <p className="text-white/70 mb-4">{error}</p>
        <Button 
          variant="primary" 
          onClick={handleRetry}
          className="mx-auto"
        >
          Try Again
        </Button>
      </div>
    );
  }
  
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-white/80">Loading journeys...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6" role="main" aria-label="Journey Dashboard">
      {/* Controls - Stacked on mobile */}
      <div className={`flex ${isMobile ? 'flex-col gap-3' : 'flex-col md:flex-row'} items-start md:items-center justify-between`}>
        <div className={`flex ${isMobile ? 'flex-wrap gap-2 w-full' : 'flex-wrap gap-2'}`} role="tablist" aria-label="Journey filters">
          {(['all', 'active', 'completed', 'delayed'] as const).map(status => (
            <Button
              key={status}
              variant={filter === status ? 'primary' : 'outline'}
              size={isMobile ? "sm" : "md"}
              onClick={() => handleFilterChange(status)}
              className="capitalize flex-1"
              role="tab"
              aria-selected={filter === status}
              aria-controls="journey-list"
            >
              {status === 'all' ? 'All Journeys' : getStatusText(status)}
            </Button>
          ))}
        </div>
        
        <div className={`w-full ${isMobile ? '' : 'md:w-auto'}`}>
          <label htmlFor="journey-search" className="sr-only">Search journeys</label>
          <Input
            id="journey-search"
            placeholder="Search journeys..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full"
            size={isMobile ? "sm" : "md"}
            aria-label="Search journeys"
          />
        </div>
      </div>
      
      {/* Visualization and List - Stacked on mobile */}
      <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 lg:grid-cols-2 gap-6'}`}>
        {/* 3D Visualization */}
        <motion.div
          className="bg-white/10 rounded-xl p-4 border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          role="region"
          aria-label="Journey Visualization"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Journey Visualization</h3>
          <div className={`${isMobile ? 'h-64' : 'h-80'} rounded-lg overflow-hidden`} id="journey-visualization-container">
            <JourneyPathVisualization
              journeys={filteredJourneys.map(journey => ({
                id: journey.id,
                userId: journey.userId,
                start: {
                  lat: journey.start.lat,
                  lng: journey.start.lng,
                  timestamp: journey.startTime.getTime(),
                  status: journey.status === 'completed' ? 'completed' : 'pending'
                },
                end: {
                  lat: journey.end.lat,
                  lng: journey.end.lng,
                  timestamp: journey.estimatedArrival.getTime(),
                  status: journey.status === 'completed' ? 'completed' : 'pending'
                },
                waypoints: [],
                progress: journey.progress,
                estimatedArrival: journey.estimatedArrival,
                actualArrival: journey.actualArrival,
                status: journey.status
              }))}
              selectedJourney={selectedJourney || undefined}
              onJourneySelect={handleJourneySelect}
              onError={(err) => {
                console.error('Visualization error:', err);
                addToast({ message: 'Visualization error: ' + err.message, type: 'error' });
                trackError('Visualization', err.message);
                if (onError) onError(err);
              }}
              className="w-full h-full"
            />
          </div>
        </motion.div>
        
        {/* Journey List */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          role="region"
          aria-label="Journey List"
          id="journey-list"
        >
          <h3 className="text-lg font-semibold text-white">Journey List</h3>
          
          {filteredJourneys.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10" role="status" aria-live="polite">
              <p className="text-white/70">No journeys found matching your criteria</p>
              {searchTerm && (
                <Button 
                  variant="outline" 
                  size={isMobile ? "sm" : "default"}
                  className="mt-4"
                  onClick={() => handleSearchChange('')}
                  aria-label="Clear search"
                >
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredJourneys.map(journey => (
                <motion.div
                  key={journey.id}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedJourney === journey.id 
                      ? 'bg-blue-500/20 border-blue-400/50' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                  onClick={() => handleJourneySelect(journey.id)}
                  whileHover={{ scale: isMobile ? 1 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Select journey from ${journey.start.name} to ${journey.end.name}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleJourneySelect(journey.id);
                    }
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className={`font-medium text-white ${isMobile ? 'text-sm' : ''}`}>
                        {journey.start.name} → {journey.end.name}
                      </h4>
                      <p className={`text-sm text-white/70 ${isMobile ? 'text-xs' : ''}`}>
                        {journey.userId.slice(0, 6)}...{journey.userId.slice(-4)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(journey.status)}`} aria-label={`Status: ${getStatusText(journey.status)}`}>
                      {getStatusText(journey.status)}
                    </span>
                  </div>
                  
                  <div className={`grid ${isMobile ? 'grid-cols-2 gap-2' : 'grid-cols-2 gap-4'} text-sm`}>
                    <div>
                      <p className="text-white/60">Progress</p>
                      <p className="text-white font-medium">{Math.round(journey.progress * 100)}%</p>
                    </div>
                    <div>
                      <p className="text-white/60">Stake</p>
                      <p className="text-white font-medium">{journey.stakeAmount} STT</p>
                    </div>
                    <div>
                      <p className="text-white/60">Reputation</p>
                      <p className={`font-medium ${
                        journey.reputationImpact > 0 ? 'text-green-400' : 
                        journey.reputationImpact < 0 ? 'text-red-400' : 'text-white'
                      }`}>
                        {journey.reputationImpact > 0 ? '+' : ''}{journey.reputationImpact}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/60">ETA</p>
                      <p className="text-white font-medium">
                        {journey.estimatedArrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-700 rounded-full h-2" role="progressbar" aria-valuenow={Math.round(journey.progress * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Journey progress">
                      <div 
                        className={`h-2 rounded-full ${
                          journey.status === 'completed' ? 'bg-green-500' :
                          journey.status === 'delayed' ? 'bg-red-500' :
                          journey.status === 'active' ? 'bg-blue-500' : 'bg-gray-500'
                        }`}
                        style={{ width: `${journey.progress * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
      
      {/* Selected Journey Details */}
      {selectedJourneyData && (
        <motion.div
          className="bg-white/10 rounded-xl p-6 border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          role="dialog"
          aria-label="Journey Details"
          aria-modal="true"
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className={`text-xl font-bold text-white ${isMobile ? 'text-lg' : ''}`}>Journey Details</h3>
            <Button 
              variant="ghost" 
              size={isMobile ? "sm" : "default"}
              onClick={() => handleJourneySelect('')}
              className="text-white/70 hover:text-white"
              aria-label="Close journey details"
            >
              Close
            </Button>
          </div>
          
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-2 gap-6'}`}>
            <div>
              <h4 className="font-semibold text-white mb-3">Route Information</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/70">From:</span>
                  <span className="text-white">{selectedJourneyData.start.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">To:</span>
                  <span className="text-white">{selectedJourneyData.end.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Started:</span>
                  <span className={`text-white ${isMobile ? 'text-sm' : ''}`}>
                    {selectedJourneyData.startTime.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Estimated Arrival:</span>
                  <span className={`text-white ${isMobile ? 'text-sm' : ''}`}>
                    {selectedJourneyData.estimatedArrival.toLocaleString()}
                  </span>
                </div>
                {selectedJourneyData.actualArrival && (
                  <div className="flex justify-between">
                    <span className="text-white/70">Actual Arrival:</span>
                    <span className={`text-white ${isMobile ? 'text-sm' : ''}`}>
                      {selectedJourneyData.actualArrival.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-3">Commitment Details</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/70">Stake Amount:</span>
                  <span className="text-white font-medium">{selectedJourneyData.stakeAmount} STT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Reputation Impact:</span>
                  <span className={`font-medium ${
                    selectedJourneyData.reputationImpact > 0 ? 'text-green-400' : 
                    selectedJourneyData.reputationImpact < 0 ? 'text-red-400' : 'text-white'
                  }`}>
                    {selectedJourneyData.reputationImpact > 0 ? '+' : ''}{selectedJourneyData.reputationImpact}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedJourneyData.status)}`} aria-label={`Status: ${getStatusText(selectedJourneyData.status)}`}>
                    {getStatusText(selectedJourneyData.status)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Progress:</span>
                  <span className="text-white font-medium">
                    {Math.round(selectedJourneyData.progress * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-white/10">
            <Button 
              variant="primary" 
              size={isMobile ? "sm" : "default"}
              className="w-full"
              onClick={() => {
                addToast({
                  message: 'Navigating to journey tracking...',
                  type: 'success'
                });
                // In real implementation, this would navigate to the tracking page
              }}
              aria-label="Track this journey"
            >
              Track This Journey
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}