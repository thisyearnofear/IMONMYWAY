/**
 * Global Error Boundary - Application-wide Error Handling
 * 
 * Provides comprehensive error catching and user-friendly error displays
 * with recovery options and detailed logging.
 */

"use client";

import { Component, ReactNode, ErrorInfo, useState } from 'react'
import { GlobalErrorHandler } from '@/lib/engines/error-handling-engine'
import { Button } from '@/components/ui/PremiumButton';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
}

interface GlobalErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, errorInfo: ErrorInfo, retry: () => void) => ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  enableRecovery?: boolean
  showErrorDetails?: boolean
}

// ============================================================================
// GLOBAL ERROR BOUNDARY COMPONENT
// ============================================================================

export class GlobalErrorBoundary extends Component<GlobalErrorBoundaryProps, ErrorBoundaryState> {
  private errorHandler: GlobalErrorHandler

  constructor(props: GlobalErrorBoundaryProps) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    }
    this.errorHandler = GlobalErrorHandler.getInstance()
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { 
      hasError: true, 
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo })

    // Log error with comprehensive context
    const context = {
      component: 'GlobalErrorBoundary',
      action: 'component_error',
      additionalData: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
        errorId: this.state.errorId,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      }
    }

    this.errorHandler.handleError(error, context, {
      logToConsole: true,
      logToService: true,
      showUserNotification: false, // We'll show our own UI
      enableRecovery: this.props.enableRecovery !== false,
      enableRetry: true
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  retry = (): void => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    })
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.state.errorInfo!, this.retry)
      }

      // Default comprehensive error UI
      return (
        <ErrorFallbackUI
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          onRetry={this.retry}
          showErrorDetails={this.props.showErrorDetails}
        />
      )
    }

    return this.props.children
  }
}

// ============================================================================
// ERROR FALLBACK UI COMPONENT
// ============================================================================

interface ErrorFallbackUIProps {
  error: Error
  errorInfo: ErrorInfo | null
  errorId: string | null
  onRetry: () => void
  showErrorDetails?: boolean
}

function ErrorFallbackUI({ 
  error, 
  errorInfo, 
  errorId, 
  onRetry, 
  showErrorDetails = false 
}: ErrorFallbackUIProps) {
  
  const handleRefresh = () => {
    window.location.reload()
  }

  const handleGoHome = () => {
    window.location.href = '/'
  }

  const handleReportError = () => {
    // In a real implementation, this would open a support ticket or send to error reporting service
    const errorReport = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    }
    
    console.log('Error report:', errorReport)
    
    // Copy error ID to clipboard for support
    if (navigator.clipboard && errorId) {
      navigator.clipboard.writeText(errorId).then(() => {
        alert(`Error ID ${errorId} copied to clipboard. Please include this when reporting the issue.`)
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full">
            <svg 
              className="w-8 h-8 text-red-600" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>
        </div>

        {/* Error Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Oops! Something went wrong
          </h1>
          <p className="text-gray-600">
            We&apos;re sorry, but an unexpected error occurred. Our team has been notified and is working on a fix.
          </p>
        </div>

        {/* Error ID */}
        {errorId && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Error ID</p>
                <p className="text-sm text-gray-500 font-mono">{errorId}</p>
              </div>
              <button
                onClick={handleReportError}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Report Issue
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 mb-6">
          <Button
            onClick={onRetry}
            variant="primary"
            className="w-full"
          >
            Try Again
          </Button>
          
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleRefresh}
              variant="secondary"
              className="w-full"
            >
              Refresh Page
            </Button>
            
            <Button
              onClick={handleGoHome}
              variant="ghost"
              className="w-full"
            >
              Go Home
            </Button>
          </div>
        </div>

        {/* Error Details (Development/Debug) */}
        {(showErrorDetails || process.env.NODE_ENV === 'development') && (
          <details className="mt-6">
            <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700 font-medium">
              Technical Details
            </summary>
            <div className="mt-3 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">Error Message</p>
                  <p className="text-xs text-red-600 font-mono break-all">
                    {error.message}
                  </p>
                </div>
                
                {error.stack && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Stack Trace</p>
                    <pre className="text-xs text-gray-600 bg-white p-2 rounded border overflow-auto max-h-32">
                      {error.stack}
                    </pre>
                  </div>
                )}
                
                {errorInfo?.componentStack && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Component Stack</p>
                    <pre className="text-xs text-gray-600 bg-white p-2 rounded border overflow-auto max-h-32">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </details>
        )}

        {/* Help Text */}
        <div className="mt-6 text-center">
            <p className="text-gray-600">
              If this problem persists, please contact support with the error ID above.
            </p>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// SPECIALIZED ERROR BOUNDARIES
// ============================================================================

interface ComponentErrorBoundaryProps {
  children: ReactNode
  componentName: string
  fallback?: ReactNode
  onError?: (error: Error) => void
}

export class ComponentErrorBoundary extends Component<
  ComponentErrorBoundaryProps,
  { hasError: boolean; error: Error | null }
> {
  constructor(props: ComponentErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const context = {
      component: this.props.componentName,
      action: 'component_render_error',
      additionalData: {
        componentStack: errorInfo.componentStack
      }
    }

    GlobalErrorHandler.getInstance().handleError(error, context)
    this.props.onError?.(error)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2 text-red-800">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Component Error</span>
          </div>
          <p className="mt-1 text-sm text-red-700">
            The {this.props.componentName} component encountered an error and couldn&apos;t render.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// ============================================================================
// ASYNC ERROR BOUNDARY HOOK
// ============================================================================

export function useAsyncErrorBoundary() {
  const [, setError] = useState()
  
  return (error: Error) => {
    setError(() => {
      throw error
    })
  }
}