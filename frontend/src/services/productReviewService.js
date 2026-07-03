import httpClient from './api/httpClient.js'

const productPath = (product) =>
  `/api/storefront/products/${encodeURIComponent(product)}/reviews`

export async function getProductReviews(product, params = {}) {
  const response = await httpClient.get(productPath(product), { params })
  return response.data
}

export async function createProductReview(product, payload) {
  const response = await httpClient.post(productPath(product), payload)
  return response.data
}

export async function getMyReviews(params = {}) {
  const response = await httpClient.get('/api/account/reviews', { params })
  return response.data
}

export async function updateMyReview(reviewId, payload) {
  const response = await httpClient.patch(
    `/api/account/reviews/${encodeURIComponent(reviewId)}`,
    payload,
  )
  return response.data
}

export async function deleteMyReview(reviewId) {
  const response = await httpClient.delete(
    `/api/account/reviews/${encodeURIComponent(reviewId)}`,
  )
  return response.data
}

export async function getAdminProductReviews(params = {}) {
  const response = await httpClient.get('/api/admin/product-reviews', { params })
  return response.data
}

export async function getAdminProductReview(reviewId) {
  const response = await httpClient.get(
    `/api/admin/product-reviews/${encodeURIComponent(reviewId)}`,
  )
  return response.data
}

export async function moderateProductReview(reviewId, payload) {
  const response = await httpClient.patch(
    `/api/admin/product-reviews/${encodeURIComponent(reviewId)}/moderate`,
    payload,
  )
  return response.data
}
