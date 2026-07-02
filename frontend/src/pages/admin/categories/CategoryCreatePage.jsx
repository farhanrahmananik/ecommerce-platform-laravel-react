import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import CategoryForm from '../../../components/admin/categories/CategoryForm.jsx'
import {
  createCategory,
  getCategoryOptions,
} from '../../../services/admin/categoryService.js'
import {
  getApiErrorMessage,
  getValidationErrors,
} from '../../../utils/apiErrors.js'

function CategoryCreatePage() {
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [generalError, setGeneralError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    let isMounted = true

    getCategoryOptions()
      .then((options) => {
        if (isMounted) {
          setCategories(options)
        }
      })
      .catch((error) => {
        if (isMounted) {
          setGeneralError(
            getApiErrorMessage(error, 'Parent categories could not be loaded.'),
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
  }, [])

  const handleSubmit = async (payload) => {
    setIsSubmitting(true)
    setFieldErrors({})
    setGeneralError('')

    try {
      const response = await createCategory(payload)

      await Swal.fire({
        icon: 'success',
        title: 'Category created',
        text: `${response.data.name} is ready to organize your catalog.`,
        timer: 1600,
        showConfirmButton: false,
        customClass: { popup: 'storefront-alert' },
      })

      navigate('/admin/categories', { replace: true })
    } catch (error) {
      const validationErrors = getValidationErrors(error)

      setFieldErrors(validationErrors)

      if (Object.keys(validationErrors).length === 0) {
        setGeneralError(
          getApiErrorMessage(error, 'The category could not be created.'),
        )
      }
    } finally {
      setIsSubmitting(false)
    }
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
          <h1>Create category</h1>
          <p>Add a clear, reusable category for your product catalog.</p>
        </div>
        <span className="category-heading-icon" aria-hidden="true">
          <i className="bi bi-folder-plus" />
        </span>
      </header>

      {generalError && (
        <div className="alert category-alert category-alert-danger" role="alert">
          <i className="bi bi-exclamation-octagon" aria-hidden="true" />
          <span>{generalError}</span>
        </div>
      )}

      {isLoading ? (
        <div className="category-form-loading" role="status">
          <span className="spinner-border" aria-hidden="true" />
          <strong>Preparing the category form...</strong>
          <span className="visually-hidden">Loading</span>
        </div>
      ) : (
        <CategoryForm
          categories={categories}
          onSubmit={handleSubmit}
          submitting={isSubmitting}
          errors={fieldErrors}
          submitLabel="Create Category"
        />
      )}
    </main>
  )
}

export default CategoryCreatePage
