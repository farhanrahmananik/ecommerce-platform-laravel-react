import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Swal from 'sweetalert2'
import ProductForm from '../../../components/admin/products/ProductForm.jsx'
import ProductImagesManager from '../../../components/admin/products/ProductImagesManager.jsx'
import { getCategoryOptions } from '../../../services/admin/categoryService.js'
import {
  getProduct,
  updateProduct,
} from '../../../services/admin/productService.js'
import {
  getApiErrorMessage,
  getValidationErrors,
} from '../../../utils/apiErrors.js'

function ProductEditPage() {
  const [product, setProduct] = useState(null)
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [generalError, setGeneralError] = useState('')
  const { id } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    let isMounted = true

    Promise.all([getProduct(id), getCategoryOptions()])
      .then(([productResponse, options]) => {
        if (isMounted) {
          setProduct(productResponse.data)
          setCategories(options)
        }
      })
      .catch((error) => {
        if (isMounted) {
          setGeneralError(
            error.response?.status === 404
              ? 'The requested product could not be found.'
              : getApiErrorMessage(error, 'The product could not be loaded.'),
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
      const response = await updateProduct(id, payload)

      await Swal.fire({
        icon: 'success',
        title: 'Changes saved',
        text: `${response.data.name} has been updated.`,
        timer: 1500,
        showConfirmButton: false,
        customClass: { popup: 'storefront-alert' },
      })

      navigate('/admin/products', { replace: true })
    } catch (error) {
      const validationErrors = getValidationErrors(error)

      setFieldErrors(validationErrors)

      if (Object.keys(validationErrors).length === 0) {
        setGeneralError(
          getApiErrorMessage(error, 'The product could not be updated.'),
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="category-form-loading category-form-loading-page app-form-card" role="status">
        <span className="spinner-border" aria-hidden="true" />
        <strong>Loading product details...</strong>
        <span className="visually-hidden">Loading</span>
      </div>
    )
  }

  if (!product) {
    return (
      <main className="category-request-error app-empty-state">
        <span className="category-request-error-icon" aria-hidden="true">
          <i className="bi bi-box-seam" />
        </span>
        <span className="admin-eyebrow">Product unavailable</span>
        <h1>We could not open this product</h1>
        <p>{generalError}</p>
        <Link className="btn btn-admin-primary" to="/admin/products">
          <i className="bi bi-arrow-left" aria-hidden="true" />
          Back to Products
        </Link>
      </main>
    )
  }

  return (
    <main className="admin-product-page admin-catalog-page">
      <header className="category-page-heading app-page-header admin-catalog-header">
        <div className="admin-list-title-group">
          <Link className="category-back-link" to="/admin/products">
            <i className="bi bi-arrow-left" aria-hidden="true" />
            Back to Products
          </Link>
          <span className="admin-eyebrow app-page-eyebrow">Catalog management</span>
          <h1 className="app-page-title">Edit product</h1>
          <p className="app-page-subtitle">Update the catalog details and availability of {product.name}.</p>
        </div>
        <span className="category-heading-icon app-icon-badge" aria-hidden="true">
          <i className="bi bi-pencil-square" />
        </span>
      </header>

      {generalError && (
        <div className="alert category-alert category-alert-danger product-page-alert" role="alert">
          <i className="bi bi-exclamation-octagon" aria-hidden="true" />
          <span>{generalError}</span>
        </div>
      )}

      <ProductForm
        key={product.id}
        initialValues={product}
        categories={categories}
        onSubmit={handleSubmit}
        submitting={isSubmitting}
        errors={fieldErrors}
        submitLabel="Save Changes"
      />

      <ProductImagesManager
        productId={product.id}
        productName={product.name}
      />
    </main>
  )
}

export default ProductEditPage
