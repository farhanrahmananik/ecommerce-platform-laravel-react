import httpClient from './api/httpClient.js'

export async function getCoupons(params = {}) {
  const response = await httpClient.get('/api/admin/coupons', { params })

  return response.data
}

export async function getCoupon(id) {
  const response = await httpClient.get(
    `/api/admin/coupons/${encodeURIComponent(id)}`,
  )

  return response.data
}

export async function createCoupon(payload) {
  const response = await httpClient.post('/api/admin/coupons', payload)

  return response.data
}

export async function updateCoupon(id, payload) {
  const response = await httpClient.patch(
    `/api/admin/coupons/${encodeURIComponent(id)}`,
    payload,
  )

  return response.data
}

export async function deleteCoupon(id) {
  const response = await httpClient.delete(
    `/api/admin/coupons/${encodeURIComponent(id)}`,
  )

  return response.data
}
