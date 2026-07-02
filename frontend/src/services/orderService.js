import httpClient from './api/httpClient.js'

export async function getOrders(params = {}) {
  const response = await httpClient.get('/api/orders', { params })

  return response.data
}

export async function getOrder(orderId) {
  const response = await httpClient.get(
    `/api/orders/${encodeURIComponent(orderId)}`,
  )

  return response.data
}
