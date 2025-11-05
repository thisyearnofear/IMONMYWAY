"use client";

import dynamic from 'next/dynamic';
import { MapSkeleton, RouteCardSkeleton } from "@/components/ui/LoadingSkeleton";

const PlanPageContent = dynamic(
  () => import('./PlanPageContent'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen relative">
        {/* Background matching the actual page */}
        <div className="fixed inset-0 bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-pink-950/10" />
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(59,130,246,0.08),transparent_70%)]" />
        
        <main className="relative z-10 container mx-auto px-4 pt-16 pb-6 max-w-4xl">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                🗺️ Plan Your Route
              </span>
            </h1>
            <p className="text-white/70 text-base max-w-2xl mx-auto">
              Loading route planner...
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <MapSkeleton className="h-64 w-full" />
            <RouteCardSkeleton className="w-full" />
          </div>
        </main>
      </div>
    )
  }
) as any; // Type assertion to resolve implicit any

export default PlanPageContent;
