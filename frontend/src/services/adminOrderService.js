import httpClient from './api/httpClient.js'

export async function getAdminOrders(params = {}) {
  const response = await httpClient.get('/api/admin/orders', { params })

  return response.data
}

export async function getAdminOrder(orderId) {
  const response = await httpClient.get(
    `/api/admin/orders/${encodeURIComponent(orderId)}`,
  )

  return response.data
}

export async function updateAdminOrderStatus(orderId, status) {
  const response = await httpClient.patch(
    `/api/admin/orders/${encodeURIComponent(orderId)}/status`,
    { status },
  )

  return response.data
}
