import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminSelect from '../../../components/admin/common/AdminSelect.jsx'
import AdminOrderStatusBadge from '../../../components/admin/orders/AdminOrderStatusBadge.jsx'
import { getAdminOrders } from '../../../services/adminOrderService.js'
import { getApiErrorMessage } from '../../../utils/apiErrors.js'

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

function getVisiblePages(currentPage, lastPage) {
  const firstPage = Math.max(1, currentPage - 1)
  const finalPage = Math.min(lastPage, firstPage + 2)
  const adjustedFirstPage = Math.max(1, finalPage - 2)

  return Array.from(
    { length: finalPage - adjustedFirstPage + 1 },
    (_, index) => adjustedFirstPage + index,
  )
}

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
    ? '-'
    : new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(date)
}

function labelize(value) {
  return String(value || 'Not specified')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [meta, setMeta] = useState(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [requestVersion, setRequestVersion] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    getAdminOrders({
      page,
      per_page: 15,
      search: search || undefined,
      status: status || undefined,
    })
      .then((response) => {
        if (isMounted) {
          setOrders(response.data || [])
          setMeta(response.meta || null)
          setError('')
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(getApiErrorMessage(requestError, 'Orders could not be loaded.'))
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
  }, [page, requestVersion, search, status])

  const refresh = () => {
    setError('')
    setIsLoading(true)
    setRequestVersion((current) => current + 1)
  }

  const handleSearch = (event) => {
    event.preventDefault()
    const nextSearch = searchInput.trim()

    if (nextSearch === search && page === 1) {
      refresh()
      return
    }

    setPage(1)
    setIsLoading(true)
    setSearch(nextSearch)
  }

  const handleStatusChange = (nextStatus) => {
    setStatus(String(nextStatus))
    setPage(1)
    setIsLoading(true)
  }

  const clearFilters = () => {
    setSearchInput('')
    setSearch('')
    setStatus('')
    setPage(1)
    setIsLoading(true)
  }

  const changePage = (nextPage) => {
    if (nextPage === page) {
      return
    }

    setPage(nextPage)
    setIsLoading(true)
  }

  const hasFilters = Boolean(search || status)
  const visiblePages = getVisiblePages(
    meta?.current_page || 1,
    meta?.last_page || 1,
  )
  const summary = {
    total: orders.length,
    pending: orders.filter((order) => order.status === 'pending').length,
    processing: orders.filter((order) => order.status === 'processing').length,
    delivered: orders.filter((order) => order.status === 'delivered').length,
  }

  return (
    <main className="admin-orders-page admin-list-page">
      <header className="category-list-heading admin-list-header">
        <div className="admin-list-title-group">
          <span className="admin-eyebrow">Fulfillment management</span>
          <h1>Orders</h1>
          <p>Track customer purchases and fulfillment progress.</p>
        </div>
        <button
          className="admin-refresh-button"
          type="button"
          onClick={refresh}
          disabled={isLoading}
          aria-label="Refresh orders"
        >
          <i className={`bi bi-arrow-clockwise ${isLoading ? 'spin' : ''}`} />
        </button>
      </header>

      <section className="admin-order-stats" aria-label="Loaded order summary">
        {[
          ['Loaded orders', summary.total, 'bi-receipt', 'blue'],
          ['Pending', summary.pending, 'bi-clock', 'amber'],
          ['Processing', summary.processing, 'bi-arrow-repeat', 'violet'],
          ['Delivered', summary.delivered, 'bi-check-circle', 'green'],
        ].map(([label, value, icon, tone]) => (
          <article className="admin-order-stat" key={label}>
            <span className={`tone-${tone}`} aria-hidden="true">
              <i className={`bi ${icon}`} />
            </span>
            <div>
              <small>{label}</small>
              <strong>{value}</strong>
            </div>
          </article>
        ))}
      </section>

      <section className="category-list-card admin-orders-card admin-table-card">
        <div className="admin-orders-toolbar admin-table-toolbar admin-filter-card">
          <form className="category-search-form admin-order-search admin-filter-control" onSubmit={handleSearch}>
            <i className="bi bi-search" aria-hidden="true" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search order, customer, or email..."
              aria-label="Search orders"
            />
            <button type="submit">Search</button>
          </form>

          <div className="admin-order-filter-row admin-filter-grid">
            <div className="admin-select-filter admin-order-status-filter">
              <AdminSelect
                id="admin-order-status-filter"
                name="status"
                label="Status"
                value={status}
                options={statusOptions}
                onChange={handleStatusChange}
                placeholder="All statuses"
              />
            </div>
            {hasFilters && (
              <button className="category-clear-button" type="button" onClick={clearFilters}>
                <i className="bi bi-x-circle" aria-hidden="true" />
                Clear
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="alert category-alert category-alert-danger" role="alert">
            <i className="bi bi-exclamation-octagon" aria-hidden="true" />
            <span>{error}</span>
            <button type="button" onClick={refresh}>Try again</button>
          </div>
        )}

        {isLoading ? (
          <div className="category-table-loading" role="status">
            {[0, 1, 2, 3].map((item) => <span key={item} />)}
            <span className="visually-hidden">Loading orders</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="category-empty-state admin-empty-state">
            <span className="category-empty-icon" aria-hidden="true">
              <i className="bi bi-receipt" />
            </span>
            <h2>{hasFilters ? 'No matching orders' : 'No orders yet'}</h2>
            <p>
              {hasFilters
                ? 'Try a different search or clear the current filters.'
                : 'Customer purchases will appear here after checkout.'}
            </p>
            {hasFilters && (
              <button className="btn btn-admin-soft" type="button" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="table-responsive category-table-wrap admin-table-wrap">
              <table className="table category-table admin-orders-table admin-table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Total</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td data-label="Order">
                        <div className="admin-order-number-cell">
                          <span aria-hidden="true"><i className="bi bi-receipt-cutoff" /></span>
                          <div><strong>{order.order_number}</strong><small>#{order.id}</small></div>
                        </div>
                      </td>
                      <td data-label="Customer">
                        <div className="admin-order-customer">
                          <strong>{order.customer?.name || order.customer_name}</strong>
                          <small>{order.customer?.email || order.customer_email}</small>
                        </div>
                      </td>
                      <td data-label="Date"><span>{formatDate(order.created_at)}</span></td>
                      <td data-label="Status"><AdminOrderStatusBadge status={order.status} /></td>
                      <td data-label="Payment"><span>{labelize(order.payment_method)}</span></td>
                      <td data-label="Total"><strong>{formatAmount(order.total)}</strong></td>
                      <td data-label="Action">
                        <div className="category-row-actions admin-table-actions">
                          <Link
                            className="admin-order-view-button"
                            to={`${order.id}`}
                            aria-label={`View ${order.order_number}`}
                          >
                            View <i className="bi bi-arrow-right" aria-hidden="true" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {meta && (
              <footer className="category-pagination admin-pagination-wrap">
                <span>
                  Showing <strong>{meta.from || 0}</strong> to <strong>{meta.to || 0}</strong>{' '}
                  of <strong>{meta.total || 0}</strong>
                </span>
                <nav aria-label="Order pagination">
                  <button type="button" onClick={() => changePage(page - 1)} disabled={meta.current_page <= 1}>
                    <i className="bi bi-chevron-left" aria-hidden="true" />
                  </button>
                  {visiblePages.map((pageNumber) => (
                    <button
                      className={pageNumber === meta.current_page ? 'active' : ''}
                      type="button"
                      onClick={() => changePage(pageNumber)}
                      key={pageNumber}
                      aria-current={pageNumber === meta.current_page ? 'page' : undefined}
                    >
                      {pageNumber}
                    </button>
                  ))}
                  <button type="button" onClick={() => changePage(page + 1)} disabled={meta.current_page >= meta.last_page}>
                    <i className="bi bi-chevron-right" aria-hidden="true" />
                  </button>
                </nav>
              </footer>
            )}
          </>
        )}
      </section>
    </main>
  )
}

export default AdminOrdersPage
