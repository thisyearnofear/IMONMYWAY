import { useState, useEffect, useCallback } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { dbService } from '@/lib/db-service'
import { cacheService } from '@/lib/cache-service'

interface WalletState {
  address: string | null
  isConnected: boolean
  isConnecting: boolean
  chainId: number | null
  balance: string | null
  networkMetrics: {
    lastTxSpeed: number | null // in seconds
    avgBlockTime: number | null
    isOnSomnia: boolean
  }
}

interface UseWalletReturn extends WalletState {
  connect: () => Promise<void>
  disconnect: () => void
  switchToSomnia: () => Promise<void>
  trackTransactionSpeed: (txHash: string) => Promise<void>
}

// Somnia Network configuration
const SOMNIA_NETWORK = {
  chainId: '0xC478', // 50312 in hex
  chainName: 'Somnia Network',
  nativeCurrency: {
    name: 'SOMI',
    symbol: 'SOMI',
    decimals: 18,
  },
  rpcUrls: ['https://dream-rpc.somnia.network/'],
  blockExplorerUrls: ['https://shannon-explorer.somnia.network/'],
}

export function useWallet(): UseWalletReturn {
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    isConnected: false,
    isConnecting: false,
    chainId: null,
    balance: null,
    networkMetrics: {
      lastTxSpeed: null,
      avgBlockTime: null,
      isOnSomnia: false,
    },
  })

  const { addToast } = useUIStore()

  // Check if MetaMask is installed
  const isMetaMaskInstalled = useCallback(() => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined'
  }, [])

  // Get current account and chain
  const updateWalletState = useCallback(async () => {
    if (!isMetaMaskInstalled()) return

    try {
      if (!window.ethereum) return

      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      const chainId = await window.ethereum.request({ method: 'eth_chainId' })
      
      if (accounts.length > 0) {
        const balance = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [accounts[0], 'latest'],
        })

        setWalletState(prev => ({
          ...prev,
          address: accounts[0],
          isConnected: true,
          isConnecting: false,
          chainId: parseInt(chainId, 16),
          balance: (parseInt(balance, 16) / 1e18).toFixed(4), // Convert wei to ETH
        }))
      } else {
        setWalletState(prev => ({
          ...prev,
          address: null,
          isConnected: false,
          isConnecting: false,
          balance: null,
        }))
      }
    } catch (error) {
      console.error('Error updating wallet state:', error)
      setWalletState(prev => ({
        ...prev,
        isConnecting: false,
      }))
    }
  }, [isMetaMaskInstalled])

  // Connect wallet
  const connect = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      addToast({
        type: 'error',
        message: 'MetaMask is not installed. Please install MetaMask to continue.',
      })
      return
    }

    setWalletState(prev => ({ ...prev, isConnecting: true }))

    try {
      if (!window.ethereum) throw new Error('MetaMask not available')

      await window.ethereum.request({ method: 'eth_requestAccounts' })
      await updateWalletState()

      // Auto-add Somnia network if not already added
      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' })
      const isOnSomnia = parseInt(currentChainId, 16) === 50312
      
      if (!isOnSomnia) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [SOMNIA_NETWORK],
          })
          addToast({
            type: 'success',
            message: 'Somnia Network added to MetaMask! 🚀',
          })
        } catch (addError) {
          console.log('User declined adding Somnia network')
        }
      }

      // Update network metrics
      setWalletState(prev => ({
        ...prev,
        networkMetrics: {
          ...prev.networkMetrics,
          isOnSomnia: parseInt(currentChainId, 16) === 50312,
        },
      }))

      // Create or update user in database
      if (walletState.address) {
        try {
          await dbService.createUser(walletState.address)
          await cacheService.invalidateUserProfile(walletState.address)
          console.log(`✅ User profile created/updated for ${walletState.address}`)
        } catch (dbError) {
          console.error('Error creating user in database:', dbError)
          // Don't fail the connection if database update fails
        }
      }

      addToast({
        type: 'success',
        message: 'Wallet connected successfully!',
      })
    } catch (error: any) {
      console.error('Error connecting wallet:', error)
      addToast({
        type: 'error',
        message: error.message || 'Failed to connect wallet',
      })
      setWalletState(prev => ({ ...prev, isConnecting: false }))
    }
  }, [isMetaMaskInstalled, updateWalletState, addToast])

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setWalletState(prev => ({
      ...prev,
      address: null,
      isConnected: false,
      isConnecting: false,
      chainId: null,
      balance: null,
    }))
    addToast({
      type: 'info',
      message: 'Wallet disconnected',
    })
  }, [addToast])

  // Switch to Somnia Network
  const switchToSomnia = useCallback(async () => {
    if (!isMetaMaskInstalled() || !window.ethereum) return

    try {
      // Try to switch to Somnia Network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SOMNIA_NETWORK.chainId }],
      })
    } catch (switchError: any) {
      // If the chain doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [SOMNIA_NETWORK],
          })
          addToast({
            type: 'success',
            message: 'Somnia Network added successfully!',
          })
        } catch (addError: any) {
          console.error('Error adding Somnia Network:', addError)
          addToast({
            type: 'error',
            message: 'Failed to add Somnia Network',
          })
        }
      } else {
        console.error('Error switching to Somnia Network:', switchError)
        addToast({
          type: 'error',
          message: 'Failed to switch to Somnia Network',
        })
      }
    }
  }, [isMetaMaskInstalled, addToast])

  // Listen for account and chain changes
  useEffect(() => {
    if (!isMetaMaskInstalled() || !window.ethereum) return

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect()
      } else {
        updateWalletState()
      }
    }

    const handleChainChanged = () => {
      updateWalletState()
    }

    window.ethereum.on('accountsChanged', handleAccountsChanged)
    window.ethereum.on('chainChanged', handleChainChanged)

    // Initial state check
    updateWalletState()

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [isMetaMaskInstalled, updateWalletState, disconnect])

  // Track transaction speed for Somnia showcase
  const trackTransactionSpeed = useCallback(async (txHash: string) => {
    if (!window.ethereum) return
    
    const startTime = Date.now()
    const provider = new (await import('ethers')).BrowserProvider(window.ethereum)
    
    try {
      await provider.waitForTransaction(txHash)
      const endTime = Date.now()
      const speed = (endTime - startTime) / 1000
      
      setWalletState(prev => ({
        ...prev,
        networkMetrics: {
          ...prev.networkMetrics,
          lastTxSpeed: speed,
        },
      }))
      
      addToast({
        type: 'success',
        message: `Transaction confirmed in ${speed.toFixed(1)}s on Somnia! ⚡`,
      })
    } catch (error) {
      console.error('Transaction tracking failed:', error)
    }
  }, [addToast])

  return {
    ...walletState,
    connect,
    disconnect,
    switchToSomnia,
    trackTransactionSpeed,
  }
}

// Type declarations for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>
      on: (event: string, callback: (...args: any[]) => void) => void
      removeListener: (event: string, callback: (...args: any[]) => void) => void
    }
  }
}