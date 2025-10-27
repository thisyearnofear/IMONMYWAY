import Link from "next/link";

// Server component for navigation (static export compatible)
function StaticNavigation() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900">
              iMOnMyWay
            </Link>
          </div>
          <nav className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Home
              </Link>
              <Link href="/plan" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Plan
              </Link>
              <Link href="/leaderboard" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Leaderboard
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}

export default function WatchPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <StaticNavigation />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Live Tracking Unavailable
          </h1>
          <p className="text-gray-600 mb-4">
            Real-time tracking features are disabled in static export mode.
          </p>
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            Return to Home
          </Link>
        </div>
      </main>
    </div>
  );
}

// For static export, we provide empty params since we can't generate all possible IDs
export async function generateStaticParams() {
  return [];
}


