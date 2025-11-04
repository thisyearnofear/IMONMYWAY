"use client";

import { useEffect, useState } from 'react';

interface MetaMaskProvider {
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    on: (event: string, callback: (...args: any[]) => void) => void;
    removeListener: (event: string, callback: (...args: any[]) => void) => void;
    isMetaMask?: boolean;
}

/**
 * Safe MetaMask provider hook that handles window object access properly
 */
export function useMetaMaskProvider() {
    const [provider, setProvider] = useState<MetaMaskProvider | null>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Only run on client side
        if (typeof window === 'undefined') {
            setIsLoading(false);
            return;
        }

        const checkProvider = () => {
            try {
                // Check if ethereum is available
                const ethereum = (window as any).ethereum;

                if (ethereum && ethereum.isMetaMask) {
                    setProvider(ethereum);
                    setIsInstalled(true);
                } else {
                    setProvider(null);
                    setIsInstalled(false);
                }
            } catch (error) {
                console.warn('Error accessing MetaMask provider:', error);
                setProvider(null);
                setIsInstalled(false);
            } finally {
                setIsLoading(false);
            }
        };

        // Check immediately
        checkProvider();

        // Listen for provider changes
        const handleEthereumProviderChange = () => {
            checkProvider();
        };

        // Some wallets dispatch this event when they're ready
        window.addEventListener('ethereum#initialized', handleEthereumProviderChange);

        // Fallback for providers that don't dispatch the event
        const timeout = setTimeout(checkProvider, 1000);

        return () => {
            window.removeEventListener('ethereum#initialized', handleEthereumProviderChange);
            clearTimeout(timeout);
        };
    }, []);

    return {
        provider,
        isInstalled,
        isLoading
    };
}