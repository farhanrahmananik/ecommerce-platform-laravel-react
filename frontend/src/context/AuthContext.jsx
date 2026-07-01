import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from '../hooks/useAuth.js'
import { authApi } from '../services/api/authApi.js'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.getCurrentUser()
      const currentUser = response.data.user

      setUser(currentUser)

      return currentUser
    } catch (error) {
      if ([401, 419].includes(error.response?.status)) {
        setUser(null)

        return null
      }

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
        }
      })
      .catch(() => {
        if (isMounted) {
          setUser(null)
        }
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

  const login = useCallback(async (credentials) => {
    const response = await authApi.login(credentials)
    setUser(response.data.user)

    return response
  }, [])

  const register = useCallback(async (payload) => {
    const response = await authApi.register(payload)
    setUser(response.data.user)

    return response
  }, [])

  const logout = useCallback(async () => {
    const response = await authApi.logout()
    setUser(null)

    return response
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      register,
      logout,
      refreshUser,
    }),
    [isLoading, login, logout, refreshUser, register, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
