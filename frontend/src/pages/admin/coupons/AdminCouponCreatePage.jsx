import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import CouponForm from '../../../components/admin/coupons/CouponForm.jsx'
import { createCoupon } from '../../../services/adminCouponService.js'
import {
  getApiErrorMessage,
  getValidationErrors,
} from '../../../utils/apiErrors.js'

function AdminCouponCreatePage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState({})
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (payload) => {
    setIsSubmitting(true)
    setValidationErrors({})
    setError('')

    try {
      const response = await createCoupon(payload)
      const coupon = response.data ?? response

      await Swal.fire({
        icon: 'success',
        title: 'Coupon created',
        text: `${coupon.code} is ready for its configured campaign window.`,
        timer: 1600,
        showConfirmButton: false,
        customClass: { popup: 'storefront-alert' },
      })

      navigate(`/admin/coupons/${coupon.id}`, { replace: true })
    } catch (requestError) {
      const nextValidationErrors = getValidationErrors(requestError)

      setValidationErrors(nextValidationErrors)

      if (Object.keys(nextValidationErrors).length === 0) {
        setError(
          getApiErrorMessage(requestError, 'The coupon could not be created.'),
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="admin-coupon-page">
      <header className="category-page-heading coupon-page-heading">
        <div>
          <Link className="category-back-link" to="/admin/coupons">
            <i className="bi bi-arrow-left" aria-hidden="true" />
            Back to Coupons
          </Link>
          <span className="admin-eyebrow">Promotions</span>
          <h1>Create coupon</h1>
          <p>Configure a controlled discount for a future customer campaign.</p>
        </div>
        <span className="category-heading-icon coupon-heading-icon" aria-hidden="true">
          <i className="bi bi-ticket-perforated" />
        </span>
      </header>

      {error && (
        <div className="alert category-alert category-alert-danger" role="alert">
          <i className="bi bi-exclamation-octagon" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <CouponForm
        onSubmit={handleSubmit}
        submitting={isSubmitting}
        validationErrors={validationErrors}
        submitLabel="Create Coupon"
      />
    </main>
  )
}

export default AdminCouponCreatePage
