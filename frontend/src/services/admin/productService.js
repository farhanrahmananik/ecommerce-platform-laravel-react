import httpClient from '../api/httpClient.js'

export async function getProducts(params = {}) {
  const response = await httpClient.get('/api/admin/products', { params })

  return response.data
}

export async function getProduct(id) {
  const response = await httpClient.get(`/api/admin/products/${id}`)

  return response.data
}

export async function createProduct(payload) {
  const response = await httpClient.post('/api/admin/products', payload)

  return response.data
}

export async function updateProduct(id, payload) {
  const response = await httpClient.patch(`/api/admin/products/${id}`, payload)

  return response.data
}

export async function deleteProduct(id) {
  const response = await httpClient.delete(`/api/admin/products/${id}`)

  return response.data
}
