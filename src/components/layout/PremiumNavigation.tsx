"use client";

import Link from "next/link";
import { useWallet } from "@/hooks/useWallet";
import { useLocationStore } from "@/stores/locationStore";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/PremiumButton";
import { motion } from "framer-motion";

// Navigation items - single source of truth
const NAV_ITEMS = [
  { href: "/plan", label: "Plan", icon: "🗺️" },
  { href: "/share", label: "Challenge", icon: "🎯" },
  { href: "/watch", label: "Watch", icon: "📍" },
  { href: "/leaderboard", label: "Leaderboard", icon: "🏆" }
];

export function PremiumNavigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { address, isConnected, connect } = useWallet();
  const { setWalletAddress, setWalletConnected } = useLocationStore();
  
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

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1" role="navigation" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-white hover:bg-violet-500/10 rounded-lg px-4 py-2"
              >
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>

        {/* Wallet Connection */}
        <div className="flex items-center gap-3">
          {isConnected ? (
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex items-center gap-2 border-violet-500/50 hover:bg-violet-500/10 rounded-lg"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">{truncatedAddress}</span>
            </Button>
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
            {NAV_ITEMS.map((item) => (
              <Link 
                key={item.href} 
                href={item.href} 
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="flex items-center gap-3 text-gray-300 hover:text-white py-3 px-4 rounded-lg hover:bg-violet-500/10 transition-colors">
                  <span aria-hidden="true">{item.icon}</span>
                  {item.label}
                </div>
              </Link>
            ))}
            
            <div className="pt-4">
              {isConnected ? (
                <Button
                  variant="outline"
                  className="w-full justify-start border-violet-500/50 hover:bg-violet-500/10"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span>{truncatedAddress}</span>
                </Button>
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
            </div>
          </nav>
        </motion.div>
      )}
    </header>
  );
}