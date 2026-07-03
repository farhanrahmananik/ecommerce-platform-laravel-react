import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import AdminSelect from '../../../components/admin/common/AdminSelect.jsx'
import ReviewStars from '../../../components/reviews/ReviewStars.jsx'
import ReviewStatusBadge from '../../../components/reviews/ReviewStatusBadge.jsx'
import {
  getAdminProductReviews,
  moderateProductReview,
} from '../../../services/productReviewService.js'
import { getApiErrorMessage } from '../../../utils/apiErrors.js'

const statusOptions = [
  { value: '', label: 'All statuses' }, { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' },
]
const ratingOptions = [
  { value: '', label: 'All ratings' }, ...[5, 4, 3, 2, 1].map((rating) => ({ value: String(rating), label: `${rating} stars` })),
]

function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date)
}

function AdminProductReviewsPage() {
  const [reviews, setReviews] = useState([])
  const [meta, setMeta] = useState(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [rating, setRating] = useState('')
  const [page, setPage] = useState(1)
  const [version, setVersion] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    getAdminProductReviews({ page, per_page: 15, search: search || undefined, status: status || undefined, rating: rating || undefined })
      .then((response) => {
        if (mounted) { setReviews(response.data || []); setMeta(response.meta || null); setError('') }
      })
      .catch((requestError) => mounted && setError(getApiErrorMessage(requestError, 'Product reviews could not be loaded.')))
      .finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [page, rating, search, status, version])

  const refresh = () => { setLoading(true); setVersion((current) => current + 1) }
  const updateFilter = (setter) => (value) => { setLoading(true); setter(String(value)); setPage(1) }
  const clearFilters = () => { setLoading(true); setSearchInput(''); setSearch(''); setStatus(''); setRating(''); setPage(1) }

  const moderate = async (review, nextStatus) => {
    const rejecting = nextStatus === 'rejected'
    const result = await Swal.fire({
      icon: rejecting ? 'warning' : 'question',
      title: rejecting ? 'Reject this review?' : 'Approve this review?',
      text: rejecting ? 'It will remain visible only to the customer and administrators.' : 'It will become visible on the product storefront.',
      input: rejecting ? 'textarea' : undefined,
      inputLabel: rejecting ? 'Moderation note (optional)' : undefined,
      inputPlaceholder: rejecting ? 'Explain why this review was rejected...' : undefined,
      inputAttributes: rejecting ? { maxlength: '1000' } : undefined,
      showCancelButton: true,
      confirmButtonText: rejecting ? 'Reject review' : 'Approve review',
      cancelButtonText: 'Cancel', buttonsStyling: false,
      customClass: { popup: 'storefront-alert', confirmButton: rejecting ? 'swal-danger-button' : 'swal-brand-button', cancelButton: 'swal-soft-button' },
    })
    if (!result.isConfirmed) return
    setBusyId(review.id)
    try {
      await moderateProductReview(review.id, { status: nextStatus, moderation_note: rejecting ? result.value?.trim() || null : null })
      refresh()
      await Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: rejecting ? 'Review rejected' : 'Review approved', timer: 1500, showConfirmButton: false, customClass: { popup: 'storefront-alert' } })
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'The review could not be moderated.'))
    } finally { setBusyId(null) }
  }

  const hasFilters = Boolean(search || status || rating)
  const submitSearch = (event) => { event.preventDefault(); setLoading(true); setSearch(searchInput.trim()); setPage(1) }

  return (
    <main className="admin-reviews-page">
      <header className="category-list-heading"><div><span className="admin-eyebrow">Trust and quality</span><h1>Product reviews</h1><p>Moderate verified customer feedback before it reaches the storefront.</p></div><button className="admin-refresh-button" type="button" onClick={refresh} disabled={loading}><i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`} /></button></header>
      <section className="admin-review-stats">
        {[['Loaded', reviews.length, 'bi-chat-square-text', 'blue'], ['Pending', reviews.filter((r) => r.status === 'pending').length, 'bi-hourglass-split', 'amber'], ['Approved', reviews.filter((r) => r.status === 'approved').length, 'bi-check-circle', 'green'], ['Verified', reviews.filter((r) => r.is_verified_purchase).length, 'bi-patch-check', 'violet']].map(([label, value, icon, tone]) => <article key={label}><span className={`tone-${tone}`}><i className={`bi ${icon}`} /></span><div><small>{label}</small><strong>{value}</strong></div></article>)}
      </section>
      <section className="category-list-card admin-reviews-card">
        <div className="admin-reviews-toolbar">
          <form className="category-search-form admin-review-search" onSubmit={submitSearch}><i className="bi bi-search" /><input type="search" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search review, product, or customer..." /><button type="submit">Search</button></form>
          <div className="admin-review-filters"><div className="admin-select-filter"><AdminSelect id="review-status" name="status" label="Status" value={status} options={statusOptions} onChange={updateFilter(setStatus)} /></div><div className="admin-select-filter"><AdminSelect id="review-rating" name="rating" label="Rating" value={rating} options={ratingOptions} onChange={updateFilter(setRating)} /></div>{hasFilters && <button className="category-clear-button" type="button" onClick={clearFilters}><i className="bi bi-x-circle" /> Clear</button>}</div>
        </div>
        {error && <div className="alert category-alert category-alert-danger"><i className="bi bi-exclamation-octagon" /><span>{error}</span><button type="button" onClick={refresh}>Retry</button></div>}
        {loading ? <div className="category-table-loading">{[1, 2, 3, 4].map((n) => <span key={n} />)}</div> : reviews.length === 0 ? <div className="category-empty-state"><span className="category-empty-icon"><i className="bi bi-chat-square-heart" /></span><h2>{hasFilters ? 'No matching reviews' : 'No reviews to moderate'}</h2><p>{hasFilters ? 'Adjust or clear the current filters.' : 'Customer submissions will appear here.'}</p></div> : (
          <><div className="table-responsive category-table-wrap"><table className="table category-table admin-review-table align-middle mb-0"><thead><tr><th>Product & customer</th><th>Rating</th><th>Review</th><th>Status</th><th>Date</th><th className="text-end">Actions</th></tr></thead><tbody>{reviews.map((review) => <tr key={review.id}><td data-label="Product & customer"><div className="admin-review-identity"><span><i className="bi bi-box-seam" /></span><div><strong>{review.product?.name || 'Product'}</strong><small>{review.customer?.name || 'Customer'}</small></div></div></td><td data-label="Rating"><ReviewStars rating={review.rating} /></td><td data-label="Review"><div className="admin-review-copy"><strong>{review.title || 'Untitled review'}</strong><p>{review.comment}</p>{review.is_verified_purchase && <span><i className="bi bi-patch-check-fill" /> Verified</span>}</div></td><td data-label="Status"><ReviewStatusBadge status={review.status} /></td><td data-label="Date"><span className="category-created-date">{formatDate(review.reviewed_at)}</span></td><td data-label="Actions"><div className="admin-review-actions"><button className="is-approve" type="button" disabled={busyId === review.id || review.status === 'approved'} onClick={() => moderate(review, 'approved')}><i className="bi bi-check-lg" /> Approve</button><button className="is-reject" type="button" disabled={busyId === review.id || review.status === 'rejected'} onClick={() => moderate(review, 'rejected')}><i className="bi bi-x-lg" /> Reject</button></div></td></tr>)}</tbody></table></div>
          {meta?.last_page > 1 && <footer className="category-pagination"><span>Showing <strong>{meta.from || 0}</strong> to <strong>{meta.to || 0}</strong> of <strong>{meta.total}</strong></span><nav><button type="button" disabled={page <= 1} onClick={() => { setLoading(true); setPage((p) => p - 1) }}><i className="bi bi-chevron-left" /></button><span>Page {meta.current_page} of {meta.last_page}</span><button type="button" disabled={page >= meta.last_page} onClick={() => { setLoading(true); setPage((p) => p + 1) }}><i className="bi bi-chevron-right" /></button></nav></footer>}
          </>)}
      </section>
    </main>
  )
}

export default AdminProductReviewsPage
