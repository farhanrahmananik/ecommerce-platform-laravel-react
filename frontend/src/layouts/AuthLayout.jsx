import { Link, Outlet } from 'react-router-dom'

const authHighlights = [
  {
    icon: 'bi-shield-check',
    title: 'Secure by design',
    text: 'First-party session authentication powered by Laravel Sanctum.',
  },
  {
    icon: 'bi-lightning-charge',
    title: 'Fast storefront access',
    text: 'A focused sign-in flow that gets you back to shopping quickly.',
  },
  {
    icon: 'bi-bag-check',
    title: 'Ready for what is next',
    text: 'Your account foundation for future orders, carts, and wishlists.',
  },
]

function AuthLayout() {
  return (
    <main className="auth-shell auth-shell-polish">
      <div className="auth-orb auth-orb-one" aria-hidden="true" />
      <div className="auth-orb auth-orb-two" aria-hidden="true" />

      <div className="container auth-container">
        <div className="auth-topbar auth-brand-bar">
          <Link className="brand-link auth-brand" to="/" aria-label="E-Commerce Platform home">
            <span className="brand-mark" aria-hidden="true">
              <i className="bi bi-bag-heart-fill" />
            </span>
            <span>E-Commerce Platform</span>
          </Link>
          <Link className="back-home-link" to="/">
            <i className="bi bi-arrow-left" aria-hidden="true" />
            Back to storefront
          </Link>
        </div>

        <div className="row g-4 g-xl-5 align-items-center auth-content-row">
          <div className="col-lg-6">
            <section className="auth-promo auth-hero-panel">
              <span className="eyebrow eyebrow-light">
                <i className="bi bi-stars" aria-hidden="true" />
                Your account, thoughtfully built
              </span>
              <h1>Everything you love, one secure sign-in away.</h1>
              <p className="auth-promo-lead">
                A polished account experience for a modern Laravel API and React
                storefront.
              </p>

              <div className="auth-highlights">
                {authHighlights.map((item) => (
                  <div className="auth-highlight auth-highlight-card" key={item.title}>
                    <span className="auth-highlight-icon" aria-hidden="true">
                      <i className={`bi ${item.icon}`} />
                    </span>
                    <div>
                      <h2>{item.title}</h2>
                      <p>{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="auth-trust-row">
                <div className="auth-avatar-stack" aria-hidden="true">
                  <span>AM</span>
                  <span>RK</span>
                  <span>JL</span>
                </div>
                <p>
                  <strong>Storefront-ready</strong>
                  <span>Built for a seamless customer journey</span>
                </p>
              </div>
            </section>
          </div>

          <div className="col-lg-6 col-xl-5 offset-xl-1 auth-card-column">
            <Outlet />
          </div>
        </div>

        <footer className="auth-footer auth-footer-note">
          <span>© {new Date().getFullYear()} E-Commerce Platform</span>
          <span>Laravel API + React</span>
        </footer>
      </div>
    </main>
  )
}

export default AuthLayout
