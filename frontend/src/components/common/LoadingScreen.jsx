function LoadingScreen() {
  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <div className="brand-mark brand-mark-lg" aria-hidden="true">
        <i className="bi bi-bag-heart-fill" />
      </div>
      <div className="loading-pulse" aria-hidden="true" />
      <p>Preparing your storefront...</p>
      <span className="visually-hidden">Loading</span>
    </div>
  )
}

export default LoadingScreen
