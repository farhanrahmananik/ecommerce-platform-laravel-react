import StorefrontSelect from './StorefrontSelect.jsx'

const sortOptions = [
  { value: 'latest', label: 'Newest first' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'name_asc', label: 'Name: A to Z' },
]

const perPageOptions = [12, 24, 36, 48].map((value) => ({
  value,
  label: `${value} products`,
}))

function StorefrontProductFilters({
  categories,
  categoriesLoading,
  categoryError,
  filters,
  searchInput,
  hasActiveFilters,
  onSearchInputChange,
  onSearchSubmit,
  onFilterChange,
  onFeaturedToggle,
  onReset,
  onCategoriesRetry,
}) {
  const categoryOptions = [
    {
      value: '',
      label: categoriesLoading ? 'Loading categories...' : 'All categories',
    },
    ...categories.map((category) => ({
      value: category.slug,
      label: category.name,
    })),
  ]

  return (
    <section className="shop-filter-panel" aria-label="Product filters">
      <form className="shop-search" onSubmit={onSearchSubmit}>
        <i className="bi bi-search" aria-hidden="true" />
        <input
          type="search"
          value={searchInput}
          onChange={(event) => onSearchInputChange(event.target.value)}
          placeholder="Search products..."
          aria-label="Search products"
        />
        <button type="submit">Search</button>
      </form>

      <div className="shop-filter-grid">
        <StorefrontSelect
          id="storefront-category"
          label="Category"
          value={filters.category}
          options={categoryOptions}
          onChange={(value) => onFilterChange('category', value)}
          placeholder="All categories"
          disabled={categoriesLoading}
        />

        <StorefrontSelect
          id="storefront-sort"
          label="Sort by"
          value={filters.sort}
          options={sortOptions}
          onChange={(value) => onFilterChange('sort', value)}
          placeholder="Newest first"
        />

        <StorefrontSelect
          id="storefront-per-page"
          label="Show"
          value={filters.per_page}
          options={perPageOptions}
          onChange={(value) => onFilterChange('per_page', value)}
          placeholder="12 products"
        />

        <button
          className={`shop-featured-toggle ${filters.featured ? 'is-active' : ''}`}
          type="button"
          onClick={onFeaturedToggle}
          aria-pressed={filters.featured}
        >
          <i
            className={`bi ${filters.featured ? 'bi-star-fill' : 'bi-star'}`}
            aria-hidden="true"
          />
          Featured only
        </button>

        {hasActiveFilters && (
          <button className="shop-reset-button" type="button" onClick={onReset}>
            <i className="bi bi-arrow-counterclockwise" aria-hidden="true" />
            Reset
          </button>
        )}
      </div>

      {categoryError && (
        <div className="shop-filter-note" role="status">
          <i className="bi bi-info-circle" aria-hidden="true" />
          <span>{categoryError}</span>
          <button type="button" onClick={onCategoriesRetry}>
            Retry
          </button>
        </div>
      )}
    </section>
  )
}

export default StorefrontProductFilters
