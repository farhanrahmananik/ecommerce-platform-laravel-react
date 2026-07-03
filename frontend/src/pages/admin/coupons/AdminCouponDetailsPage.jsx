import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Swal from 'sweetalert2'
import {
  deleteCoupon,
  getCoupon,
} from '../../../services/adminCouponService.js'
import { getApiErrorMessage } from '../../../utils/apiErrors.js'

function formatAmount(value) {
  const amount = Number(value)

  return Number.isFinite(amount)
    ? new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)
    : '-'
}

function formatDate(value, fallback = 'Not set') {
  if (!value) {
    return fallback
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? fallback
    : new Intl.DateTimeFormat('en-US', {
        dateStyle: 'long',
        timeStyle: 'short',
      }).format(date)
}

function SummaryItem({ icon, label, value }) {
  return (
    <div className="coupon-summary-item app-card">
      <span aria-hidden="true"><i className={`bi ${icon}`} /></span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  )
}

function AdminCouponDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [coupon, setCoupon] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')
  const [requestVersion, setRequestVersion] = useState(0)

  useEffect(() => {
    let isMounted = true

    getCoupon(id)
      .then((response) => {
        if (isMounted) {
          setCoupon(response.data ?? response)
          setError('')
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(
            requestError.response?.status === 404
              ? 'The requested coupon could not be found.'
              : getApiErrorMessage(requestError, 'Coupon details could not be loaded.'),
          )
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [id, requestVersion])

  const retry = () => {
    setCoupon(null)
    setError('')
    setIsLoading(true)
    setRequestVersion((current) => current + 1)
  }

  const handleDelete = async () => {
    const confirmation = await Swal.fire({
      icon: 'warning',
      title: 'Delete this coupon?',
      text: `${coupon.code} will no longer be available for customer checkout.`,
      showCancelButton: true,
      confirmButtonText: 'Delete Coupon',
      cancelButtonText: 'Keep Coupon',
      reverseButtons: true,
      buttonsStyling: false,
      customClass: {
        popup: 'storefront-alert',
        confirmButton: 'swal-danger-button',
        cancelButton: 'swal-cancel-button',
        actions: 'swal-category-actions',
      },
    })

    if (!confirmation.isConfirmed) {
      return
    }

    setIsDeleting(true)
    setError('')

    try {
      await deleteCoupon(coupon.id)

      await Swal.fire({
        icon: 'success',
        title: 'Coupon deleted',
        text: `${coupon.code} was removed successfully.`,
        timer: 1400,
        showConfirmButton: false,
        customClass: { popup: 'storefront-alert' },
      })

      navigate('/admin/coupons', { replace: true })
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, 'The coupon could not be deleted.'),
      )
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <main className="admin-coupon-page app-page-shell" aria-busy="true">
        <div className="coupon-page-loading" role="status">
          {[0, 1, 2].map((item) => <span key={item} />)}
          <span className="visually-hidden">Loading coupon details</span>
        </div>
      </main>
    )
  }

  if (!coupon) {
    return (
      <main className="admin-coupon-page app-page-shell">
        <div className="category-empty-state admin-empty-state coupon-request-error">
          <span className="category-empty-icon" aria-hidden="true">
            <i className="bi bi-cloud-slash" />
          </span>
          <h2>Coupon details unavailable</h2>
          <p>{error}</p>
          <div>
            <Link className="btn btn-admin-soft" to="/admin/coupons">
              Back to Coupons
            </Link>
            <button className="btn btn-admin-primary" type="button" onClick={retry}>
              Try again
            </button>
          </div>
        </div>
      </main>
    )
  }

  const discountValue = coupon.type === 'percentage'
    ? `${formatAmount(coupon.value)}%`
    : formatAmount(coupon.value)

  return (
    <main className="admin-coupon-page app-page-shell">
      <header className="coupon-detail-heading app-page-header admin-commerce-header admin-coupon-detail-header">
        <div>
          <Link className="category-back-link" to="/admin/coupons">
            <i className="bi bi-arrow-left" aria-hidden="true" />
            Back to Coupons
          </Link>
          <span className="admin-eyebrow app-page-eyebrow">Promotion details</span>
          <div className="coupon-detail-title">
            <code className="admin-coupon-code">{coupon.code}</code>
            <span
              className={`category-status-badge admin-status-badge ${coupon.is_active ? 'is-active success' : 'is-inactive neutral'}`}
            >
              <span aria-hidden="true" />
              {coupon.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <h1 className="app-page-title">{coupon.name}</h1>
          <p className="app-page-subtitle">{coupon.description || 'No internal campaign description provided.'}</p>
        </div>
        <div className="coupon-detail-actions">
          <Link className="btn btn-admin-primary" to="edit">
            <i className="bi bi-pencil" aria-hidden="true" />
            Edit Coupon
          </Link>
          <button
            className="btn coupon-delete-button"
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
            ) : (
              <i className="bi bi-trash3" aria-hidden="true" />
            )}
            Delete
          </button>
        </div>
      </header>

      {error && (
        <div className="alert category-alert category-alert-danger" role="alert">
          <i className="bi bi-exclamation-octagon" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div className="coupon-detail-grid">
        <div className="coupon-detail-main">
          <section className="coupon-detail-card coupon-discount-card app-section-card">
            <header>
              <div>
                <span>Customer benefit</span>
                <h2>Discount configuration</h2>
              </div>
              <i className="bi bi-percent" aria-hidden="true" />
            </header>
            <div className="coupon-discount-value">
              <strong>{discountValue}</strong>
              <span>{coupon.type === 'percentage' ? 'percentage discount' : 'fixed discount'}</span>
            </div>
            <div className="coupon-summary-grid">
              <SummaryItem
                icon="bi-basket2"
                label="Minimum order"
                value={formatAmount(coupon.min_order_amount)}
              />
              <SummaryItem
                icon="bi-shield-check"
                label="Maximum discount"
                value={coupon.max_discount_amount === null
                  ? 'No cap'
                  : formatAmount(coupon.max_discount_amount)}
              />
            </div>
          </section>

          <section className="coupon-detail-card app-section-card">
            <header>
              <div>
                <span>Campaign window</span>
                <h2>Validity schedule</h2>
              </div>
              <i className="bi bi-calendar-range" aria-hidden="true" />
            </header>
            <div className="coupon-timeline">
              <div>
                <span aria-hidden="true"><i className="bi bi-play-fill" /></span>
                <small>Starts</small>
                <strong>{formatDate(coupon.starts_at, 'Immediately')}</strong>
              </div>
              <i className="bi bi-arrow-right" aria-hidden="true" />
              <div>
                <span aria-hidden="true"><i className="bi bi-flag-fill" /></span>
                <small>Expires</small>
                <strong>{formatDate(coupon.expires_at, 'No expiry')}</strong>
              </div>
            </div>
          </section>

          <section className="coupon-detail-card app-section-card">
            <header>
              <div>
                <span>Audit information</span>
                <h2>Record details</h2>
              </div>
              <i className="bi bi-clock-history" aria-hidden="true" />
            </header>
            <div className="coupon-record-grid">
              <div>
                <small>Created by</small>
                <strong>{coupon.created_by?.name || 'System administrator'}</strong>
                {coupon.created_by?.email && <span>{coupon.created_by.email}</span>}
              </div>
              <div><small>Created</small><strong>{formatDate(coupon.created_at)}</strong></div>
              <div><small>Last updated</small><strong>{formatDate(coupon.updated_at)}</strong></div>
            </div>
          </section>
        </div>

        <aside className="coupon-detail-side">
          <section className="coupon-detail-card coupon-usage-card app-section-card">
            <header>
              <div>
                <span>Redemptions</span>
                <h2>Usage overview</h2>
              </div>
              <i className="bi bi-graph-up-arrow" aria-hidden="true" />
            </header>
            <div className="coupon-usage-count">
              <strong>{coupon.used_count}</strong>
              <span>times redeemed</span>
            </div>
            <dl>
              <div>
                <dt>Total limit</dt>
                <dd>{coupon.usage_limit ?? 'Unlimited'}</dd>
              </div>
              <div>
                <dt>Per customer</dt>
                <dd>{coupon.usage_limit_per_user ?? 'Unlimited'}</dd>
              </div>
              <div>
                <dt>Recorded redemptions</dt>
                <dd>{coupon.redemptions_count ?? coupon.used_count}</dd>
              </div>
            </dl>
          </section>

          <section className="coupon-detail-card coupon-status-card app-section-card">
            <span className={coupon.is_active ? 'is-active' : 'is-inactive'} aria-hidden="true">
              <i className={`bi ${coupon.is_active ? 'bi-broadcast' : 'bi-pause-circle'}`} />
            </span>
            <div>
              <small>Current availability</small>
              <strong>{coupon.is_active ? 'Enabled' : 'Disabled'}</strong>
              <p>
                {coupon.is_active
                  ? 'Eligibility is evaluated at validation and checkout.'
                  : 'Customers cannot currently redeem this coupon.'}
              </p>
            </div>
          </section>
        </aside>
      </div>
    </main>
  )
}

export default AdminCouponDetailsPage
