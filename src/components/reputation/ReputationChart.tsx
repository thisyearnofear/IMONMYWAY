'use client'

interface ReputationChartProps {
  score: number
  totalCommitments: number
  successfulCommitments: number
  className?: string
}

export function ReputationChart({ 
  score, 
  totalCommitments, 
  successfulCommitments,
  className = ''
}: ReputationChartProps) {
  const percentage = Math.round(score / 100)
  const successRate = totalCommitments > 0 ? Math.round((successfulCommitments / totalCommitments) * 100) : 0

  return (
    <div className={`bg-white rounded-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Reputation Score</h3>
      
      {/* Main Score */}
      <div className="text-center mb-6">
        <div className="text-4xl font-bold text-gray-900 mb-2">{percentage}%</div>
        <div className="text-sm text-gray-600">Reliability Score</div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Reputation</span>
          <span>{percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-300 ${
              percentage >= 90 ? 'bg-green-500' :
              percentage >= 80 ? 'bg-blue-500' :
              percentage >= 70 ? 'bg-yellow-500' :
              percentage >= 60 ? 'bg-orange-500' :
              'bg-red-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-gray-900">{totalCommitments}</div>
          <div className="text-xs text-gray-600">Total</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-green-600">{successfulCommitments}</div>
          <div className="text-xs text-gray-600">Success</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-blue-600">{successRate}%</div>
          <div className="text-xs text-gray-600">Rate</div>
        </div>
      </div>

      {/* Achievement Badges */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-sm font-medium text-gray-700 mb-2">Achievements</div>
        <div className="flex flex-wrap gap-2">
          {successfulCommitments >= 10 && (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
              🎯 Consistent
            </span>
          )}
          {successfulCommitments >= 50 && (
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
              🏆 Expert
            </span>
          )}
          {percentage >= 95 && (
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
              ⭐ Reliable
            </span>
          )}
          {totalCommitments >= 100 && (
            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
              🔥 Active
            </span>
          )}
        </div>
      </div>
    </div>
  )
}