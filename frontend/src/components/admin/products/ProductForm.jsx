import { useState } from 'react'
import { Link } from 'react-router-dom'
import AdminSelect from '../common/AdminSelect.jsx'

const defaultValues = {
  category_id: '',
  name: '',
  slug: '',
  sku: '',
  short_description: '',
  description: '',
  price: '',
  sale_price: '',
  cost_price: '',
  stock_quantity: 0,
  low_stock_threshold: 5,
  is_active: true,
  is_featured: false,
  sort_order: 0,
  meta_title: '',
  meta_description: '',
}

function FieldErrors({ messages }) {
  if (!messages) {
    return null
  }

  const errorMessages = Array.isArray(messages) ? messages : [messages]

  return errorMessages.map((message) => (
    <div className="category-field-error admin-validation-text" key={message}>
      {message}
    </div>
  ))
}

function SectionHeading({ icon, title, description }) {
  return (
    <div className="product-form-section-heading admin-form-section-title">
      <span aria-hidden="true">
        <i className={`bi ${icon}`} />
      </span>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  )
}

function optionalText(value) {
  const normalizedValue = String(value ?? '').trim()

  return normalizedValue || null
}

function optionalNumber(value) {
  return value === '' || value === null ? null : Number(value)
}

function ProductForm({
  initialValues = defaultValues,
  categories = [],
  onSubmit,
  submitting = false,
  errors = {},
  submitLabel = 'Save Product',
}) {
  const [form, setForm] = useState(() => {
    const values = { ...defaultValues, ...initialValues }

    return Object.fromEntries(
      Object.entries(values).map(([key, value]) => [key, value ?? '']),
    )
  })

  const handleChange = (event) => {
    const { checked, name, type, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const categoryOptions = [
    { value: '', label: 'Uncategorized' },
    ...categories.map((category) => ({
      value: category.id,
      label: category.name,
    })),
  ]

  const handleSubmit = (event) => {
    event.preventDefault()

    onSubmit({
      category_id: form.category_id === '' ? null : Number(form.category_id),
      name: form.name.trim(),
      slug: optionalText(form.slug),
      sku: form.sku.trim(),
      short_description: optionalText(form.short_description),
      description: optionalText(form.description),
      price: optionalNumber(form.price),
      sale_price: optionalNumber(form.sale_price),
      cost_price: optionalNumber(form.cost_price),
      stock_quantity: optionalNumber(form.stock_quantity),
      low_stock_threshold: optionalNumber(form.low_stock_threshold),
      is_active: Boolean(form.is_active),
      is_featured: Boolean(form.is_featured),
      sort_order: optionalNumber(form.sort_order),
      meta_title: optionalText(form.meta_title),
      meta_description: optionalText(form.meta_description),
    })
  }

  return (
    <form className="product-form admin-catalog-form" onSubmit={handleSubmit} noValidate>
      <section className="product-form-section admin-form-section app-section-card">
        <SectionHeading
          icon="bi-box-seam"
          title="Basic Information"
          description="Name the product and define its place in the catalog."
        />

        <div className="row g-4 admin-form-grid">
          <div className="col-lg-8">
            <label className="category-form-label" htmlFor="product-name">
              Product name <span>*</span>
            </label>
            <input
              id="product-name"
              className={`form-control category-form-control ${errors.name ? 'is-invalid' : ''}`}
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Everyday Canvas Backpack"
              autoComplete="off"
            />
            <FieldErrors messages={errors.name} />
          </div>

          <div className="col-lg-4">
            <label className="category-form-label" htmlFor="product-sku">
              SKU <span>*</span>
            </label>
            <input
              id="product-sku"
              className={`form-control category-form-control ${errors.sku ? 'is-invalid' : ''}`}
              name="sku"
              value={form.sku}
              onChange={handleChange}
              placeholder="BAG-001"
              autoComplete="off"
            />
            <FieldErrors messages={errors.sku} />
          </div>

          <div className="col-lg-6 admin-product-category-field">
            <AdminSelect
              id="product-category"
              name="category_id"
              label="Category"
              value={form.category_id}
              options={categoryOptions}
              onChange={(categoryId) =>
                setForm((current) => ({ ...current, category_id: categoryId }))
              }
              error={errors.category_id}
              placeholder="Choose a category"
              helperText="Choose where this product appears in the catalog."
              optional
            />
          </div>

          <div className="col-lg-6">
            <label className="category-form-label" htmlFor="product-slug">
              URL slug <small>Optional</small>
            </label>
            <div className="category-input-with-icon">
              <i className="bi bi-link-45deg" aria-hidden="true" />
              <input
                id="product-slug"
                className={`form-control category-form-control ${errors.slug ? 'is-invalid' : ''}`}
                name="slug"
                value={form.slug}
                onChange={handleChange}
                placeholder="Generated from the name if blank"
                autoComplete="off"
              />
            </div>
            <FieldErrors messages={errors.slug} />
          </div>

          <div className="col-12">
            <label className="category-form-label" htmlFor="product-short-description">
              Short description <small>Optional</small>
            </label>
            <textarea
              id="product-short-description"
              className={`form-control category-form-control product-form-textarea-short ${errors.short_description ? 'is-invalid' : ''}`}
              name="short_description"
              value={form.short_description}
              onChange={handleChange}
              placeholder="A concise summary for product listings."
              rows="3"
            />
            <FieldErrors messages={errors.short_description} />
          </div>

          <div className="col-12">
            <label className="category-form-label" htmlFor="product-description">
              Description <small>Optional</small>
            </label>
            <textarea
              id="product-description"
              className={`form-control category-form-control category-form-textarea ${errors.description ? 'is-invalid' : ''}`}
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the product, materials, use, and customer value."
              rows="7"
            />
            <FieldErrors messages={errors.description} />
          </div>
        </div>
      </section>

      <div className="product-form-grid admin-form-grid">
        <section className="product-form-section admin-form-section app-section-card">
          <SectionHeading
            icon="bi-cash-stack"
            title="Pricing"
            description="Set regular, promotional, and internal cost values."
          />

          <div className="row g-4">
            <div className="col-md-4">
              <label className="category-form-label" htmlFor="product-price">
                Price <span>*</span>
              </label>
              <input
                id="product-price"
                className={`form-control category-form-control ${errors.price ? 'is-invalid' : ''}`}
                type="number"
                min="0"
                step="0.01"
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="0.00"
              />
              <FieldErrors messages={errors.price} />
            </div>

            <div className="col-md-4">
              <label className="category-form-label" htmlFor="product-sale-price">
                Sale price <small>Optional</small>
              </label>
              <input
                id="product-sale-price"
                className={`form-control category-form-control ${errors.sale_price ? 'is-invalid' : ''}`}
                type="number"
                min="0"
                step="0.01"
                name="sale_price"
                value={form.sale_price}
                onChange={handleChange}
                placeholder="0.00"
              />
              <FieldErrors messages={errors.sale_price} />
            </div>

            <div className="col-md-4">
              <label className="category-form-label" htmlFor="product-cost-price">
                Cost price <small>Optional</small>
              </label>
              <input
                id="product-cost-price"
                className={`form-control category-form-control ${errors.cost_price ? 'is-invalid' : ''}`}
                type="number"
                min="0"
                step="0.01"
                name="cost_price"
                value={form.cost_price}
                onChange={handleChange}
                placeholder="0.00"
              />
              <FieldErrors messages={errors.cost_price} />
            </div>
          </div>
        </section>

        <section className="product-form-section admin-form-section app-section-card">
          <SectionHeading
            icon="bi-boxes"
            title="Inventory"
            description="Track available quantity and define the low-stock signal."
          />

          <div className="row g-4">
            <div className="col-md-6">
              <label className="category-form-label" htmlFor="product-stock">
                Stock quantity
              </label>
              <input
                id="product-stock"
                className={`form-control category-form-control ${errors.stock_quantity ? 'is-invalid' : ''}`}
                type="number"
                min="0"
                step="1"
                name="stock_quantity"
                value={form.stock_quantity}
                onChange={handleChange}
              />
              <FieldErrors messages={errors.stock_quantity} />
            </div>

            <div className="col-md-6">
              <label className="category-form-label" htmlFor="product-low-stock">
                Low-stock threshold
              </label>
              <input
                id="product-low-stock"
                className={`form-control category-form-control ${errors.low_stock_threshold ? 'is-invalid' : ''}`}
                type="number"
                min="0"
                step="1"
                name="low_stock_threshold"
                value={form.low_stock_threshold}
                onChange={handleChange}
              />
              <FieldErrors messages={errors.low_stock_threshold} />
            </div>
          </div>
        </section>
      </div>

      <section className="product-form-section admin-form-section app-section-card">
        <SectionHeading
          icon="bi-broadcast"
          title="Publishing"
          description="Control catalog visibility, merchandising, and display order."
        />

        <div className="product-publishing-grid">
          <label className="product-toggle-card" htmlFor="product-is-active">
            <span className="product-toggle-icon is-active" aria-hidden="true">
              <i className="bi bi-eye" />
            </span>
            <span>
              <strong>Active product</strong>
              <small>Available to future catalog experiences.</small>
            </span>
            <span className="form-check form-switch category-status-switch">
              <input
                id="product-is-active"
                className="form-check-input"
                type="checkbox"
                role="switch"
                name="is_active"
                checked={form.is_active}
                onChange={handleChange}
              />
            </span>
          </label>

          <label className="product-toggle-card" htmlFor="product-is-featured">
            <span className="product-toggle-icon is-featured" aria-hidden="true">
              <i className="bi bi-star" />
            </span>
            <span>
              <strong>Featured product</strong>
              <small>Highlight this item in curated placements.</small>
            </span>
            <span className="form-check form-switch category-status-switch">
              <input
                id="product-is-featured"
                className="form-check-input"
                type="checkbox"
                role="switch"
                name="is_featured"
                checked={form.is_featured}
                onChange={handleChange}
              />
            </span>
          </label>

          <div className="product-sort-field">
            <label className="category-form-label" htmlFor="product-sort-order">
              Sort order
            </label>
            <input
              id="product-sort-order"
              className={`form-control category-form-control ${errors.sort_order ? 'is-invalid' : ''}`}
              type="number"
              min="0"
              step="1"
              name="sort_order"
              value={form.sort_order}
              onChange={handleChange}
            />
            <FieldErrors messages={errors.sort_order} />
          </div>
        </div>
        <FieldErrors messages={errors.is_active} />
        <FieldErrors messages={errors.is_featured} />
      </section>

      <section className="product-form-section admin-form-section app-section-card">
        <SectionHeading
          icon="bi-search"
          title="SEO"
          description="Prepare search-friendly titles and descriptions."
        />

        <div className="row g-4">
          <div className="col-12">
            <label className="category-form-label" htmlFor="product-meta-title">
              Meta title <small>Optional</small>
            </label>
            <input
              id="product-meta-title"
              className={`form-control category-form-control ${errors.meta_title ? 'is-invalid' : ''}`}
              name="meta_title"
              value={form.meta_title}
              onChange={handleChange}
              placeholder="Search result title"
              autoComplete="off"
            />
            <FieldErrors messages={errors.meta_title} />
          </div>

          <div className="col-12">
            <label className="category-form-label" htmlFor="product-meta-description">
              Meta description <small>Optional</small>
            </label>
            <textarea
              id="product-meta-description"
              className={`form-control category-form-control product-form-textarea-short ${errors.meta_description ? 'is-invalid' : ''}`}
              name="meta_description"
              value={form.meta_description}
              onChange={handleChange}
              placeholder="A concise description for search results."
              rows="3"
            />
            <FieldErrors messages={errors.meta_description} />
          </div>
        </div>
      </section>

      <div className="product-form-actions admin-catalog-form-actions">
        <div>
          <strong>Ready to save?</strong>
          <span>Required fields are marked with an asterisk.</span>
        </div>
        <div>
          <Link className="btn btn-admin-soft" to="/admin/products">
            Cancel
          </Link>
          <button
            className="btn btn-admin-primary product-submit-button"
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
                <i className="bi bi-check2" aria-hidden="true" />
                {submitLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  )
}

export default ProductForm
