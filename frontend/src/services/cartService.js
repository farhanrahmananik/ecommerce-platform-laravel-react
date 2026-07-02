import httpClient from './api/httpClient.js'

export async function getCart() {
  const response = await httpClient.get('/api/cart')

  return response.data
}

export async function addCartItem(payload) {
  const response = await httpClient.post('/api/cart/items', payload)

  return response.data
}

export async function updateCartItem(cartItemId, payload) {
  const response = await httpClient.patch(
    `/api/cart/items/${encodeURIComponent(cartItemId)}`,
    payload,
  )

  return response.data
}

export async function removeCartItem(cartItemId) {
  const response = await httpClient.delete(
    `/api/cart/items/${encodeURIComponent(cartItemId)}`,
  )

  return response.data
}

export async function clearCart() {
  const response = await httpClient.delete('/api/cart')

  return response.data
}
