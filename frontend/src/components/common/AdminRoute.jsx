import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { hasRoleData, isAdminUser } from '../../utils/userRoles.js'
import '../../assets/styles/admin.css'
import LoadingScreen from './LoadingScreen.jsx'

function AdminRoute() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!isAdminUser(user)) {
    const roleInformationMissing = !hasRoleData(user)

    return (
      <main className="admin-access-page">
        <div className="admin-access-glow" aria-hidden="true" />
        <section className="admin-access-card">
          <Link className="admin-access-brand" to="/">
            <span className="brand-mark" aria-hidden="true">
              <i className="bi bi-bag-heart-fill" />
            </span>
            <span>E-Commerce Platform</span>
          </Link>

          <span className="admin-access-icon" aria-hidden="true">
            <i className="bi bi-shield-lock" />
          </span>
          <span className="admin-eyebrow">Protected workspace</span>
          <h1>Admin access required</h1>
          <p>
            {roleInformationMissing
              ? 'Your authenticated profile does not include role information yet. Admin access will become available after the Role & Permission Management scope is implemented.'
              : 'Your account does not have a Super Admin, Store Manager, or Admin role.'}
          </p>

          <div className="admin-access-actions">
            <Link className="btn btn-brand" to="/account">
              <i className="bi bi-person" aria-hidden="true" />
              Return to account
            </Link>
            <Link className="btn btn-admin-soft" to="/">
              Storefront home
            </Link>
          </div>

          <div className="admin-access-note">
            <i className="bi bi-info-circle" aria-hidden="true" />
            <span>No permissions or account data were changed.</span>
          </div>
        </section>
      </main>
    )
  }

  return <Outlet />
}

export default AdminRoute
