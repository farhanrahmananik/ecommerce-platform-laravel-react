import { useState } from 'react'
import { Link } from 'react-router-dom'
import AdminSelect from '../common/AdminSelect.jsx'

const typeOptions = [
  { value: 'fixed', label: 'Fixed amount' },
  { value: 'percentage', label: 'Percentage' },
]

const emptyValues = {
  code: '',
  name: '',
  description: '',
  type: 'fixed',
  value: '',
  max_discount_amount: '',
  min_order_amount: '0',
  usage_limit: '',
  usage_limit_per_user: '',
  starts_at: '',
  expires_at: '',
  is_active: true,
}

function FieldError({ errors, name }) {
  const messages = errors?.[name]

  if (!messages) {
    return null
  }

  return (Array.isArray(messages) ? messages : [messages]).map(
    (message, index) => (
      <div className="category-field-error" key={`${name}-${index}`}>
        {message}
      </div>
    ),
  )
}

function CouponField({
  children,
  errors,
  helperText,
  label,
  name,
  optional = false,
}) {
  return (
    <div>
      <label className="category-form-label" htmlFor={`coupon-${name}`}>
        {label}
        {optional && <small>Optional</small>}
      </label>
      {children}
      {helperText && <span className="category-form-help">{helperText}</span>}
      <FieldError errors={errors} name={name} />
    </div>
  )
}

function CouponForm({
  initialValues = emptyValues,
  onSubmit,
  submitting = false,
  validationErrors = {},
  submitLabel = 'Save Coupon',
}) {
  const [values, setValues] = useState({
    ...emptyValues,
    ...initialValues,
    is_active: initialValues.is_active ?? true,
  })

  const updateValue = (name, value) => {
    setValues((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    onSubmit({
      code: values.code.trim().toUpperCase(),
      name: values.name.trim(),
      description: values.description.trim() || null,
      type: values.type,
      value: values.value,
      max_discount_amount:
        values.type === 'percentage' && values.max_discount_amount !== ''
          ? values.max_discount_amount
          : null,
      min_order_amount: values.min_order_amount || 0,
      usage_limit: values.usage_limit === '' ? null : values.usage_limit,
      usage_limit_per_user:
        values.usage_limit_per_user === ''
          ? null
          : values.usage_limit_per_user,
      starts_at: values.starts_at || null,
      expires_at: values.expires_at || null,
      is_active: Boolean(values.is_active),
    })
  }

  return (
    <form className="coupon-form" onSubmit={handleSubmit} noValidate>
      <section className="coupon-form-section app-form-card admin-rule-card">
        <header className="product-form-section-heading">
          <span aria-hidden="true">
            <i className="bi bi-ticket-perforated" />
          </span>
          <div>
            <h2>Coupon identity</h2>
            <p>Create a memorable promotion code and an internal display name.</p>
          </div>
        </header>

        <div className="row g-4">
          <div className="col-md-5">
            <CouponField
              errors={validationErrors}
              label="Coupon code"
              name="code"
              helperText="Codes are stored in uppercase."
            >
              <div className="category-input-with-icon coupon-code-input">
                <i className="bi bi-upc-scan" aria-hidden="true" />
                <input
                  className={`category-form-control ${validationErrors.code ? 'is-invalid' : ''}`}
                  id="coupon-code"
                  type="text"
                  value={values.code}
                  onChange={(event) =>
                    updateValue('code', event.target.value.toUpperCase())
                  }
                  placeholder="WELCOME20"
                  maxLength="50"
                  disabled={submitting}
                  required
                />
              </div>
            </CouponField>
          </div>
          <div className="col-md-7">
            <CouponField
              errors={validationErrors}
              label="Name"
              name="name"
            >
              <input
                className={`category-form-control ${validationErrors.name ? 'is-invalid' : ''}`}
                id="coupon-name"
                type="text"
                value={values.name}
                onChange={(event) => updateValue('name', event.target.value)}
                placeholder="Welcome discount"
                maxLength="150"
                disabled={submitting}
                required
              />
            </CouponField>
          </div>
          <div className="col-12">
            <CouponField
              errors={validationErrors}
              label="Description"
              name="description"
              optional
            >
              <textarea
                className={`category-form-control category-form-textarea ${validationErrors.description ? 'is-invalid' : ''}`}
                id="coupon-description"
                rows="3"
                value={values.description}
                onChange={(event) =>
                  updateValue('description', event.target.value)
                }
                placeholder="Add an internal note about this campaign..."
                disabled={submitting}
              />
            </CouponField>
          </div>
        </div>
      </section>

      <section className="coupon-form-section app-form-card admin-rule-card">
        <header className="product-form-section-heading">
          <span aria-hidden="true">
            <i className="bi bi-percent" />
          </span>
          <div>
            <h2>Discount configuration</h2>
            <p>Define the customer benefit and minimum qualifying spend.</p>
          </div>
        </header>

        <div className="row g-4">
          <div className="col-md-6 col-xl-3">
            <AdminSelect
              id="coupon-type"
              name="type"
              label="Discount type"
              value={values.type}
              options={typeOptions}
              onChange={(value) => updateValue('type', String(value))}
              error={validationErrors.type}
              disabled={submitting}
            />
          </div>
          <div className="col-md-6 col-xl-3">
            <CouponField
              errors={validationErrors}
              label={values.type === 'percentage' ? 'Percentage value' : 'Discount amount'}
              name="value"
              helperText={
                values.type === 'percentage'
                  ? 'Enter a value from 0.01 to 100.'
                  : 'Applied in the store currency.'
              }
            >
              <input
                className={`category-form-control ${validationErrors.value ? 'is-invalid' : ''}`}
                id="coupon-value"
                type="number"
                min="0.01"
                max={values.type === 'percentage' ? '100' : undefined}
                step="0.01"
                value={values.value}
                onChange={(event) => updateValue('value', event.target.value)}
                disabled={submitting}
                required
              />
            </CouponField>
          </div>
          <div className="col-md-6 col-xl-3">
            <CouponField
              errors={validationErrors}
              label="Maximum discount"
              name="max_discount_amount"
              helperText="Primarily used to cap percentage discounts."
              optional
            >
              <input
                className={`category-form-control ${validationErrors.max_discount_amount ? 'is-invalid' : ''}`}
                id="coupon-max_discount_amount"
                type="number"
                min="0"
                step="0.01"
                value={values.max_discount_amount}
                onChange={(event) =>
                  updateValue('max_discount_amount', event.target.value)
                }
                disabled={submitting || values.type === 'fixed'}
              />
            </CouponField>
          </div>
          <div className="col-md-6 col-xl-3">
            <CouponField
              errors={validationErrors}
              label="Minimum order"
              name="min_order_amount"
            >
              <input
                className={`category-form-control ${validationErrors.min_order_amount ? 'is-invalid' : ''}`}
                id="coupon-min_order_amount"
                type="number"
                min="0"
                step="0.01"
                value={values.min_order_amount}
                onChange={(event) =>
                  updateValue('min_order_amount', event.target.value)
                }
                disabled={submitting}
              />
            </CouponField>
          </div>
        </div>
      </section>

      <section className="coupon-form-section app-form-card admin-rule-card">
        <header className="product-form-section-heading">
          <span aria-hidden="true">
            <i className="bi bi-sliders" />
          </span>
          <div>
            <h2>Usage limits</h2>
            <p>Control total redemption volume and per-customer usage.</p>
          </div>
        </header>

        <div className="row g-4">
          <div className="col-md-6">
            <CouponField
              errors={validationErrors}
              label="Total usage limit"
              name="usage_limit"
              helperText="Leave empty for unlimited total redemptions."
              optional
            >
              <input
                className={`category-form-control ${validationErrors.usage_limit ? 'is-invalid' : ''}`}
                id="coupon-usage_limit"
                type="number"
                min="1"
                step="1"
                value={values.usage_limit}
                onChange={(event) =>
                  updateValue('usage_limit', event.target.value)
                }
                disabled={submitting}
              />
            </CouponField>
          </div>
          <div className="col-md-6">
            <CouponField
              errors={validationErrors}
              label="Limit per customer"
              name="usage_limit_per_user"
              helperText="Leave empty for unlimited uses per customer."
              optional
            >
              <input
                className={`category-form-control ${validationErrors.usage_limit_per_user ? 'is-invalid' : ''}`}
                id="coupon-usage_limit_per_user"
                type="number"
                min="1"
                step="1"
                value={values.usage_limit_per_user}
                onChange={(event) =>
                  updateValue('usage_limit_per_user', event.target.value)
                }
                disabled={submitting}
              />
            </CouponField>
          </div>
        </div>
      </section>

      <section className="coupon-form-section app-form-card admin-rule-card">
        <header className="product-form-section-heading">
          <span aria-hidden="true">
            <i className="bi bi-calendar-range" />
          </span>
          <div>
            <h2>Validity and status</h2>
            <p>Schedule the campaign window and control customer availability.</p>
          </div>
        </header>

        <div className="row g-4">
          <div className="col-md-6">
            <CouponField
              errors={validationErrors}
              label="Starts at"
              name="starts_at"
              optional
            >
              <input
                className={`category-form-control ${validationErrors.starts_at ? 'is-invalid' : ''}`}
                id="coupon-starts_at"
                type="datetime-local"
                value={values.starts_at}
                onChange={(event) => updateValue('starts_at', event.target.value)}
                disabled={submitting}
              />
            </CouponField>
          </div>
          <div className="col-md-6">
            <CouponField
              errors={validationErrors}
              label="Expires at"
              name="expires_at"
              optional
            >
              <input
                className={`category-form-control ${validationErrors.expires_at ? 'is-invalid' : ''}`}
                id="coupon-expires_at"
                type="datetime-local"
                value={values.expires_at}
                onChange={(event) => updateValue('expires_at', event.target.value)}
                disabled={submitting}
              />
            </CouponField>
          </div>
        </div>

        <div className="coupon-publishing-card">
          <span className={values.is_active ? 'is-active' : ''} aria-hidden="true">
            <i className={`bi ${values.is_active ? 'bi-broadcast' : 'bi-pause-circle'}`} />
          </span>
          <div>
            <strong>Coupon availability</strong>
            <p>
              {values.is_active
                ? 'Customers can use this coupon while all eligibility rules pass.'
                : 'This coupon is saved but unavailable to customers.'}
            </p>
          </div>
          <div className="form-check form-switch category-status-switch">
            <input
              className="form-check-input"
              id="coupon-is_active"
              type="checkbox"
              checked={values.is_active}
              onChange={(event) =>
                updateValue('is_active', event.target.checked)
              }
              disabled={submitting}
            />
            <label className="form-check-label" htmlFor="coupon-is_active">
              {values.is_active ? 'Active' : 'Inactive'}
            </label>
          </div>
        </div>
        <FieldError errors={validationErrors} name="is_active" />
      </section>

      <footer className="coupon-form-actions app-section-card admin-coupon-form-actions">
        <div>
          <strong>Ready to save?</strong>
          <span>Review discount values and validity before continuing.</span>
        </div>
        <div>
          <Link className="btn btn-admin-soft" to="/admin/coupons">
            Cancel
          </Link>
          <button
            className="btn btn-admin-primary"
            type="submit"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                Saving...
              </>
            ) : (
              <>
                <i className="bi bi-check2-circle" aria-hidden="true" />
                {submitLabel}
              </>
            )}
          </button>
        </div>
      </footer>
    </form>
  )
}

export default CouponForm
