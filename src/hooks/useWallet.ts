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
  switchToSomnia: () => Promise<boolean>
  trackTransactionSpeed: (txHash: string) => Promise<void>
}

// ✅ PRODUCTION READY: Somnia Mainnet Configuration
const SOMNIA_NETWORK = {
  chainId: '0xC478', // 50312 in hex (Somnia mainnet)
  chainName: 'Somnia Network',
  nativeCurrency: {
    name: 'SOMI',
    symbol: 'SOMI',
    decimals: 18,
  },
  rpcUrls: ['https://dream-rpc.somnia.network/'],
  blockExplorerUrls: ['https://explorer.somnia.network/'],
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

  const { addToast, updateNetworkMetrics } = useUIStore()

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
  }, [isMetaMaskInstalled, updateWalletState, addToast, walletState.address])

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
    if (!window.ethereum) {
      updateNetworkMetrics({ isOnSomnia: false })
      addToast({
        message: 'MetaMask not detected. Please install MetaMask to continue.',
        type: 'error',
      })
      return false
    }

    try {
      // Try to switch to Somnia network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SOMNIA_NETWORK.chainId }],
      })

      updateNetworkMetrics({ isOnSomnia: true })
      addToast({
        message: 'Successfully switched to Somnia Network! 🎉',
        type: 'success',
      })
      return true
    } catch (switchError: any) {
      // If network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          addToast({
            message: 'Adding Somnia Network to MetaMask...',
            type: 'info',
          })

          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [SOMNIA_NETWORK],
          })

          updateNetworkMetrics({ isOnSomnia: true })
          addToast({
            message: 'Somnia Network added and activated! ✅',
            type: 'success',
          })
          return true
        } catch (addError: any) {
          console.error('Failed to add Somnia network:', addError)
          updateNetworkMetrics({ isOnSomnia: false })

          let errorMessage = 'Failed to add Somnia Network to MetaMask.'
          if (addError.code === 4001) {
            errorMessage = 'Network addition cancelled by user.'
          } else if (addError.code === -32002) {
            errorMessage = 'MetaMask is already processing a request. Please check MetaMask.'
          } else if (addError.message?.includes('Invalid RPC URL')) {
            errorMessage = 'Invalid RPC URL detected. Please contact support.'
          }

          addToast({
            message: errorMessage,
            type: 'error',
          })
          return false
        }
      } else {
        console.error('Failed to switch to Somnia network:', switchError)
        updateNetworkMetrics({ isOnSomnia: false })

        let errorMessage = 'Failed to switch to Somnia Network.'
        if (switchError.code === 4001) {
          errorMessage = 'Network switch cancelled by user.'
        } else if (switchError.code === -32002) {
          errorMessage = 'MetaMask is busy. Please check MetaMask and try again.'
        } else if (switchError.message?.includes('Unrecognized chain ID')) {
          errorMessage = 'Network configuration error. The chain ID may be incorrect.'
        } else if (switchError.message?.includes('Invalid RPC URL')) {
          errorMessage = 'RPC connection failed. Please check your internet connection.'
        }

        addToast({
          message: errorMessage + ' Please ensure you\'re using the latest MetaMask version.',
          type: 'error',
        })
        return false
      }
    }
  }, [addToast, updateNetworkMetrics])

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