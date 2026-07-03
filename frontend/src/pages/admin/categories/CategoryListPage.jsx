import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Swal from 'sweetalert2'
import AdminSelect from '../../../components/admin/common/AdminSelect.jsx'
import {
  deleteCategory,
  getCategories,
} from '../../../services/admin/categoryService.js'
import { getApiErrorMessage } from '../../../utils/apiErrors.js'

const statusFilterOptions = [
  { value: '', label: 'All' },
  { value: '1', label: 'Active' },
  { value: '0', label: 'Inactive' },
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
    return '—'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function CategoryListPage() {
  const [categories, setCategories] = useState([])
  const [meta, setMeta] = useState(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [requestVersion, setRequestVersion] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    getCategories({
      page,
      per_page: 15,
      search: search || undefined,
      is_active: status === '' ? undefined : status,
    })
      .then((response) => {
        if (isMounted) {
          setCategories(response.data || [])
          setMeta(response.meta || null)
          setError('')
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(
            getApiErrorMessage(requestError, 'Categories could not be loaded.'),
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

  const handleStatusChange = (value) => {
    setStatus(value)
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

  const handleDelete = async (category) => {
    const confirmation = await Swal.fire({
      icon: 'warning',
      title: 'Delete this category?',
      text: `${category.name} will be removed from active category management.`,
      showCancelButton: true,
      confirmButtonText: 'Delete Category',
      cancelButtonText: 'Keep Category',
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

    setDeletingId(category.id)
    setError('')

    try {
      await deleteCategory(category.id)

      await Swal.fire({
        icon: 'success',
        title: 'Category deleted',
        text: `${category.name} was deleted successfully.`,
        timer: 1400,
        showConfirmButton: false,
        customClass: { popup: 'storefront-alert' },
      })

      if (categories.length === 1 && page > 1) {
        setPage((current) => current - 1)
        setIsLoading(true)
      } else {
        refresh()
      }
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, 'The category could not be deleted.'),
      )
    } finally {
      setDeletingId(null)
    }
  }

  const hasFilters = Boolean(search || status)
  const visiblePages = getVisiblePages(
    meta?.current_page || 1,
    meta?.last_page || 1,
  )

  return (
    <main className="admin-category-page admin-list-page">
      <header className="category-list-heading admin-list-header app-page-header admin-catalog-header">
        <div className="admin-list-title-group">
          <span className="admin-eyebrow app-page-eyebrow">Catalog organization</span>
          <h1 className="app-page-title">Categories</h1>
          <p className="app-page-subtitle">Build a clear hierarchy that keeps your future catalog easy to manage.</p>
        </div>
        <Link className="btn btn-admin-primary category-add-button admin-list-actions" to="create">
          <i className="bi bi-plus-lg" aria-hidden="true" />
          Add Category
        </Link>
      </header>

      <section className="category-list-card admin-table-card">
        <div className="category-list-toolbar admin-table-toolbar admin-filter-card">
          <form className="category-search-form admin-filter-control" onSubmit={handleSearch}>
            <i className="bi bi-search" aria-hidden="true" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search name or slug..."
              aria-label="Search categories"
            />
            <button type="submit">Search</button>
          </form>

          <div className="admin-select-filter admin-filter-control">
            <AdminSelect
              id="category-status-filter"
              name="status"
              label="Status"
              value={status}
              options={statusFilterOptions}
              onChange={handleStatusChange}
              placeholder="All"
            />
          </div>

          {hasFilters && (
            <button className="category-clear-button" type="button" onClick={clearFilters}>
              <i className="bi bi-x-circle" aria-hidden="true" />
              Clear
            </button>
          )}
        </div>

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
            <span className="visually-hidden">Loading categories</span>
          </div>
        ) : categories.length === 0 ? (
          <div className="category-empty-state admin-empty-state">
            <span className="category-empty-icon" aria-hidden="true">
              <i className="bi bi-folder2-open" />
            </span>
            <h2>{hasFilters ? 'No matching categories' : 'No categories yet'}</h2>
            <p>
              {hasFilters
                ? 'Try a different search or clear the current filters.'
                : 'Create your first category to start organizing the catalog.'}
            </p>
            {hasFilters ? (
              <button className="btn btn-admin-soft" type="button" onClick={clearFilters}>
                Clear filters
              </button>
            ) : (
              <Link className="btn btn-admin-primary" to="create">
                <i className="bi bi-plus-lg" aria-hidden="true" />
                Add Category
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="table-responsive category-table-wrap admin-table-wrap">
              <table className="table category-table admin-table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Slug</th>
                    <th>Parent</th>
                    <th>Status</th>
                    <th>Sort Order</th>
                    <th>Created</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id}>
                      <td data-label="Name">
                        <div className="category-name-cell">
                          <span aria-hidden="true">
                            <i className="bi bi-folder-fill" />
                          </span>
                          <div>
                            <strong>{category.name}</strong>
                            <small>#{category.id}</small>
                          </div>
                        </div>
                      </td>
                      <td data-label="Slug">
                        <code className="category-slug">{category.slug}</code>
                      </td>
                      <td data-label="Parent">
                        <span className="category-parent-name admin-category-chip">
                          {category.parent?.name || 'Top level'}
                        </span>
                      </td>
                      <td data-label="Status">
                        <span
                          className={`category-status-badge admin-status-badge ${category.is_active ? 'is-active success' : 'is-inactive neutral'}`}
                        >
                          <span aria-hidden="true" />
                          {category.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td data-label="Sort Order">
                        <span className="category-sort-value">{category.sort_order}</span>
                      </td>
                      <td data-label="Created">
                        <span className="category-created-date">
                          {formatDate(category.created_at)}
                        </span>
                      </td>
                      <td data-label="Actions">
                        <div className="category-row-actions admin-table-actions">
                          <Link
                            className="category-action-button"
                            to={`${category.id}/edit`}
                            title={`Edit ${category.name}`}
                            aria-label={`Edit ${category.name}`}
                          >
                            <i className="bi bi-pencil" aria-hidden="true" />
                          </Link>
                          <button
                            className="category-action-button is-danger"
                            type="button"
                            onClick={() => handleDelete(category)}
                            disabled={deletingId === category.id}
                            title={`Delete ${category.name}`}
                            aria-label={`Delete ${category.name}`}
                          >
                            {deletingId === category.id ? (
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
                <nav aria-label="Category pagination">
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

export default CategoryListPage
