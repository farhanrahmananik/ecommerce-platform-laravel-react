import httpClient from './api/httpClient.js'

export async function validateCoupon(payload) {
  const response = await httpClient.post('/api/coupons/validate', payload)

  return response.data
}
