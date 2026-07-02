import httpClient from './api/httpClient.js'

export async function getStorefrontCategories() {
  const response = await httpClient.get('/api/storefront/categories')

  return response.data
}

export async function getStorefrontProducts(params = {}) {
  const response = await httpClient.get('/api/storefront/products', { params })

  return response.data
}

export async function getStorefrontProduct(slug) {
  const response = await httpClient.get(
    `/api/storefront/products/${encodeURIComponent(slug)}`,
  )

  return response.data
}
