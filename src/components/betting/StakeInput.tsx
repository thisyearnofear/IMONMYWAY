'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface StakeInputProps {
  onStakeSet: (amount: string) => void
  isLoading?: boolean
  minStake?: string
  maxStake?: string
  userBalance?: string
}

export function StakeInput({ 
  onStakeSet, 
  isLoading = false, 
  minStake = '0.001',
  maxStake = '10',
  userBalance = '0'
}: StakeInputProps) {
  const [stakeAmount, setStakeAmount] = useState('0.01')
  const [error, setError] = useState('')

  const validateStake = (amount: string) => {
    const numAmount = parseFloat(amount)
    const numMin = parseFloat(minStake)
    const numMax = parseFloat(maxStake)
    const numBalance = parseFloat(userBalance)

    if (isNaN(numAmount) || numAmount <= 0) {
      return 'Please enter a valid amount'
    }
    if (numAmount < numMin) {
      return `Minimum stake is ${minStake} STT`
    }
    if (numAmount > numMax) {
      return `Maximum stake is ${maxStake} STT`
    }
    if (numAmount > numBalance) {
      return 'Insufficient balance'
    }
    return ''
  }

  const handleStakeChange = (value: string) => {
    setStakeAmount(value)
    setError(validateStake(value))
  }

  const handleSubmit = () => {
    const validationError = validateStake(stakeAmount)
    if (validationError) {
      setError(validationError)
      return
    }
    onStakeSet(stakeAmount)
  }

  const quickAmounts = ['0.01', '0.05', '0.1', '0.5']

  return (
    <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200 animate-scale-in">
      <div className="flex items-center space-x-2 mb-4">
        <div className="text-2xl animate-bounce-gentle">💰</div>
        <h3 className="text-lg font-semibold text-gray-900">Set Your Stake</h3>
      </div>
      
      <div className="space-y-4">
        {/* Balance Display */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Available Balance:</span>
          <span className="font-mono text-gray-900">{userBalance} STT</span>
        </div>

        {/* Stake Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stake Amount (STT)
          </label>
          <Input
            type="number"
            value={stakeAmount}
            onChange={(e) => handleStakeChange(e.target.value)}
            placeholder="0.01"
            min={minStake}
            max={maxStake}
            step="0.001"
            className={error ? 'border-red-500' : ''}
          />
          {error && (
            <p className="text-red-500 text-sm mt-1">{error}</p>
          )}
        </div>

        {/* Quick Amount Buttons */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quick Select:
          </label>
          <div className="grid grid-cols-4 gap-2">
            {quickAmounts.map((amount, index) => (
              <button
                key={amount}
                onClick={() => handleStakeChange(amount)}
                className={`px-3 py-2 text-sm rounded-lg border transition-all duration-200 transform hover:scale-105 tap-feedback ${
                  stakeAmount === amount
                    ? 'bg-blue-100 border-blue-500 text-blue-700 animate-glow'
                    : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100 hover-lift'
                }`}
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                {amount} STT
              </button>
            ))}
          </div>
        </div>

        {/* Stake Button */}
        <AnimatedButton
          onClick={handleSubmit}
          disabled={isLoading || !!error || !stakeAmount}
          className="w-full"
          loadingMessage="Creating Commitment..."
          successMessage="Commitment Created!"
          animation="pulse"
        >
          {isLoading ? (
            <LoadingSpinner size="sm" color="white" />
          ) : (
            `Stake ${stakeAmount} STT`
          )}
        </AnimatedButton>

        {/* Info */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Your stake will be locked until the commitment deadline</p>
          <p>• You&apos;ll get your stake back if you arrive on time</p>
          <p>• Others can bet on your success for additional rewards</p>
        </div>
      </div>
    </div>
  )
}