import httpClient from './api/httpClient.js'

export async function checkout(payload) {
  const response = await httpClient.post('/api/checkout', payload)

  return response.data
}
