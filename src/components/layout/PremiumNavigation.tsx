"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";
import { useLocationStore } from "@/stores/locationStore";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/PremiumButton";
import { motion, AnimatePresence } from "framer-motion";
import { ClientOnly } from "@/components/core/ClientOnly";

// Enhanced navigation items with contextual information
const NAV_ITEMS = [
  { href: "/challenges", label: "Browse", icon: "🎯", description: "Discover challenges" },
  { href: "/plan", label: "Plan", icon: "🗺️", description: "Plan your route" },
  { href: "/create", label: "Create", icon: "🧠", description: "New challenge" },
  { href: "/profile", label: "My Challenges", icon: "📊", description: "Track progress" },
  { href: "/leaderboard", label: "Leaderboard", icon: "🏆", description: "See rankings" }
];

// Get contextual page info for better UX cohesion
const getPageContext = (pathname: string) => {
  if (pathname.startsWith('/challenges')) return { step: 1, nextStep: '/plan', nextLabel: 'Plan Route' };
  if (pathname === '/plan') return { step: 2, nextStep: '/create', nextLabel: 'Create Challenge' };
  if (pathname === '/create') return { step: 3, nextStep: '/profile', nextLabel: 'Track Progress' };
  if (pathname.startsWith('/profile')) return { step: 4, nextStep: '/leaderboard', nextLabel: 'View Rankings' };
  if (pathname === '/leaderboard') return { step: 5, nextStep: '/challenges', nextLabel: 'New Challenge' };
  return { step: 0, nextStep: '/challenges', nextLabel: 'Get Started' };
};

export function PremiumNavigation() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState(false);
  const { address, isConnected, connect, disconnect, balance, chainId, networkMetrics } = useWallet();
  const { setWalletAddress, setWalletConnected } = useLocationStore();
  const walletDropdownRef = useRef<HTMLDivElement>(null);
  
  const pageContext = getPageContext(pathname);
  const isActive = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(href));

  // Truncate wallet address for display
  const truncatedAddress = address ? `${address.slice(0, 4)}...${address.slice(-4)}` : "";

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Sync wallet state with location store
  useEffect(() => {
    setWalletAddress(address);
    setWalletConnected(isConnected);
  }, [address, isConnected, setWalletAddress, setWalletConnected]);

  // Handle click outside wallet dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (walletDropdownRef.current && !walletDropdownRef.current.contains(event.target as Node)) {
        setIsWalletDropdownOpen(false);
      }
    }

    if (isWalletDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isWalletDropdownOpen]);

  const handleDisconnect = () => {
    disconnect();
    setIsWalletDropdownOpen(false);
  };

  const getNetworkName = () => {
    if (networkMetrics?.isOnSomnia) return "Somnia";
    if (chainId === 1) return "Ethereum";
    if (chainId === 137) return "Polygon";
    if (chainId === 56) return "BSC";
    return `Chain ${chainId}`;
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-graphite-900/80 backdrop-blur-xl border-b border-violet-500/20 ${isScrolled ? "py-3" : "py-4"}`}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <motion.div
              className="w-10 h-10 bg-gradient-to-br from-gold-500 to-violet-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
              whileHover={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 0.5 }}
            >
              <span className="text-xl font-bold text-white">∞</span>
            </motion.div>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold text-white drop-shadow-[0_1px_1px_rgba(110,43,242,0.3)]">
              IMONMYWAY
            </h1>
          </div>
        </Link>

        {/* Enhanced Desktop Navigation with Active States */}
        <nav className="hidden md:flex items-center gap-1" role="navigation" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative"
                >
                  <Button
                    variant={active ? "primary" : "ghost"}
                    size="sm"
                    className={`relative group rounded-lg px-4 py-2 transition-all duration-200 ${
                      active 
                        ? "text-white bg-gradient-to-r from-violet-600 to-purple-600 shadow-lg" 
                        : "text-gray-300 hover:text-white hover:bg-violet-500/10"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`transition-transform ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
                        {item.icon}
                      </span>
                      {item.label}
                    </span>
                    {active && (
                      <motion.div
                        layoutId="activeNavIndicator"
                        className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gold-500 rounded-full"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </Button>
                  
                  {/* Tooltip for additional context */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                    {item.description}
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Wallet Connection */}
        <div className="flex items-center gap-3">
          <ClientOnly fallback={
            <Button
              size="sm"
              variant="outline"
              className="hidden sm:flex rounded-lg opacity-50"
              disabled
            >
              Loading...
            </Button>
          }>
            {isConnected ? (
              <div className="hidden sm:block relative" ref={walletDropdownRef}>
                <Button
                  variant="outline"
                  size="sm"
                  className="items-center gap-2 border-violet-500/50 hover:bg-violet-500/10 rounded-lg"
                  onClick={() => setIsWalletDropdownOpen(!isWalletDropdownOpen)}
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">{truncatedAddress}</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${isWalletDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Button>

                <AnimatePresence>
                  {isWalletDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-80 bg-graphite-800/95 backdrop-blur-xl border border-violet-500/20 rounded-xl shadow-2xl z-50"
                    >
                      <div className="p-4 space-y-4">
                        {/* Wallet Info Header */}
                        <div className="flex items-center gap-3 pb-3 border-b border-violet-500/20">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <div>
                            <p className="text-white font-medium">Wallet Connected</p>
                            <p className="text-gray-400 text-sm">{truncatedAddress}</p>
                          </div>
                        </div>

                        {/* Balance and Network Info */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Balance:</span>
                            <span className="text-white font-mono">{balance || '0.0000'} ETH</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Network:</span>
                            <span className={`text-sm px-2 py-1 rounded-full ${networkMetrics?.isOnSomnia
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                              }`}>
                              {getNetworkName()}
                            </span>
                          </div>
                          {networkMetrics?.lastTxSpeed && (
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400">Last Tx Speed:</span>
                              <span className="text-green-400 font-mono">{networkMetrics.lastTxSpeed.toFixed(1)}s</span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-3 border-t border-violet-500/20 space-y-2">
                          <Link href="/profile">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full justify-start border-violet-500/30 hover:bg-violet-500/10"
                              onClick={() => setIsWalletDropdownOpen(false)}
                            >
                              👤 View Profile
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start border-red-500/30 hover:bg-red-500/10 text-red-400 hover:text-red-300"
                            onClick={handleDisconnect}
                          >
                            🔌 Disconnect Wallet
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Button
                size="sm"
                variant="gradient"
                className="hidden sm:flex rounded-lg"
                onClick={connect}
              >
                Connect Wallet
              </Button>
            )}
          </ClientOnly>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              className="p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
              aria-expanded={isMobileMenuOpen}
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
                  d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                />
              </svg>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden border-t border-violet-500/20 bg-graphite-800/90 backdrop-blur-lg"
        >
          <nav className="container mx-auto px-4 py-4 space-y-2">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center justify-between py-3 px-4 rounded-lg transition-all duration-200 ${
                      active 
                        ? "bg-gradient-to-r from-violet-600/20 to-purple-600/20 border border-violet-500/30 text-white" 
                        : "text-gray-300 hover:text-white hover:bg-violet-500/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-lg transition-transform ${active ? 'scale-110' : ''}`} aria-hidden="true">
                        {item.icon}
                      </span>
                      <div>
                        <div className={`font-medium ${active ? 'text-white' : ''}`}>{item.label}</div>
                        <div className={`text-xs ${active ? 'text-violet-200' : 'text-gray-500'}`}>
                          {item.description}
                        </div>
                      </div>
                    </div>
                    {active && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="w-2 h-2 bg-gold-500 rounded-full"
                      />
                    )}
                  </motion.div>
                </Link>
              );
            })}

            <div className="pt-4 space-y-3">
              <ClientOnly fallback={
                <Button
                  variant="outline"
                  className="w-full opacity-50"
                  disabled
                >
                  Loading...
                </Button>
              }>
                {isConnected ? (
                  <>
                    <div className="p-4 bg-graphite-700/50 rounded-lg border border-violet-500/20">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="text-white font-medium text-sm">Wallet Connected</p>
                          <p className="text-gray-400 text-xs">{truncatedAddress}</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Balance:</span>
                          <span className="text-white font-mono">{balance || '0.0000'} ETH</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Network:</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${networkMetrics?.isOnSomnia
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                            {getNetworkName()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Link href="/profile">
                        <Button
                          variant="outline"
                          className="w-full justify-start border-violet-500/30 hover:bg-violet-500/10"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          👤 View Profile
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        className="w-full justify-start border-red-500/30 hover:bg-red-500/10 text-red-400 hover:text-red-300"
                        onClick={() => {
                          handleDisconnect();
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        🔌 Disconnect Wallet
                      </Button>
                    </div>
                  </>
                ) : (
                  <Button
                    variant="gradient"
                    className="w-full"
                    onClick={() => {
                      connect();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Connect Wallet
                  </Button>
                )}
              </ClientOnly>
            </div>
          </nav>
        </motion.div>
      )}
    </header>
  );
}