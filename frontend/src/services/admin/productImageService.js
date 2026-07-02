import httpClient from '../api/httpClient.js'

export async function getProductImages(productId) {
  const response = await httpClient.get(
    `/api/admin/products/${productId}/images`,
  )

  return response.data
}

export async function uploadProductImage(productId, payload) {
  const formData = new FormData()

  formData.append('image', payload.image)
  formData.append('alt_text', payload.alt_text ?? '')
  formData.append('is_primary', payload.is_primary ? '1' : '0')
  formData.append('sort_order', String(payload.sort_order ?? 0))

  const response = await httpClient.post(
    `/api/admin/products/${productId}/images`,
    formData,
  )

  return response.data
}

export async function updateProductImage(productId, imageId, payload) {
  const response = await httpClient.patch(
    `/api/admin/products/${productId}/images/${imageId}`,
    payload,
  )

  return response.data
}

export async function deleteProductImage(productId, imageId) {
  const response = await httpClient.delete(
    `/api/admin/products/${productId}/images/${imageId}`,
  )

  return response.data
}
