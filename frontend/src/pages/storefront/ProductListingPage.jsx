import { useEffect, useState } from 'react'
import StorefrontProductCard from '../../components/storefront/StorefrontProductCard.jsx'
import StorefrontProductFilters from '../../components/storefront/StorefrontProductFilters.jsx'
import {
  getStorefrontCategories,
  getStorefrontProducts,
} from '../../services/storefrontService.js'
import { getApiErrorMessage } from '../../utils/apiErrors.js'

const defaultFilters = {
  search: '',
  category: '',
  featured: false,
  sort: 'latest',
  page: 1,
  per_page: 12,
}

function ProductListingPage() {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [meta, setMeta] = useState(null)
  const [filters, setFilters] = useState(defaultFilters)
  const [searchInput, setSearchInput] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [error, setError] = useState('')
  const [categoryError, setCategoryError] = useState('')
  const [productRequestVersion, setProductRequestVersion] = useState(0)
  const [categoryRequestVersion, setCategoryRequestVersion] = useState(0)

  useEffect(() => {
    let isMounted = true

    getStorefrontCategories()
      .then((response) => {
        if (isMounted) {
          setCategories(response.data || [])
          setCategoryError('')
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setCategoryError(
            getApiErrorMessage(
              requestError,
              'Categories are temporarily unavailable.',
            ),
          )
        }
      })
      .finally(() => {
        if (isMounted) {
          setCategoriesLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [categoryRequestVersion])

  useEffect(() => {
    let isMounted = true

    getStorefrontProducts({
      search: filters.search || undefined,
      category: filters.category || undefined,
      featured: filters.featured ? 1 : undefined,
      sort: filters.sort,
      page: filters.page,
      per_page: filters.per_page,
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
            getApiErrorMessage(
              requestError,
              'Products could not be loaded right now.',
            ),
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
  }, [filters, productRequestVersion])

  const retryProducts = () => {
    setError('')
    setIsLoading(true)
    setProductRequestVersion((current) => current + 1)
  }

  const retryCategories = () => {
    setCategoryError('')
    setCategoriesLoading(true)
    setCategoryRequestVersion((current) => current + 1)
  }

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    const search = searchInput.trim()

    if (search === filters.search && filters.page === 1) {
      retryProducts()

      return
    }

    setIsLoading(true)
    setFilters((current) => ({ ...current, search, page: 1 }))
  }

  const handleFilterChange = (name, value) => {
    setIsLoading(true)
    setFilters((current) => ({ ...current, [name]: value, page: 1 }))
  }

  const handleFeaturedToggle = () => {
    setIsLoading(true)
    setFilters((current) => ({
      ...current,
      featured: !current.featured,
      page: 1,
    }))
  }

  const resetFilters = () => {
    setSearchInput('')
    setIsLoading(true)
    setFilters(defaultFilters)
  }

  const changePage = (page) => {
    if (page === filters.page || page < 1 || page > (meta?.last_page || 1)) {
      return
    }

    setIsLoading(true)
    setFilters((current) => ({ ...current, page }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.category ||
      filters.featured ||
      filters.sort !== 'latest' ||
      filters.per_page !== 12,
  )
  const currentPage = meta?.current_page || filters.page
  const lastPage = meta?.last_page || 1

  return (
    <main className="shop-page storefront-listing-page">
      <section className="shop-hero storefront-hero storefront-listing-hero">
        <div className="shop-hero__pattern" aria-hidden="true" />
        <div className="container position-relative">
          <div className="shop-hero__content">
            <span className="eyebrow">
              <i className="bi bi-stars" aria-hidden="true" />
              Curated storefront
            </span>
            <h1>Discover products selected for everyday life.</h1>
            <p>
              Browse the latest catalog, compare pricing, and find featured picks
              in a clean, focused shopping experience.
            </p>
            <div className="shop-hero__proof">
              <span>
                <i className="bi bi-grid" aria-hidden="true" />
                Responsive catalog
              </span>
              <span>
                <i className="bi bi-tag" aria-hidden="true" />
                Clear sale pricing
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="shop-catalog-section storefront-catalog-section">
        <div className="container">
          <StorefrontProductFilters
            categories={categories}
            categoriesLoading={categoriesLoading}
            categoryError={categoryError}
            filters={filters}
            searchInput={searchInput}
            hasActiveFilters={hasActiveFilters}
            onSearchInputChange={setSearchInput}
            onSearchSubmit={handleSearchSubmit}
            onFilterChange={handleFilterChange}
            onFeaturedToggle={handleFeaturedToggle}
            onReset={resetFilters}
            onCategoriesRetry={retryCategories}
          />

          <div className="shop-results-heading app-page-header storefront-results-header">
            <div>
              <span className="section-kicker">Shop the catalog</span>
              <h2>{filters.search ? `Results for "${filters.search}"` : 'All products'}</h2>
            </div>
            {!isLoading && !error && meta && (
              <span className="shop-results-count">
                {meta.total || 0} {meta.total === 1 ? 'product' : 'products'}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="row g-4 storefront-product-grid" role="status" aria-label="Loading products">
              {Array.from({ length: 8 }, (_, index) => (
                <div className="col-sm-6 col-xl-3" key={index}>
                  <div className="shop-product-skeleton">
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="shop-state-card shop-error-state app-empty-state" role="alert">
              <span aria-hidden="true">
                <i className="bi bi-cloud-slash" />
              </span>
              <h2>We could not load the catalog</h2>
              <p>{error}</p>
              <button className="btn btn-brand" type="button" onClick={retryProducts}>
                <i className="bi bi-arrow-clockwise" aria-hidden="true" />
                Try again
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="shop-state-card shop-empty-state app-empty-state">
              <span aria-hidden="true">
                <i className="bi bi-search" />
              </span>
              <h2>No products match these filters</h2>
              <p>Try a broader search or reset the filters to explore everything.</p>
              {hasActiveFilters && (
                <button className="btn btn-soft" type="button" onClick={resetFilters}>
                  Reset filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="row g-4 storefront-product-grid">
                {products.map((product) => (
                  <div className="col-sm-6 col-lg-4 col-xl-3" key={product.id}>
                    <StorefrontProductCard product={product} />
                  </div>
                ))}
              </div>

              {meta && lastPage > 1 && (
                <nav className="shop-pagination" aria-label="Product pagination">
                  <button
                    type="button"
                    onClick={() => changePage(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    <i className="bi bi-arrow-left" aria-hidden="true" />
                    Previous
                  </button>
                  <span>
                    Page <strong>{currentPage}</strong> of <strong>{lastPage}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => changePage(currentPage + 1)}
                    disabled={currentPage >= lastPage}
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

export default ProductListingPage
