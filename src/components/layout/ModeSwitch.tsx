'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/PremiumButton'
import { cn } from '@/lib/utils'

export function ModeSwitch() {
  const pathname = usePathname()
  
  const modes = [
    {
      path: '/plan',
      label: 'Plan',
      icon: '🗺️',
      description: 'Set route & calculate ETA'
    },
    {
      path: '/create',
      label: 'Create',
      icon: '🧠',
      description: 'Create AI challenge'
    }
  ]

  return (
    <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-200">
      {modes.map((mode) => (
        <Link key={mode.path} href={mode.path} className="flex-1">
          <Button
            variant={pathname === mode.path ? 'primary' : 'ghost'}
            size="sm"
            className={cn(
              'w-full justify-start',
              pathname === mode.path && 'shadow-md'
            )}
          >
            <span className="mr-2">{mode.icon}</span>
            <div className="text-left">
              <div className="font-medium">{mode.label}</div>
              <div className="text-xs opacity-75">{mode.description}</div>
            </div>
          </Button>
        </Link>
      ))}
    </div>
  )
}