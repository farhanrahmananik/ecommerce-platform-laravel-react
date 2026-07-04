import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import AuthLoadError from './AuthLoadError.jsx'
import LoadingScreen from './LoadingScreen.jsx'

function GuestRoute() {
  const {
    authError,
    isAuthenticated,
    isLoading,
    retryAuthBootstrap,
  } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (authError && !isAuthenticated) {
    return (
      <AuthLoadError message={authError} onRetry={retryAuthBootstrap} />
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/account" replace />
  }

  return <Outlet />
}

export default GuestRoute
