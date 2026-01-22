import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { logger } from '@/utils/logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error
    logger.error('React Error Boundary caught an error', error, {
      componentStack: errorInfo.componentStack,
    })

    this.setState({
      error,
      errorInfo,
    })
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  handleGoHome = (): void => {
    window.location.href = '/'
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full space-y-6">
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5" />
                <h3 className="font-semibold">Something went wrong</h3>
              </div>
              <p className="mb-4 text-sm">
                An unexpected error occurred. Our team has been notified.
              </p>
              
              {import.meta.env.DEV && this.state.error && (
                <div className="mt-4 p-3 bg-destructive/5 rounded text-sm font-mono overflow-auto">
                  <div className="font-semibold mb-1">Error Details:</div>
                  <div>{this.state.error.toString()}</div>
                  
                  {this.state.errorInfo && (
                    <>
                      <div className="font-semibold mt-3 mb-1">Component Stack:</div>
                      <div className="text-xs opacity-75">
                        {this.state.errorInfo.componentStack}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={this.handleReset}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              
              <Button
                onClick={this.handleGoHome}
                className="flex-1"
              >
                <Home className="mr-2 h-4 w-4" />
                Go to Home
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>
                If the problem persists, please contact support.
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Higher-order component for wrapping components with ErrorBoundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
): React.ComponentType<P> {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}