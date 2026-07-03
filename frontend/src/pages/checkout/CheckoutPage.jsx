import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { useAuth } from '../../hooks/useAuth.js'
import { useCart } from '../../hooks/useCart.js'
import { checkout as submitCheckout } from '../../services/checkoutService.js'
import { validateCoupon } from '../../services/couponService.js'
import {
  getApiErrorMessage,
  getValidationErrors,
} from '../../utils/apiErrors.js'

const billingFieldNames = [
  'billing_address_line1',
  'billing_address_line2',
  'billing_city',
  'billing_state',
  'billing_postal_code',
  'billing_country',
]

function formatAmount(value) {
  const amount = Number(value)

  if (!Number.isFinite(amount)) {
    return '-'
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatCouponExpiry(value) {
  if (!value) {
    return null
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? null
    : new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(date)
}

function initialCheckoutForm(user) {
  return {
    customer_name: user?.name || '',
    customer_email: user?.email || '',
    customer_phone: '',
    shipping_address_line1: '',
    shipping_address_line2: '',
    shipping_city: '',
    shipping_state: '',
    shipping_postal_code: '',
    shipping_country: '',
    billing_same_as_shipping: true,
    billing_address_line1: '',
    billing_address_line2: '',
    billing_city: '',
    billing_state: '',
    billing_postal_code: '',
    billing_country: '',
    payment_method: 'cash_on_delivery',
    notes: '',
  }
}

function CheckoutField({
  as = 'input',
  error,
  id,
  label,
  optional = false,
  ...fieldProps
}) {
  const messages = Array.isArray(error) ? error : error ? [error] : []
  const describedBy = messages.length > 0 ? `${id}-error` : undefined
  const sharedProps = {
    ...fieldProps,
    id,
    className: `checkout-input ${messages.length > 0 ? 'is-invalid' : ''}`,
    'aria-invalid': messages.length > 0,
    'aria-describedby': describedBy,
  }

  return (
    <div className="checkout-field">
      <label htmlFor={id}>
        {label}
        {optional && <span>Optional</span>}
      </label>
      {as === 'textarea' ? <textarea {...sharedProps} /> : <input {...sharedProps} />}
      {messages.length > 0 && (
        <div className="checkout-field-errors" id={describedBy}>
          {messages.map((message) => (
            <span key={message}>{message}</span>
          ))}
        </div>
      )}
    </div>
  )
}

function CheckoutSection({ children, description, icon, title }) {
  return (
    <section className="checkout-form-section app-section-card checkout-step-card">
      <div className="checkout-form-section__heading">
        <span aria-hidden="true">
          <i className={`bi ${icon}`} />
        </span>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

function CheckoutSummaryItem({ item }) {
  const [imageFailed, setImageFailed] = useState(false)
  const showImage = item.product_image_url && !imageFailed

  return (
    <div className="checkout-summary-item checkout-summary-product">
      <div className="checkout-summary-item__image">
        {showImage ? (
          <img
            src={item.product_image_url}
            alt={item.product_name || 'Product'}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <i className="bi bi-image" aria-hidden="true" />
        )}
        <span aria-label={`Quantity ${item.quantity}`}>{item.quantity}</span>
      </div>
      <div>
        <strong>{item.product_name || 'Product'}</strong>
        <small>{formatAmount(item.unit_price)} each</small>
      </div>
      <b>{formatAmount(item.line_total)}</b>
    </div>
  )
}

function CheckoutSkeleton() {
  return (
    <main className="checkout-page customer-checkout-page" aria-busy="true">
      <section className="checkout-page-hero customer-flow-hero checkout-flow-hero">
        <div className="container">
          <div className="checkout-heading-skeleton" />
        </div>
      </section>
      <section className="checkout-page-content">
        <div className="container">
          <div className="checkout-layout">
            <div className="checkout-form-skeleton" />
            <div className="checkout-summary-skeleton" />
          </div>
          <span className="visually-hidden">Loading checkout</span>
        </div>
      </section>
    </main>
  )
}

function CheckoutPage() {
  const { user } = useAuth()
  const {
    cart,
    error: cartError,
    fetchCart,
    items,
    itemsCount,
    loading,
    resetCart,
    subtotal,
    total,
  } = useCart()
  const [form, setForm] = useState(() => initialCheckoutForm(user))
  const [fieldErrors, setFieldErrors] = useState({})
  const [generalError, setGeneralError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponError, setCouponError] = useState('')
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false)
  const navigate = useNavigate()
  const couponMatchesCart =
    !appliedCoupon ||
    Number(appliedCoupon.cart_subtotal) === Number(subtotal)
  const activeCoupon = couponMatchesCart ? appliedCoupon : null
  const visibleCouponError = couponMatchesCart
    ? couponError
    : 'Your cart total changed. Please apply the coupon again.'

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleChange = (event) => {
    const { checked, name, type, value } = event.target
    const nextValue = type === 'checkbox' ? checked : value

    setForm((current) => ({ ...current, [name]: nextValue }))
    setGeneralError('')
    setFieldErrors((current) => {
      const nextErrors = { ...current }

      delete nextErrors[name]

      if (name === 'billing_same_as_shipping' && checked) {
        billingFieldNames.forEach((fieldName) => delete nextErrors[fieldName])
      }

      return nextErrors
    })
  }

  const handleRetryCart = () => {
    fetchCart().catch(() => undefined)
  }

  const handleCouponCodeChange = (event) => {
    setCouponCode(event.target.value.toUpperCase())
    setCouponError('')
    setFieldErrors((current) => {
      const nextErrors = { ...current }

      delete nextErrors.code
      delete nextErrors.coupon_code

      return nextErrors
    })
  }

  const handleApplyCoupon = async (event) => {
    event.preventDefault()
    const normalizedCode = couponCode.trim().toUpperCase()

    if (!normalizedCode) {
      setCouponError('Enter a coupon code to continue.')

      return
    }

    setIsValidatingCoupon(true)
    setCouponError('')

    try {
      const response = await validateCoupon({ code: normalizedCode })
      const coupon = response?.data ?? response

      setCouponCode(coupon.code)
      setAppliedCoupon(coupon)
      setFieldErrors((current) => {
        const nextErrors = { ...current }

        delete nextErrors.code
        delete nextErrors.coupon_code

        return nextErrors
      })
    } catch (validationError) {
      const validationErrors = getValidationErrors(validationError)
      const message =
        validationErrors.code?.[0] ||
        validationErrors.coupon_code?.[0] ||
        validationErrors.cart?.[0] ||
        getApiErrorMessage(
          validationError,
          'We could not validate this coupon. Please try again.',
        )

      setAppliedCoupon(null)
      setCouponError(message)
    } finally {
      setIsValidatingCoupon(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
    setCouponError('')
    setFieldErrors((current) => {
      const nextErrors = { ...current }

      delete nextErrors.code
      delete nextErrors.coupon_code

      return nextErrors
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setFieldErrors({})
    setGeneralError('')

    try {
      const checkoutPayload = activeCoupon
        ? { ...form, coupon_code: activeCoupon.code }
        : form
      const response = await submitCheckout(checkoutPayload)
      const order = response?.data ?? response

      setAppliedCoupon(null)
      setCouponCode('')
      setCouponError('')

      try {
        await fetchCart()
      } catch {
        resetCart()
      }

      const successResult = await Swal.fire({
        icon: 'success',
        title: 'Order placed successfully',
        text: order?.order_number
          ? `Your order ${order.order_number} has been received.`
          : 'Your order has been received.',
        confirmButtonText: order?.id ? 'View Order' : 'View My Orders',
        cancelButtonText: 'Continue shopping',
        showCancelButton: true,
        buttonsStyling: false,
        customClass: {
          popup: 'storefront-alert',
          confirmButton: 'swal-brand-button',
          cancelButton: 'swal-soft-button',
        },
      })

      const ordersDestination = order?.id
        ? `/account/orders/${order.id}`
        : '/account/orders'

      navigate(successResult.isConfirmed ? ordersDestination : '/products', {
        replace: true,
      })
    } catch (checkoutError) {
      const validationErrors = getValidationErrors(checkoutError)
      const hasValidationErrors = Object.keys(validationErrors).length > 0
      const checkoutCouponError = validationErrors.coupon_code?.[0]

      setFieldErrors(validationErrors)
      if (checkoutCouponError) {
        setCouponError(checkoutCouponError)
      }
      setGeneralError(
        validationErrors.cart?.[0] ||
          (checkoutCouponError
            ? 'Your coupon needs attention before this order can be placed.'
            : null) ||
          (hasValidationErrors
            ? 'Please review the highlighted checkout fields.'
            : getApiErrorMessage(
                checkoutError,
                'We could not place your order. Please try again.',
              )),
      )
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading && !cart) {
    return <CheckoutSkeleton />
  }

  if (!cart && cartError) {
    return (
      <main className="checkout-page customer-checkout-page">
        <section className="checkout-page-hero customer-flow-hero checkout-flow-hero">
          <div className="container">
            <span className="section-kicker">Secure checkout</span>
            <h1>Complete your order</h1>
          </div>
        </section>
        <section className="checkout-page-content">
          <div className="container">
            <div className="checkout-state-card app-empty-state" role="alert">
              <span aria-hidden="true">
                <i className="bi bi-cloud-slash" />
              </span>
              <h2>We could not load your cart</h2>
              <p>{cartError}</p>
              <button className="btn btn-brand" type="button" onClick={handleRetryCart}>
                <i className="bi bi-arrow-clockwise" aria-hidden="true" />
                Try again
              </button>
            </div>
          </div>
        </section>
      </main>
    )
  }

  if (items.length === 0) {
    return (
      <main className="checkout-page customer-checkout-page">
        <section className="checkout-page-hero customer-flow-hero checkout-flow-hero">
          <div className="container">
            <span className="section-kicker">Secure checkout</span>
            <h1>Complete your order</h1>
          </div>
        </section>
        <section className="checkout-page-content">
          <div className="container">
            <div className="checkout-state-card app-empty-state">
              <span aria-hidden="true">
                <i className="bi bi-bag-x" />
              </span>
              <small>Your cart is empty</small>
              <h2>Add something before checkout</h2>
              <p>Browse the storefront, choose your products, and return when ready.</p>
              <div>
                <Link className="btn btn-brand" to="/products">
                  <i className="bi bi-grid" aria-hidden="true" />
                  Browse products
                </Link>
                <Link className="btn btn-soft" to="/cart">
                  Back to cart
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="checkout-page customer-checkout-page">
      <section className="checkout-page-hero customer-flow-hero checkout-flow-hero">
        <div className="container">
          <div className="checkout-page-heading">
            <div>
              <span className="section-kicker">Secure checkout</span>
              <h1>Complete your order</h1>
              <p>Confirm your details and place your cash-on-delivery order.</p>
            </div>
            <Link className="btn btn-soft" to="/cart">
              <i className="bi bi-arrow-left" aria-hidden="true" />
              Return to cart
            </Link>
          </div>
        </div>
      </section>

      <section className="checkout-page-content">
        <div className="container">
          {generalError && (
            <div className="alert alert-danger checkout-alert" role="alert">
              <i className="bi bi-exclamation-octagon" aria-hidden="true" />
              <span>{generalError}</span>
            </div>
          )}

          <div className="checkout-layout checkout-shell">
            <form
              className="checkout-form-card app-form-card"
              id="checkout-form"
              onSubmit={handleSubmit}
              noValidate
            >
              <CheckoutSection
                icon="bi-person"
                title="Customer details"
                description="Tell us who is receiving this order."
              >
                <div className="checkout-fields-grid">
                  <CheckoutField
                    id="customer_name"
                    name="customer_name"
                    label="Full name"
                    value={form.customer_name}
                    onChange={handleChange}
                    error={fieldErrors.customer_name}
                    autoComplete="name"
                  />
                  <CheckoutField
                    id="customer_email"
                    name="customer_email"
                    label="Email address"
                    type="email"
                    value={form.customer_email}
                    onChange={handleChange}
                    error={fieldErrors.customer_email}
                    autoComplete="email"
                  />
                  <CheckoutField
                    id="customer_phone"
                    name="customer_phone"
                    label="Phone number"
                    type="tel"
                    optional
                    value={form.customer_phone}
                    onChange={handleChange}
                    error={fieldErrors.customer_phone}
                    autoComplete="tel"
                  />
                </div>
              </CheckoutSection>

              <CheckoutSection
                icon="bi-truck"
                title="Shipping address"
                description="Where should we deliver your order?"
              >
                <div className="checkout-fields-grid">
                  <CheckoutField
                    id="shipping_address_line1"
                    name="shipping_address_line1"
                    label="Address line 1"
                    value={form.shipping_address_line1}
                    onChange={handleChange}
                    error={fieldErrors.shipping_address_line1}
                    autoComplete="shipping address-line1"
                  />
                  <CheckoutField
                    id="shipping_address_line2"
                    name="shipping_address_line2"
                    label="Address line 2"
                    optional
                    value={form.shipping_address_line2}
                    onChange={handleChange}
                    error={fieldErrors.shipping_address_line2}
                    autoComplete="shipping address-line2"
                  />
                  <CheckoutField
                    id="shipping_city"
                    name="shipping_city"
                    label="City"
                    value={form.shipping_city}
                    onChange={handleChange}
                    error={fieldErrors.shipping_city}
                    autoComplete="shipping address-level2"
                  />
                  <CheckoutField
                    id="shipping_state"
                    name="shipping_state"
                    label="State / region"
                    optional
                    value={form.shipping_state}
                    onChange={handleChange}
                    error={fieldErrors.shipping_state}
                    autoComplete="shipping address-level1"
                  />
                  <CheckoutField
                    id="shipping_postal_code"
                    name="shipping_postal_code"
                    label="Postal code"
                    value={form.shipping_postal_code}
                    onChange={handleChange}
                    error={fieldErrors.shipping_postal_code}
                    autoComplete="shipping postal-code"
                  />
                  <CheckoutField
                    id="shipping_country"
                    name="shipping_country"
                    label="Country"
                    value={form.shipping_country}
                    onChange={handleChange}
                    error={fieldErrors.shipping_country}
                    autoComplete="shipping country-name"
                  />
                </div>
              </CheckoutSection>

              <CheckoutSection
                icon="bi-house-check"
                title="Billing address"
                description="Choose whether billing matches delivery."
              >
                <label className="checkout-checkbox" htmlFor="billing_same_as_shipping">
                  <input
                    id="billing_same_as_shipping"
                    name="billing_same_as_shipping"
                    type="checkbox"
                    checked={form.billing_same_as_shipping}
                    onChange={handleChange}
                  />
                  <span aria-hidden="true">
                    <i className="bi bi-check" />
                  </span>
                  <div>
                    <strong>Same as shipping address</strong>
                    <small>Use the delivery address for billing.</small>
                  </div>
                </label>

                {!form.billing_same_as_shipping && (
                  <div className="checkout-fields-grid checkout-billing-fields">
                    <CheckoutField
                      id="billing_address_line1"
                      name="billing_address_line1"
                      label="Address line 1"
                      value={form.billing_address_line1}
                      onChange={handleChange}
                      error={fieldErrors.billing_address_line1}
                      autoComplete="billing address-line1"
                    />
                    <CheckoutField
                      id="billing_address_line2"
                      name="billing_address_line2"
                      label="Address line 2"
                      optional
                      value={form.billing_address_line2}
                      onChange={handleChange}
                      error={fieldErrors.billing_address_line2}
                      autoComplete="billing address-line2"
                    />
                    <CheckoutField
                      id="billing_city"
                      name="billing_city"
                      label="City"
                      value={form.billing_city}
                      onChange={handleChange}
                      error={fieldErrors.billing_city}
                      autoComplete="billing address-level2"
                    />
                    <CheckoutField
                      id="billing_state"
                      name="billing_state"
                      label="State / region"
                      optional
                      value={form.billing_state}
                      onChange={handleChange}
                      error={fieldErrors.billing_state}
                      autoComplete="billing address-level1"
                    />
                    <CheckoutField
                      id="billing_postal_code"
                      name="billing_postal_code"
                      label="Postal code"
                      value={form.billing_postal_code}
                      onChange={handleChange}
                      error={fieldErrors.billing_postal_code}
                      autoComplete="billing postal-code"
                    />
                    <CheckoutField
                      id="billing_country"
                      name="billing_country"
                      label="Country"
                      value={form.billing_country}
                      onChange={handleChange}
                      error={fieldErrors.billing_country}
                      autoComplete="billing country-name"
                    />
                  </div>
                )}
              </CheckoutSection>

              <CheckoutSection
                icon="bi-cash-coin"
                title="Payment method"
                description="Payment is collected when your order arrives."
              >
                <label className="checkout-payment-option">
                  <input
                    type="radio"
                    name="payment_method"
                    value="cash_on_delivery"
                    checked={form.payment_method === 'cash_on_delivery'}
                    readOnly
                  />
                  <span aria-hidden="true">
                    <i className="bi bi-cash-stack" />
                  </span>
                  <div>
                    <strong>Cash on delivery</strong>
                    <small>Pay when your order is delivered.</small>
                  </div>
                  <i className="bi bi-check-circle-fill" aria-hidden="true" />
                </label>
                {fieldErrors.payment_method?.map((message) => (
                  <span className="checkout-field-errors" key={message}>
                    {message}
                  </span>
                ))}
              </CheckoutSection>

              <CheckoutSection
                icon="bi-chat-left-text"
                title="Order notes"
                description="Share optional delivery instructions."
              >
                <CheckoutField
                  as="textarea"
                  id="notes"
                  name="notes"
                  label="Notes"
                  optional
                  rows="4"
                  value={form.notes}
                  onChange={handleChange}
                  error={fieldErrors.notes}
                  placeholder="Anything we should know about your delivery?"
                />
              </CheckoutSection>
            </form>

            <aside className="checkout-order-card app-section-card checkout-summary-card" aria-labelledby="checkout-summary-title">
              <div className="checkout-order-card__heading">
                <div>
                  <span className="section-kicker">Final review</span>
                  <h2 id="checkout-summary-title">Order summary</h2>
                </div>
                <span>{itemsCount}</span>
              </div>

              <div className="checkout-summary-items">
                {items.map((item) => (
                  <CheckoutSummaryItem item={item} key={item.id} />
                ))}
              </div>

              <section className="checkout-coupon checkout-coupon-card" aria-labelledby="checkout-coupon-title">
                <div className="checkout-coupon__heading">
                  <span aria-hidden="true">
                    <i className="bi bi-ticket-perforated" />
                  </span>
                  <div>
                    <h3 id="checkout-coupon-title">Have a coupon?</h3>
                    <p>Apply one promotion code to this order.</p>
                  </div>
                </div>

                {activeCoupon ? (
                  <div className="checkout-coupon-applied checkout-coupon-success" role="status">
                    <div className="checkout-coupon-applied__code">
                      <span aria-hidden="true">
                        <i className="bi bi-check-circle-fill" />
                      </span>
                      <div>
                        <small>Coupon applied</small>
                        <strong>{activeCoupon.code}</strong>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        disabled={isSubmitting}
                        aria-label={`Remove coupon ${activeCoupon.code}`}
                      >
                        <i className="bi bi-x-circle" aria-hidden="true" />
                        Remove
                      </button>
                    </div>
                    <div className="checkout-coupon-applied__summary">
                      <span>
                        Saving <strong>{formatAmount(activeCoupon.discount_amount)}</strong>
                      </span>
                      {formatCouponExpiry(activeCoupon.expires_at) && (
                        <span>
                          Expires {formatCouponExpiry(activeCoupon.expires_at)}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <form className="checkout-coupon-form" onSubmit={handleApplyCoupon} noValidate>
                    <div>
                      <i className="bi bi-percent" aria-hidden="true" />
                      <input
                        type="text"
                        value={couponCode}
                        onChange={handleCouponCodeChange}
                        placeholder="Enter coupon code"
                        aria-label="Coupon code"
                        aria-invalid={Boolean(visibleCouponError)}
                        aria-describedby={visibleCouponError ? 'checkout-coupon-error' : undefined}
                        maxLength="50"
                        disabled={isValidatingCoupon || isSubmitting}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isValidatingCoupon || isSubmitting}
                    >
                      {isValidatingCoupon ? (
                        <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                      ) : (
                        'Apply'
                      )}
                    </button>
                  </form>
                )}

                {visibleCouponError && (
                  <div className="checkout-coupon-error checkout-validation-text" id="checkout-coupon-error" role="alert">
                    <i className="bi bi-exclamation-circle" aria-hidden="true" />
                    <span>{visibleCouponError}</span>
                  </div>
                )}
              </section>

              <dl className="checkout-totals">
                <div>
                  <dt>Subtotal</dt>
                  <dd>{formatAmount(activeCoupon?.cart_subtotal ?? subtotal)}</dd>
                </div>
                <div>
                  <dt>Shipping</dt>
                  <dd>Free</dd>
                </div>
                {activeCoupon && (
                  <div className="checkout-discount-row">
                    <dt>
                      Discount <small>{activeCoupon.code}</small>
                    </dt>
                    <dd>- {formatAmount(activeCoupon.discount_amount)}</dd>
                  </div>
                )}
                <div className="checkout-total-row">
                  <dt>Total</dt>
                  <dd>
                    {formatAmount(activeCoupon?.total_after_discount ?? total)}
                  </dd>
                </div>
              </dl>

              <button
                className="btn btn-brand checkout-submit-button checkout-submit-area"
                type="submit"
                form="checkout-form"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                    Placing order...
                  </>
                ) : (
                  <>
                    <i className="bi bi-bag-check" aria-hidden="true" />
                    Place Order
                  </>
                )}
              </button>
              <p className="checkout-submit-note">
                <i className="bi bi-shield-lock" aria-hidden="true" />
                Your order is submitted through a secure authenticated session.
              </p>
            </aside>
          </div>
        </div>
      </section>
    </main>
  )
}

export default CheckoutPage
