import { useEffect, useRef, useState } from 'react'
import Swal from 'sweetalert2'
import {
  deleteProductImage,
  getProductImages,
  updateProductImage,
  uploadProductImage,
} from '../../../services/admin/productImageService.js'
import {
  getApiErrorMessage,
  getValidationErrors,
} from '../../../utils/apiErrors.js'

const emptyUploadForm = {
  image: null,
  alt_text: '',
  sort_order: 0,
  is_primary: false,
}

function sortImages(images) {
  return [...images].sort(
    (first, second) =>
      Number(first.sort_order) - Number(second.sort_order) ||
      Number(first.id) - Number(second.id),
  )
}

function createDraft(image) {
  return {
    alt_text: image.alt_text ?? '',
    sort_order: image.sort_order ?? 0,
  }
}

function createDrafts(images) {
  return Object.fromEntries(images.map((image) => [image.id, createDraft(image)]))
}

function formatFileSize(sizeBytes) {
  const bytes = Number(sizeBytes)

  if (!Number.isFinite(bytes) || bytes <= 0) {
    return ''
  }

  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FieldErrors({ messages }) {
  if (!messages) {
    return null
  }

  const errors = Array.isArray(messages) ? messages : [messages]

  return errors.map((message, index) => (
    <div className="category-field-error" key={`${message}-${index}`}>
      {message}
    </div>
  ))
}

function InlineError({ message, onRetry }) {
  if (!message) {
    return null
  }

  return (
    <div className="product-images-alert" role="alert">
      <i className="bi bi-exclamation-octagon" aria-hidden="true" />
      <span>{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}

function showSuccess(title, text) {
  return Swal.fire({
    icon: 'success',
    title,
    text,
    timer: 1500,
    showConfirmButton: false,
    customClass: { popup: 'storefront-alert' },
  })
}

function ProductImagesManager({ productId, productName = 'this product' }) {
  const [images, setImages] = useState([])
  const [drafts, setDrafts] = useState({})
  const [uploadForm, setUploadForm] = useState(emptyUploadForm)
  const [previewUrl, setPreviewUrl] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [savingId, setSavingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [uploadErrors, setUploadErrors] = useState({})
  const [imageErrors, setImageErrors] = useState({})
  const [requestVersion, setRequestVersion] = useState(0)
  const fileInputRef = useRef(null)
  const previewUrlRef = useRef('')

  useEffect(() => {
    let isMounted = true

    getProductImages(productId)
      .then((response) => {
        if (isMounted) {
          const loadedImages = sortImages(response.data || [])

          setImages(loadedImages)
          setDrafts(createDrafts(loadedImages))
          setLoadError('')
        }
      })
      .catch((error) => {
        if (isMounted) {
          setLoadError(
            getApiErrorMessage(error, 'Product images could not be loaded.'),
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
  }, [productId, requestVersion])

  useEffect(
    () => () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
    },
    [],
  )

  const clearSelectedFile = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = ''
    }

    setPreviewUrl('')
    setUploadForm(emptyUploadForm)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0] || null

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = ''
    }

    const nextPreviewUrl = selectedFile ? URL.createObjectURL(selectedFile) : ''
    previewUrlRef.current = nextPreviewUrl
    setPreviewUrl(nextPreviewUrl)
    setUploadForm((current) => ({ ...current, image: selectedFile }))
    setUploadErrors((current) => ({ ...current, image: undefined }))
  }

  const mergeImage = (updatedImage) => {
    setImages((current) =>
      sortImages(
        current.map((image) => {
          if (image.id === updatedImage.id) {
            return updatedImage
          }

          return updatedImage.is_primary
            ? { ...image, is_primary: false }
            : image
        }),
      ),
    )
    setDrafts((current) => ({
      ...current,
      [updatedImage.id]: createDraft(updatedImage),
    }))
  }

  const handleUpload = async (event) => {
    event.preventDefault()

    if (!uploadForm.image) {
      setUploadErrors({ image: ['Choose an image to upload.'] })

      return
    }

    setIsUploading(true)
    setUploadError('')
    setUploadErrors({})

    try {
      const response = await uploadProductImage(productId, {
        ...uploadForm,
        alt_text: uploadForm.alt_text.trim(),
        sort_order:
          uploadForm.sort_order === '' ? 0 : Number(uploadForm.sort_order),
      })
      const uploadedImage = response.data

      setImages((current) =>
        sortImages([
          ...current.map((image) =>
            uploadedImage.is_primary ? { ...image, is_primary: false } : image,
          ),
          uploadedImage,
        ]),
      )
      setDrafts((current) => ({
        ...current,
        [uploadedImage.id]: createDraft(uploadedImage),
      }))
      clearSelectedFile()

      await showSuccess(
        'Image uploaded',
        `${productName} now has a new gallery image.`,
      )
    } catch (error) {
      const validationErrors = getValidationErrors(error)

      setUploadErrors(validationErrors)

      if (Object.keys(validationErrors).length === 0) {
        setUploadError(
          getApiErrorMessage(error, 'The image could not be uploaded.'),
        )
      }
    } finally {
      setIsUploading(false)
    }
  }

  const updateDraft = (imageId, field, value) => {
    setDrafts((current) => ({
      ...current,
      [imageId]: {
        ...current[imageId],
        [field]: value,
      },
    }))
  }

  const handleSave = async (image, makePrimary = false) => {
    const draft = drafts[image.id] || createDraft(image)

    setSavingId(image.id)
    setImageErrors((current) => ({ ...current, [image.id]: undefined }))

    try {
      const response = await updateProductImage(productId, image.id, {
        alt_text: draft.alt_text.trim() || null,
        sort_order: draft.sort_order === '' ? 0 : Number(draft.sort_order),
        ...(makePrimary ? { is_primary: true } : {}),
      })

      mergeImage(response.data)

      await showSuccess(
        makePrimary ? 'Primary image updated' : 'Image details saved',
        makePrimary
          ? 'The gallery has a new primary image.'
          : 'The image metadata has been updated.',
      )
    } catch (error) {
      const validationErrors = getValidationErrors(error)

      setImageErrors((current) => ({
        ...current,
        [image.id]: {
          fields: validationErrors,
          general:
            Object.keys(validationErrors).length === 0
              ? getApiErrorMessage(error, 'The image could not be updated.')
              : '',
        },
      }))
    } finally {
      setSavingId(null)
    }
  }

  const handleDelete = async (image) => {
    const confirmation = await Swal.fire({
      icon: 'warning',
      title: 'Delete this image?',
      text: 'The stored file and its gallery metadata will be removed.',
      showCancelButton: true,
      confirmButtonText: 'Delete Image',
      cancelButtonText: 'Keep Image',
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

    setDeletingId(image.id)
    setImageErrors((current) => ({ ...current, [image.id]: undefined }))

    try {
      await deleteProductImage(productId, image.id)

      setImages((current) => {
        const remainingImages = sortImages(
          current.filter((currentImage) => currentImage.id !== image.id),
        )

        if (image.is_primary && remainingImages.length > 0) {
          remainingImages[0] = { ...remainingImages[0], is_primary: true }
        }

        return remainingImages
      })
      setDrafts((current) => {
        const nextDrafts = { ...current }

        delete nextDrafts[image.id]

        return nextDrafts
      })

      await showSuccess('Image deleted', 'The gallery image was removed.')
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        'The image could not be deleted.',
      )

      setImageErrors((current) => ({
        ...current,
        [image.id]: { fields: {}, general: message },
      }))

      await Swal.fire({
        icon: 'error',
        title: 'Could not delete image',
        text: message,
        confirmButtonText: 'Close',
        buttonsStyling: false,
        customClass: {
          popup: 'storefront-alert',
          confirmButton: 'swal-brand-button',
        },
      })
    } finally {
      setDeletingId(null)
    }
  }

  const retry = () => {
    setLoadError('')
    setIsLoading(true)
    setRequestVersion((current) => current + 1)
  }

  return (
    <section
      className="product-images-manager admin-image-manager"
      aria-labelledby="product-images-title"
    >
      <header className="product-images-manager__header app-section-card admin-image-context">
        <span className="product-images-manager__icon" aria-hidden="true">
          <i className="bi bi-images" />
        </span>
        <div>
          <span className="admin-eyebrow">Media gallery</span>
          <h2 id="product-images-title">Product Images</h2>
          <p>
            Images are managed after product creation so every upload belongs to a
            saved catalog item.
          </p>
        </div>
        <span className="product-images-count">
          {images.length} {images.length === 1 ? 'image' : 'images'}
        </span>
      </header>

      <form
        className="product-image-upload app-form-card admin-image-upload-card"
        onSubmit={handleUpload}
        noValidate
      >
        <div className="product-image-upload__heading">
          <div>
            <h3>Upload a new image</h3>
            <p>JPG, PNG, or WebP up to 4 MB.</p>
          </div>
          <i className="bi bi-cloud-arrow-up" aria-hidden="true" />
        </div>

        <InlineError message={uploadError} />

        <div className="product-image-upload__grid">
          <div className="product-image-preview admin-image-preview">
            {previewUrl ? (
              <img src={previewUrl} alt="Selected upload preview" />
            ) : (
              <div>
                <i className="bi bi-image" aria-hidden="true" />
                <strong>Image preview</strong>
                <span>Select a file to preview it here.</span>
              </div>
            )}
          </div>

          <div className="product-image-upload__fields">
            <div>
              <label className="category-form-label" htmlFor="product-image-file">
                Image file <span>*</span>
              </label>
              <input
                id="product-image-file"
                className={`form-control category-form-control product-image-file-input ${uploadErrors.image ? 'is-invalid' : ''}`}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <FieldErrors messages={uploadErrors.image} />
            </div>

            <div>
              <label className="category-form-label" htmlFor="product-image-alt-text">
                Alt text <small>Optional</small>
              </label>
              <input
                id="product-image-alt-text"
                className={`form-control category-form-control ${uploadErrors.alt_text ? 'is-invalid' : ''}`}
                value={uploadForm.alt_text}
                onChange={(event) =>
                  setUploadForm((current) => ({
                    ...current,
                    alt_text: event.target.value,
                  }))
                }
                placeholder="Describe the image for accessibility"
              />
              <FieldErrors messages={uploadErrors.alt_text} />
            </div>

            <div className="product-image-upload__settings">
              <div>
                <label className="category-form-label" htmlFor="product-image-sort-order">
                  Sort order
                </label>
                <input
                  id="product-image-sort-order"
                  className={`form-control category-form-control ${uploadErrors.sort_order ? 'is-invalid' : ''}`}
                  type="number"
                  min="0"
                  max="999999"
                  step="1"
                  value={uploadForm.sort_order}
                  onChange={(event) =>
                    setUploadForm((current) => ({
                      ...current,
                      sort_order: event.target.value,
                    }))
                  }
                />
                <FieldErrors messages={uploadErrors.sort_order} />
              </div>

              <label className="product-image-primary-toggle" htmlFor="product-image-primary">
                <input
                  id="product-image-primary"
                  className="form-check-input"
                  type="checkbox"
                  checked={uploadForm.is_primary}
                  onChange={(event) =>
                    setUploadForm((current) => ({
                      ...current,
                      is_primary: event.target.checked,
                    }))
                  }
                />
                <span>
                  <strong>Make primary image</strong>
                  <small>Use this image as the main catalog visual.</small>
                </span>
              </label>
            </div>
            <FieldErrors messages={uploadErrors.is_primary} />

            <div className="product-image-upload__actions">
              {previewUrl && (
                <button
                  className="btn btn-admin-soft"
                  type="button"
                  onClick={clearSelectedFile}
                  disabled={isUploading}
                >
                  Clear
                </button>
              )}
              <button
                className="btn btn-admin-primary"
                type="submit"
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <i className="bi bi-cloud-arrow-up" aria-hidden="true" />
                    Upload Image
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      <div className="product-image-gallery-heading">
        <div>
          <h3>Image gallery</h3>
          <p>Edit accessibility text, ordering, and the primary image.</p>
        </div>
      </div>

      <InlineError message={loadError} onRetry={retry} />

      {isLoading ? (
        <div className="product-images-loading admin-image-grid" role="status">
          {[0, 1, 2].map((item) => (
            <span key={item} />
          ))}
          <span className="visually-hidden">Loading product images</span>
        </div>
      ) : !loadError && images.length === 0 ? (
        <div className="product-images-empty admin-empty-state">
          <span aria-hidden="true">
            <i className="bi bi-images" />
          </span>
          <h3>No product images yet</h3>
          <p>Upload the first image to begin building this product gallery.</p>
        </div>
      ) : (
        <div className="product-images-grid admin-image-grid">
          {images.map((image) => {
            const draft = drafts[image.id] || createDraft(image)
            const errors = imageErrors[image.id] || {}
            const fileDetails = [image.mime_type, formatFileSize(image.size_bytes)]
              .filter(Boolean)
              .join(' - ')

            return (
              <article
                className={`product-image-card admin-image-card app-card-hover ${image.is_primary ? 'is-primary' : ''}`}
                key={image.id}
              >
                <div className="product-image-card__visual">
                  <img
                    src={image.image_url}
                    alt={image.alt_text || `${productName} gallery image`}
                    loading="lazy"
                  />
                  {image.is_primary && (
                    <span className="product-image-primary-badge admin-primary-badge">
                      <i className="bi bi-star-fill" aria-hidden="true" />
                      Primary
                    </span>
                  )}
                </div>

                <div className="product-image-card__body">
                  <div className="product-image-card__file admin-image-meta">
                    <strong>{image.original_name || `Product image ${image.id}`}</strong>
                    {fileDetails && <span>{fileDetails}</span>}
                  </div>

                  <InlineError message={errors.general} />

                  <div>
                    <label
                      className="category-form-label"
                      htmlFor={`product-image-alt-${image.id}`}
                    >
                      Alt text <small>Optional</small>
                    </label>
                    <input
                      id={`product-image-alt-${image.id}`}
                      className={`form-control category-form-control ${errors.fields?.alt_text ? 'is-invalid' : ''}`}
                      value={draft.alt_text}
                      onChange={(event) =>
                        updateDraft(image.id, 'alt_text', event.target.value)
                      }
                      placeholder="Describe this image"
                    />
                    <FieldErrors messages={errors.fields?.alt_text} />
                  </div>

                  <div>
                    <label
                      className="category-form-label"
                      htmlFor={`product-image-order-${image.id}`}
                    >
                      Sort order
                    </label>
                    <input
                      id={`product-image-order-${image.id}`}
                      className={`form-control category-form-control ${errors.fields?.sort_order ? 'is-invalid' : ''}`}
                      type="number"
                      min="0"
                      max="999999"
                      step="1"
                      value={draft.sort_order}
                      onChange={(event) =>
                        updateDraft(image.id, 'sort_order', event.target.value)
                      }
                    />
                    <FieldErrors messages={errors.fields?.sort_order} />
                    <FieldErrors messages={errors.fields?.is_primary} />
                  </div>

                  <div className="product-image-card__actions">
                    {!image.is_primary && (
                      <button
                        className="product-image-action product-image-action--primary"
                        type="button"
                        onClick={() => handleSave(image, true)}
                        disabled={savingId === image.id || deletingId === image.id}
                      >
                        <i className="bi bi-star" aria-hidden="true" />
                        Set primary
                      </button>
                    )}
                    <button
                      className="product-image-action"
                      type="button"
                      onClick={() => handleSave(image)}
                      disabled={savingId === image.id || deletingId === image.id}
                    >
                      {savingId === image.id ? (
                        <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                      ) : (
                        <i className="bi bi-check2" aria-hidden="true" />
                      )}
                      Save
                    </button>
                    <button
                      className="product-image-action product-image-action--danger"
                      type="button"
                      onClick={() => handleDelete(image)}
                      disabled={deletingId === image.id || savingId === image.id}
                    >
                      {deletingId === image.id ? (
                        <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                      ) : (
                        <i className="bi bi-trash3" aria-hidden="true" />
                      )}
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default ProductImagesManager
