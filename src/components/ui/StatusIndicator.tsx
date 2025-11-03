// CONSOLIDATED: Single source of truth for ALL status indicators (AGGRESSIVE CONSOLIDATION)
// Replaces: StatusIndicator, PremiumStatusIndicator
import { cn } from '@/lib/utils'

interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'connecting' | 'error' | 'warning'
  label?: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
  pulse?: boolean
  glow?: boolean
  premium?: boolean // Toggle between basic and premium styling
}

export function StatusIndicator({
  status,
  label,
  size = 'md',
  showLabel = true,
  className,
  pulse = true,
  glow = false,
  premium = false
}: StatusIndicatorProps) {
  const statusConfig = {
    online: {
      color: premium ? 'bg-green-400' : 'bg-green-500',
      textColor: premium ? 'text-green-400' : 'text-green-700',
      label: label || 'Online',
      glowColor: 'shadow-green-400/50',
      borderColor: 'border-green-400/30',
      animate: 'animate-pulse'
    },
    offline: {
      color: premium ? 'bg-gray-400' : 'bg-gray-500',
      textColor: premium ? 'text-gray-400' : 'text-gray-700',
      label: label || 'Offline',
      glowColor: 'shadow-gray-400/30',
      borderColor: 'border-gray-400/30',
      animate: ''
    },
    connecting: {
      color: premium ? 'bg-yellow-400' : 'bg-yellow-500',
      textColor: premium ? 'text-yellow-400' : 'text-yellow-700',
      label: label || 'Connecting...',
      glowColor: 'shadow-yellow-400/50',
      borderColor: 'border-yellow-400/30',
      animate: 'animate-pulse'
    },
    error: {
      color: premium ? 'bg-red-400' : 'bg-red-500',
      textColor: premium ? 'text-red-400' : 'text-red-700',
      label: label || 'Error',
      glowColor: 'shadow-red-400/50',
      borderColor: 'border-red-400/30',
      animate: 'animate-bounce'
    },
    warning: {
      color: premium ? 'bg-orange-400' : 'bg-orange-500',
      textColor: premium ? 'text-orange-400' : 'text-orange-700',
      label: label || 'Warning',
      glowColor: 'shadow-orange-400/50',
      borderColor: 'border-orange-400/30',
      animate: 'animate-pulse'
    }
  }

  const sizes = {
    sm: {
      dot: 'w-2 h-2',
      container: 'gap-2',
      text: premium ? 'text-xs' : 'text-sm',
      padding: premium ? 'px-2 py-1' : ''
    },
    md: {
      dot: 'w-3 h-3',
      container: 'gap-3',
      text: premium ? 'text-sm' : 'text-sm',
      padding: premium ? 'px-3 py-2' : ''
    },
    lg: {
      dot: 'w-4 h-4',
      container: 'gap-3',
      text: premium ? 'text-base' : 'text-sm',
      padding: premium ? 'px-4 py-3' : ''
    }
  }

  const config = statusConfig[status]
  const sizeConfig = sizes[size]

  // Simple dot-only version
  if (!showLabel) {
    return (
      <div className={cn('relative', className)}>
        <div
          className={cn(
            'rounded-full transition-all duration-300',
            config.color,
            sizeConfig.dot,
            pulse && config.animate,
            glow && `shadow-lg ${config.glowColor}`
          )}
        />
        {glow && (
          <div
            className={cn(
              'absolute inset-0 rounded-full blur-sm opacity-50',
              config.color,
              pulse && 'animate-pulse'
            )}
          />
        )}
      </div>
    )
  }

  // Premium styled version
  if (premium) {
    return (
      <div className={cn(
        'bg-gradient-to-br from-gold/5 to-violet/5 border border-gold/10 rounded-xl flex items-center border transition-all duration-300',
        sizeConfig.container,
        sizeConfig.padding,
        config.borderColor,
        glow && `shadow-lg ${config.glowColor}`,
        className
      )}>
        <div className="relative">
          <div
            className={cn(
              'rounded-full transition-all duration-300',
              config.color,
              sizeConfig.dot,
              pulse && config.animate
            )}
          />
          {glow && (
            <div
              className={cn(
                'absolute inset-0 rounded-full blur-sm opacity-50',
                config.color,
                pulse && 'animate-pulse'
              )}
            />
          )}
        </div>

        <span className={cn(
          'font-medium tracking-wide',
          config.textColor,
          sizeConfig.text
        )}>
          {config.label}
        </span>
      </div>
    )
  }

  // Basic version
  return (
    <div className={cn('flex items-center', sizeConfig.container, className)}>
      <div
        className={cn(
          'rounded-full',
          config.color,
          pulse && config.animate,
          sizeConfig.dot
        )}
      />
      <span className={cn('font-medium', config.textColor, sizeConfig.text)}>
        {config.label}
      </span>
    </div>
  )
}

// Export both names for compatibility (ENHANCEMENT FIRST)
export const PremiumStatusIndicator = StatusIndicator

// Specialized variants (MODULAR)
export function NetworkStatusIndicator({
  isConnected,
  networkName,
  className
}: {
  isConnected: boolean
  networkName?: string
  className?: string
}) {
  return (
    <StatusIndicator
      status={isConnected ? 'online' : 'offline'}
      label={isConnected ? `Connected to ${networkName || 'Network'}` : 'Disconnected'}
      className={className}
      premium
      glow
    />
  )
}

export function WalletStatusIndicator({
  isConnected,
  address,
  className
}: {
  isConnected: boolean
  address?: string
  className?: string
}) {
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <StatusIndicator
      status={isConnected ? 'online' : 'offline'}
      label={isConnected && address ? formatAddress(address) : 'Wallet Disconnected'}
      className={className}
      premium
      glow
    />
  )
}

export function GPSStatusIndicator({
  isEnabled,
  accuracy,
  className
}: {
  isEnabled: boolean
  accuracy?: number
  className?: string
}) {
  const getStatus = () => {
    if (!isEnabled) return 'offline'
    if (accuracy && accuracy > 10) return 'warning'
    return 'online'
  }

  const getLabel = () => {
    if (!isEnabled) return 'GPS Disabled'
    if (accuracy) return `GPS Active (±${accuracy}m)`
    return 'GPS Active'
  }

  return (
    <StatusIndicator
      status={getStatus()}
      label={getLabel()}
      className={className}
      premium
      glow
    />
  )
}