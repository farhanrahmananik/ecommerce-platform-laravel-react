import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import AuthLoadError from './AuthLoadError.jsx'
import LoadingScreen from './LoadingScreen.jsx'

function ProtectedRoute() {
  const {
    authError,
    isAuthenticated,
    isLoading,
    retryAuthBootstrap,
  } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (authError && !isAuthenticated) {
    return (
      <AuthLoadError message={authError} onRetry={retryAuthBootstrap} />
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export default ProtectedRoute
