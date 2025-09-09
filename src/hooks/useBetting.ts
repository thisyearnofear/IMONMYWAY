import { useCallback, useMemo, useState, useEffect } from 'react'
import { useWallet } from './useWallet'
import { useLocationStore } from '@/stores/locationStore'
import { useBettingStore } from '@/stores/bettingStore'
import { useUIStore } from '@/stores/uiStore'
import { useAchievements } from './useAchievements'
import { getContract, estimateGasCost, calculateDistance } from '@/lib/contracts'
import { dbService } from '@/lib/db-service'
import { cacheService } from '@/lib/cache-service'
import { ethers } from 'ethers'

/**
 * Hook for betting operations
 * Integrates with existing location tracking and wallet functionality
 */
export function useBetting() {
  const { address, isConnected, chainId } = useWallet()
  const { addToast } = useUIStore()
  const { unlockAchievement, updateStreak } = useAchievements()
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

  // Create ethers provider
  const provider = useMemo(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      return new ethers.BrowserProvider(window.ethereum)
    }
    return null
  }, [])

  // Get signer - this will be a promise that we resolve when needed
  const getSigner = useCallback(async () => {
    if (provider && address) {
      return await provider.getSigner()
    }
    return null
  }, [provider, address])

  // Get contract instance - we'll create it on demand to avoid async issues in useMemo
  const getContractInstance = useCallback(async () => {
    if (chainId) {
      const signer = await getSigner()
      if (signer) {
        return getContract(chainId, signer)
      }
    }
    return null
  }, [chainId, getSigner])

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
      // Get contract instance
      const contract = await getContractInstance()
      if (!contract) {
        addToast({
          type: 'error',
          message: 'Contract not initialized'
        })
        return null
      }

      // Calculate distance using our utility function
      const distance = calculateDistance(
        startLocation.lat,
        startLocation.lng,
        targetLocation.lat,
        targetLocation.lng
      )

      // Format location data for contract
      const startLocationData = {
        latitude: Math.floor(startLocation.lat * 1e6),
        longitude: Math.floor(startLocation.lng * 1e6),
        accuracy: 0,
        timestamp: Math.floor(Date.now() / 1000)
      }

      const targetLocationData = {
        latitude: Math.floor(targetLocation.lat * 1e6),
        longitude: Math.floor(targetLocation.lng * 1e6),
        accuracy: 0,
        timestamp: Math.floor(Date.now() / 1000)
      }

      // Create commitment via contract
      const tx = await contract.createCommitment(
        startLocationData,
        targetLocationData,
        Math.floor(arrivalDeadline / 1000), // Convert to seconds
        estimatedPace,
        { value: ethers.parseEther(stakeAmount) }
      )
      
      // Wait for transaction to be mined
      const receipt = await tx.wait()
      
      // Extract commitment ID from event logs
      let commitmentId = ''
      if (receipt && receipt.logs) {
        for (const log of receipt.logs) {
          try {
            const parsedLog = contract.interface.parseLog(log)
            if (parsedLog && parsedLog.name === 'CommitmentCreated') {
              commitmentId = parsedLog.args.commitmentId
              break
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
      }

      if (!commitmentId) {
        throw new Error('Failed to extract commitment ID from transaction')
      }

      // Convert stake amount to wei
      const stakeWei = ethers.parseEther(stakeAmount)

      // Store commitment in database
      await dbService.createCommitment({
        userId: address,
        commitmentId,
        stakeAmount,
        deadline: new Date(arrivalDeadline),
        startLatitude: startLocation.lat,
        startLongitude: startLocation.lng,
        targetLatitude: targetLocation.lat,
        targetLongitude: targetLocation.lng,
        estimatedDistance: Math.round(distance),
        estimatedPace
      })

      // Cache the commitment
      await cacheService.invalidateCommitment(commitmentId)

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
        betAmount: BigInt(0),
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
      setUserReputationScore(Number(reputation))

      // Update cached reputation
      await cacheService.updateUserReputation(address, Number(reputation))

      // Unlock first commitment achievement
      unlockAchievement('first_commitment')

      // Update streak for activity
      updateStreak()

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
  }, [isConnected, address, getContractInstance, addToast, setCreatingCommitment, setCommitmentId, setStakeAmount, setStaked, addActiveBet, setUserReputationScore, unlockAchievement, updateStreak])

  /**
   * Place a bet on someone's commitment with optimistic updates
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

    // Optimistic update - immediately show the bet in UI
    const betWei = ethers.parseEther(betAmount)
    const optimisticBetUpdate = {
      betAmount: betWei,
      bettingFor,
      status: 'pending' as const,
      bettorAddress: address,
      betPlacedAt: Date.now()
    }

    updateActiveBet(commitmentId, optimisticBetUpdate)

    // Show immediate feedback
    addToast({
      type: 'info',
      message: `Placing bet... ${betAmount} STT ${bettingFor ? 'FOR' : 'AGAINST'} success`
    })

    try {
      // Get contract instance
      const contract = await getContractInstance()
      if (!contract) {
        addToast({
          type: 'error',
          message: 'Contract not initialized'
        })
        return false
      }

      // Place bet via contract
      const tx = await contract.placeBet(
        commitmentId as `0x${string}`,
        bettingFor,
        { value: ethers.parseEther(betAmount) }
      )

      // Wait for transaction to be mined
      await tx.wait()

      // Update with confirmed status
      updateActiveBet(commitmentId, {
        status: 'confirmed',
        txHash: tx.hash,
        confirmedAt: Date.now()
      })

      // Unlock first bet achievement
      unlockAchievement('first_bet')

      // Check for high roller achievement
      if (parseFloat(betAmount) >= 1.0) {
        unlockAchievement('high_roller')
      }

      addToast({
        type: 'success',
        message: `Bet confirmed! ${betAmount} STT ${bettingFor ? 'FOR' : 'AGAINST'} success 🎉`
      })

      return true
    } catch (error: any) {
      console.error('Error placing bet:', error)

      // Revert optimistic update on failure
      updateActiveBet(commitmentId, {
        betAmount: BigInt(0),
        bettingFor: true,
        status: 'active' as const,
        bettorAddress: undefined,
        betPlacedAt: undefined
      })

      addToast({
        type: 'error',
        message: error.message || 'Failed to place bet - please try again'
      })
      return false
    } finally {
      setPlacingBet(false)
    }
  }, [isConnected, address, getContractInstance, addToast, setPlacingBet, updateActiveBet, unlockAchievement])

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
      // Get contract instance
      const contract = await getContractInstance()
      if (!contract) {
        addToast({
          type: 'error',
          message: 'Contract not initialized'
        })
        return false
      }

      // Format arrival location data for contract
      const arrivalLocationData = {
        latitude: Math.floor(arrivalLocation.lat * 1e6),
        longitude: Math.floor(arrivalLocation.lng * 1e6),
        accuracy: 0,
        timestamp: Math.floor(Date.now() / 1000)
      }

      // Fulfill commitment via contract
      const tx = await contract.fulfillCommitment(
        commitmentId as `0x${string}`,
        arrivalLocationData
      )
      
      // Wait for transaction to be mined
      const receipt = await tx.wait()
      
      // Extract success status from event logs
      let success = false
      let reward = ''
      if (receipt && receipt.logs) {
        for (const log of receipt.logs) {
          try {
            const parsedLog = contract.interface.parseLog(log)
            if (parsedLog && parsedLog.name === 'CommitmentFulfilled') {
              success = parsedLog.args.successful
              reward = ethers.formatEther(parsedLog.args.rewardAmount)
              break
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
      }

      // Update bet status
      updateActiveBet(commitmentId, {
        status: 'fulfilled',
        successful: success
      })

      if (success) {
        // Update streak for successful completion
        updateStreak()

        addToast({
          type: 'success',
          message: `Commitment fulfilled successfully! ${reward ? `Reward: ${reward} STT` : ''}`
        })
      } else {
        addToast({
          type: 'warning',
          message: 'Commitment fulfilled but arrived late. Stake forfeited.'
        })
      }

      return success
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
  }, [isConnected, address, getContractInstance, addToast, setFulfillingCommitment, updateActiveBet, updateStreak])

  /**
   * Get commitment details from contract
   */
  const getCommitmentDetails = useCallback(async (commitmentId: string) => {
    try {
      // Get contract instance
      const contract = await getContractInstance()
      if (!contract) {
        console.error('Contract not initialized')
        return null
      }

      const commitment = await contract.getCommitment(commitmentId as `0x${string}`)
      
      // Format the commitment data
      return {
        user: commitment.user,
        stakeAmount: ethers.formatEther(commitment.stakeAmount),
        commitmentTime: commitment.commitmentTime * 1000, // Convert to milliseconds
        arrivalDeadline: commitment.arrivalDeadline * 1000, // Convert to milliseconds
        startLocation: {
          latitude: commitment.startLocation.latitude / 1e6,
          longitude: commitment.startLocation.longitude / 1e6,
          accuracy: commitment.startLocation.accuracy,
          timestamp: commitment.startLocation.timestamp * 1000 // Convert to milliseconds
        },
        targetLocation: {
          latitude: commitment.targetLocation.latitude / 1e6,
          longitude: commitment.targetLocation.longitude / 1e6,
          accuracy: commitment.targetLocation.accuracy,
          timestamp: commitment.targetLocation.timestamp * 1000 // Convert to milliseconds
        },
        estimatedDistance: commitment.estimatedDistance,
        estimatedPace: commitment.estimatedPace,
        fulfilled: commitment.fulfilled,
        successful: commitment.successful,
        actualArrivalTime: commitment.actualArrivalTime * 1000, // Convert to milliseconds
        totalBetsFor: ethers.formatEther(commitment.totalBetsFor),
        totalBetsAgainst: ethers.formatEther(commitment.totalBetsAgainst)
      }
    } catch (error) {
      console.error('Error fetching commitment:', error)
      return null
    }
  }, [getContractInstance])

  /**
   * Get user reputation from contract
   */
  const getUserReputation = useCallback(async (userAddress: string) => {
    try {
      // Get contract instance
      const contract = await getContractInstance()
      if (!contract) {
        console.error('Contract not initialized')
        return 7500 // Default reputation
      }

      const reputation = await contract.getUserReputation(userAddress)
      return Number(reputation)
    } catch (error) {
      console.error('Error fetching reputation:', error)
      return 7500 // Default reputation
    }
  }, [getContractInstance])

  return {
    createCommitment,
    placeBet,
    fulfillCommitment,
    getCommitmentDetails,
    getUserReputation,
    estimateGasCost: async (operation: string, params: any) => {
      try {
        const signer = await getSigner()
        if (signer && chainId) {
          return await estimateGasCost(operation, params, signer, chainId)
        }
        // Return default estimates if signer not available
        const baseCosts = {
          createCommitment: 0.001,
          placeBet: 0.0005,
          fulfillCommitment: 0.0007
        }
        return baseCosts[operation as keyof typeof baseCosts] || 0.0005
      } catch (error) {
        console.error('Error estimating gas:', error)
        // Return default estimates on error
        const baseCosts = {
          createCommitment: 0.001,
          placeBet: 0.0005,
          fulfillCommitment: 0.0007
        }
        return baseCosts[operation as keyof typeof baseCosts] || 0.0005
      }
    },
    isConnected,
    userAddress: address
  }
}