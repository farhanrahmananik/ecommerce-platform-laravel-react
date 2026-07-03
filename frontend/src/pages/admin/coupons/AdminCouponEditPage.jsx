import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Swal from 'sweetalert2'
import CouponForm from '../../../components/admin/coupons/CouponForm.jsx'
import {
  getCoupon,
  updateCoupon,
} from '../../../services/adminCouponService.js'
import {
  getApiErrorMessage,
  getValidationErrors,
} from '../../../utils/apiErrors.js'

function toDateTimeLocal(value) {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)

  return localDate.toISOString().slice(0, 16)
}

function formValues(coupon) {
  return {
    code: coupon.code ?? '',
    name: coupon.name ?? '',
    description: coupon.description ?? '',
    type: coupon.type ?? 'fixed',
    value: coupon.value ?? '',
    max_discount_amount: coupon.max_discount_amount ?? '',
    min_order_amount: coupon.min_order_amount ?? '0',
    usage_limit: coupon.usage_limit ?? '',
    usage_limit_per_user: coupon.usage_limit_per_user ?? '',
    starts_at: toDateTimeLocal(coupon.starts_at),
    expires_at: toDateTimeLocal(coupon.expires_at),
    is_active: Boolean(coupon.is_active),
  }
}

function AdminCouponEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [coupon, setCoupon] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState({})
  const [error, setError] = useState('')

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
              : getApiErrorMessage(requestError, 'The coupon could not be loaded.'),
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
  }, [id])

  const handleSubmit = async (payload) => {
    setIsSubmitting(true)
    setValidationErrors({})
    setError('')

    try {
      const response = await updateCoupon(id, payload)
      const updatedCoupon = response.data ?? response

      await Swal.fire({
        icon: 'success',
        title: 'Changes saved',
        text: `${updatedCoupon.code} has been updated.`,
        timer: 1500,
        showConfirmButton: false,
        customClass: { popup: 'storefront-alert' },
      })

      navigate(`/admin/coupons/${id}`, { replace: true })
    } catch (requestError) {
      const nextValidationErrors = getValidationErrors(requestError)

      setValidationErrors(nextValidationErrors)

      if (Object.keys(nextValidationErrors).length === 0) {
        setError(
          getApiErrorMessage(requestError, 'The coupon could not be updated.'),
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <main className="admin-coupon-page app-page-shell" aria-busy="true">
        <div className="coupon-page-loading" role="status">
          {[0, 1, 2].map((item) => <span key={item} />)}
          <span className="visually-hidden">Loading coupon</span>
        </div>
      </main>
    )
  }

  if (!coupon) {
    return (
      <main className="admin-coupon-page app-page-shell">
        <div className="category-empty-state admin-empty-state coupon-request-error">
          <span className="category-empty-icon" aria-hidden="true">
            <i className="bi bi-ticket-perforated" />
          </span>
          <h2>Coupon unavailable</h2>
          <p>{error}</p>
          <Link className="btn btn-admin-soft" to="/admin/coupons">
            Back to Coupons
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="admin-coupon-page app-page-shell">
      <header className="category-page-heading coupon-page-heading app-page-header admin-commerce-header admin-coupon-form-header">
        <div>
          <Link className="category-back-link" to={`/admin/coupons/${id}`}>
            <i className="bi bi-arrow-left" aria-hidden="true" />
            Back to Coupon
          </Link>
          <span className="admin-eyebrow app-page-eyebrow">Promotions</span>
          <h1 className="app-page-title">Edit {coupon.code}</h1>
          <p className="app-page-subtitle">Refine campaign rules while preserving its redemption history.</p>
        </div>
        <span className="category-heading-icon coupon-heading-icon" aria-hidden="true">
          <i className="bi bi-pencil-square" />
        </span>
      </header>

      {error && (
        <div className="alert category-alert category-alert-danger" role="alert">
          <i className="bi bi-exclamation-octagon" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <CouponForm
        initialValues={formValues(coupon)}
        onSubmit={handleSubmit}
        submitting={isSubmitting}
        validationErrors={validationErrors}
        submitLabel="Save Changes"
      />
    </main>
  )
}

export default AdminCouponEditPage
