"use client";

import Link from "next/link";
import { useWallet } from "@/hooks/useWallet";
import { useLocationStore } from "@/stores/locationStore";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/PremiumButton";
import { cn } from "@/lib/utils";

export function PremiumNavigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { address, isConnected } = useWallet();
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

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-black/50 backdrop-blur-xl">
          <nav className="container mx-auto px-6 py-4 space-y-2">
            <Link href="/plan" onClick={() => setIsMobileMenuOpen(false)}>
              <div className="flex items-center gap-3 text-white/80 hover:text-white py-3 px-4 rounded-lg hover:bg-white/10 transition-colors">
                <span aria-hidden="true">🗺️</span>
                Plan Route
              </div>
            </Link>
            <Link href="/share" onClick={() => setIsMobileMenuOpen(false)}>
              <div className="flex items-center gap-3 text-white/80 hover:text-white py-3 px-4 rounded-lg hover:bg-white/10 transition-colors">
                <span aria-hidden="true">🎯</span>
                Create Challenge
              </div>
            </Link>
            <Link href="/watch" onClick={() => setIsMobileMenuOpen(false)}>
              <div className="flex items-center gap-3 text-white/80 hover:text-white py-3 px-4 rounded-lg hover:bg-white/10 transition-colors">
                <span aria-hidden="true">📍</span>
                Live Tracking
              </div>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}