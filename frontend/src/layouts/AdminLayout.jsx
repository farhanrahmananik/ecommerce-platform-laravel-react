import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { useAuth } from '../hooks/useAuth.js'
import { getApiErrorMessage } from '../utils/apiErrors.js'
import { getPrimaryRoleLabel } from '../utils/userRoles.js'

const navigationItems = [
  { label: 'Dashboard', icon: 'bi-grid-1x2', path: '/admin/dashboard', active: true },
  { label: 'Categories', icon: 'bi-tags', path: '/admin/categories', active: true },
  { label: 'Products', icon: 'bi-box-seam', path: '/admin/products', active: true },
  { label: 'Orders', icon: 'bi-receipt', path: '/admin/orders', active: true },
  { label: 'Coupons', icon: 'bi-ticket-perforated', path: '/admin/coupons', active: true },
  { label: 'Reviews', icon: 'bi-chat-square-heart', path: '/admin/product-reviews', active: true },
  { label: 'Stock Management', icon: 'bi-clipboard-data', path: '/admin/stock', active: true },
  { label: 'Reports', icon: 'bi-graph-up-arrow', path: '/admin/reports', active: true },
]

function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const isCategoryArea = location.pathname.startsWith('/admin/categories')
  const isProductArea = location.pathname.startsWith('/admin/products')
  const isOrderArea = location.pathname.startsWith('/admin/orders')
  const isCouponArea = location.pathname.startsWith('/admin/coupons')
  const isReviewArea = location.pathname.startsWith('/admin/product-reviews')
  const isStockArea = location.pathname.startsWith('/admin/stock')
  const isReportsArea = location.pathname.startsWith('/admin/reports')
  const currentSection = isCategoryArea
    ? 'Categories'
    : isProductArea
      ? 'Products'
      : isOrderArea
        ? 'Orders'
        : isCouponArea
          ? 'Coupons'
          : isReviewArea
            ? 'Reviews'
            : isStockArea
              ? 'Stock Management'
              : isReportsArea ? 'Reports & Analytics' : 'Dashboard'
  const currentArea = isCategoryArea || isProductArea
    ? 'Catalog'
    : isOrderArea
      ? 'Fulfillment'
      : isCouponArea
        ? 'Promotions'
        : isReviewArea
          ? 'Trust & Quality'
          : isStockArea
            ? 'Inventory'
            : isReportsArea ? 'Insights' : 'Overview'

  const handleLogout = async () => {
    setIsLoggingOut(true)

    try {
      await logout()
      await Swal.fire({
        icon: 'success',
        title: 'Signed out',
        text: 'Your admin session has ended securely.',
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
    <div className="admin-shell">
      <aside className={`admin-sidebar ${isSidebarOpen ? 'is-open' : ''}`}>
        <div className="admin-sidebar-header">
          <Link className="admin-brand" to="/admin/dashboard">
            <span className="admin-brand-mark" aria-hidden="true">
              <i className="bi bi-bag-heart-fill" />
            </span>
            <span>
              <strong>E-Commerce</strong>
              <small>Admin workspace</small>
            </span>
          </Link>
          <button
            className="admin-sidebar-close d-lg-none"
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close admin navigation"
          >
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </div>

        <nav className="admin-sidebar-nav" aria-label="Admin navigation">
          <span className="admin-nav-label">Workspace</span>
          {navigationItems.map((item) =>
            item.active ? (
              <NavLink
                className={({ isActive }) =>
                  `admin-sidebar-link ${isActive ? 'active' : ''}`
                }
                to={item.path}
                key={item.label}
                onClick={() => setIsSidebarOpen(false)}
              >
                <i className={`bi ${item.icon}`} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            ) : (
              <span className="admin-sidebar-link is-planned" key={item.label}>
                <i className={`bi ${item.icon}`} aria-hidden="true" />
                <span>{item.label}</span>
                <small>Soon</small>
              </span>
            ),
          )}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-user">
            <span>{user?.name?.charAt(0)?.toUpperCase() || 'A'}</span>
            <div>
              <strong>{user?.name}</strong>
              <small>{getPrimaryRoleLabel(user)}</small>
            </div>
          </div>
          <button
            className="admin-signout-button"
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            aria-label="Sign out"
          >
            {isLoggingOut ? (
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
            ) : (
              <i className="bi bi-box-arrow-right" aria-hidden="true" />
            )}
          </button>
        </div>
      </aside>

      {isSidebarOpen && (
        <button
          className="admin-sidebar-backdrop d-lg-none"
          type="button"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close admin navigation"
        />
      )}

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              className="admin-menu-button d-lg-none"
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open admin navigation"
            >
              <i className="bi bi-list" aria-hidden="true" />
            </button>
            <div>
              <span className="admin-breadcrumb">Admin / {currentArea}</span>
              <strong>{currentSection}</strong>
            </div>
          </div>

          <div className="admin-topbar-actions">
            <Link className="admin-storefront-link" to="/">
              <i className="bi bi-shop" aria-hidden="true" />
              <span className="d-none d-sm-inline">View storefront</span>
            </Link>
            <span className="admin-topbar-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </span>
          </div>
        </header>

        <div className="admin-main-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default AdminLayout
