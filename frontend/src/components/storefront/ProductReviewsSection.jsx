import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Swal from 'sweetalert2'
import ReviewStars from '../reviews/ReviewStars.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import {
  createProductReview,
  getProductReviews,
} from '../../services/productReviewService.js'
import { getApiErrorMessage, getValidationErrors } from '../../utils/apiErrors.js'

function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Recently'
    : new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date)
}

function FieldErrors({ errors }) {
  if (!errors) return null
  return (Array.isArray(errors) ? errors : [errors]).map((message) => (
    <span className="review-field-error" key={message}>{message}</span>
  ))
}

function ProductReviewsSection({ productSlug, initialSummary }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const [reviews, setReviews] = useState([])
  const [meta, setMeta] = useState(null)
  const [summary, setSummary] = useState(initialSummary)
  const [page, setPage] = useState(1)
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [form, setForm] = useState({ rating: 5, title: '', comment: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let mounted = true
    getProductReviews(productSlug, { page, per_page: 6 })
      .then((response) => {
        if (mounted) {
          setReviews(response.data || [])
          setMeta(response.meta || null)
          setSummary(response.summary || initialSummary)
          setLoadError('')
        }
      })
      .catch((error) => {
        if (mounted) {
          setLoadError(getApiErrorMessage(error, 'Reviews could not be loaded.'))
        }
      })
      .finally(() => mounted && setIsLoading(false))

    return () => { mounted = false }
  }, [initialSummary, page, productSlug, refreshVersion])

  const updateForm = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
    setFormError('')
  }

  const submitReview = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setErrors({})
    setFormError('')

    try {
      await createProductReview(productSlug, {
        rating: form.rating,
        title: form.title.trim() || null,
        comment: form.comment.trim(),
      })
      setForm({ rating: 5, title: '', comment: '' })
      setPage(1)
      setRefreshVersion((current) => current + 1)

      await Swal.fire({
        icon: 'success',
        title: 'Review submitted',
        text: 'Thank you. Your review is pending approval before it appears publicly.',
        confirmButtonText: 'Got it',
        buttonsStyling: false,
        customClass: { popup: 'storefront-alert', confirmButton: 'swal-brand-button' },
      })
    } catch (error) {
      const validationErrors = getValidationErrors(error)
      setErrors(validationErrors)
      setFormError(
        validationErrors.product?.[0] ||
        getApiErrorMessage(error, 'Your review could not be submitted.'),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const average = Number(summary?.average_rating || 0)
  const count = Number(summary?.review_count || 0)
  const breakdown = summary?.rating_breakdown || []

  return (
    <section className="product-reviews-section app-section-card storefront-reviews-section" id="product-reviews">
      <header className="product-reviews-heading">
        <div>
          <span className="section-kicker">Customer feedback</span>
          <h2>Product reviews</h2>
          <p>Verified perspectives from customers who completed a purchase.</p>
        </div>
        <div className="product-rating-score storefront-review-summary">
          <strong>{average.toFixed(1)}</strong>
          <div><ReviewStars rating={average} /><span>{count} {count === 1 ? 'review' : 'reviews'}</span></div>
        </div>
      </header>

      <div className="product-review-layout">
        <aside className="product-rating-breakdown storefront-rating-breakdown">
          <h3>Rating breakdown</h3>
          {breakdown.map((row) => {
            const percentage = count > 0 ? (Number(row.count) / count) * 100 : 0
            return (
              <div className="rating-breakdown-row" key={row.rating}>
                <span>{row.rating} <i className="bi bi-star-fill" /></span>
                <div><span style={{ width: `${percentage}%` }} /></div>
                <b>{row.count}</b>
              </div>
            )
          })}
          {breakdown.length === 0 && <p>No ratings yet.</p>}

          <div className="review-form-shell">
            {isAuthenticated ? (
              <form onSubmit={submitReview} noValidate>
                <div className="review-form-heading">
                  <span><i className="bi bi-pencil-square" /></span>
                  <div><h3>Write a review</h3><p>Delivered purchases only.</p></div>
                </div>
                <label>Your rating</label>
                <ReviewStars
                  rating={form.rating}
                  interactive
                  onChange={(rating) => updateForm('rating', rating)}
                  disabled={isSubmitting}
                />
                <FieldErrors errors={errors.rating} />
                <label htmlFor="review-title">Title <small>Optional</small></label>
                <input
                  id="review-title"
                  value={form.title}
                  onChange={(event) => updateForm('title', event.target.value)}
                  maxLength="150"
                  placeholder="Sum up your experience"
                  disabled={isSubmitting}
                />
                <FieldErrors errors={errors.title} />
                <label htmlFor="review-comment">Your review</label>
                <textarea
                  id="review-comment"
                  value={form.comment}
                  onChange={(event) => updateForm('comment', event.target.value)}
                  rows="5"
                  maxLength="3000"
                  placeholder="Share at least 10 characters about the product..."
                  disabled={isSubmitting}
                />
                <FieldErrors errors={errors.comment} />
                {formError && <div className="review-form-error" role="alert">{formError}</div>}
                <button className="btn btn-brand" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <><span className="spinner-border spinner-border-sm" /> Submitting...</> : <><i className="bi bi-send" /> Submit review</>}
                </button>
              </form>
            ) : (
              <div className="review-signin-prompt">
                <span><i className="bi bi-person-lock" /></span>
                <h3>Sign in to review</h3>
                <p>Purchased this product? Sign in to share your experience.</p>
                <Link className="btn btn-brand" to="/login" state={{ from: location }}>Sign in</Link>
              </div>
            )}
          </div>
        </aside>

        <div className="product-review-list storefront-review-list">
          {loadError && <div className="review-list-error" role="alert"><span>{loadError}</span><button type="button" onClick={() => { setIsLoading(true); setRefreshVersion((v) => v + 1) }}>Retry</button></div>}
          {isLoading ? (
            <div className="review-list-loading">{[1, 2, 3].map((item) => <span key={item} />)}</div>
          ) : reviews.length === 0 ? (
            <div className="review-empty-state app-empty-state"><i className="bi bi-chat-square-heart" /><h3>No approved reviews yet</h3><p>Be the first verified customer to share feedback.</p></div>
          ) : reviews.map((review) => (
            <article className="storefront-review-card app-card-hover" key={review.id}>
              <header>
                <span className="reviewer-avatar">{review.customer?.name?.charAt(0)?.toUpperCase() || 'C'}</span>
                <div><strong>{review.customer?.name || 'Customer'}</strong><small>{formatDate(review.reviewed_at)}</small></div>
                <ReviewStars rating={review.rating} />
              </header>
              {review.title && <h3>{review.title}</h3>}
              <p>{review.comment}</p>
              {review.is_verified_purchase && <span className="verified-review-badge"><i className="bi bi-patch-check-fill" /> Verified purchase</span>}
            </article>
          ))}
          {meta?.last_page > 1 && (
            <nav className="review-pagination" aria-label="Review pagination">
              <button type="button" disabled={page <= 1} onClick={() => { setIsLoading(true); setPage((p) => p - 1) }}><i className="bi bi-arrow-left" /> Previous</button>
              <span>Page {meta.current_page} of {meta.last_page}</span>
              <button type="button" disabled={page >= meta.last_page} onClick={() => { setIsLoading(true); setPage((p) => p + 1) }}>Next <i className="bi bi-arrow-right" /></button>
            </nav>
          )}
        </div>
      </div>
    </section>
  )
}

export default ProductReviewsSection
