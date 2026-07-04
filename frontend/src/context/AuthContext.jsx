import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from '../hooks/useAuth.js'
import { authApi } from '../services/api/authApi.js'
import { getApiErrorMessage } from '../utils/apiErrors.js'

const unauthenticatedStatuses = new Set([401, 419])

function isUnauthenticatedError(error) {
  return unauthenticatedStatuses.has(error.response?.status)
}

function getAuthLoadErrorMessage(error) {
  return getApiErrorMessage(
    error,
    'We could not verify your session. Please try again.',
  )
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.getCurrentUser()
      const currentUser = response.data.user

      setUser(currentUser)
      setAuthError('')

      return currentUser
    } catch (error) {
      if (isUnauthenticatedError(error)) {
        setUser(null)
        setAuthError('')

        return null
      }

      setAuthError(getAuthLoadErrorMessage(error))

      throw error
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    authApi
      .getCurrentUser()
      .then((response) => {
        if (isMounted) {
          setUser(response.data.user)
          setAuthError('')
        }
      })
      .catch((error) => {
        if (!isMounted) {
          return
        }

        if (isUnauthenticatedError(error)) {
          setUser(null)
          setAuthError('')

          return
        }

        setAuthError(getAuthLoadErrorMessage(error))
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const retryAuthBootstrap = useCallback(async () => {
    setIsLoading(true)

    try {
      await refreshUser()
    } catch {
      // refreshUser stores the user-facing error for the route guards.
    } finally {
      setIsLoading(false)
    }
  }, [refreshUser])

  const login = useCallback(async (credentials) => {
    const response = await authApi.login(credentials)
    setUser(response.data.user)
    setAuthError('')

    return response
  }, [])

  const register = useCallback(async (payload) => {
    const response = await authApi.register(payload)
    setUser(response.data.user)
    setAuthError('')

    return response
  }, [])

  const logout = useCallback(async () => {
    const response = await authApi.logout()
    setUser(null)
    setAuthError('')

    return response
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      authError,
      login,
      register,
      logout,
      refreshUser,
      retryAuthBootstrap,
    }),
    [
      authError,
      isLoading,
      login,
      logout,
      refreshUser,
      register,
      retryAuthBootstrap,
      user,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
