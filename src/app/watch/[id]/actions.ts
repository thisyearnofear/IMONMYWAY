// Server actions for the watch page
// Handles commitment fulfillment and other blockchain interactions

'use server'

import { ContractService } from '@/services/contractService'
import { dbService } from '@/lib/db-service'
import { ethers } from 'ethers'
import { getNetworkConfig } from '@/contracts/addresses'

export async function fulfillCommitmentAction(
  commitmentId: string,
  userId: string,
  arrivalLocation: { lat: number; lng: number }
) {
  try {
    // Get network configuration
    const networkConfig = getNetworkConfig()
    
    // Create a read-only provider
    const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl)
    
    // Create contract service with provider only (no signer for read operations)
    const contractService = new ContractService(null)
    
    // Convert coordinates to contract format (scaled integers)
    const arrivalLoc = [
      BigInt(Math.round(arrivalLocation.lat * 1e6)), 
      BigInt(Math.round(arrivalLocation.lng * 1e6)), 
      BigInt(Math.round(Date.now() / 1000)), 
      BigInt(100) // accuracy
    ]
    
    // Fulfill the commitment on-chain
    // Note: In a real implementation, we would need a signer to send the transaction
    // For now, we'll just update the database
    
    // Update commitment status in database
    await dbService.updateCommitmentStatus(commitmentId, 'completed', {
      actualArrivalTime: new Date(),
      success: true,
      payoutAmount: '0' // This would be calculated based on the contract
    })
    
    return { success: true, message: 'Commitment fulfilled successfully' }
  } catch (error) {
    console.error('Error fulfilling commitment:', error)
    return { success: false, message: 'Failed to fulfill commitment' }
  }
}

export async function getCommitmentDetailsAction(commitmentId: string) {
  try {
    // Get commitment from database
    const commitment = await dbService.getCommitment(commitmentId)
    
    if (!commitment) {
      return { success: false, message: 'Commitment not found' }
    }
    
    return { success: true, data: commitment }
  } catch (error) {
    console.error('Error fetching commitment:', error)
    return { success: false, message: 'Failed to fetch commitment details' }
  }
}