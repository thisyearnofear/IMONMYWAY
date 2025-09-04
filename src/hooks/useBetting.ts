import { useCallback } from 'react'
import { useWallet } from './useWallet'
import { useLocationStore } from '@/stores/locationStore'
import { useBettingStore } from '@/stores/bettingStore'
import { useUIStore } from '@/stores/uiStore'
import { getContract, estimateGasCost } from '@/lib/contracts'

/**
 * Hook for betting operations
 * Integrates with existing location tracking and wallet functionality
 */
export function useBetting() {
  const { address, isConnected, chainId } = useWallet()
  const { addToast } = useUIStore()
  const { 
    setCreatingCommitment, 
    setFulfillingCommitment,
    setPlacingBet,
    addActiveBet,
    updateActiveBet
  } = useBettingStore()
  const { 
    currentLocation, 
    setCommitmentId, 
    setStakeAmount,
    setStaked,
    setUserReputationScore
  } = useLocationStore()

  const contract = getContract(chainId || 50312)

  /**
   * Create a punctuality commitment with stake
   * Enhanced version of existing session creation
   */
  const createCommitment = useCallback(async (
    startLocation: { lat: number; lng: number },
    targetLocation: { lat: number; lng: number },
    arrivalDeadline: number,
    estimatedPace: number,
    stakeAmount: string
  ) => {
    if (!isConnected || !address) {
      addToast({
        type: 'error',
        message: 'Please connect your wallet first'
      })
      return null
    }

    setCreatingCommitment(true)

    try {
      // Calculate distance using contract method
      const distance = await contract.calculateDistance(
        startLocation.lat,
        startLocation.lng,
        targetLocation.lat,
        targetLocation.lng
      )

      // Create commitment via contract
      const commitmentId = await contract.createCommitment(
        startLocation,
        targetLocation,
        arrivalDeadline,
        estimatedPace,
        stakeAmount
      )
      
      // Convert stake amount to wei
      const stakeWei = BigInt(Math.floor(parseFloat(stakeAmount) * 1e18))
      
      // Update location store with commitment details
      setCommitmentId(commitmentId)
      setStakeAmount(stakeWei)
      setStaked(true)
      
      // Add to active bets
      addActiveBet({
        commitmentId,
        userAddress: address,
        targetAddress: address,
        stakeAmount: stakeWei,
        betAmount: 0n,
        bettingFor: true,
        deadline: arrivalDeadline,
        status: 'active',
        startLocation,
        targetLocation,
        estimatedDistance: Math.round(distance),
        estimatedPace,
        createdAt: Date.now()
      })

      // Update user reputation
      const reputation = await contract.getUserReputation(address)
      setUserReputationScore(reputation)

      addToast({
        type: 'success',
        message: `Commitment created! Stake: ${stakeAmount} STT`
      })

      return commitmentId
    } catch (error: any) {
      console.error('Error creating commitment:', error)
      addToast({
        type: 'error',
        message: error.message || 'Failed to create commitment'
      })
      return null
    } finally {
      setCreatingCommitment(false)
    }
  }, [isConnected, address, addToast, setCreatingCommitment, setCommitmentId, setStakeAmount, setStaked, addActiveBet])

  /**
   * Place a bet on someone's commitment
   */
  const placeBet = useCallback(async (
    commitmentId: string,
    betAmount: string,
    bettingFor: boolean
  ) => {
    if (!isConnected || !address) {
      addToast({
        type: 'error',
        message: 'Please connect your wallet first'
      })
      return false
    }

    setPlacingBet(true)

    try {
      // Place bet via contract
      const txHash = await contract.placeBet(commitmentId, betAmount, bettingFor)
      
      const betWei = BigInt(Math.floor(parseFloat(betAmount) * 1e18))
      
      // Update active bet with new bettor
      updateActiveBet(commitmentId, {
        // Add bettor to the bet (this would normally come from contract events)
      })
      
      addToast({
        type: 'success',
        message: `Bet placed! ${betAmount} STT ${bettingFor ? 'FOR' : 'AGAINST'} success`
      })

      return true
    } catch (error: any) {
      console.error('Error placing bet:', error)
      addToast({
        type: 'error',
        message: error.message || 'Failed to place bet'
      })
      return false
    } finally {
      setPlacingBet(false)
    }
  }, [isConnected, address, addToast, contract, setPlacingBet, updateActiveBet])

  /**
   * Fulfill a commitment with proof of arrival
   */
  const fulfillCommitment = useCallback(async (
    commitmentId: string,
    arrivalLocation: { lat: number; lng: number }
  ) => {
    if (!isConnected || !address) {
      addToast({
        type: 'error',
        message: 'Please connect your wallet first'
      })
      return false
    }

    setFulfillingCommitment(true)

    try {
      // Fulfill commitment via contract
      const result = await contract.fulfillCommitment(commitmentId, arrivalLocation)
      
      // Update bet status
      updateActiveBet(commitmentId, {
        status: 'fulfilled',
        successful: result.success
      })

      if (result.success) {
        addToast({
          type: 'success',
          message: `Commitment fulfilled successfully! ${result.reward ? `Reward: ${result.reward} STT` : ''}`
        })
      } else {
        addToast({
          type: 'warning',
          message: 'Commitment fulfilled but arrived late. Stake forfeited.'
        })
      }

      return result.success
    } catch (error: any) {
      console.error('Error fulfilling commitment:', error)
      addToast({
        type: 'error',
        message: error.message || 'Failed to fulfill commitment'
      })
      return false
    } finally {
      setFulfillingCommitment(false)
    }
  }, [isConnected, address, addToast, setFulfillingCommitment])

  /**
   * Get commitment details from contract
   */
  const getCommitmentDetails = useCallback(async (commitmentId: string) => {
    try {
      return await contract.getCommitment(commitmentId)
    } catch (error) {
      console.error('Error fetching commitment:', error)
      return null
    }
  }, [contract])

  /**
   * Get user reputation from contract
   */
  const getUserReputation = useCallback(async (userAddress: string) => {
    try {
      return await contract.getUserReputation(userAddress)
    } catch (error) {
      console.error('Error fetching reputation:', error)
      return 7500 // Default reputation
    }
  }, [contract])

  return {
    createCommitment,
    placeBet,
    fulfillCommitment,
    getCommitmentDetails,
    getUserReputation,
    estimateGasCost: estimateGasCost,
    isConnected,
    userAddress: address
  }
}