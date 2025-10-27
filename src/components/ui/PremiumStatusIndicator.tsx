import { cn } from '@/lib/utils'

interface PremiumStatusIndicatorProps {
  status: 'online' | 'offline' | 'connecting' | 'error' | 'warning'
  label?: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
  pulse?: boolean
  glow?: boolean
}

export function PremiumStatusIndicator({ 
  status, 
  label, 
  size = 'md', 
  showLabel = true,
  className,
  pulse = true,
  glow = true
}: PremiumStatusIndicatorProps) {
  const statusConfig = {
    online: {
      color: 'bg-green-400',
      textColor: 'text-green-400',
      label: label || 'Online',
      glowColor: 'shadow-green-400/50',
      borderColor: 'border-green-400/30'
    },
    offline: {
      color: 'bg-gray-400',
      textColor: 'text-gray-400',
      label: label || 'Offline',
      glowColor: 'shadow-gray-400/30',
      borderColor: 'border-gray-400/30'
    },
    connecting: {
      color: 'bg-yellow-400',
      textColor: 'text-yellow-400',
      label: label || 'Connecting...',
      glowColor: 'shadow-yellow-400/50',
      borderColor: 'border-yellow-400/30'
    },
    error: {
      color: 'bg-red-400',
      textColor: 'text-red-400',
      label: label || 'Error',
      glowColor: 'shadow-red-400/50',
      borderColor: 'border-red-400/30'
    },
    warning: {
      color: 'bg-orange-400',
      textColor: 'text-orange-400',
      label: label || 'Warning',
      glowColor: 'shadow-orange-400/50',
      borderColor: 'border-orange-400/30'
    }
  }

  const sizes = {
    sm: {
      dot: 'w-2 h-2',
      container: 'gap-2',
      text: 'text-xs',
      padding: 'px-2 py-1'
    },
    md: {
      dot: 'w-3 h-3',
      container: 'gap-3',
      text: 'text-sm',
      padding: 'px-3 py-2'
    },
    lg: {
      dot: 'w-4 h-4',
      container: 'gap-3',
      text: 'text-base',
      padding: 'px-4 py-3'
    }
  }

  const config = statusConfig[status]
  const sizeConfig = sizes[size]

  if (!showLabel) {
    return (
      <div className={cn('relative', className)}>
        <div
          className={cn(
            'rounded-full transition-all duration-300',
            config.color,
            sizeConfig.dot,
            pulse && (status === 'online' || status === 'connecting' || status === 'error') && 'animate-pulse',
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
            pulse && (status === 'online' || status === 'connecting' || status === 'error') && 'animate-pulse'
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

// Specialized variants
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
    <PremiumStatusIndicator
      status={isConnected ? 'online' : 'offline'}
      label={isConnected ? `Connected to ${networkName || 'Network'}` : 'Disconnected'}
      className={className}
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
    <PremiumStatusIndicator
      status={isConnected ? 'online' : 'offline'}
      label={isConnected && address ? formatAddress(address) : 'Wallet Disconnected'}
      className={className}
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
    <PremiumStatusIndicator
      status={getStatus()}
      label={getLabel()}
      className={className}
      glow
    />
  )
}