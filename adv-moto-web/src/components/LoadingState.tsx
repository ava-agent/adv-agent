/**
 * LoadingState Component
 *
 * Displays a loading spinner with optional message
 */

import { DotLoading } from 'antd-mobile'

interface LoadingStateProps {
  message?: string
  fullScreen?: boolean
}

export function LoadingState({ message = '加载中...', fullScreen = false }: LoadingStateProps) {
  const content = (
    <div className="loading-state">
      <DotLoading color="var(--accent-orange)" />
      {message && (
        <div style={{
          marginTop: '12px',
          fontSize: '14px',
          color: 'var(--text-muted)'
        }}>
          {message}
        </div>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(10, 10, 11, 0.9)',
        backdropFilter: 'blur(20px)',
        zIndex: 9999
      }}>
        {content}
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      minHeight: '200px'
    }}>
      {content}
    </div>
  )
}

/**
 * EmptyState Component
 *
 * Displays when there's no data to show
 */

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
      textAlign: 'center'
    }}>
      <div style={{
        fontSize: '64px',
        marginBottom: '16px',
        opacity: 0.5
      }}>
        {icon}
      </div>
      <h3 style={{
        fontSize: '18px',
        fontWeight: 600,
        color: 'var(--text-primary)',
        margin: '0 0 8px'
      }}>
        {title}
      </h3>
      {description && (
        <p style={{
          fontSize: '14px',
          color: 'var(--text-muted)',
          margin: '0 0 24px',
          maxWidth: '300px'
        }}>
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="btn btn-primary"
          style={{
            padding: '12px 24px',
            fontSize: '14px'
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

/**
 * ErrorState Component
 *
 * Displays error message with retry option
 */

interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
}

export function ErrorState({ title = '出错了', message, onRetry }: ErrorStateProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
      textAlign: 'center'
    }}>
      <div style={{
        fontSize: '48px',
        marginBottom: '16px'
      }}>
        ⚠️
      </div>
      <h3 style={{
        fontSize: '18px',
        fontWeight: 600,
        color: 'var(--error)',
        margin: '0 0 8px'
      }}>
        {title}
      </h3>
      <p style={{
        fontSize: '14px',
        color: 'var(--text-muted)',
        margin: '0 0 24px',
        maxWidth: '300px'
      }}>
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn btn-secondary"
          style={{
            padding: '12px 24px',
            fontSize: '14px'
          }}
        >
          重试
        </button>
      )}
    </div>
  )
}
