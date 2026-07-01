import httpClient from './httpClient.js'

const initializeCsrfProtection = () =>
  httpClient.get('/sanctum/csrf-cookie')

export const authApi = {
  async register(payload) {
    await initializeCsrfProtection()
    const response = await httpClient.post('/api/auth/register', payload)

    return response.data
  },

  async login(payload) {
    await initializeCsrfProtection()
    const response = await httpClient.post('/api/auth/login', payload)

    return response.data
  },

  async getCurrentUser() {
    const response = await httpClient.get('/api/auth/me')

    return response.data
  },

  async logout() {
    await initializeCsrfProtection()
    const response = await httpClient.post('/api/auth/logout')

    return response.data
  },
}
