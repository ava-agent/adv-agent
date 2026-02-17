/* eslint-disable react-refresh/only-export-components */
/**
 * OfflineIndicator Component
 *
 * Displays an offline indicator when network is unavailable
 */

import { useState, useEffect } from 'react'
import { showToast, SafeStorage } from '../utils/storage'

export function OfflineIndicator() {
  // Initialize with current online status
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) {
    return null
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      padding: '8px 16px',
      background: 'var(--error)',
      color: 'white',
      fontSize: '12px',
      fontWeight: 500,
      textAlign: 'center',
      zIndex: 10000,
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
    }}>
      <span style={{ marginRight: '8px' }}>⚠️</span>
      网络连接已断开，部分功能可能不可用
    </div>
  )
}

// Re-export utilities for backward compatibility
export { showToast, SafeStorage }
export type { ToastType } from '../utils/storage'
