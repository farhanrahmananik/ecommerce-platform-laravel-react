import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Swal from 'sweetalert2'
import AdminSelect from '../../../components/admin/common/AdminSelect.jsx'
import {
  deleteCoupon,
  getCoupons,
} from '../../../services/adminCouponService.js'
import { getApiErrorMessage } from '../../../utils/apiErrors.js'

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

const typeOptions = [
  { value: '', label: 'All types' },
  { value: 'fixed', label: 'Fixed amount' },
  { value: 'percentage', label: 'Percentage' },
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
  if (!value) {
    return 'Open ended'
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? '-'
    : new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(date)
}

function discountLabel(coupon) {
  return coupon.type === 'percentage'
    ? `${formatAmount(coupon.value)}%`
    : formatAmount(coupon.value)
}

function AdminCouponListPage() {
  const [coupons, setCoupons] = useState([])
  const [meta, setMeta] = useState(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const [page, setPage] = useState(1)
  const [requestVersion, setRequestVersion] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    getCoupons({
      page,
      per_page: 15,
      search: search || undefined,
      status: status || undefined,
      type: type || undefined,
    })
      .then((response) => {
        if (isMounted) {
          setCoupons(response.data || [])
          setMeta(response.meta || null)
          setError('')
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(
            getApiErrorMessage(requestError, 'Coupons could not be loaded.'),
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
  }, [page, requestVersion, search, status, type])

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

  const updateFilter = (setter) => (value) => {
    setter(String(value))
    setPage(1)
    setIsLoading(true)
  }

  const clearFilters = () => {
    setSearchInput('')
    setSearch('')
    setStatus('')
    setType('')
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

  const handleDelete = async (coupon) => {
    const confirmation = await Swal.fire({
      icon: 'warning',
      title: 'Delete this coupon?',
      text: `${coupon.code} will no longer be available for customer checkout.`,
      showCancelButton: true,
      confirmButtonText: 'Delete Coupon',
      cancelButtonText: 'Keep Coupon',
      reverseButtons: true,
      buttonsStyling: false,
      customClass: {
        popup: 'storefront-alert',
        confirmButton: 'swal-danger-button',
        cancelButton: 'swal-cancel-button',
        actions: 'swal-category-actions',
      },
    })

    if (!confirmation.isConfirmed) {
      return
    }

    setDeletingId(coupon.id)
    setError('')

    try {
      await deleteCoupon(coupon.id)

      await Swal.fire({
        icon: 'success',
        title: 'Coupon deleted',
        text: `${coupon.code} was removed successfully.`,
        timer: 1400,
        showConfirmButton: false,
        customClass: { popup: 'storefront-alert' },
      })

      if (coupons.length === 1 && page > 1) {
        setPage((current) => current - 1)
        setIsLoading(true)
      } else {
        refresh()
      }
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, 'The coupon could not be deleted.'),
      )
    } finally {
      setDeletingId(null)
    }
  }

  const hasFilters = Boolean(search || status || type)
  const visiblePages = getVisiblePages(
    meta?.current_page || 1,
    meta?.last_page || 1,
  )

  return (
    <main className="admin-coupon-page admin-list-page app-page-shell">
      <header className="category-list-heading admin-list-header app-page-header admin-commerce-header admin-coupons-header">
        <div className="admin-list-title-group">
          <span className="admin-eyebrow app-page-eyebrow">Promotions</span>
          <h1 className="app-page-title">Coupons</h1>
          <p className="app-page-subtitle">Build controlled discounts with clear eligibility and usage limits.</p>
        </div>
        <Link className="btn btn-admin-primary category-add-button admin-list-actions" to="create">
          <i className="bi bi-plus-lg" aria-hidden="true" />
          Add Coupon
        </Link>
      </header>

      <section className="category-list-card coupon-list-card admin-table-card">
        <div className="coupon-list-toolbar admin-table-toolbar admin-filter-card">
          <form className="category-search-form coupon-search-form admin-filter-control" onSubmit={handleSearch}>
            <i className="bi bi-search" aria-hidden="true" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search coupon code or name..."
              aria-label="Search coupons"
            />
            <button type="submit">Search</button>
          </form>

          <div className="coupon-filter-row admin-filter-grid">
            <div className="admin-select-filter">
              <AdminSelect
                id="coupon-status-filter"
                name="status"
                label="Status"
                value={status}
                options={statusOptions}
                onChange={updateFilter(setStatus)}
              />
            </div>
            <div className="admin-select-filter">
              <AdminSelect
                id="coupon-type-filter"
                name="type"
                label="Type"
                value={type}
                options={typeOptions}
                onChange={updateFilter(setType)}
              />
            </div>
            {hasFilters && (
              <button
                className="category-clear-button"
                type="button"
                onClick={clearFilters}
              >
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
            <span className="visually-hidden">Loading coupons</span>
          </div>
        ) : coupons.length === 0 ? (
          <div className="category-empty-state coupon-empty-state admin-empty-state">
            <span className="category-empty-icon" aria-hidden="true">
              <i className="bi bi-ticket-perforated" />
            </span>
            <h2>{hasFilters ? 'No matching coupons' : 'No coupons yet'}</h2>
            <p>
              {hasFilters
                ? 'Try adjusting your search or clearing the current filters.'
                : 'Create your first promotion to reward customers at checkout.'}
            </p>
            {hasFilters ? (
              <button className="btn btn-admin-soft" type="button" onClick={clearFilters}>
                Clear filters
              </button>
            ) : (
              <Link className="btn btn-admin-primary" to="create">
                <i className="bi bi-plus-lg" aria-hidden="true" />
                Add Coupon
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="table-responsive category-table-wrap admin-table-wrap">
              <table className="table category-table coupon-table admin-table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Coupon</th>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Minimum order</th>
                    <th>Usage</th>
                    <th>Validity</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => (
                    <tr key={coupon.id}>
                      <td data-label="Coupon">
                        <div className="coupon-name-cell">
                          <code className="admin-coupon-code">{coupon.code}</code>
                          <div>
                            <strong>{coupon.name}</strong>
                            <small>#{coupon.id}</small>
                          </div>
                        </div>
                      </td>
                      <td data-label="Type">
                        <span className={`coupon-type-badge is-${coupon.type}`}>
                          <i
                            className={`bi ${coupon.type === 'percentage' ? 'bi-percent' : 'bi-cash-coin'}`}
                            aria-hidden="true"
                          />
                          {coupon.type === 'percentage' ? 'Percentage' : 'Fixed'}
                        </span>
                      </td>
                      <td data-label="Value">
                        <strong className="coupon-value admin-coupon-value">{discountLabel(coupon)}</strong>
                      </td>
                      <td data-label="Minimum order">
                        <span className="coupon-muted-value">
                          {formatAmount(coupon.min_order_amount)}
                        </span>
                      </td>
                      <td data-label="Usage">
                        <div className="coupon-usage">
                          <strong>{coupon.used_count}</strong>
                          <span>/ {coupon.usage_limit ?? 'Unlimited'}</span>
                        </div>
                      </td>
                      <td data-label="Validity">
                        <div className="coupon-validity admin-coupon-window">
                          <span>{formatDate(coupon.starts_at)}</span>
                          <i className="bi bi-arrow-right" aria-hidden="true" />
                          <span>{formatDate(coupon.expires_at)}</span>
                        </div>
                      </td>
                      <td data-label="Status">
                        <span
                          className={`category-status-badge admin-status-badge ${coupon.is_active ? 'is-active success' : 'is-inactive neutral'}`}
                        >
                          <span aria-hidden="true" />
                          {coupon.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td data-label="Actions">
                        <div className="category-row-actions admin-table-actions">
                          <Link
                            className="category-action-button"
                            to={`${coupon.id}`}
                            title={`View ${coupon.code}`}
                            aria-label={`View ${coupon.code}`}
                          >
                            <i className="bi bi-eye" aria-hidden="true" />
                          </Link>
                          <Link
                            className="category-action-button"
                            to={`${coupon.id}/edit`}
                            title={`Edit ${coupon.code}`}
                            aria-label={`Edit ${coupon.code}`}
                          >
                            <i className="bi bi-pencil" aria-hidden="true" />
                          </Link>
                          <button
                            className="category-action-button is-danger"
                            type="button"
                            onClick={() => handleDelete(coupon)}
                            disabled={deletingId === coupon.id}
                            title={`Delete ${coupon.code}`}
                            aria-label={`Delete ${coupon.code}`}
                          >
                            {deletingId === coupon.id ? (
                              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                            ) : (
                              <i className="bi bi-trash3" aria-hidden="true" />
                            )}
                          </button>
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
                  Showing <strong>{meta.from || 0}</strong> to{' '}
                  <strong>{meta.to || 0}</strong> of <strong>{meta.total || 0}</strong>
                </span>
                <nav aria-label="Coupon pagination">
                  <button
                    type="button"
                    onClick={() => changePage(page - 1)}
                    disabled={meta.current_page <= 1}
                    aria-label="Previous page"
                  >
                    <i className="bi bi-chevron-left" aria-hidden="true" />
                  </button>
                  {visiblePages.map((pageNumber) => (
                    <button
                      className={pageNumber === meta.current_page ? 'active' : ''}
                      type="button"
                      onClick={() => changePage(pageNumber)}
                      key={pageNumber}
                      aria-label={`Page ${pageNumber}`}
                      aria-current={pageNumber === meta.current_page ? 'page' : undefined}
                    >
                      {pageNumber}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => changePage(page + 1)}
                    disabled={meta.current_page >= meta.last_page}
                    aria-label="Next page"
                  >
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

export default AdminCouponListPage
