import { useState, useEffect, useCallback } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { cacheService } from '@/lib/cache-service'
import { getNetworkConfig } from '@/contracts/addresses'
import { useMetaMaskProvider } from './useMetaMaskProvider'

const activeNetwork = getNetworkConfig()

const SOMNIA_NETWORK_PARAMS_FOR_WALLET = {
  chainId: `0x${activeNetwork.chainId.toString(16)}`,
  chainName: activeNetwork.name,
  nativeCurrency: activeNetwork.nativeCurrency,
  rpcUrls: [activeNetwork.rpcUrl],
  blockExplorerUrls: [activeNetwork.blockExplorer],
}

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
  const { provider, isInstalled, isLoading } = useMetaMaskProvider()

  // Check if MetaMask is installed
  const isMetaMaskInstalled = useCallback(() => {
    return isInstalled && provider !== null
  }, [isInstalled, provider])

  // Get current account and chain
  const updateWalletState = useCallback(async () => {
    if (!isMetaMaskInstalled() || !provider) return

    try {
      // Add timeout to prevent hanging on provider calls
      const timeout = (ms: number) => new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Provider request timeout')), ms)
      )

      const accounts = await Promise.race([
        provider.request({ method: 'eth_accounts' }),
        timeout(5000)
      ]) as string[]

      const chainId = await Promise.race([
        provider.request({ method: 'eth_chainId' }),
        timeout(5000)
      ]) as string

      if (accounts.length > 0) {
        const balance = await Promise.race([
          provider.request({
            method: 'eth_getBalance',
            params: [accounts[0], 'latest'],
          }),
          timeout(5000)
        ]) as string

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
      console.warn('Wallet provider timeout or error:', error)
      // Don't show error toast for timeout, just log it
      setWalletState(prev => ({
        ...prev,
        isConnecting: false,
      }))
    }
  }, [isMetaMaskInstalled, provider])

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
      if (!provider) throw new Error('MetaMask not available')

      await provider.request({ method: 'eth_requestAccounts' })
      await updateWalletState()

      // Auto-add Somnia network if not already added
      const currentChainId = await provider.request({ method: 'eth_chainId' })
      const isOnSomnia = parseInt(currentChainId, 16) === activeNetwork.chainId

      if (!isOnSomnia) {
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [SOMNIA_NETWORK_PARAMS_FOR_WALLET],
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
          isOnSomnia: parseInt(currentChainId, 16) === activeNetwork.chainId,
        },
      }))

      // Create or update user in database
      if (walletState.address) {
        try {
          const { dbService } = await import('@/lib/db-service')
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
  }, [isMetaMaskInstalled, updateWalletState, addToast, walletState.address, provider])

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
    if (!provider) {
      updateNetworkMetrics({ isOnSomnia: false })
      addToast({
        message: 'MetaMask not detected. Please install MetaMask to continue.',
        type: 'error',
      })
      return false
    }

    try {
      // Try to switch to Somnia network
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SOMNIA_NETWORK_PARAMS_FOR_WALLET.chainId }],
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

          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [SOMNIA_NETWORK_PARAMS_FOR_WALLET],
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
          message: errorMessage + " Please ensure you're using the latest MetaMask version.",
          type: 'error',
        })
        return false
      }
    }
  }, [addToast, updateNetworkMetrics, provider])

  // Listen for account and chain changes
  useEffect(() => {
    if (!isMetaMaskInstalled() || !provider || isLoading) return

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

    provider.on('accountsChanged', handleAccountsChanged)
    provider.on('chainChanged', handleChainChanged)

    // Initial state check
    updateWalletState()

    return () => {
      if (provider) {
        provider.removeListener('accountsChanged', handleAccountsChanged)
        provider.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [isMetaMaskInstalled, updateWalletState, disconnect, provider, isLoading])

  // Track transaction speed for Somnia showcase
  const trackTransactionSpeed = useCallback(async (txHash: string) => {
    if (!provider) return

    const startTime = Date.now()
    const ethersProvider = new (await import('ethers')).BrowserProvider(provider)

    try {
      await ethersProvider.waitForTransaction(txHash)
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
  }, [addToast, provider])

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
