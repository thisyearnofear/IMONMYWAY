import { ReactNode, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface PremiumCardProps {
  children: ReactNode
  className?: string
  variant?: 'premium' | 'enhanced' | 'floating' | 'minimal'
  hover?: boolean
  glow?: boolean
  depth?: 1 | 2 | 3 | 4
  onClick?: () => void
  disabled?: boolean
}

// Single source of truth for all cards - replaces Card, PulseCard variants
export const Card = forwardRef<HTMLDivElement, PremiumCardProps>(
  ({ 
    children, 
    className, 
    variant = 'enhanced',
    hover = true, 
    glow = false,
    depth = 2,
    onClick,
    disabled = false
  }, ref) => {
    const baseClasses = "transition-all duration-500 ease-out"
    
    const variantClasses = {
      premium: "glass-premium",
      enhanced: "glass-enhanced", 
      floating: "glass-floating",
      minimal: "glass-premium"
    }
    
    const depthClasses = {
      1: "shadow-sm",
      2: "shadow-md", 
      3: "shadow-lg",
      4: "shadow-xl"
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          depthClasses[depth],
          hover && !disabled && "hover:scale-[1.02] hover:-translate-y-2 hover:rotate-1",
          glow && "ring-1 ring-blue-500/20 shadow-blue-500/10",
          onClick && !disabled && "cursor-pointer active:scale-[0.98] active:rotate-0",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        onClick={disabled ? undefined : onClick}
        style={{
          '--glass-depth': depth,
        } as React.CSSProperties}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

// Export both names for compatibility during transition
export const PremiumCard = Card;

interface PremiumCardHeaderProps {
  children: ReactNode
  className?: string
  icon?: ReactNode
  badge?: ReactNode
}

export function CardHeader({ 
  children, 
  className, 
  icon,
  badge 
}: PremiumCardHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-6', className)}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-12 h-12 glass-premium rounded-xl flex items-center justify-center text-xl">
            {icon}
          </div>
        )}
        <div className="flex-1">
          {children}
        </div>
      </div>
      {badge && (
        <div className="glass-status">
          {badge}
        </div>
      )}
    </div>
  )
}

interface PremiumCardTitleProps {
  children: ReactNode
  className?: string
  gradient?: boolean
}

export function CardTitle({ 
  children, 
  className,
  gradient = false 
}: PremiumCardTitleProps) {
  return (
    <h3 className={cn(
      'text-xl font-bold tracking-tight',
      gradient 
        ? 'bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 bg-clip-text text-transparent'
        : 'text-white',
      className
    )}>
      {children}
    </h3>
  )
}

interface PremiumCardDescriptionProps {
  children: ReactNode
  className?: string
}

export function CardDescription({ children, className }: PremiumCardDescriptionProps) {
  return (
    <p className={cn('text-white/70 text-sm leading-relaxed', className)}>
      {children}
    </p>
  )
}

interface PremiumCardContentProps {
  children: ReactNode
  className?: string
  padding?: boolean
}

export function CardContent({ 
  children, 
  className,
  padding = true 
}: PremiumCardContentProps) {
  return (
    <div className={cn(
      padding && 'p-6',
      className
    )}>
      {children}
    </div>
  )
}

interface PremiumCardFooterProps {
  children: ReactNode
  className?: string
  divider?: boolean
}

export function CardFooter({ 
  children, 
  className,
  divider = true 
}: PremiumCardFooterProps) {
  return (
    <div className={cn(
      'mt-6 pt-6',
      divider && 'border-t border-white/10',
      className
    )}>
      {children}
    </div>
  )
}

// Data Panel Variant for Technical Information
interface DataPanelProps {
  children: ReactNode
  className?: string
  title?: string
  status?: 'online' | 'offline' | 'warning' | 'error'
}

export function DataPanel({ 
  children, 
  className, 
  title,
  status 
}: DataPanelProps) {
  const statusColors = {
    online: 'text-green-400',
    offline: 'text-gray-400', 
    warning: 'text-yellow-400',
    error: 'text-red-400'
  }
  
  return (
    <PremiumCard variant="enhanced" className={cn('font-mono', className)}>
      <CardContent>
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-white/90 uppercase tracking-wider">
              {title}
            </h4>
            {status && (
              <div className="flex items-center gap-2">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  status === 'online' && 'bg-green-400 animate-pulse',
                  status === 'offline' && 'bg-gray-400',
                  status === 'warning' && 'bg-yellow-400 animate-pulse',
                  status === 'error' && 'bg-red-400 animate-pulse'
                )} />
                <span className={cn('text-xs font-medium', statusColors[status])}>
                  {status.toUpperCase()}
                </span>
              </div>
            )}
          </div>
        )}
        {children}
      </CardContent>
    </PremiumCard>
  )
}

interface DataRowProps {
  label: string
  value: ReactNode
  status?: 'success' | 'warning' | 'error' | 'neutral'
}

export function DataRow({ label, value, status = 'neutral' }: DataRowProps) {
  const statusColors = {
    success: 'text-green-400',
    warning: 'text-yellow-400',
    error: 'text-red-400',
    neutral: 'text-white'
  }
  
  return (
    <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-b-0">
      <span className="text-white/60 text-xs uppercase tracking-wide">
        {label}
      </span>
      <span className={cn(
        'text-xs font-bold',
        statusColors[status]
      )}>
        {value}
      </span>
    </div>
  )
}