import { useState, useEffect, useCallback } from 'react'
import { useUIStore } from '@/stores/uiStore'

interface WalletState {
  address: string | null
  isConnected: boolean
  isConnecting: boolean
  chainId: number | null
  balance: string | null
}

interface UseWalletReturn extends WalletState {
  connect: () => Promise<void>
  disconnect: () => void
  switchToSomnia: () => Promise<void>
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
      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      const chainId = await window.ethereum.request({ method: 'eth_chainId' })
      
      if (accounts.length > 0) {
        const balance = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [accounts[0], 'latest'],
        })

        setWalletState({
          address: accounts[0],
          isConnected: true,
          isConnecting: false,
          chainId: parseInt(chainId, 16),
          balance: (parseInt(balance, 16) / 1e18).toFixed(4), // Convert wei to ETH
        })
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
      await window.ethereum.request({ method: 'eth_requestAccounts' })
      await updateWalletState()
      
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
    setWalletState({
      address: null,
      isConnected: false,
      isConnecting: false,
      chainId: null,
      balance: null,
    })
    addToast({
      type: 'info',
      message: 'Wallet disconnected',
    })
  }, [addToast])

  // Switch to Somnia Network
  const switchToSomnia = useCallback(async () => {
    if (!isMetaMaskInstalled()) return

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
    if (!isMetaMaskInstalled()) return

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

  return {
    ...walletState,
    connect,
    disconnect,
    switchToSomnia,
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