'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export function Navigation() {
  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="container-mobile flex items-center justify-between h-16 px-4">
        <Link href="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">R</span>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Runner ETA
          </span>
        </Link>
        
        <nav className="flex items-center space-x-2">
          <Link href="/plan">
            <Button variant="ghost" size="sm">Plan</Button>
          </Link>
          <Link href="/share">
            <Button variant="ghost" size="sm">Share</Button>
          </Link>
        </nav>
      </div>
    </header>
  )
}