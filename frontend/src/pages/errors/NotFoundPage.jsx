import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <main className="not-found-page">
      <div className="not-found-orb" aria-hidden="true">
        <span>404</span>
      </div>
      <span className="eyebrow">
        <i className="bi bi-compass" aria-hidden="true" />
        Lost in the storefront
      </span>
      <h1>This page is not on the shelf.</h1>
      <p>
        The address may have changed, or the page may not be part of this
        storefront foundation yet.
      </p>
      <Link className="btn btn-brand btn-lg" to="/">
        <i className="bi bi-house" aria-hidden="true" />
        Return home
      </Link>
    </main>
  )
}

export default NotFoundPage
