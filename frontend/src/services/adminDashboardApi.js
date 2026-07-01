import httpClient from './api/httpClient.js'

export async function getAdminDashboardSummary() {
  const response = await httpClient.get('/api/admin/dashboard/summary')

  return response.data
}
