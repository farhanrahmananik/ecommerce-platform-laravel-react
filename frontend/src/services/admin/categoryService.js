import httpClient from '../api/httpClient.js'

export async function getCategories(params = {}) {
  const response = await httpClient.get('/api/admin/categories', { params })

  return response.data
}

export async function getCategoryOptions() {
  const firstPage = await getCategories({ per_page: 50 })
  const categories = [...(firstPage.data || [])]
  const lastPage = firstPage.meta?.last_page || 1

  for (let page = 2; page <= lastPage; page += 1) {
    const response = await getCategories({ page, per_page: 50 })
    categories.push(...(response.data || []))
  }

  return categories
}

export async function getCategory(id) {
  const response = await httpClient.get(`/api/admin/categories/${id}`)

  return response.data
}

export async function createCategory(payload) {
  const response = await httpClient.post('/api/admin/categories', payload)

  return response.data
}

export async function updateCategory(id, payload) {
  const response = await httpClient.patch(`/api/admin/categories/${id}`, payload)

  return response.data
}

export async function deleteCategory(id) {
  const response = await httpClient.delete(`/api/admin/categories/${id}`)

  return response.data
}
