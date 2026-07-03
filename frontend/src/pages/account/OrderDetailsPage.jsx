import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import OrderStatusBadge from '../../components/account/OrderStatusBadge.jsx'
import { getOrder } from '../../services/orderService.js'
import { getApiErrorMessage } from '../../utils/apiErrors.js'

function formatAmount(value) {
  const amount = Number(value)

  return Number.isFinite(amount)
    ? new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)
    : '-'
}

function formatDate(value) {
  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : new Intl.DateTimeFormat('en-US', {
        dateStyle: 'long',
        timeStyle: 'short',
      }).format(date)
}

function labelize(value) {
  return String(value || 'Not specified')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function formatDiscount(value) {
  const amount = Number(value)

  return Number.isFinite(amount) && amount > 0
    ? `-${formatAmount(amount)}`
    : formatAmount(amount)
}

function AddressCard({ address, icon, title }) {
  if (!address) {
    return null
  }

  return (
    <article className="order-address-card app-card customer-order-address">
      <span aria-hidden="true">
        <i className={`bi ${icon}`} />
      </span>
      <div>
        <h3>{title}</h3>
        <address>
          <strong>{address.line1}</strong>
          {address.line2 && <span>{address.line2}</span>}
          <span>
            {[address.city, address.state, address.postal_code]
              .filter(Boolean)
              .join(', ')}
          </span>
          <span>{address.country}</span>
        </address>
      </div>
    </article>
  )
}

function OrderDetailItem({ item }) {
  const [imageFailed, setImageFailed] = useState(false)
  const showImage = item.product_image_url && !imageFailed

  return (
    <article className="order-detail-item customer-order-item">
      <div className="order-detail-item__image">
        {showImage ? (
          <img
            src={item.product_image_url}
            alt={item.product_name || 'Product'}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <i className="bi bi-image" aria-hidden="true" />
        )}
      </div>
      <div className="order-detail-item__name">
        {item.product_slug ? (
          <Link to={`/products/${item.product_slug}`}>
            {item.product_name || 'Product'}
          </Link>
        ) : (
          <h3>{item.product_name || 'Product'}</h3>
        )}
        {item.product_sku && <small>SKU: {item.product_sku}</small>}
      </div>
      <div>
        <small>Unit price</small>
        <strong>{formatAmount(item.unit_price)}</strong>
      </div>
      <div>
        <small>Quantity</small>
        <strong>{item.quantity}</strong>
      </div>
      <div className="order-detail-item__total">
        <small>Line total</small>
        <strong>{formatAmount(item.total ?? item.line_total)}</strong>
      </div>
    </article>
  )
}

function OrderDetailsSkeleton() {
  return (
    <main className="orders-page customer-orders-shell" aria-busy="true">
      <section className="orders-page-hero customer-flow-hero">
        <div className="container">
          <div className="order-details-heading-skeleton" />
        </div>
      </section>
      <section className="orders-page-content">
        <div className="container order-details-skeleton">
          <div />
          <div />
          <span className="visually-hidden">Loading order details</span>
        </div>
      </section>
    </main>
  )
}

function OrderDetailsPage() {
  const { id } = useParams()
  const [requestVersion, setRequestVersion] = useState(0)
  const requestKey = `${id}:${requestVersion}`
  const [result, setResult] = useState({
    requestKey: '',
    order: null,
    error: '',
    isNotFound: false,
  })
  const isLoading = result.requestKey !== requestKey

  useEffect(() => {
    let isMounted = true

    window.scrollTo({ top: 0, behavior: 'smooth' })
    getOrder(id)
      .then((response) => {
        if (isMounted) {
          setResult({
            requestKey,
            order: response.data ?? response,
            error: '',
            isNotFound: false,
          })
        }
      })
      .catch((error) => {
        if (isMounted) {
          const notFound = error.response?.status === 404

          setResult({
            requestKey,
            order: null,
            error: notFound
              ? 'This order could not be found in your account.'
              : getApiErrorMessage(
                  error,
                  'We could not load this order right now.',
                ),
            isNotFound: notFound,
          })
        }
      })

    return () => {
      isMounted = false
    }
  }, [id, requestKey])

  if (isLoading) {
    return <OrderDetailsSkeleton />
  }

  if (!result.order) {
    return (
      <main className="orders-page customer-orders-shell">
        <section className="orders-page-hero customer-flow-hero">
          <div className="container">
            <span className="section-kicker">Order details</span>
            <h1>{result.isNotFound ? 'Order not found' : 'Order unavailable'}</h1>
          </div>
        </section>
        <section className="orders-page-content">
          <div className="container">
            <div className="orders-state-card app-empty-state" role="alert">
              <span aria-hidden="true">
                <i className={`bi ${result.isNotFound ? 'bi-receipt' : 'bi-cloud-slash'}`} />
              </span>
              <h2>We could not show this order</h2>
              <p>{result.error}</p>
              <div className="orders-state-actions">
                <Link className="btn btn-soft" to="/account/orders">
                  Back to Orders
                </Link>
                {!result.isNotFound && (
                  <button
                    className="btn btn-brand"
                    type="button"
                    onClick={() => setRequestVersion((current) => current + 1)}
                  >
                    Try again
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    )
  }

  const order = result.order

  return (
    <main className="orders-page customer-orders-shell">
      <section className="orders-page-hero order-details-hero customer-flow-hero">
        <div className="container">
          <div className="order-details-heading">
            <div>
              <Link to="/account/orders">
                <i className="bi bi-arrow-left" aria-hidden="true" />
                Back to Orders
              </Link>
              <span className="section-kicker">Order details</span>
              <h1>{order.order_number}</h1>
              <p>Placed {formatDate(order.created_at)}</p>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>
        </div>
      </section>

      <section className="orders-page-content">
        <div className="container order-details-layout">
          <div className="order-details-main">
            <section className="order-detail-card app-section-card customer-order-items">
              <div className="order-detail-card__heading">
                <div>
                  <span className="section-kicker">Purchased products</span>
                  <h2>Order items</h2>
                </div>
                <span>{order.items?.length || 0}</span>
              </div>
              <div className="order-detail-items">
                {(order.items || []).map((item) => (
                  <OrderDetailItem item={item} key={item.id} />
                ))}
              </div>
            </section>

            <section className="order-address-grid">
              <AddressCard
                address={order.shipping_address}
                icon="bi-truck"
                title="Shipping address"
              />
              <AddressCard
                address={order.billing_address}
                icon="bi-receipt"
                title="Billing address"
              />
            </section>

            {order.notes && (
              <section className="order-notes-card app-card">
                <span aria-hidden="true">
                  <i className="bi bi-chat-left-text" />
                </span>
                <div>
                  <h2>Order notes</h2>
                  <p>{order.notes}</p>
                </div>
              </section>
            )}
          </div>

          <aside className="order-detail-summary app-section-card customer-order-summary">
            <div className="order-detail-summary__heading">
              <span aria-hidden="true">
                <i className="bi bi-credit-card" />
              </span>
              <div>
                <small>Payment</small>
                <h2>{labelize(order.payment_method)}</h2>
              </div>
            </div>
            {order.payment_status && (
              <div className="order-payment-row">
                <span>Payment status</span>
                <b>{labelize(order.payment_status)}</b>
              </div>
            )}
            <dl className="order-total-lines">
              <div>
                <dt>Subtotal</dt>
                <dd>{formatAmount(order.subtotal)}</dd>
              </div>
              <div>
                <dt>Shipping</dt>
                <dd>{formatAmount(order.shipping_amount)}</dd>
              </div>
              <div>
                <dt>Discount</dt>
                <dd>{formatDiscount(order.discount_amount)}</dd>
              </div>
              <div>
                <dt>Tax</dt>
                <dd>{formatAmount(order.tax_amount)}</dd>
              </div>
              <div className="order-grand-total">
                <dt>Total</dt>
                <dd>{formatAmount(order.total)}</dd>
              </div>
            </dl>
            <Link className="btn btn-brand" to="/products">
              <i className="bi bi-bag" aria-hidden="true" />
              Continue Shopping
            </Link>
          </aside>
        </div>
      </section>
    </main>
  )
}

export default OrderDetailsPage
