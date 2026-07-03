import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Swal from 'sweetalert2'
import ReviewStars from '../../components/reviews/ReviewStars.jsx'
import ReviewStatusBadge from '../../components/reviews/ReviewStatusBadge.jsx'
import {
  deleteMyReview,
  getMyReviews,
  updateMyReview,
} from '../../services/productReviewService.js'
import { getApiErrorMessage, getValidationErrors } from '../../utils/apiErrors.js'

const filters = [
  ['', 'All'],
  ['pending', 'Pending'],
  ['approved', 'Approved'],
  ['rejected', 'Rejected'],
]

function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date)
}

function MyReviewsPage() {
  const [reviews, setReviews] = useState([])
  const [meta, setMeta] = useState(null)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [version, setVersion] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [editErrors, setEditErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true
    getMyReviews({ page, per_page: 8, status: status || undefined })
      .then((response) => {
        if (mounted) {
          setReviews(response.data || [])
          setMeta(response.meta || null)
          setError('')
        }
      })
      .catch((requestError) => mounted && setError(getApiErrorMessage(requestError, 'Your reviews could not be loaded.')))
      .finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [page, status, version])

  const beginEdit = (review) => {
    setEditingId(review.id)
    setEditForm({ rating: review.rating, title: review.title || '', comment: review.comment })
    setEditErrors({})
  }

  const saveEdit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setEditErrors({})
    try {
      await updateMyReview(editingId, {
        ...editForm,
        title: editForm.title.trim() || null,
        comment: editForm.comment.trim(),
      })
      setEditingId(null)
      setEditForm(null)
      setVersion((current) => current + 1)
      await Swal.fire({
        icon: 'success',
        title: 'Review resubmitted',
        text: 'Your changes are pending moderation before they appear publicly.',
        timer: 1800,
        showConfirmButton: false,
        customClass: { popup: 'storefront-alert' },
      })
    } catch (requestError) {
      const validation = getValidationErrors(requestError)
      setEditErrors(validation)
      if (Object.keys(validation).length === 0) {
        await Swal.fire({ icon: 'error', title: 'Update failed', text: getApiErrorMessage(requestError, 'Your review could not be updated.'), buttonsStyling: false, customClass: { popup: 'storefront-alert', confirmButton: 'swal-brand-button' } })
      }
    } finally {
      setSaving(false)
    }
  }

  const removeReview = async (review) => {
    const result = await Swal.fire({
      icon: 'warning', title: 'Delete this review?', text: 'This removes your review from moderation and the storefront.',
      showCancelButton: true, confirmButtonText: 'Delete review', cancelButtonText: 'Keep review', buttonsStyling: false,
      customClass: { popup: 'storefront-alert', confirmButton: 'swal-danger-button', cancelButton: 'swal-soft-button' },
    })
    if (!result.isConfirmed) return
    try {
      await deleteMyReview(review.id)
      setVersion((current) => current + 1)
      await Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Review deleted', timer: 1400, showConfirmButton: false, customClass: { popup: 'storefront-alert' } })
    } catch (requestError) {
      await Swal.fire({ icon: 'error', title: 'Delete failed', text: getApiErrorMessage(requestError, 'Your review could not be deleted.'), buttonsStyling: false, customClass: { popup: 'storefront-alert', confirmButton: 'swal-brand-button' } })
    }
  }

  return (
    <main className="my-reviews-page">
      <section className="my-reviews-hero"><div className="container"><Link to="/account"><i className="bi bi-arrow-left" /> Account</Link><span className="section-kicker">Customer feedback</span><h1>My reviews</h1><p>Manage your submitted product experiences and moderation status.</p></div></section>
      <section className="my-reviews-content"><div className="container">
        <div className="review-filter-tabs" role="group" aria-label="Filter reviews by status">
          {filters.map(([value, label]) => <button className={status === value ? 'active' : ''} type="button" key={label} onClick={() => { setLoading(true); setStatus(value); setPage(1) }}>{label}</button>)}
        </div>
        {error && <div className="review-page-alert" role="alert"><span>{error}</span><button type="button" onClick={() => { setLoading(true); setVersion((v) => v + 1) }}>Retry</button></div>}
        {loading ? <div className="my-review-loading">{[1, 2, 3].map((n) => <span key={n} />)}</div> : reviews.length === 0 ? (
          <div className="my-review-empty"><i className="bi bi-chat-square-heart" /><h2>No reviews here yet</h2><p>Completed purchases can be reviewed from their product page.</p><Link className="btn btn-brand" to="/products">Browse products</Link></div>
        ) : <div className="my-review-list">{reviews.map((review) => (
          <article className="my-review-card" key={review.id}>
            <header><span><i className="bi bi-box-seam" /></span><div><Link to={`/products/${review.product?.slug}`}>{review.product?.name || 'Product'}</Link><small>Reviewed {formatDate(review.reviewed_at)}</small></div><ReviewStatusBadge status={review.status} /></header>
            {editingId === review.id ? (
              <form className="my-review-edit-form" onSubmit={saveEdit}>
                <label>Rating</label><ReviewStars rating={editForm.rating} interactive onChange={(rating) => setEditForm((f) => ({ ...f, rating }))} disabled={saving} />
                {editErrors.rating?.map((m) => <span className="review-field-error" key={m}>{m}</span>)}
                <label htmlFor={`edit-title-${review.id}`}>Title <small>Optional</small></label><input id={`edit-title-${review.id}`} value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} disabled={saving} />
                <label htmlFor={`edit-comment-${review.id}`}>Review</label><textarea id={`edit-comment-${review.id}`} rows="4" value={editForm.comment} onChange={(e) => setEditForm((f) => ({ ...f, comment: e.target.value }))} disabled={saving} />
                {editErrors.comment?.map((m) => <span className="review-field-error" key={m}>{m}</span>)}
                <div><button className="btn btn-soft" type="button" onClick={() => setEditingId(null)} disabled={saving}>Cancel</button><button className="btn btn-brand" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save and resubmit'}</button></div>
              </form>
            ) : <><div className="my-review-rating"><ReviewStars rating={review.rating} />{review.is_verified_purchase && <span className="verified-review-badge"><i className="bi bi-patch-check-fill" /> Verified purchase</span>}</div>{review.title && <h2>{review.title}</h2>}<p>{review.comment}</p>{review.moderation_note && <div className="review-moderation-note"><i className="bi bi-info-circle" /><span><strong>Moderation note</strong>{review.moderation_note}</span></div>}<footer><button type="button" onClick={() => beginEdit(review)}><i className="bi bi-pencil" /> Edit</button><button className="is-danger" type="button" onClick={() => removeReview(review)}><i className="bi bi-trash3" /> Delete</button></footer></>}
          </article>
        ))}</div>}
        {meta?.last_page > 1 && <nav className="review-pagination"><button type="button" disabled={page <= 1} onClick={() => { setLoading(true); setPage((p) => p - 1) }}>Previous</button><span>Page {meta.current_page} of {meta.last_page}</span><button type="button" disabled={page >= meta.last_page} onClick={() => { setLoading(true); setPage((p) => p + 1) }}>Next</button></nav>}
      </div></section>
    </main>
  )
}

export default MyReviewsPage
