'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useBetting } from '@/hooks/useBetting'
import { ActiveBet } from '@/stores/bettingStore'

interface BetCardProps {
  bet: ActiveBet
  canBet?: boolean
  showBetInterface?: boolean
}

export function BetCard({ bet, canBet = true, showBetInterface = true }: BetCardProps) {
  const [betAmount, setBetAmount] = useState('0.01')
  const [bettingFor, setBettingFor] = useState(true)
  const [isPlacing, setIsPlacing] = useState(false)
  
  const { placeBet } = useBetting()

  const handlePlaceBet = async () => {
    setIsPlacing(true)
    const success = await placeBet(bet.commitmentId, betAmount, bettingFor)
    if (success) {
      setBetAmount('0.01')
    }
    setIsPlacing(false)
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${meters}m`
    return `${(meters / 1000).toFixed(1)}km`
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const timeRemaining = Math.max(0, bet.deadline - Date.now())
  const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60))
  const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60))

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="font-mono text-sm text-gray-600">
            {formatAddress(bet.userAddress)}
          </span>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-medium ${
          bet.status === 'active' ? 'bg-green-100 text-green-800' :
          bet.status === 'fulfilled' ? 'bg-blue-100 text-blue-800' :
          'bg-red-100 text-red-800'
        }`}>
          {bet.status.toUpperCase()}
        </div>
      </div>

      {/* Commitment Details */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Stake:</span>
          <span className="font-mono font-medium">
            {(Number(bet.stakeAmount) / 1e18).toFixed(3)} STT
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Distance:</span>
          <span className="font-medium">
            {formatDistance(bet.estimatedDistance)}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Pace:</span>
          <span className="font-medium">
            {(bet.estimatedPace / 100).toFixed(1)} min/mile
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Deadline:</span>
          <span className="font-medium">
            {formatTime(bet.deadline)}
          </span>
        </div>

        {bet.status === 'active' && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Time Remaining:</span>
            <span className={`font-medium ${
              timeRemaining < 300000 ? 'text-red-600' : 'text-green-600'
            }`}>
              {hoursRemaining > 0 ? `${hoursRemaining}h ` : ''}{minutesRemaining}m
            </span>
          </div>
        )}
      </div>

      {/* Betting Interface */}
      {showBetInterface && canBet && bet.status === 'active' && (
        <div className="border-t pt-4 space-y-4">
          <h4 className="font-medium text-gray-900">Place Your Bet</h4>
          
          {/* Bet Direction */}
          <div className="flex space-x-2">
            <button
              onClick={() => setBettingFor(true)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                bettingFor
                  ? 'bg-green-100 text-green-800 border border-green-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-300'
              }`}
            >
              Bet FOR Success
            </button>
            <button
              onClick={() => setBettingFor(false)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                !bettingFor
                  ? 'bg-red-100 text-red-800 border border-red-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-300'
              }`}
            >
              Bet AGAINST
            </button>
          </div>

          {/* Bet Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bet Amount (STT)
            </label>
            <Input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              placeholder="0.01"
              min="0.001"
              step="0.001"
            />
          </div>

          {/* Place Bet Button */}
          <Button
            onClick={handlePlaceBet}
            disabled={isPlacing || !betAmount || parseFloat(betAmount) <= 0}
            className="w-full"
            variant={bettingFor ? 'default' : 'secondary'}
          >
            {isPlacing ? 'Placing Bet...' : 
             `Bet ${betAmount} STT ${bettingFor ? 'FOR' : 'AGAINST'}`}
          </Button>
        </div>
      )}

      {/* Location Preview */}
      <div className="mt-4 text-xs text-gray-500">
        <div className="flex justify-between">
          <span>Start: {bet.startLocation.lat.toFixed(4)}, {bet.startLocation.lng.toFixed(4)}</span>
          <span>Target: {bet.targetLocation.lat.toFixed(4)}, {bet.targetLocation.lng.toFixed(4)}</span>
        </div>
      </div>
    </div>
  )
}