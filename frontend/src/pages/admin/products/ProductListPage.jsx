import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Swal from 'sweetalert2'
import AdminSelect from '../../../components/admin/common/AdminSelect.jsx'
import { getCategoryOptions } from '../../../services/admin/categoryService.js'
import {
  deleteProduct,
  getProducts,
} from '../../../services/admin/productService.js'
import { getApiErrorMessage } from '../../../utils/apiErrors.js'

const statusFilterOptions = [
  { value: '', label: 'All' },
  { value: '1', label: 'Active' },
  { value: '0', label: 'Inactive' },
]

const featuredFilterOptions = [
  { value: '', label: 'All' },
  { value: '1', label: 'Featured' },
  { value: '0', label: 'Regular' },
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

function formatDate(value) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function formatAmount(value) {
  if (value === null || value === '') {
    return '-'
  }

  const amount = Number(value)

  if (!Number.isFinite(amount)) {
    return '-'
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function ProductListPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [meta, setMeta] = useState(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [status, setStatus] = useState('')
  const [featured, setFeatured] = useState('')
  const [page, setPage] = useState(1)
  const [requestVersion, setRequestVersion] = useState(0)
  const [categoryRequestVersion, setCategoryRequestVersion] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')
  const [categoryError, setCategoryError] = useState('')

  useEffect(() => {
    let isMounted = true

    getCategoryOptions()
      .then((options) => {
        if (isMounted) {
          setCategories(options)
          setCategoryError('')
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setCategoryError(
            getApiErrorMessage(
              requestError,
              'Category filters could not be loaded.',
            ),
          )
        }
      })

    return () => {
      isMounted = false
    }
  }, [categoryRequestVersion])

  useEffect(() => {
    let isMounted = true

    getProducts({
      page,
      per_page: 15,
      search: search || undefined,
      category_id: categoryId || undefined,
      is_active: status === '' ? undefined : status,
      is_featured: featured === '' ? undefined : featured,
    })
      .then((response) => {
        if (isMounted) {
          setProducts(response.data || [])
          setMeta(response.meta || null)
          setError('')
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(
            getApiErrorMessage(requestError, 'Products could not be loaded.'),
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
  }, [categoryId, featured, page, requestVersion, search, status])

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
    setter(value)
    setPage(1)
    setIsLoading(true)
  }

  const clearFilters = () => {
    setSearchInput('')
    setSearch('')
    setCategoryId('')
    setStatus('')
    setFeatured('')
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

  const handleDelete = async (product) => {
    const confirmation = await Swal.fire({
      icon: 'warning',
      title: 'Delete this product?',
      text: `${product.name} will be removed from active catalog management.`,
      showCancelButton: true,
      confirmButtonText: 'Delete Product',
      cancelButtonText: 'Keep Product',
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

    setDeletingId(product.id)
    setError('')

    try {
      await deleteProduct(product.id)

      await Swal.fire({
        icon: 'success',
        title: 'Product deleted',
        text: `${product.name} was deleted successfully.`,
        timer: 1400,
        showConfirmButton: false,
        customClass: { popup: 'storefront-alert' },
      })

      if (products.length === 1 && page > 1) {
        setPage((current) => current - 1)
        setIsLoading(true)
      } else {
        refresh()
      }
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, 'The product could not be deleted.'),
      )
    } finally {
      setDeletingId(null)
    }
  }

  const hasFilters = Boolean(search || categoryId || status || featured)
  const categoryFilterOptions = [
    { value: '', label: 'All categories' },
    { value: 'null', label: 'Uncategorized' },
    ...categories.map((category) => ({
      value: category.id,
      label: category.name,
    })),
  ]
  const visiblePages = getVisiblePages(
    meta?.current_page || 1,
    meta?.last_page || 1,
  )

  return (
    <main className="admin-product-page admin-list-page">
      <header className="category-list-heading admin-list-header">
        <div className="admin-list-title-group">
          <span className="admin-eyebrow">Catalog management</span>
          <h1>Products</h1>
          <p>Manage product details, pricing, availability, and merchandising.</p>
        </div>
        <Link className="btn btn-admin-primary category-add-button admin-list-actions" to="create">
          <i className="bi bi-plus-lg" aria-hidden="true" />
          Add Product
        </Link>
      </header>

      <section className="category-list-card product-list-card admin-table-card">
        <div className="product-list-toolbar admin-table-toolbar admin-filter-card">
          <form className="category-search-form product-search-form admin-filter-control" onSubmit={handleSearch}>
            <i className="bi bi-search" aria-hidden="true" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search name, SKU, or slug..."
              aria-label="Search products"
            />
            <button type="submit">Search</button>
          </form>

          <div className="product-filter-row admin-filter-grid">
            <div className="admin-select-filter admin-select-filter--category">
              <AdminSelect
                id="product-category-filter"
                name="category_id"
                label="Category"
                value={categoryId}
                options={categoryFilterOptions}
                onChange={updateFilter(setCategoryId)}
                placeholder="All categories"
              />
            </div>

            <div className="admin-select-filter">
              <AdminSelect
                id="product-status-filter"
                name="status"
                label="Status"
                value={status}
                options={statusFilterOptions}
                onChange={updateFilter(setStatus)}
                placeholder="All"
              />
            </div>

            <div className="admin-select-filter">
              <AdminSelect
                id="product-featured-filter"
                name="featured"
                label="Featured"
                value={featured}
                options={featuredFilterOptions}
                onChange={updateFilter(setFeatured)}
                placeholder="All"
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

        {categoryError && (
          <div className="alert category-alert product-filter-alert" role="alert">
            <i className="bi bi-info-circle" aria-hidden="true" />
            <span>{categoryError}</span>
            <button
              type="button"
              onClick={() => setCategoryRequestVersion((current) => current + 1)}
            >
              Retry
            </button>
          </div>
        )}

        {error && (
          <div className="alert category-alert category-alert-danger" role="alert">
            <i className="bi bi-exclamation-octagon" aria-hidden="true" />
            <span>{error}</span>
            <button type="button" onClick={refresh}>
              Try again
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="category-table-loading" role="status">
            {[0, 1, 2, 3].map((item) => (
              <span key={item} />
            ))}
            <span className="visually-hidden">Loading products</span>
          </div>
        ) : products.length === 0 ? (
          <div className="category-empty-state product-empty-state admin-empty-state">
            <span className="category-empty-icon" aria-hidden="true">
              <i className="bi bi-box-seam" />
            </span>
            <h2>{hasFilters ? 'No matching products' : 'No products yet'}</h2>
            <p>
              {hasFilters
                ? 'Try adjusting your search or clearing the current filters.'
                : 'Create your first product to begin building the catalog.'}
            </p>
            {hasFilters ? (
              <button className="btn btn-admin-soft" type="button" onClick={clearFilters}>
                Clear filters
              </button>
            ) : (
              <Link className="btn btn-admin-primary" to="create">
                <i className="bi bi-plus-lg" aria-hidden="true" />
                Add Product
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="table-responsive category-table-wrap admin-table-wrap">
              <table className="table category-table product-table admin-table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Sale Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Featured</th>
                    <th>Created</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const isLowStock =
                      Number(product.stock_quantity) <=
                      Number(product.low_stock_threshold)

                    return (
                      <tr key={product.id}>
                        <td data-label="Product">
                          <div className="category-name-cell product-name-cell">
                            <span aria-hidden="true">
                              <i className="bi bi-box-seam" />
                            </span>
                            <div>
                              <strong>{product.name}</strong>
                              <small>{product.slug}</small>
                            </div>
                          </div>
                        </td>
                        <td data-label="SKU">
                          <code className="category-slug">{product.sku}</code>
                        </td>
                        <td data-label="Category">
                          <span className="category-parent-name">
                            {product.category?.name || 'Uncategorized'}
                          </span>
                        </td>
                        <td data-label="Price">
                          <strong className="product-price">
                            {formatAmount(product.price)}
                          </strong>
                        </td>
                        <td data-label="Sale Price">
                          <span
                            className={
                              product.sale_price !== null && product.sale_price !== ''
                                ? 'product-sale-price'
                                : 'product-muted-value'
                            }
                          >
                            {formatAmount(product.sale_price)}
                          </span>
                        </td>
                        <td data-label="Stock">
                          <span className={`product-stock-badge admin-status-badge ${isLowStock ? 'is-low warning' : 'success'}`}>
                            <i
                              className={`bi ${isLowStock ? 'bi-exclamation-triangle' : 'bi-box2-check'}`}
                              aria-hidden="true"
                            />
                            {product.stock_quantity}
                          </span>
                        </td>
                        <td data-label="Status">
                          <span
                            className={`category-status-badge admin-status-badge ${product.is_active ? 'is-active success' : 'is-inactive neutral'}`}
                          >
                            <span aria-hidden="true" />
                            {product.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td data-label="Featured">
                          <span
                            className={`product-featured-badge admin-status-badge ${product.is_featured ? 'is-featured info' : 'neutral'}`}
                            aria-label={product.is_featured ? 'Featured' : 'Regular'}
                          >
                            <i
                              className={`bi ${product.is_featured ? 'bi-star-fill' : 'bi-star'}`}
                              aria-hidden="true"
                            />
                            {product.is_featured ? 'Featured' : 'Regular'}
                          </span>
                        </td>
                        <td data-label="Created">
                          <span className="category-created-date">
                            {formatDate(product.created_at)}
                          </span>
                        </td>
                        <td data-label="Actions">
                          <div className="category-row-actions admin-table-actions">
                            <Link
                              className="category-action-button"
                              to={`${product.id}/edit`}
                              title={`Edit ${product.name}`}
                              aria-label={`Edit ${product.name}`}
                            >
                              <i className="bi bi-pencil" aria-hidden="true" />
                            </Link>
                            <button
                              className="category-action-button is-danger"
                              type="button"
                              onClick={() => handleDelete(product)}
                              disabled={deletingId === product.id}
                              title={`Delete ${product.name}`}
                              aria-label={`Delete ${product.name}`}
                            >
                              {deletingId === product.id ? (
                                <span
                                  className="spinner-border spinner-border-sm"
                                  aria-hidden="true"
                                />
                              ) : (
                                <i className="bi bi-trash3" aria-hidden="true" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {meta && (
              <footer className="category-pagination admin-pagination-wrap">
                <span>
                  Showing <strong>{meta.from || 0}</strong> to{' '}
                  <strong>{meta.to || 0}</strong> of <strong>{meta.total || 0}</strong>
                </span>
                <nav aria-label="Product pagination">
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

export default ProductListPage
