import { useState } from 'react'
import { Link } from 'react-router-dom'
import AdminSelect from '../common/AdminSelect.jsx'

const defaultValues = {
  parent_id: '',
  name: '',
  slug: '',
  description: '',
  image_path: '',
  is_active: true,
  sort_order: 0,
}

function FieldErrors({ messages }) {
  if (!messages?.length) {
    return null
  }

  return messages.map((message) => (
    <div className="category-field-error admin-validation-text" key={message}>
      {message}
    </div>
  ))
}

function CategoryForm({
  initialValues = defaultValues,
  categories = [],
  onSubmit,
  submitting = false,
  errors = {},
  currentCategoryId = null,
  submitLabel = 'Save Category',
}) {
  const [form, setForm] = useState(() => ({
    ...defaultValues,
    ...initialValues,
    parent_id: initialValues.parent_id ?? '',
    description: initialValues.description ?? '',
    image_path: initialValues.image_path ?? '',
    slug: initialValues.slug ?? '',
  }))

  const parentOptions = categories.filter(
    (category) => String(category.id) !== String(currentCategoryId),
  )
  const parentCategoryOptions = [
    { value: '', label: 'No parent category' },
    ...parentOptions.map((category) => ({
      value: category.id,
      label: category.name,
    })),
  ]

  const handleChange = (event) => {
    const { checked, name, type, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    onSubmit({
      parent_id: form.parent_id === '' ? null : Number(form.parent_id),
      name: form.name.trim(),
      slug: form.slug.trim() || null,
      description: form.description.trim() || null,
      image_path: form.image_path.trim() || null,
      is_active: Boolean(form.is_active),
      sort_order: form.sort_order === '' ? 0 : Number(form.sort_order),
    })
  }

  return (
    <form className="category-form-card app-form-card admin-catalog-form" onSubmit={handleSubmit} noValidate>
      <div className="category-form-section-heading admin-form-section-title">
        <span className="category-form-section-icon" aria-hidden="true">
          <i className="bi bi-folder2-open" />
        </span>
        <div>
          <h2>Category details</h2>
          <p>Define how this category appears and where it belongs.</p>
        </div>
      </div>

      <div className="row g-4 admin-form-grid">
        <div className="col-lg-8">
          <label className="category-form-label" htmlFor="category-name">
            Category name <span>*</span>
          </label>
          <input
            id="category-name"
            className={`form-control category-form-control ${errors.name ? 'is-invalid' : ''}`}
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Home & Living"
            autoComplete="off"
          />
          <FieldErrors messages={errors.name} />
        </div>

        <div className="col-lg-4">
          <label className="category-form-label" htmlFor="category-sort-order">
            Sort order
          </label>
          <input
            id="category-sort-order"
            className={`form-control category-form-control ${errors.sort_order ? 'is-invalid' : ''}`}
            type="number"
            min="0"
            name="sort_order"
            value={form.sort_order}
            onChange={handleChange}
          />
          <FieldErrors messages={errors.sort_order} />
        </div>

        <div className="col-lg-6 admin-category-parent-field">
          <label className="category-form-label" htmlFor="category-slug">
            URL slug <small>Optional</small>
          </label>
          <div className="category-input-with-icon">
            <i className="bi bi-link-45deg" aria-hidden="true" />
            <input
              id="category-slug"
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

        <div className="col-lg-6">
          <AdminSelect
            id="category-parent"
            name="parent_id"
            label="Parent category"
            value={form.parent_id}
            options={parentCategoryOptions}
            onChange={(parentId) =>
              setForm((current) => ({ ...current, parent_id: parentId }))
            }
            error={errors.parent_id}
            placeholder="Choose a parent category"
            helperText="Leave empty to keep this as a top-level category."
            optional
          />
        </div>

        <div className="col-12">
          <label className="category-form-label" htmlFor="category-description">
            Description <small>Optional</small>
          </label>
          <textarea
            id="category-description"
            className={`form-control category-form-control category-form-textarea ${errors.description ? 'is-invalid' : ''}`}
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="A short explanation of what belongs in this category."
            rows="5"
          />
          <FieldErrors messages={errors.description} />
        </div>

        <div className="col-12">
          <label className="category-form-label" htmlFor="category-image-path">
            Image path <small>Optional</small>
          </label>
          <div className="category-input-with-icon">
            <i className="bi bi-image" aria-hidden="true" />
            <input
              id="category-image-path"
              className={`form-control category-form-control ${errors.image_path ? 'is-invalid' : ''}`}
              name="image_path"
              value={form.image_path}
              onChange={handleChange}
              placeholder="categories/home-living.jpg"
              autoComplete="off"
            />
          </div>
          <FieldErrors messages={errors.image_path} />
          <span className="category-form-help">
            Image upload will be handled in a future media-management scope.
          </span>
        </div>
      </div>

      <div className="category-visibility-panel admin-form-section">
        <div>
          <span className="category-visibility-icon" aria-hidden="true">
            <i className="bi bi-eye" />
          </span>
          <div>
            <strong>Category visibility</strong>
            <p>Active categories are available to future catalog experiences.</p>
          </div>
        </div>
        <div className="form-check form-switch category-status-switch">
          <input
            id="category-is-active"
            className="form-check-input"
            type="checkbox"
            role="switch"
            name="is_active"
            checked={form.is_active}
            onChange={handleChange}
          />
          <label className="form-check-label" htmlFor="category-is-active">
            {form.is_active ? 'Active' : 'Inactive'}
          </label>
        </div>
      </div>
      <FieldErrors messages={errors.is_active} />

      <div className="category-form-actions admin-catalog-form-actions">
        <Link className="btn btn-admin-soft" to="/admin/categories">
          Cancel
        </Link>
        <button
          className="btn btn-admin-primary category-submit-button"
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
    </form>
  )
}

export default CategoryForm
