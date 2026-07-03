import httpClient from './api/httpClient.js'

export async function getStockProducts(params = {}) {
  const response = await httpClient.get('/api/admin/stock/products', { params })
  return response.data
}

export async function getProductStockMovements(productId, params = {}) {
  const response = await httpClient.get(`/api/admin/stock/products/${encodeURIComponent(productId)}/movements`, { params })
  return response.data
}

export async function adjustProductStock(productId, payload) {
  const response = await httpClient.post(`/api/admin/stock/products/${encodeURIComponent(productId)}/adjust`, payload)
  return response.data
}
