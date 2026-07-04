import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { useCart } from '../hooks/useCart.js'
import { isAdminUser } from '../utils/userRoles.js'

function AppLayout() {
  const { isAuthenticated, user } = useAuth()
  const { itemsCount } = useCart()
  const cartCount = Number.isFinite(itemsCount) ? Math.max(0, itemsCount) : 0
  const visibleCartCount = cartCount > 99 ? '99+' : cartCount

  return (
    <div className="app-shell">
      <header className="site-header">
        <nav className="navbar navbar-expand">
          <div className="container">
            <Link className="brand-link brand-link-dark" to="/">
              <span className="brand-mark" aria-hidden="true">
                <i className="bi bi-bag-heart-fill" />
              </span>
              <span>E-Commerce Platform</span>
            </Link>

            <div className="d-flex align-items-center gap-2 gap-md-3 header-actions">
              <NavLink className="nav-home-link d-none d-md-inline-flex" to="/">
                Home
              </NavLink>
              <NavLink
                className="nav-home-link d-none d-md-inline-flex"
                to="/products"
              >
                Products
              </NavLink>
              <NavLink
                className="cart-nav-link"
                to="/cart"
                aria-label={
                  isAuthenticated && cartCount > 0
                    ? `Cart with ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`
                    : 'Cart'
                }
              >
                <span className="cart-nav-link__icon" aria-hidden="true">
                  <i className="bi bi-bag" />
                </span>
                <span className="d-none d-lg-inline">Cart</span>
                {isAuthenticated && cartCount > 0 && (
                  <span className="cart-nav-badge" aria-hidden="true">
                    {visibleCartCount}
                  </span>
                )}
              </NavLink>
              {isAuthenticated ? (
                <>
                  {isAdminUser(user) && (
                    <Link
                      className="admin-nav-link d-none d-md-inline-flex"
                      to="/admin/dashboard"
                    >
                      <i className="bi bi-speedometer2" aria-hidden="true" />
                      Admin
                    </Link>
                  )}
                  <Link className="account-nav-button" to="/account">
                    <span className="account-nav-avatar">
                      {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                    </span>
                    <span className="d-none d-sm-inline">My account</span>
                    <i className="bi bi-arrow-up-right" aria-hidden="true" />
                  </Link>
                </>
              ) : (
                <>
                  <Link className="btn btn-link nav-login-link" to="/login">
                    Sign in
                  </Link>
                  <Link className="btn btn-brand btn-sm" to="/register">
                    Create account
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
      </header>

      <Outlet />

      <footer className="site-footer">
        <div className="container d-flex flex-column flex-md-row justify-content-between gap-3">
          <div>
            <Link className="brand-link brand-link-dark footer-brand" to="/">
              <span className="brand-mark brand-mark-sm" aria-hidden="true">
                <i className="bi bi-bag-heart-fill" />
              </span>
              <span>E-Commerce Platform</span>
            </Link>
            <p>Laravel API + React storefront foundation.</p>
          </div>
          <div className="footer-meta">
            <span>Secure sessions</span>
            <span>Responsive UI</span>
            <span>Built to scale</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default AppLayout
