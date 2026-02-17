/**
 * ErrorBoundary Component
 *
 * Catches JavaScript errors in component tree and displays fallback UI
 */

import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          background: 'var(--bg-primary)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px'
          }}>
            💥
          </div>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 600,
            color: 'var(--error)',
            margin: '0 0 12px'
          }}>
            应用出错了
          </h2>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-muted)',
            margin: '0 0 24px',
            maxWidth: '400px'
          }}>
            {this.state.error?.message || '发生了未知错误，请刷新页面重试'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
            style={{
              padding: '12px 24px',
              fontSize: '14px'
            }}
          >
            刷新页面
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Higher-order component for error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
): React.ComponentType<P> {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}
