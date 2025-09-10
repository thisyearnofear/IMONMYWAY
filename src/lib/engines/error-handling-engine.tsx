/**
 * Error Handling Engine - Comprehensive Error Management System
 * 
 * Provides unified error handling, recovery mechanisms, and user-friendly error reporting
 * following reliability principles.
 */

"use client";

import { Component, ReactNode, ErrorInfo } from 'react'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ErrorContext {
  component?: string
  action?: string
  userId?: string
  timestamp: number
  userAgent: string
  url: string
  additionalData?: any
}

interface RetryConfig {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
  retryCondition?: (error: Error) => boolean
}

interface ErrorRecoveryStrategy {
  type: 'retry' | 'fallback' | 'redirect' | 'refresh' | 'ignore'
  config?: any
}

interface ErrorHandlerConfig {
  logToConsole: boolean
  logToService: boolean
  showUserNotification: boolean
  enableRecovery: boolean
  enableRetry: boolean
}

// ============================================================================
// ERROR CLASSIFICATION
// ============================================================================

export enum ErrorType {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  SERVER = 'server',
  CLIENT = 'client',
  BLOCKCHAIN = 'blockchain',
  LOCATION = 'location',
  UNKNOWN = 'unknown'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// ============================================================================
// ERROR CLASSIFICATION UTILITIES
// ============================================================================

export class ErrorClassifier {
  static classifyError(error: Error): { type: ErrorType; severity: ErrorSeverity } {
    const message = error.message.toLowerCase()
    const name = error.name.toLowerCase()

    // Network errors
    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('connection') ||
      name.includes('networkerror')
    ) {
      return { type: ErrorType.NETWORK, severity: ErrorSeverity.MEDIUM }
    }

    // Blockchain errors
    if (
      message.includes('wallet') ||
      message.includes('metamask') ||
      message.includes('transaction') ||
      message.includes('gas') ||
      message.includes('contract')
    ) {
      return { type: ErrorType.BLOCKCHAIN, severity: ErrorSeverity.HIGH }
    }

    // Location errors
    if (
      message.includes('geolocation') ||
      message.includes('location') ||
      message.includes('gps')
    ) {
      return { type: ErrorType.LOCATION, severity: ErrorSeverity.MEDIUM }
    }

    // Authentication errors
    if (
      message.includes('unauthorized') ||
      message.includes('authentication') ||
      message.includes('login')
    ) {
      return { type: ErrorType.AUTHENTICATION, severity: ErrorSeverity.HIGH }
    }

    // Validation errors
    if (
      message.includes('validation') ||
      message.includes('invalid') ||
      message.includes('required')
    ) {
      return { type: ErrorType.VALIDATION, severity: ErrorSeverity.LOW }
    }

    // Server errors
    if (
      message.includes('500') ||
      message.includes('server') ||
      message.includes('internal')
    ) {
      return { type: ErrorType.SERVER, severity: ErrorSeverity.HIGH }
    }

    // Not found errors
    if (
      message.includes('404') ||
      message.includes('not found')
    ) {
      return { type: ErrorType.NOT_FOUND, severity: ErrorSeverity.MEDIUM }
    }

    return { type: ErrorType.UNKNOWN, severity: ErrorSeverity.MEDIUM }
  }

  static isRetryableError(error: Error): boolean {
    const { type } = this.classifyError(error)
    
    // Retryable error types
    const retryableTypes = [
      ErrorType.NETWORK,
      ErrorType.SERVER,
      ErrorType.BLOCKCHAIN // Some blockchain errors are retryable
    ]

    return retryableTypes.includes(type)
  }

  static getRecoveryStrategy(error: Error): ErrorRecoveryStrategy {
    const { type, severity } = this.classifyError(error)

    switch (type) {
      case ErrorType.NETWORK:
        return { type: 'retry', config: { maxAttempts: 3, baseDelay: 1000 } }
      
      case ErrorType.AUTHENTICATION:
        return { type: 'redirect', config: { path: '/login' } }
      
      case ErrorType.NOT_FOUND:
        return { type: 'redirect', config: { path: '/' } }
      
      case ErrorType.VALIDATION:
        return { type: 'fallback', config: { showForm: true } }
      
      case ErrorType.LOCATION:
        return { type: 'fallback', config: { useManualInput: true } }
      
      case ErrorType.BLOCKCHAIN:
        if (severity === ErrorSeverity.CRITICAL) {
          return { type: 'refresh' }
        }
        return { type: 'retry', config: { maxAttempts: 2, baseDelay: 2000 } }
      
      default:
        return { type: 'fallback' }
    }
  }
}

// ============================================================================
// RETRY MECHANISM
// ============================================================================

export class RetryManager {
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2
    }
  ): Promise<T> {
    let lastError: Error
    
    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        
        // Check if error is retryable
        if (config.retryCondition && !config.retryCondition(lastError)) {
          throw lastError
        }
        
        if (!ErrorClassifier.isRetryableError(lastError)) {
          throw lastError
        }
        
        // Don't delay on last attempt
        if (attempt === config.maxAttempts) {
          break
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
          config.maxDelay
        )
        
        console.log(`Retry attempt ${attempt}/${config.maxAttempts} after ${delay}ms delay`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    throw lastError!
  }
}

// ============================================================================
// ERROR LOGGING & REPORTING
// ============================================================================

export class ErrorLogger {
  private static logs: Array<{
    error: Error
    context: ErrorContext
    classification: { type: ErrorType; severity: ErrorSeverity }
    timestamp: number
  }> = []

  static logError(
    error: Error,
    context: Partial<ErrorContext> = {},
    config: ErrorHandlerConfig = {
      logToConsole: true,
      logToService: false,
      showUserNotification: true,
      enableRecovery: true,
      enableRetry: true
    }
  ): void {
    const fullContext: ErrorContext = {
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...context
    }

    const classification = ErrorClassifier.classifyError(error)

    const logEntry = {
      error,
      context: fullContext,
      classification,
      timestamp: Date.now()
    }

    // Store in memory
    this.logs.push(logEntry)

    // Console logging
    if (config.logToConsole) {
      console.group(`🚨 Error [${classification.type}] - ${classification.severity}`)
      console.error('Error:', error)
      console.log('Context:', fullContext)
      console.log('Classification:', classification)
      console.groupEnd()
    }

    // External service logging (future enhancement)
    if (config.logToService) {
      this.sendToLoggingService(logEntry)
    }
  }

  private static async sendToLoggingService(logEntry: any): Promise<void> {
    try {
      // In a real implementation, this would send to a logging service
      // For now, we'll just log that it would be sent
      console.log('📤 Would send to logging service:', {
        errorType: logEntry.classification.type,
        severity: logEntry.classification.severity,
        message: logEntry.error.message,
        context: logEntry.context
      })
    } catch (err) {
      console.error('Failed to send error to logging service:', err)
    }
  }

  static getErrorLogs(): typeof ErrorLogger.logs {
    return [...this.logs]
  }

  static clearLogs(): void {
    this.logs = []
  }

  static getErrorStats(): {
    total: number
    byType: Record<ErrorType, number>
    bySeverity: Record<ErrorSeverity, number>
  } {
    const stats = {
      total: this.logs.length,
      byType: {} as Record<ErrorType, number>,
      bySeverity: {} as Record<ErrorSeverity, number>
    }

    // Initialize counters
    Object.values(ErrorType).forEach(type => {
      stats.byType[type] = 0
    })
    Object.values(ErrorSeverity).forEach(severity => {
      stats.bySeverity[severity] = 0
    })

    // Count occurrences
    this.logs.forEach(log => {
      stats.byType[log.classification.type]++
      stats.bySeverity[log.classification.severity]++
    })

    return stats
  }
}

// ============================================================================
// GLOBAL ERROR HANDLER
// ============================================================================

export class GlobalErrorHandler {
  private static instance: GlobalErrorHandler
  private notificationCallback?: (message: string, type: string) => void

  static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler()
    }
    return GlobalErrorHandler.instance
  }

  setNotificationCallback(callback: (message: string, type: string) => void): void {
    this.notificationCallback = callback
  }

  async handleError(
    error: Error,
    context: Partial<ErrorContext> = {},
    config: ErrorHandlerConfig = {
      logToConsole: true,
      logToService: false,
      showUserNotification: true,
      enableRecovery: true,
      enableRetry: true
    }
  ): Promise<void> {
    // Log the error
    ErrorLogger.logError(error, context, config)

    const classification = ErrorClassifier.classifyError(error)

    // Show user notification
    if (config.showUserNotification && this.notificationCallback) {
      const userMessage = this.getUserFriendlyMessage(error, classification)
      this.notificationCallback(userMessage, classification.severity)
    }

    // Attempt recovery if enabled
    if (config.enableRecovery) {
      await this.attemptRecovery(error, context)
    }
  }

  private getUserFriendlyMessage(
    error: Error,
    classification: { type: ErrorType; severity: ErrorSeverity }
  ): string {
    const messages = {
      [ErrorType.NETWORK]: 'Connection issue. Please check your internet and try again.',
      [ErrorType.BLOCKCHAIN]: 'Blockchain transaction failed. Please try again or check your wallet.',
      [ErrorType.LOCATION]: 'Location access required. Please enable GPS and try again.',
      [ErrorType.AUTHENTICATION]: 'Authentication required. Please log in again.',
      [ErrorType.AUTHORIZATION]: 'You don\'t have permission to perform this action.',
      [ErrorType.NOT_FOUND]: 'The requested resource was not found.',
      [ErrorType.SERVER]: 'Server error. Please try again in a moment.',
      [ErrorType.VALIDATION]: 'Please check your input and try again.',
      [ErrorType.CLIENT]: 'An unexpected error occurred. Please refresh the page.',
      [ErrorType.UNKNOWN]: 'An unexpected error occurred. Please try again.'
    }

    return messages[classification.type] || messages[ErrorType.UNKNOWN]
  }

  private async attemptRecovery(error: Error, context: Partial<ErrorContext>): Promise<void> {
    const strategy = ErrorClassifier.getRecoveryStrategy(error)

    switch (strategy.type) {
      case 'retry':
        // Retry logic would be handled by the calling code
        console.log('🔄 Recovery strategy: Retry recommended')
        break

      case 'fallback':
        console.log('🔄 Recovery strategy: Fallback to alternative method')
        // Implement fallback logic based on strategy.config
        break

      case 'redirect':
        console.log('🔄 Recovery strategy: Redirect to', strategy.config?.path)
        // In a real implementation, this would trigger navigation
        break

      case 'refresh':
        console.log('🔄 Recovery strategy: Page refresh recommended')
        // Could automatically refresh after user confirmation
        break

      case 'ignore':
        console.log('🔄 Recovery strategy: Error can be safely ignored')
        break
    }
  }
}

// ============================================================================
// REACT ERROR BOUNDARY
// ============================================================================

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, errorInfo: ErrorInfo) => ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

export class GlobalErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo })

    // Log error with context
    const context: Partial<ErrorContext> = {
      component: 'ErrorBoundary',
      additionalData: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true
      }
    }

    GlobalErrorHandler.getInstance().handleError(error, context)

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.state.errorInfo!)
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Something went wrong
                </h3>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                We&apos;re sorry, but something unexpected happened. Please try refreshing the page.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Refresh Page
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Try Again
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4">
                <summary className="text-sm text-gray-500 cursor-pointer">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// ============================================================================
// REACT HOOKS
// ============================================================================

export function useErrorHandler() {
  const globalHandler = GlobalErrorHandler.getInstance()

  const handleError = async (
    error: Error,
    context: Partial<ErrorContext> = {},
    config?: Partial<ErrorHandlerConfig>
  ) => {
    await globalHandler.handleError(error, context, {
      logToConsole: true,
      logToService: false,
      showUserNotification: true,
      enableRecovery: true,
      enableRetry: true,
      ...config
    })
  }

  const handleAsyncError = async (
    operation: () => Promise<any>,
    context: Partial<ErrorContext> = {},
    retryConfig?: Partial<RetryConfig>
  ): Promise<any> => {
    try {
      if (retryConfig) {
        return await RetryManager.executeWithRetry(operation, {
          maxAttempts: 3,
          baseDelay: 1000,
          maxDelay: 10000,
          backoffMultiplier: 2,
          ...retryConfig
        })
      } else {
        return await operation()
      }
    } catch (error) {
      await handleError(error as Error, context)
      return null
    }
  }

  return {
    handleError,
    handleAsyncError,
    getErrorLogs: ErrorLogger.getErrorLogs,
    getErrorStats: ErrorLogger.getErrorStats,
    clearErrorLogs: ErrorLogger.clearLogs
  }
}