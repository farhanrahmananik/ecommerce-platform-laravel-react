import httpClient from '../api/httpClient.js'

export async function getAuditLogs(params = {}) {
  const response = await httpClient.get('/api/admin/audit-logs', { params })

  return response.data
}

export async function getAuditLog(id) {
  const response = await httpClient.get(
    `/api/admin/audit-logs/${encodeURIComponent(id)}`,
  )

  return response.data
}
