import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import ProductForm from '../../../components/admin/products/ProductForm.jsx'
import { getCategoryOptions } from '../../../services/admin/categoryService.js'
import { createProduct } from '../../../services/admin/productService.js'
import {
  getApiErrorMessage,
  getValidationErrors,
} from '../../../utils/apiErrors.js'

function ProductCreatePage() {
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
            getApiErrorMessage(error, 'Categories could not be loaded.'),
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
      const response = await createProduct(payload)

      await Swal.fire({
        icon: 'success',
        title: 'Product created',
        text: `${response.data.name} is ready for catalog management.`,
        timer: 1600,
        showConfirmButton: false,
        customClass: { popup: 'storefront-alert' },
      })

      navigate('/admin/products', { replace: true })
    } catch (error) {
      const validationErrors = getValidationErrors(error)

      setFieldErrors(validationErrors)

      if (Object.keys(validationErrors).length === 0) {
        setGeneralError(
          getApiErrorMessage(error, 'The product could not be created.'),
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="admin-product-page">
      <header className="category-page-heading">
        <div>
          <Link className="category-back-link" to="/admin/products">
            <i className="bi bi-arrow-left" aria-hidden="true" />
            Back to Products
          </Link>
          <span className="admin-eyebrow">Catalog management</span>
          <h1>Create product</h1>
          <p>Add the core details, pricing, stock, and visibility for a catalog item.</p>
        </div>
        <span className="category-heading-icon" aria-hidden="true">
          <i className="bi bi-box-seam" />
        </span>
      </header>

      {generalError && (
        <div className="alert category-alert category-alert-danger product-page-alert" role="alert">
          <i className="bi bi-exclamation-octagon" aria-hidden="true" />
          <span>{generalError}</span>
        </div>
      )}

      {isLoading ? (
        <div className="category-form-loading" role="status">
          <span className="spinner-border" aria-hidden="true" />
          <strong>Preparing the product form...</strong>
          <span className="visually-hidden">Loading</span>
        </div>
      ) : (
        <ProductForm
          categories={categories}
          onSubmit={handleSubmit}
          submitting={isSubmitting}
          errors={fieldErrors}
          submitLabel="Create Product"
        />
      )}
    </main>
  )
}

export default ProductCreatePage
