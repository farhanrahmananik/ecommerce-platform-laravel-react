export function getValidationErrors(error) {
  return error.response?.status === 422 ? error.response.data?.errors || {} : {}
}

export function getApiErrorMessage(error, fallbackMessage) {
  if (error.response?.data?.message) {
    return error.response.data.message
  }

  if (error.request) {
    return 'We could not reach the server. Please check your connection and try again.'
  }

  return error.message || fallbackMessage
}
