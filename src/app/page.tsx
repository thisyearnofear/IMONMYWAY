import { Navigation } from '@/components/layout/Navigation'
import { ModeSwitch } from '@/components/layout/ModeSwitch'
import { ToastContainer } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation />
      
      <main className="container-mobile py-8 safe-area-bottom">
        <div className="text-center mb-12 animate-fade-in">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-xl mb-4 animate-bounce-gentle">
              <span className="text-3xl">🏃</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-4">
            Runner ETA
          </h1>
          <p className="text-xl text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
            The missing speed between walking and driving. Get accurate ETAs based on your actual pace.
          </p>
          
          {/* Quick Mode Switch */}
          <div className="max-w-md mx-auto mb-8">
            <ModeSwitch />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12 animate-slide-up">
          {/* Plan a Run Card */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Plan a Run</h3>
                <p className="text-gray-600">Set start and end points, calculate ETA</p>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              Plan your route with start and destination addresses. Calculate estimated time and share your planned route.
            </p>
            <Link href="/plan">
              <Button className="w-full">
                Plan Route
              </Button>
            </Link>
          </div>

          {/* Live Tracking Card */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Live Tracking</h3>
                <p className="text-gray-600">Share your real-time location</p>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              Share your live location with real-time updates. Set your pace and destination for live ETA calculation.
            </p>
            <Link href="/share">
              <Button variant="secondary" className="w-full">
                Start Sharing
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Features</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">Real-time Updates</h3>
              <p className="text-sm text-gray-600">Live location tracking with instant updates</p>
            </div>
            <div className="text-center">
              <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">ETA Calculation</h3>
              <p className="text-sm text-gray-600">Accurate arrival time estimates</p>
            </div>
            <div className="text-center">
              <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">Easy Sharing</h3>
              <p className="text-sm text-gray-600">Simple links to share your location</p>
            </div>
          </div>
        </div>
      </main>

      <ToastContainer />
    </div>
  )
}