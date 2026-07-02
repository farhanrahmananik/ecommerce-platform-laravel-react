import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Swal from 'sweetalert2'
import { useCart } from '../../hooks/useCart.js'
import {
  getApiErrorMessage,
  getValidationErrors,
} from '../../utils/apiErrors.js'

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

function getCartActionErrorMessage(error, fallbackMessage) {
  const validationErrors = getValidationErrors(error)
  const validationMessage = Object.values(validationErrors)
    .flat()
    .find((message) => typeof message === 'string')

  return validationMessage || getApiErrorMessage(error, fallbackMessage)
}

function showSuccessToast(title) {
  return Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'success',
    title,
    timer: 1500,
    timerProgressBar: true,
    showConfirmButton: false,
    customClass: { popup: 'storefront-alert cart-toast' },
  })
}

function showActionError(error, fallbackMessage) {
  return Swal.fire({
    icon: 'error',
    title: 'Cart update failed',
    text: getCartActionErrorMessage(error, fallbackMessage),
    confirmButtonText: 'Close',
    buttonsStyling: false,
    customClass: {
      popup: 'storefront-alert',
      confirmButton: 'swal-brand-button',
    },
  })
}

function CartPageSkeleton() {
  return (
    <main className="cart-page" aria-busy="true">
      <section className="cart-page-hero">
        <div className="container">
          <div className="cart-page-heading-skeleton" />
        </div>
      </section>
      <section className="cart-page-content">
        <div className="container">
          <div className="cart-layout">
            <div className="cart-list-skeleton">
              {[1, 2, 3].map((item) => (
                <div className="cart-item-skeleton" key={item}>
                  <span />
                  <div>
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              ))}
            </div>
            <div className="cart-summary-skeleton" />
          </div>
          <span className="visually-hidden">Loading your cart</span>
        </div>
      </section>
    </main>
  )
}

function CartItemRow({
  item,
  isBusy,
  pendingAction,
  onDecrease,
  onIncrease,
  onRemove,
}) {
  const [imageFailed, setImageFailed] = useState(false)
  const productLink = item.product_slug
    ? `/products/${encodeURIComponent(item.product_slug)}`
    : null
  const showImage = item.product_image_url && !imageFailed
  const isUpdating = pendingAction === `update:${item.id}`
  const isRemoving = pendingAction === `remove:${item.id}`

  return (
    <article className={`cart-item-card ${isBusy ? 'is-busy' : ''}`}>
      <div className="cart-item-media">
        {showImage ? (
          <img
            src={item.product_image_url}
            alt={item.product_name || 'Cart product'}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="cart-item-placeholder" aria-label="No product image">
            <i className="bi bi-image" aria-hidden="true" />
          </span>
        )}
      </div>

      <div className="cart-item-main">
        <div className="cart-item-title-row">
          <div>
            <span className="cart-item-eyebrow">In your cart</span>
            {productLink ? (
              <Link to={productLink}>{item.product_name || 'Product'}</Link>
            ) : (
              <h2>{item.product_name || 'Product'}</h2>
            )}
          </div>
          <button
            className="cart-remove-button"
            type="button"
            onClick={() => onRemove(item)}
            disabled={isBusy}
            aria-label={`Remove ${item.product_name || 'product'} from cart`}
          >
            {isRemoving ? (
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
            ) : (
              <i className="bi bi-trash3" aria-hidden="true" />
            )}
            <span>Remove</span>
          </button>
        </div>

        <div className="cart-item-details">
          <div className="cart-item-unit-price">
            <small>Unit price</small>
            <strong>{formatAmount(item.unit_price)}</strong>
          </div>

          <div className="cart-item-quantity">
            <span>Quantity</span>
            <div className="cart-quantity-control" aria-label="Item quantity">
              <button
                type="button"
                onClick={() => onDecrease(item)}
                disabled={isBusy || item.quantity <= 1}
                aria-label={`Decrease quantity for ${item.product_name || 'product'}`}
              >
                <i className="bi bi-dash" aria-hidden="true" />
              </button>
              <output aria-live="polite">
                {isUpdating ? (
                  <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                ) : (
                  item.quantity
                )}
              </output>
              <button
                type="button"
                onClick={() => onIncrease(item)}
                disabled={isBusy}
                aria-label={`Increase quantity for ${item.product_name || 'product'}`}
              >
                <i className="bi bi-plus" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="cart-item-line-total">
            <small>Line total</small>
            <strong>{formatAmount(item.line_total)}</strong>
          </div>
        </div>
      </div>
    </article>
  )
}

function CartPage() {
  const {
    actionLoading,
    cart,
    clearCart,
    error,
    fetchCart,
    items,
    itemsCount,
    loading,
    removeItem,
    subtotal,
    total,
    updateItem,
  } = useCart()
  const [pendingAction, setPendingAction] = useState('')

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleRetry = () => {
    fetchCart().catch(() => undefined)
  }

  const runAction = async (actionKey, action, successMessage, fallbackMessage) => {
    setPendingAction(actionKey)

    try {
      await action()

      if (successMessage) {
        await showSuccessToast(successMessage)
      }
    } catch (actionError) {
      await showActionError(actionError, fallbackMessage)
    } finally {
      setPendingAction('')
    }
  }

  const handleQuantityChange = (item, nextQuantity) => {
    if (nextQuantity < 1 || actionLoading) {
      return
    }

    return runAction(
      `update:${item.id}`,
      () => updateItem(item.id, nextQuantity),
      null,
      'Unable to update this item right now.',
    )
  }

  const handleRemove = async (item) => {
    if (actionLoading) {
      return
    }

    const confirmation = await Swal.fire({
      icon: 'question',
      title: 'Remove this item?',
      text: item.product_name || 'This product will be removed from your cart.',
      showCancelButton: true,
      confirmButtonText: 'Remove item',
      cancelButtonText: 'Keep item',
      buttonsStyling: false,
      customClass: {
        popup: 'storefront-alert',
        confirmButton: 'swal-danger-button',
        cancelButton: 'swal-soft-button',
      },
    })

    if (confirmation.isConfirmed) {
      await runAction(
        `remove:${item.id}`,
        () => removeItem(item.id),
        'Item removed from cart',
        'Unable to remove this item right now.',
      )
    }
  }

  const handleClearCart = async () => {
    if (actionLoading || items.length === 0) {
      return
    }

    const confirmation = await Swal.fire({
      icon: 'warning',
      title: 'Clear your cart?',
      text: 'Every item currently in your cart will be removed.',
      showCancelButton: true,
      confirmButtonText: 'Clear cart',
      cancelButtonText: 'Cancel',
      buttonsStyling: false,
      customClass: {
        popup: 'storefront-alert',
        confirmButton: 'swal-danger-button',
        cancelButton: 'swal-soft-button',
      },
    })

    if (confirmation.isConfirmed) {
      await runAction(
        'clear',
        clearCart,
        'Your cart is now empty',
        'Unable to clear your cart right now.',
      )
    }
  }

  if (loading && !cart) {
    return <CartPageSkeleton />
  }

  if (!cart && error) {
    return (
      <main className="cart-page">
        <section className="cart-page-hero">
          <div className="container">
            <span className="section-kicker">Your shopping bag</span>
            <h1>Your cart</h1>
          </div>
        </section>
        <section className="cart-page-content">
          <div className="container">
            <div className="cart-load-error" role="alert">
              <span aria-hidden="true">
                <i className="bi bi-cloud-slash" />
              </span>
              <h2>We could not load your cart</h2>
              <p>{error}</p>
              <button className="btn btn-brand" type="button" onClick={handleRetry}>
                <i className="bi bi-arrow-clockwise" aria-hidden="true" />
                Try again
              </button>
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="cart-page">
      <section className="cart-page-hero">
        <div className="container">
          <div className="cart-page-heading">
            <div>
              <span className="section-kicker">Your shopping bag</span>
              <h1>Your cart</h1>
              <p>Review quantities and totals before the next checkout step.</p>
            </div>
            <Link className="btn btn-soft" to="/products">
              <i className="bi bi-arrow-left" aria-hidden="true" />
              Continue shopping
            </Link>
          </div>
        </div>
      </section>

      <section className="cart-page-content">
        <div className="container">
          {items.length === 0 ? (
            <div className="cart-empty-state">
              <span aria-hidden="true">
                <i className="bi bi-bag" />
              </span>
              <small>Your cart is ready</small>
              <h2>Nothing here yet</h2>
              <p>Explore the catalog and add something you love.</p>
              <Link className="btn btn-brand" to="/products">
                <i className="bi bi-grid" aria-hidden="true" />
                Browse products
              </Link>
            </div>
          ) : (
            <div className="cart-layout">
              <section className="cart-items-section" aria-labelledby="cart-items-title">
                <div className="cart-section-heading">
                  <div>
                    <span className="section-kicker">Selected products</span>
                    <h2 id="cart-items-title">
                      {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                    </h2>
                  </div>
                  <button
                    className="cart-clear-button"
                    type="button"
                    onClick={handleClearCart}
                    disabled={actionLoading}
                  >
                    {pendingAction === 'clear' ? (
                      <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                    ) : (
                      <i className="bi bi-trash3" aria-hidden="true" />
                    )}
                    Clear cart
                  </button>
                </div>

                <div className="cart-items-list">
                  {items.map((item) => (
                    <CartItemRow
                      item={item}
                      isBusy={actionLoading}
                      pendingAction={pendingAction}
                      onDecrease={(currentItem) =>
                        handleQuantityChange(currentItem, currentItem.quantity - 1)
                      }
                      onIncrease={(currentItem) =>
                        handleQuantityChange(currentItem, currentItem.quantity + 1)
                      }
                      onRemove={handleRemove}
                      key={item.id}
                    />
                  ))}
                </div>
              </section>

              <aside className="cart-summary-card" aria-labelledby="cart-summary-title">
                <div className="cart-summary-card__heading">
                  <span aria-hidden="true">
                    <i className="bi bi-receipt" />
                  </span>
                  <div>
                    <small>Order overview</small>
                    <h2 id="cart-summary-title">Cart summary</h2>
                  </div>
                </div>

                <dl className="cart-summary-lines">
                  <div>
                    <dt>Items</dt>
                    <dd>{itemsCount}</dd>
                  </div>
                  <div>
                    <dt>Subtotal</dt>
                    <dd>{formatAmount(subtotal)}</dd>
                  </div>
                  <div className="cart-summary-total">
                    <dt>Total</dt>
                    <dd>{formatAmount(total)}</dd>
                  </div>
                </dl>

                <button className="btn btn-brand cart-checkout-button" type="button" disabled>
                  <i className="bi bi-lock" aria-hidden="true" />
                  Proceed to Checkout
                </button>
                <p className="cart-checkout-note">
                  <i className="bi bi-info-circle" aria-hidden="true" />
                  Checkout will be available in the next scope.
                </p>
              </aside>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

export default CartPage
