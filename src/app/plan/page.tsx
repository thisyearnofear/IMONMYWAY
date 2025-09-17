"use client";

import dynamic from 'next/dynamic';

const PlanPageContent = dynamic(
  () => import('./PlanPageContent'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 to-purple-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-white/80">Loading route planner...</p>
        </div>
      </div>
    )
  }
) as any; // Type assertion to resolve implicit any

export default PlanPageContent;
