import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

const foundationFeatures = [
  {
    icon: 'bi-shield-lock',
    title: 'Session-secure access',
    text: 'First-party Sanctum authentication with CSRF protection and credentialed requests.',
  },
  {
    icon: 'bi-layers',
    title: 'Clean application layers',
    text: 'A React interface backed by a focused Laravel API architecture.',
  },
  {
    icon: 'bi-phone',
    title: 'Designed for every screen',
    text: 'Responsive account journeys that feel considered on mobile and desktop.',
  },
]

function HomePage() {
  const { isAuthenticated, user } = useAuth()

  return (
    <main>
      <section className="home-hero">
        <div className="hero-grid-pattern" aria-hidden="true" />
        <div className="container position-relative">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <span className="eyebrow">
                <i className="bi bi-stars" aria-hidden="true" />
                Modern commerce starts here
              </span>
              <h1>A storefront foundation built for the whole journey.</h1>
              <p className="hero-lead">
                A production-minded Laravel API and React experience, beginning
                with secure customer authentication and a polished account flow.
              </p>

              <div className="hero-actions">
                <Link className="btn btn-brand btn-lg" to="/products">
                  Shop products
                  <i className="bi bi-arrow-right" aria-hidden="true" />
                </Link>
                {isAuthenticated ? (
                  <Link className="btn btn-soft btn-lg" to="/account">
                    Open your account
                  </Link>
                ) : (
                  <Link className="btn btn-soft btn-lg" to="/register">
                    Create an account
                  </Link>
                )}
              </div>

              <div className="hero-proof">
                <span>
                  <i className="bi bi-check-circle-fill" aria-hidden="true" />
                  Sanctum SPA sessions
                </span>
                <span>
                  <i className="bi bi-check-circle-fill" aria-hidden="true" />
                  Responsive by default
                </span>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="storefront-preview">
                <div className="preview-glow" aria-hidden="true" />
                <div className="preview-toolbar">
                  <div className="preview-dots" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                  <span>Account overview</span>
                  <i className="bi bi-shield-check" aria-hidden="true" />
                </div>

                <div className="preview-body">
                  <div className="preview-welcome">
                    <div>
                      <small>Good to see you</small>
                      <h2>{isAuthenticated ? user?.name : 'Your storefront account'}</h2>
                    </div>
                    <span className="preview-avatar">
                      {isAuthenticated
                        ? user?.name?.charAt(0)?.toUpperCase()
                        : 'E'}
                    </span>
                  </div>

                  <div className="preview-stat-grid">
                    <div className="preview-stat preview-stat-accent">
                      <span className="preview-stat-icon">
                        <i className="bi bi-person-check" aria-hidden="true" />
                      </span>
                      <small>Account status</small>
                      <strong>Ready</strong>
                    </div>
                    <div className="preview-stat">
                      <span className="preview-stat-icon">
                        <i className="bi bi-bag" aria-hidden="true" />
                      </span>
                      <small>Storefront</small>
                      <strong>Connected</strong>
                    </div>
                  </div>

                  <div className="preview-activity">
                    <div className="preview-activity-icon">
                      <i className="bi bi-lock-fill" aria-hidden="true" />
                    </div>
                    <div>
                      <strong>Protected account access</strong>
                      <span>Secure cookie-based session</span>
                    </div>
                    <span className="badge text-bg-success-subtle">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="foundation-section">
        <div className="container">
          <div className="section-heading text-center">
            <span className="section-kicker">Foundation first</span>
            <h2>Engineered for confidence, styled with intention.</h2>
            <p>
              The authentication layer is ready to support future storefront
              experiences without pretending those features exist today.
            </p>
          </div>

          <div className="row g-4">
            {foundationFeatures.map((feature) => (
              <div className="col-md-4" key={feature.title}>
                <article className="foundation-card h-100">
                  <span className="foundation-card-icon" aria-hidden="true">
                    <i className={`bi ${feature.icon}`} />
                  </span>
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-cta-section">
        <div className="container">
          <div className="home-cta-card">
            <div>
              <span className="section-kicker section-kicker-light">Customer access</span>
              <h2>
                {isAuthenticated
                  ? 'Your account is ready when you are.'
                  : 'Start with a secure customer account.'}
              </h2>
              <p>
                A clean first step toward a complete Laravel and React commerce
                experience.
              </p>
            </div>
            <Link
              className="btn btn-light btn-lg"
              to={isAuthenticated ? '/account' : '/register'}
            >
              {isAuthenticated ? 'Go to account' : 'Get started'}
              <i className="bi bi-arrow-up-right" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

export default HomePage
