import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  variant?: 'light' | 'dark' | 'adaptive'
}

const Input = forwardRef<HTMLInputElement, InputProps>(
({ className, label, error, helperText, id, variant = 'adaptive', ...props }, ref) => {
const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

return (
<div className="space-y-1">
{label && (
<label
htmlFor={inputId}
className={`block text-sm font-medium ${
  variant === 'dark' ? 'text-white' : 
  variant === 'light' ? 'text-gray-700' : 
  'text-gray-900'
}`}
>
{label}
</label>
)}
        <input
          id={inputId}
          className={cn(
            'flex h-11 w-full rounded-xl px-4 py-3 text-base transition-smooth focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 touch-target',
            variant === 'dark'
              ? 'border border-white/30 bg-white/95 text-gray-900 placeholder:text-gray-500 focus:ring-blue-400 focus:border-blue-400 disabled:bg-gray-50'
              : variant === 'light'
              ? 'border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50'
              : 'border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50',
            error && 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }