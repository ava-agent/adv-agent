/**
 * Toast notification helper using antd-mobile
 */

import { Toast } from 'antd-mobile'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export function showToast(message: string, type: ToastType = 'info') {
  // Show toast with antd-mobile
  Toast.show({
    content: message,
    icon: type,
    position: 'top'
  })
}

/**
 * LocalStorage helper with error handling
 */

export const SafeStorage = {
  get: (key: string): string | null => {
    try {
      return localStorage.getItem(key)
    } catch (error) {
      console.error('LocalStorage get error:', error)
      return null
    }
  },
  set: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value)
    } catch (error) {
      console.error('LocalStorage set error:', error)
    }
  },
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('LocalStorage remove error:', error)
    }
  },
  clear: (): void => {
    try {
      localStorage.clear()
    } catch (error) {
      console.error('LocalStorage clear error:', error)
    }
  }
}
