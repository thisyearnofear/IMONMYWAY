'use client'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'blue' | 'green' | 'purple' | 'white'
  message?: string
  className?: string
}

export function LoadingSpinner({ 
  size = 'md', 
  color = 'blue', 
  message,
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  const colorClasses = {
    blue: 'border-blue-600 border-t-transparent',
    green: 'border-green-600 border-t-transparent',
    purple: 'border-purple-600 border-t-transparent',
    white: 'border-white border-t-transparent'
  }

  return (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      <div className="relative">
        {/* Main spinner */}
        <div 
          className={`
            ${sizeClasses[size]} 
            ${colorClasses[color]}
            border-2 rounded-full animate-spin
          `}
        />
        
        {/* Pulse effect */}
        <div 
          className={`
            absolute inset-0 
            ${sizeClasses[size]} 
            ${colorClasses[color]}
            border-2 rounded-full animate-ping opacity-20
          `}
        />
      </div>
      
      {message && (
        <p className="text-sm text-gray-600 animate-pulse">
          {message}
        </p>
      )}
    </div>
  )
}