"use client";

import Link from "next/link";
import { useWallet } from "@/hooks/useWallet";
import { useLocationStore } from "@/stores/locationStore";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export function Navigation() {
  const {
    address,
    isConnected,
    isConnecting,
    chainId,
    connect,
    disconnect,
    switchToSomnia,
  } = useWallet();
  const { setWalletAddress, setWalletConnected } = useLocationStore();

  // Sync wallet state with location store
  useEffect(() => {
    setWalletAddress(address);
    setWalletConnected(isConnected);
  }, [address, isConnected, setWalletAddress, setWalletConnected]);

  // Check if on Somnia Testnet
  const isOnSomnia = chainId === 50311;

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };
  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="container-mobile flex items-center justify-between h-16 px-4">
        <Link href="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">⏰</span>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Punctuality Protocol
          </span>
        </Link>

        <nav className="flex items-center space-x-2">
          <Link href="/plan">
            <Button variant="ghost" size="sm">
              Plan Route
            </Button>
          </Link>
          <Link href="/share">
            <Button variant="ghost" size="sm">
              Create Bet
            </Button>
          </Link>
          <Link href="/watch">
            <Button variant="ghost" size="sm">
              Watch Bets
            </Button>
          </Link>

          {/* Wallet Connection */}
          {!isConnected ? (
            <Button
              onClick={connect}
              disabled={isConnecting}
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </Button>
          ) : (
            <div className="flex items-center space-x-2">
              {!isOnSomnia && (
                <Button
                  onClick={switchToSomnia}
                  size="sm"
                  variant="secondary"
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Switch to Somnia
                </Button>
              )}
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-mono text-gray-700">
                  {formatAddress(address!)}
                </span>
                <button
                  onClick={disconnect}
                  className="text-gray-500 hover:text-red-500 transition-colors ml-2"
                  title="Disconnect"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
