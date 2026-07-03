import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import OrderStatusBadge from '../../components/account/OrderStatusBadge.jsx'
import StorefrontSelect from '../../components/storefront/StorefrontSelect.jsx'
import { getOrders } from '../../services/orderService.js'
import { getApiErrorMessage } from '../../utils/apiErrors.js'

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

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
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date)
}

function paymentLabel(value) {
  return String(value || 'Not specified')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function itemCount(order) {
  if (!Array.isArray(order.items)) {
    return 0
  }

  return order.items.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0,
  )
}

function OrdersSkeleton() {
  return (
    <div className="orders-list-skeleton" aria-busy="true">
      {[1, 2, 3].map((item) => (
        <div className="order-card-skeleton" key={item}>
          <span />
          <span />
          <span />
        </div>
      ))}
      <span className="visually-hidden">Loading your orders</span>
    </div>
  )
}

function OrdersPage() {
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [requestVersion, setRequestVersion] = useState(0)
  const requestKey = `${status}:${page}:${requestVersion}`
  const [result, setResult] = useState({
    requestKey: '',
    orders: [],
    meta: null,
    error: '',
  })
  const isLoading = result.requestKey !== requestKey

  useEffect(() => {
    let isMounted = true
    const params = { page, per_page: 8 }

    if (status) {
      params.status = status
    }

    getOrders(params)
      .then((response) => {
        if (isMounted) {
          setResult({
            requestKey,
            orders: Array.isArray(response.data) ? response.data : [],
            meta: response.meta || null,
            error: '',
          })
        }
      })
      .catch((error) => {
        if (isMounted) {
          setResult({
            requestKey,
            orders: [],
            meta: null,
            error: getApiErrorMessage(
              error,
              'We could not load your orders right now.',
            ),
          })
        }
      })

    return () => {
      isMounted = false
    }
  }, [page, requestKey, status])

  const handleStatusChange = (nextStatus) => {
    setStatus(String(nextStatus))
    setPage(1)
  }

  const retry = () => setRequestVersion((current) => current + 1)
  const hasPreviousPage = (result.meta?.current_page || page) > 1
  const hasNextPage =
    (result.meta?.current_page || page) < (result.meta?.last_page || 1)

  return (
    <main className="orders-page customer-orders-shell">
      <section className="orders-page-hero customer-flow-hero">
        <div className="container orders-page-heading">
          <div>
            <span className="section-kicker">Purchase history</span>
            <h1>My Orders</h1>
            <p>Track every order and revisit the details of your purchases.</p>
          </div>
          <Link className="btn btn-soft" to="/account">
            <i className="bi bi-arrow-left" aria-hidden="true" />
            Account dashboard
          </Link>
        </div>
      </section>

      <section className="orders-page-content">
        <div className="container">
          <div className="orders-toolbar app-section-card customer-orders-toolbar">
            <div>
              <span className="section-kicker">Order history</span>
              <h2>{result.meta?.total ?? result.orders.length} orders</h2>
            </div>
            <StorefrontSelect
              id="customer-order-status"
              label="Order status"
              value={status}
              options={statusOptions}
              onChange={handleStatusChange}
            />
          </div>

          {isLoading ? (
            <OrdersSkeleton />
          ) : result.error ? (
            <div className="orders-state-card app-empty-state" role="alert">
              <span aria-hidden="true">
                <i className="bi bi-cloud-slash" />
              </span>
              <h2>Orders are unavailable</h2>
              <p>{result.error}</p>
              <button className="btn btn-brand" type="button" onClick={retry}>
                <i className="bi bi-arrow-clockwise" aria-hidden="true" />
                Try again
              </button>
            </div>
          ) : result.orders.length === 0 ? (
            <div className="orders-state-card app-empty-state">
              <span aria-hidden="true">
                <i className="bi bi-receipt" />
              </span>
              <small>{status ? 'No matching orders' : 'Your history starts here'}</small>
              <h2>{status ? 'Nothing matches this status' : 'No orders yet'}</h2>
              <p>
                {status
                  ? 'Choose another status or view all of your orders.'
                  : 'Explore the storefront and place your first order when ready.'}
              </p>
              {status ? (
                <button
                  className="btn btn-soft"
                  type="button"
                  onClick={() => handleStatusChange('')}
                >
                  View all orders
                </button>
              ) : (
                <Link className="btn btn-brand" to="/products">
                  <i className="bi bi-grid" aria-hidden="true" />
                  Browse products
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="orders-list">
                {result.orders.map((order) => {
                  const count = itemCount(order)

                  return (
                    <article className="order-history-card app-card-hover customer-order-card" key={order.id}>
                      <div className="order-history-card__main">
                        <div className="order-history-number">
                          <span aria-hidden="true">
                            <i className="bi bi-receipt-cutoff" />
                          </span>
                          <div>
                            <small>Order number</small>
                            <h2>{order.order_number}</h2>
                            <time dateTime={order.created_at}>
                              {formatDate(order.created_at)}
                            </time>
                          </div>
                        </div>
                        <OrderStatusBadge status={order.status} />
                      </div>

                      <dl className="order-history-facts customer-order-meta">
                        <div>
                          <dt>Payment</dt>
                          <dd>{paymentLabel(order.payment_method)}</dd>
                        </div>
                        <div>
                          <dt>Items</dt>
                          <dd>{count || order.items?.length || 0}</dd>
                        </div>
                        <div>
                          <dt>Total</dt>
                          <dd>{formatAmount(order.total)}</dd>
                        </div>
                      </dl>

                      <Link
                        className="btn btn-soft order-details-link"
                        to={`/account/orders/${order.id}`}
                      >
                        View Details
                        <i className="bi bi-arrow-right" aria-hidden="true" />
                      </Link>
                    </article>
                  )
                })}
              </div>

              {result.meta && result.meta.last_page > 1 && (
                <nav className="orders-pagination" aria-label="Order history pages">
                  <button
                    className="btn btn-soft"
                    type="button"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={!hasPreviousPage}
                  >
                    <i className="bi bi-arrow-left" aria-hidden="true" />
                    Previous
                  </button>
                  <span>
                    Page {result.meta.current_page} of {result.meta.last_page}
                  </span>
                  <button
                    className="btn btn-soft"
                    type="button"
                    onClick={() => setPage((current) => current + 1)}
                    disabled={!hasNextPage}
                  >
                    Next
                    <i className="bi bi-arrow-right" aria-hidden="true" />
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  )
}

export default OrdersPage
