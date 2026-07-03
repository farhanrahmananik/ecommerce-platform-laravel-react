import { useState } from 'react'

function buildGalleryImages(product) {
  const images = Array.isArray(product.images) ? [...product.images] : []
  const primaryImage = product.primary_image

  if (primaryImage && !images.some((image) => image.id === primaryImage.id)) {
    images.unshift(primaryImage)
  }

  return images
}

function ProductImageGallery({ product }) {
  const images = buildGalleryImages(product)
  const initialImage =
    images.find((image) => image.id === product.primary_image?.id) || images[0]
  const [selectedImageId, setSelectedImageId] = useState(initialImage?.id ?? null)
  const [failedImages, setFailedImages] = useState({})
  const selectedImage =
    images.find((image) => image.id === selectedImageId) || images[0]
  const selectedImageFailed = selectedImage && failedImages[selectedImage.id]

  const markImageFailed = (imageId) => {
    setFailedImages((current) => ({ ...current, [imageId]: true }))
  }

  return (
    <section className="product-detail-gallery storefront-gallery app-card" aria-label="Product image gallery">
      <div className="product-detail-main-image storefront-gallery-main">
        {selectedImage?.url && !selectedImageFailed ? (
          <img
            src={selectedImage.url}
            alt={selectedImage.alt_text || product.name}
            onError={() => markImageFailed(selectedImage.id)}
          />
        ) : (
          <div className="product-detail-placeholder">
            <span aria-hidden="true">
              <i className="bi bi-image" />
            </span>
            <strong>Product image coming soon</strong>
            <p>The gallery will appear here when product media is available.</p>
          </div>
        )}

        {product.is_featured && (
          <span className="product-detail-gallery-badge">
            <i className="bi bi-star-fill" aria-hidden="true" />
            Featured
          </span>
        )}
      </div>

      {images.length > 1 && (
        <div className="product-detail-thumbnails storefront-gallery-thumbnails" aria-label="Choose product image">
          {images.map((image, index) => {
            const isSelected = image.id === selectedImage?.id
            const imageFailed = failedImages[image.id]

            return (
              <button
                className={`storefront-gallery-thumb ${isSelected ? 'is-active' : ''}`}
                type="button"
                onClick={() => setSelectedImageId(image.id)}
                aria-label={`View image ${index + 1} of ${product.name}`}
                aria-pressed={isSelected}
                key={image.id}
              >
                {image.url && !imageFailed ? (
                  <img
                    src={image.url}
                    alt=""
                    loading="lazy"
                    onError={() => markImageFailed(image.id)}
                  />
                ) : (
                  <span aria-hidden="true">
                    <i className="bi bi-image" />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default ProductImageGallery
