"use client";

import Link from "next/link";
import { useWallet } from "@/hooks/useWallet";
import { useLocationStore } from "@/stores/locationStore";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/PremiumButton";
import { cn } from "@/lib/utils";

export function PremiumNavigation() {
  const [isScrolled, setIsScrolled] = useState(false);
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

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        "glass-nav backdrop-blur-xl",
        isScrolled ? "py-3" : "py-4"
      )}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="w-10 h-10 glass-enhanced rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                ∞
              </span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
              IMONMYWAY
            </h1>
            <p className="text-xs text-white/60 font-mono uppercase tracking-wider">
              Punctuality Protocol
            </p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav
          className="hidden md:flex items-center gap-2"
          role="navigation"
          aria-label="Main navigation"
        >
          <Link href="/plan">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/80 hover:text-white focus:text-white interactive-underline"
              aria-label="Plan your route on an interactive map"
            >
              <span className="mr-2" aria-hidden="true">
                🗺️
              </span>
              Plan Route
            </Button>
          </Link>
          <Link href="/share">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/80 hover:text-white focus:text-white interactive-underline"
              aria-label="Create a GPS-tracked punctuality challenge"
            >
              <span className="mr-2" aria-hidden="true">
                🎯
              </span>
              Create Challenge
            </Button>
          </Link>
          <Link href="/watch">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/80 hover:text-white focus:text-white interactive-underline"
              aria-label="Watch live GPS tracking of challenges"
            >
              <span className="mr-2" aria-hidden="true">
                📍
              </span>
              Live Tracking
            </Button>
          </Link>
        </nav>

        {/* Wallet Connection */}
        <div className="flex items-center gap-3">
          {!isConnected ? (
            <Button
              variant="primary"
              onClick={connect}
              className="btn-primary border-0"
              aria-label="Connect your cryptocurrency wallet"
            >
              <span className="mr-2" aria-hidden="true">
                🔗
              </span>
              Connect Wallet
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              {/* Network Status with better accessibility */}
              {!isOnSomnia && (
                <Button
                  variant="secondary"
                  onClick={switchToSomnia}
                  className="btn-secondary text-xs"
                  aria-label="Switch to Somnia blockchain network"
                >
                  Switch to Somnia
                </Button>
              )}

              {/* Wallet Info with better structure */}
              <div className="card-enhanced px-4 py-2 flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      isOnSomnia
                        ? "bg-green-400 animate-pulse"
                        : "bg-orange-400"
                    )}
                    aria-hidden="true"
                  />
                  <span className="text-xs font-mono text-white/90">
                    {isOnSomnia ? "SOMNIA" : "WRONG_NET"}
                  </span>
                </div>
                <div className="w-px h-4 bg-white/20" aria-hidden="true" />
                <span className="text-sm font-mono text-white/90">
                  {formatAddress(address!)}
                </span>
                <button
                  onClick={disconnect}
                  className="text-white/60 hover:text-red-400 transition-colors p-1 hover:bg-red-500/10 rounded focus:outline-none focus:ring-2 focus:ring-red-400"
                  title="Disconnect wallet"
                  aria-label="Disconnect wallet"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
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

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              className="p-2"
              aria-label="Open mobile menu"
              aria-expanded="false"
            >
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Network Status Bar - Simplified */}
      {isConnected && (
        <div
          className={cn(
            "border-t border-white/10 px-6 py-3 transition-all duration-500 ease-out",
            isScrolled ? "opacity-0 h-0 py-0 overflow-hidden" : "opacity-100"
          )}
        >
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-6 text-white/70">
              <div className="flex items-center gap-2 group hover:text-green-400 transition-colors">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse group-hover:scale-125 transition-transform" />
                <span className="text-xs font-medium">PROTOCOL ACTIVE</span>
              </div>
              <div className="flex items-center gap-2 group hover:text-blue-400 transition-colors">
                <div className="w-2 h-2 bg-blue-400 rounded-full group-hover:scale-125 transition-transform" />
                <span className="text-xs font-medium">GPS READY</span>
              </div>
              {isOnSomnia && (
                <div className="flex items-center gap-2 group hover:text-purple-400 transition-colors">
                  <div className="w-2 h-2 bg-purple-400 rounded-full group-hover:scale-125 transition-transform" />
                  <span className="text-xs font-medium">SMART CONTRACTS</span>
                </div>
              )}
            </div>
            <div className="text-white/50 font-mono text-xs">
              Block {chainId || "---"}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
