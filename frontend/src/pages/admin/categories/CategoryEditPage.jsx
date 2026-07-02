import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Swal from 'sweetalert2'
import CategoryForm from '../../../components/admin/categories/CategoryForm.jsx'
import {
  getCategory,
  getCategoryOptions,
  updateCategory,
} from '../../../services/admin/categoryService.js'
import {
  getApiErrorMessage,
  getValidationErrors,
} from '../../../utils/apiErrors.js'

function CategoryEditPage() {
  const [category, setCategory] = useState(null)
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [generalError, setGeneralError] = useState('')
  const { id } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    let isMounted = true

    Promise.all([getCategory(id), getCategoryOptions()])
      .then(([categoryResponse, options]) => {
        if (isMounted) {
          setCategory(categoryResponse.data)
          setCategories(options)
        }
      })
      .catch((error) => {
        if (isMounted) {
          setGeneralError(
            error.response?.status === 404
              ? 'The requested category could not be found.'
              : getApiErrorMessage(error, 'The category could not be loaded.'),
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
    setFieldErrors({})
    setGeneralError('')

    try {
      const response = await updateCategory(id, payload)

      await Swal.fire({
        icon: 'success',
        title: 'Changes saved',
        text: `${response.data.name} has been updated.`,
        timer: 1500,
        showConfirmButton: false,
        customClass: { popup: 'storefront-alert' },
      })

      navigate('/admin/categories', { replace: true })
    } catch (error) {
      const validationErrors = getValidationErrors(error)

      setFieldErrors(validationErrors)

      if (Object.keys(validationErrors).length === 0) {
        setGeneralError(
          getApiErrorMessage(error, 'The category could not be updated.'),
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="category-form-loading category-form-loading-page" role="status">
        <span className="spinner-border" aria-hidden="true" />
        <strong>Loading category details...</strong>
        <span className="visually-hidden">Loading</span>
      </div>
    )
  }

  if (!category) {
    return (
      <main className="category-request-error">
        <span className="category-request-error-icon" aria-hidden="true">
          <i className="bi bi-folder-x" />
        </span>
        <span className="admin-eyebrow">Category unavailable</span>
        <h1>We could not open this category</h1>
        <p>{generalError}</p>
        <Link className="btn btn-admin-primary" to="/admin/categories">
          <i className="bi bi-arrow-left" aria-hidden="true" />
          Back to Categories
        </Link>
      </main>
    )
  }

  return (
    <main className="admin-category-page">
      <header className="category-page-heading">
        <div>
          <Link className="category-back-link" to="/admin/categories">
            <i className="bi bi-arrow-left" aria-hidden="true" />
            Back to Categories
          </Link>
          <span className="admin-eyebrow">Catalog organization</span>
          <h1>Edit category</h1>
          <p>Update the structure and visibility of {category.name}.</p>
        </div>
        <span className="category-heading-icon" aria-hidden="true">
          <i className="bi bi-pencil-square" />
        </span>
      </header>

      {generalError && (
        <div className="alert category-alert category-alert-danger" role="alert">
          <i className="bi bi-exclamation-octagon" aria-hidden="true" />
          <span>{generalError}</span>
        </div>
      )}

      <CategoryForm
        key={category.id}
        initialValues={category}
        categories={categories}
        currentCategoryId={category.id}
        onSubmit={handleSubmit}
        submitting={isSubmitting}
        errors={fieldErrors}
        submitLabel="Save Changes"
      />
    </main>
  )
}

export default CategoryEditPage
