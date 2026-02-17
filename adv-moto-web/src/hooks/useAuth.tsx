/* eslint-disable react-refresh/only-export-components */
/**
 * Authentication Hook
 *
 * Provides authentication state and methods for user login/logout
 */

import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import type { User } from '../types'
import { DataService } from '../services/dataService'
import {
  signInAnonymously,
  signInWithWeChat,
  signOut,
  isCloudBaseConfigured
} from '../services/cloudBase'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  isCloudBaseEnabled: boolean
}

interface AuthContextType extends AuthState {
  login: () => Promise<void>
  logout: () => Promise<void>
  updateUser: (params: {
    nickName?: string
    avatarUrl?: string
    bio?: string
    bikes?: Array<{ brand: string; model: string; year: number }>
  }) => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

/**
 * Auth Provider Component
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    isCloudBaseEnabled: false
  })

  // Initialize auth on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Initialize data service
        await DataService.initialize()

        // Check if CloudBase is configured
        const cloudBaseEnabled = isCloudBaseConfigured()

        // Try to get current user
        const user = await DataService.getCurrentUser()

        setState({
          user,
          isAuthenticated: !!user,
          isLoading: false,
          error: null,
          isCloudBaseEnabled: cloudBaseEnabled
        })
      } catch (error: unknown) {
        console.error('Auth initialization failed:', error)
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Initialization failed'
        }))
      }
    }

    initializeAuth()
  }, [])

  /**
   * Login - Anonymous or WeChat
   */
  const login = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      if (isCloudBaseConfigured()) {
        // Try WeChat login first (for mini-program)
        try {
          await signInWithWeChat()
        } catch {
          // Fallback to anonymous login
          await signInAnonymously()
        }

        const user = await DataService.getCurrentUser()

        setState({
          user,
          isAuthenticated: !!user,
          isLoading: false,
          error: null,
          isCloudBaseEnabled: true
        })
      } else {
        // Create a guest user for local mode
        const guestUser: User = {
          id: 'guest',
          nickname: 'Guest User',
          avatarUrl: '',
          garage: [],
          isPremium: false,
          createdAt: new Date().toISOString()
        }

        setState({
          user: guestUser,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          isCloudBaseEnabled: false
        })
      }
    } catch (error: unknown) {
      console.error('Login failed:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed'
      }))
    }
  }, [])

  /**
   * Logout
   */
  const logout = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }))

    try {
      if (isCloudBaseConfigured()) {
        await signOut()
      }

      // Clear local data
      localStorage.clear()

      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        isCloudBaseEnabled: isCloudBaseConfigured()
      })
    } catch (error: unknown) {
      console.error('Logout failed:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Logout failed'
      }))
    }
  }, [])

  /**
   * Update user profile
   */
  const updateUser = useCallback(async (params: {
    nickName?: string
    avatarUrl?: string
    bio?: string
    bikes?: Array<{ brand: string; model: string; year: number }>
  }) => {
    setState(prev => ({ ...prev, isLoading: true }))

    try {
      const result = await DataService.updateUserProfile(params)

      if (result.success) {
        // Refresh user data
        const user = await DataService.getCurrentUser()

        setState(prev => ({
          ...prev,
          user,
          isLoading: false,
          error: null
        }))
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Failed to update profile'
        }))
      }
    } catch (error: unknown) {
      console.error('Update user failed:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Update failed'
      }))
    }
  }, [])

  /**
   * Refresh user data
   */
  const refreshUser = useCallback(async () => {
    try {
      const user = await DataService.getCurrentUser()

      setState(prev => ({
        ...prev,
        user,
        isAuthenticated: !!user
      }))
    } catch (error: unknown) {
      console.error('Refresh user failed:', error)
    }
  }, [])

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    updateUser,
    refreshUser
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * useAuth Hook
 *
 * Provides authentication state and methods
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, isAuthenticated, login, logout } = useAuth()
 *
 *   if (!isAuthenticated) {
 *     return <button onClick={login}>Login</button>
 *   }
 *
 *   return <div>Welcome, {user?.nickname}!</div>
 * }
 * ```
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}

/**
 * withAuth HOC
 *
 * Higher-order component that requires authentication
 *
 * @example
 * ```tsx
 * const ProtectedPage = withAuth(() => {
 *   return <div>This page requires authentication</div>
 * })
 * ```
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading, login } = useAuth()

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="spinner" />
        </div>
      )
    }

    if (!isAuthenticated) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <h2 className="text-2xl font-bold">Login Required</h2>
          <p className="text-text-muted">Please login to continue</p>
          <button onClick={login} className="btn btn-primary">
            Login
          </button>
        </div>
      )
    }

    return <Component {...props} />
  }
}
