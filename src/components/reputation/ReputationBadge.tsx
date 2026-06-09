"use client"

interface ReputationBadgeProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function ReputationBadge({
  score,
  size = 'md',
  showLabel = true,
}: ReputationBadgeProps) {
  const percentage = Math.round(score / 100)

  const getColor = (score: number) => {
    if (score >= 9000) return 'text-green-600 bg-green-100'
    if (score >= 8000) return 'text-blue-600 bg-blue-100'
    if (score >= 7000) return 'text-yellow-600 bg-yellow-100'
    if (score >= 6000) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }

  const getIcon = (score: number) => {
    if (score >= 9000) return '⭐'
    if (score >= 8000) return '🎯'
    if (score >= 7000) return '👍'
    if (score >= 6000) return '⚠️'
    return '❌'
  }

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs'
      case 'lg':
        return 'px-4 py-2 text-base'
      default:
        return 'px-3 py-1 text-sm'
    }
  }

  return (
    <div className={`inline-flex items-center space-x-1 rounded-full font-medium ${getColor(score)} ${getSizeClasses(size)}`}>
      <span>{getIcon(score)}</span>
      <span>{percentage}%</span>
      {showLabel && size !== 'sm' && (
        <span className="text-xs opacity-75">reliability</span>
      )}
    </div>
  )
}
