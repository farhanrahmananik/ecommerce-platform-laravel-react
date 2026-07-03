import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { useAuth } from '../../hooks/useAuth.js'
import { getApiErrorMessage } from '../../utils/apiErrors.js'
import {
  getPrimaryRoleLabel,
  isAdminUser,
} from '../../utils/userRoles.js'

const dashboardCards = [
  {
    icon: 'bi-receipt',
    title: 'Orders',
    value: 'Order history',
    detail: 'Review purchases, statuses, totals, and delivery details.',
    tone: 'blue',
    path: '/account/orders',
    action: 'My Orders',
  },
  {
    icon: 'bi-star',
    title: 'Reviews',
    value: 'Your feedback',
    detail: 'Manage product reviews and track moderation status.',
    tone: 'orange',
    path: '/account/reviews',
    action: 'My Reviews',
  },
  {
    icon: 'bi-heart',
    title: 'Wishlist',
    value: 'Coming soon',
    detail: 'A saved-items experience can be added later.',
    tone: 'rose',
  },
]

function AccountDashboardPage() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const roleLabel = getPrimaryRoleLabel(user)

  const handleLogout = async () => {
    setIsLoggingOut(true)

    try {
      await logout()

      await Swal.fire({
        icon: 'success',
        title: 'Signed out',
        text: 'Your session has ended securely.',
        timer: 1400,
        showConfirmButton: false,
        customClass: { popup: 'storefront-alert' },
      })

      navigate('/', { replace: true })
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Could not sign out',
        text: getApiErrorMessage(error, 'Please try again.'),
        confirmButtonText: 'Close',
        customClass: {
          popup: 'storefront-alert',
          confirmButton: 'swal-brand-button',
        },
        buttonsStyling: false,
      })
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <main className="account-page">
      <section className="account-hero">
        <div className="container">
          <div className="account-hero-card">
            <div className="account-identity">
              <span className="account-avatar">
                {user?.name?.charAt(0)?.toUpperCase() || 'C'}
              </span>
              <div>
                <span className="eyebrow eyebrow-compact">
                  <i className="bi bi-patch-check-fill" aria-hidden="true" />
                  Authenticated account
                </span>
                <h1>Welcome, {user?.name}.</h1>
                <p>{user?.email}</p>
              </div>
            </div>

            <button
              className="btn btn-outline-light account-logout-button"
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <>
                  <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                  Signing out...
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-right" aria-hidden="true" />
                  Sign out
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      <section className="account-content">
        <div className="container">
          <div className="dashboard-intro">
            <div>
              <span className="section-kicker">Account dashboard</span>
              <h2>Your customer space</h2>
              <p>Access your order history and customer storefront tools.</p>
            </div>
            <span className="badge dashboard-preview-badge">
              <i className="bi bi-grid" aria-hidden="true" />
              Account overview
            </span>
            {isAdminUser(user) && (
              <Link className="btn btn-brand" to="/admin/dashboard">
                <i className="bi bi-speedometer2" aria-hidden="true" />
                Admin Dashboard
              </Link>
            )}
          </div>

          <div className="row g-4">
            <div className="col-lg-5">
              <article className="dashboard-card status-card h-100">
                <div className="dashboard-card-topline">
                  <span className="dashboard-icon dashboard-icon-green">
                    <i className="bi bi-shield-check" aria-hidden="true" />
                  </span>
                  <span className="badge status-badge">Active</span>
                </div>
                <span className="dashboard-card-label">Account Status</span>
                <h3>Secure and connected</h3>
                <p>Your Laravel Sanctum session is active for this account.</p>

                <dl className="account-details">
                  <div>
                    <dt>Name</dt>
                    <dd>{user?.name}</dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>{user?.email}</dd>
                  </div>
                  <div>
                    <dt>Role</dt>
                    <dd>{roleLabel}</dd>
                  </div>
                </dl>
              </article>
            </div>

            <div className="col-lg-7">
              <div className="row g-4 h-100">
                {dashboardCards.map((card) => (
                  <div className="col-md-6 col-xl-4" key={card.title}>
                    <article className="dashboard-card dashboard-mini-card h-100">
                      <span className={`dashboard-icon dashboard-icon-${card.tone}`}>
                        <i className={`bi ${card.icon}`} aria-hidden="true" />
                      </span>
                      <span className="dashboard-card-label">{card.title}</span>
                      <h3>{card.value}</h3>
                      <p>{card.detail}</p>
                      {card.path ? (
                        <Link className="dashboard-card-action" to={card.path}>
                          {card.action}
                          <i className="bi bi-arrow-right" aria-hidden="true" />
                        </Link>
                      ) : (
                        <span className="placeholder-label">UI placeholder</span>
                      )}
                    </article>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default AccountDashboardPage
