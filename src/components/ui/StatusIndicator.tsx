import { cn } from '@/lib/utils'

interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'connecting' | 'error'
  label?: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export function StatusIndicator({ 
  status, 
  label, 
  size = 'md', 
  showLabel = true,
  className 
}: StatusIndicatorProps) {
  const statusConfig = {
    online: {
      color: 'bg-green-500',
      label: label || 'Online',
      animate: 'animate-pulse'
    },
    offline: {
      color: 'bg-gray-500',
      label: label || 'Offline',
      animate: ''
    },
    connecting: {
      color: 'bg-yellow-500',
      label: label || 'Connecting...',
      animate: 'animate-pulse'
    },
    error: {
      color: 'bg-red-500',
      label: label || 'Error',
      animate: 'animate-bounce'
    }
  }

  const sizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }

  const config = statusConfig[status]

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'rounded-full',
          config.color,
          config.animate,
          sizes[size]
        )}
      />
      {showLabel && (
        <span className="text-sm font-medium text-gray-700">
          {config.label}
        </span>
      )}
    </div>
  )
}