import { Link } from 'react-router-dom'

function AuthLoadError({ message, onRetry }) {
  return (
    <main className="loading-screen" role="alert" aria-live="assertive">
      <div className="brand-mark brand-mark-lg" aria-hidden="true">
        <i className="bi bi-cloud-slash" />
      </div>
      <h1 className="h3">We could not verify your session</h1>
      <p>{message}</p>
      <div className="d-flex flex-wrap justify-content-center gap-3">
        <button className="btn btn-brand" type="button" onClick={onRetry}>
          <i className="bi bi-arrow-clockwise" aria-hidden="true" />
          Try again
        </button>
        <Link className="btn btn-outline-secondary" to="/">
          Continue to storefront
        </Link>
      </div>
    </main>
  )
}

export default AuthLoadError
