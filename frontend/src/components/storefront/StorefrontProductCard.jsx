import { useState } from 'react'

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

function StorefrontProductCard({ product }) {
  const [imageFailed, setImageFailed] = useState(false)
  const price = Number(product.price)
  const salePrice = product.sale_price === null ? null : Number(product.sale_price)
  const hasSale =
    Number.isFinite(price) &&
    Number.isFinite(salePrice) &&
    salePrice < price
  const showImage = product.primary_image?.url && !imageFailed

  return (
    <article className="shop-product-card h-100">
      <div className="shop-product-card__visual">
        {showImage ? (
          <img
            src={product.primary_image.url}
            alt={product.primary_image.alt_text || product.name}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="shop-product-card__placeholder" aria-label="No product image">
            <i className="bi bi-image" aria-hidden="true" />
            <span>Image coming soon</span>
          </div>
        )}

        <div className="shop-product-card__badges">
          {product.is_featured && (
            <span className="shop-product-featured-badge">
              <i className="bi bi-star-fill" aria-hidden="true" />
              Featured
            </span>
          )}
          {hasSale && <span className="shop-product-sale-badge">Sale</span>}
        </div>
      </div>

      <div className="shop-product-card__body">
        <span className="shop-product-category">
          <i className="bi bi-tag" aria-hidden="true" />
          {product.category?.name || 'Uncategorized'}
        </span>

        <h2>{product.name}</h2>
        <p>
          {product.short_description ||
            'A thoughtfully selected product from our growing catalog.'}
        </p>

        <div className="shop-product-card__footer">
          <div className="shop-product-price">
            <small>{hasSale ? 'Sale price' : 'Price'}</small>
            <div>
              <strong>{formatAmount(hasSale ? salePrice : price)}</strong>
              {hasSale && <del>{formatAmount(price)}</del>}
            </div>
          </div>
          <span className="shop-product-details-note">
            Details soon
            <i className="bi bi-arrow-up-right" aria-hidden="true" />
          </span>
        </div>
      </div>
    </article>
  )
}

export default StorefrontProductCard
