import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Swal from 'sweetalert2'
import ProductImageGallery from '../../components/storefront/ProductImageGallery.jsx'
import ProductReviewsSection from '../../components/storefront/ProductReviewsSection.jsx'
import ReviewStars from '../../components/reviews/ReviewStars.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useCart } from '../../hooks/useCart.js'
import { getStorefrontProduct } from '../../services/storefrontService.js'
import {
  getApiErrorMessage,
  getValidationErrors,
} from '../../utils/apiErrors.js'

const trustItems = [
  {
    icon: 'bi-shield-check',
    title: 'Secure checkout foundation',
    text: 'Built on a session-secure commerce architecture.',
  },
  {
    icon: 'bi-lightning-charge',
    title: 'Fast storefront experience',
    text: 'Responsive product media and focused information.',
  },
  {
    icon: 'bi-code-slash',
    title: 'Laravel API powered',
    text: 'Reliable catalog data from a clean API layer.',
  },
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

function ProductDetailSkeleton() {
  return (
    <main className="product-detail-page" aria-busy="true">
      <div className="container">
        <div className="product-detail-skeleton" role="status">
          <div className="product-detail-skeleton__crumb" />
          <div className="product-detail-skeleton__shell">
            <div className="product-detail-skeleton__image" />
            <div className="product-detail-skeleton__copy">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
          <span className="visually-hidden">Loading product details</span>
        </div>
      </div>
    </main>
  )
}

function getCartActionErrorMessage(error) {
  const validationErrors = getValidationErrors(error)
  const validationMessage = Object.values(validationErrors)
    .flat()
    .find((message) => typeof message === 'string')

  return (
    validationMessage ||
    getApiErrorMessage(error, 'This product could not be added to your cart.')
  )
}

function ProductCartActions({ product }) {
  const [quantity, setQuantity] = useState(1)
  const { isAuthenticated } = useAuth()
  const { actionLoading, addItem } = useCart()
  const location = useLocation()
  const navigate = useNavigate()
  const stockQuantity = Number(product.stock_quantity)
  const hasStockLimit =
    product.stock_quantity !== null &&
    product.stock_quantity !== undefined &&
    Number.isFinite(stockQuantity)
  const maxQuantity = hasStockLimit
    ? Math.max(0, Math.floor(stockQuantity))
    : null
  const isInactive = [false, 0, '0'].includes(product.is_active)
  const isOutOfStock = maxQuantity === 0
  const isUnavailable = isInactive || isOutOfStock

  const setValidQuantity = (nextQuantity) => {
    const parsedQuantity = Number.parseInt(nextQuantity, 10)
    const positiveQuantity = Number.isFinite(parsedQuantity)
      ? Math.max(1, parsedQuantity)
      : 1

    setQuantity(
      maxQuantity === null
        ? positiveQuantity
        : Math.min(positiveQuantity, Math.max(1, maxQuantity)),
    )
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (isUnavailable || actionLoading) {
      return
    }

    if (!isAuthenticated) {
      const result = await Swal.fire({
        icon: 'info',
        title: 'Sign in to use your cart',
        text: 'Your cart is securely connected to your customer account.',
        showCancelButton: true,
        confirmButtonText: 'Sign in',
        cancelButtonText: 'Keep browsing',
        focusCancel: true,
        buttonsStyling: false,
        customClass: {
          popup: 'storefront-alert',
          confirmButton: 'swal-brand-button',
          cancelButton: 'swal-soft-button',
        },
      })

      if (result.isConfirmed) {
        navigate('/login', { state: { from: location } })
      }

      return
    }

    try {
      await addItem(product.id, quantity)

      await Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `${quantity} ${quantity === 1 ? 'item' : 'items'} added to cart`,
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
        customClass: { popup: 'storefront-alert cart-toast' },
      })
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Could not add this product',
        text: getCartActionErrorMessage(error),
        confirmButtonText: 'Close',
        buttonsStyling: false,
        customClass: {
          popup: 'storefront-alert',
          confirmButton: 'swal-brand-button',
        },
      })
    }
  }

  return (
    <form className="product-detail-cart-panel storefront-detail-actions app-section-card" onSubmit={handleSubmit}>
      <div className="product-detail-cart-panel__heading">
        <span aria-hidden="true">
          <i className="bi bi-bag-plus" />
        </span>
        <div>
          <h2>Add to cart</h2>
          <p>Choose your quantity and add this item securely.</p>
        </div>
        {hasStockLimit && !isInactive && (
          <span
            className={`product-stock-status storefront-stock-badge ${isOutOfStock ? 'is-out' : ''}`}
            id="product-cart-status"
          >
            {isOutOfStock ? 'Out of stock' : `${maxQuantity} available`}
          </span>
        )}
        {isInactive && (
          <span className="product-stock-status storefront-stock-badge is-out" id="product-cart-status">
            Unavailable
          </span>
        )}
      </div>

      <div className="product-detail-cart-panel__controls">
        <div className="product-quantity-field">
          <label htmlFor={`product-quantity-${product.id}`}>Quantity</label>
          <div className="product-quantity-control storefront-quantity-control">
            <button
              type="button"
              onClick={() => setValidQuantity(quantity - 1)}
              disabled={quantity <= 1 || isUnavailable || actionLoading}
              aria-label="Decrease quantity"
            >
              <i className="bi bi-dash" aria-hidden="true" />
            </button>
            <input
              id={`product-quantity-${product.id}`}
              type="number"
              min="1"
              max={maxQuantity ?? undefined}
              value={quantity}
              onChange={(event) => setValidQuantity(event.target.value)}
              disabled={isUnavailable || actionLoading}
              aria-describedby={hasStockLimit || isInactive ? 'product-cart-status' : undefined}
            />
            <button
              type="button"
              onClick={() => setValidQuantity(quantity + 1)}
              disabled={
                isUnavailable ||
                actionLoading ||
                (maxQuantity !== null && quantity >= maxQuantity)
              }
              aria-label="Increase quantity"
            >
              <i className="bi bi-plus" aria-hidden="true" />
            </button>
          </div>
        </div>

        <button
          className="btn btn-brand product-add-to-cart-button"
          type="submit"
          disabled={isUnavailable || actionLoading}
        >
          {actionLoading ? (
            <>
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
              Adding to cart...
            </>
          ) : (
            <>
              <i className="bi bi-bag-plus" aria-hidden="true" />
              {isOutOfStock ? 'Out of stock' : 'Add to cart'}
            </>
          )}
        </button>
      </div>

      <div className="product-detail-cart-panel__note">
        <i
          className={`bi ${isAuthenticated ? 'bi-shield-check' : 'bi-person-lock'}`}
          aria-hidden="true"
        />
        <span>
          {isAuthenticated
            ? 'Your authenticated cart will update immediately.'
            : 'Sign in is required when you add an item to your cart.'}
        </span>
      </div>
    </form>
  )
}

function ProductDetailPage() {
  const { slug } = useParams()
  const [requestVersion, setRequestVersion] = useState(0)
  const requestKey = `${slug}:${requestVersion}`
  const [result, setResult] = useState({
    requestKey: '',
    product: null,
    error: '',
    isNotFound: false,
  })
  const isLoading = result.requestKey !== requestKey
  const { error, isNotFound, product } = result

  useEffect(() => {
    let isMounted = true

    window.scrollTo({ top: 0, behavior: 'smooth' })

    getStorefrontProduct(slug)
      .then((response) => {
        if (isMounted) {
          setResult({
            requestKey,
            product: response.data,
            error: '',
            isNotFound: false,
          })
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          const notFound = requestError.response?.status === 404

          setResult({
            requestKey,
            product: null,
            error: notFound
              ? 'This product is unavailable or no longer part of the storefront.'
              : getApiErrorMessage(
                  requestError,
                  'Product details could not be loaded right now.',
                ),
            isNotFound: notFound,
          })
        }
      })

    return () => {
      isMounted = false
    }
  }, [requestKey, slug])

  const retry = () => {
    setRequestVersion((current) => current + 1)
  }

  if (isLoading) {
    return <ProductDetailSkeleton />
  }

  if (!product) {
    return (
      <main className="product-detail-page storefront-detail-page">
        <div className="container">
          <section className="product-detail-state app-empty-state" role="alert">
            <span className="product-detail-state__icon" aria-hidden="true">
              <i className={`bi ${isNotFound ? 'bi-box-seam' : 'bi-cloud-slash'}`} />
            </span>
            <span className="section-kicker">
              {isNotFound ? 'Product unavailable' : 'Connection issue'}
            </span>
            <h1>{isNotFound ? 'We could not find this product' : 'Details are unavailable'}</h1>
            <p>{error}</p>
            <div>
              <Link className="btn btn-soft" to="/products">
                <i className="bi bi-arrow-left" aria-hidden="true" />
                Back to products
              </Link>
              {!isNotFound && (
                <button className="btn btn-brand" type="button" onClick={retry}>
                  <i className="bi bi-arrow-clockwise" aria-hidden="true" />
                  Try again
                </button>
              )}
            </div>
          </section>
        </div>
      </main>
    )
  }

  const price = Number(product.price)
  const salePrice = product.sale_price === null ? null : Number(product.sale_price)
  const hasSale =
    Number.isFinite(price) &&
    Number.isFinite(salePrice) &&
    salePrice < price

  return (
    <main className="product-detail-page storefront-detail-page">
      <section className="product-detail-hero storefront-detail-hero">
        <div className="container">
          <Link className="product-detail-back-link" to="/products">
            <i className="bi bi-arrow-left" aria-hidden="true" />
            Back to products
          </Link>
          <nav className="product-detail-breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <i className="bi bi-chevron-right" aria-hidden="true" />
            <Link to="/products">Products</Link>
            <i className="bi bi-chevron-right" aria-hidden="true" />
            <span aria-current="page">{product.name}</span>
          </nav>
        </div>
      </section>

      <section className="product-detail-content">
        <div className="container">
          <div className="product-detail-shell storefront-detail-shell">
            <ProductImageGallery product={product} key={product.id} />

            <section className="product-detail-summary storefront-detail-info app-section-card">
              <div className="product-detail-badges">
                <span className="product-detail-category">
                  <i className="bi bi-tag" aria-hidden="true" />
                  {product.category?.name || 'Uncategorized'}
                </span>
                {product.is_featured && (
                  <span className="is-featured">
                    <i className="bi bi-star-fill" aria-hidden="true" />
                    Featured
                  </span>
                )}
                {hasSale && <span className="is-sale">Sale</span>}
              </div>

              <h1>{product.name}</h1>
              <a className="product-detail-rating-link storefront-review-summary" href="#product-reviews">
                <ReviewStars rating={product.rating_summary?.average_rating || 0} />
                <strong>{Number(product.rating_summary?.average_rating || 0).toFixed(1)}</strong>
                <span>({product.rating_summary?.review_count || 0} reviews)</span>
              </a>
              {product.short_description && (
                <p className="product-detail-lead">{product.short_description}</p>
              )}

              {product.sku && (
                <div className="product-detail-sku">
                  <span>SKU</span>
                  <code>{product.sku}</code>
                </div>
              )}

              <div className="product-detail-price storefront-detail-price">
                <small>{hasSale ? 'Current price' : 'Price'}</small>
                <div>
                  <strong>{formatAmount(hasSale ? salePrice : price)}</strong>
                  {hasSale && <del>{formatAmount(price)}</del>}
                </div>
                {hasSale && (
                  <span>You save {formatAmount(price - salePrice)}</span>
                )}
              </div>

              <ProductCartActions product={product} key={product.id} />
            </section>
          </div>

          <section className="product-detail-description app-section-card storefront-detail-description">
            <span className="section-kicker">Product information</span>
            <h2>About this product</h2>
            <p>
              {product.description ||
                product.short_description ||
                'More product information will be available soon.'}
            </p>
          </section>

          <ProductReviewsSection
            productSlug={product.slug}
            initialSummary={product.rating_summary}
          />

          <section className="product-detail-trust-grid" aria-label="Storefront features">
            {trustItems.map((item) => (
              <article key={item.title}>
                <span aria-hidden="true">
                  <i className={`bi ${item.icon}`} />
                </span>
                <div>
                  <h2>{item.title}</h2>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </section>
        </div>
      </section>
    </main>
  )
}

export default ProductDetailPage
