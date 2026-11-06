import api from './api.js'

export const getPortfolios = async () => {
  const response = await api.get('/portfolios')
  return response.data
}

export const getPortfolioById = async (id) => {
  const response = await api.get(`/portfolios/${id}`)
  return response.data
}

export const createPortfolio = async (data) => {
  const response = await api.post('/portfolios', data)
  return response.data
}

export const updatePortfolio = async (id, data) => {
  const response = await api.put(`/portfolios/${id}`, data)
  return response.data
}

export const deletePortfolio = async (id) => {
  const response = await api.delete(`/portfolios/${id}`)
  return response.data
}

export const publishPortfolio = async (id) => {
  const response = await api.post(`/portfolios/${id}/publish`)
  return response.data
}

export const unpublishPortfolio = async (id) => {
  const response = await api.post(`/portfolios/${id}/unpublish`)
  return response.data
}

export const duplicatePortfolio = async (id) => {
  const response = await api.post(`/portfolios/${id}/duplicate`)
  return response.data
}

export const getPortfolioVersions = async (id) => {
  const response = await api.get(`/portfolios/${id}/versions`)
  return response.data
}

export const restorePortfolioVersion = async (id, versionId) => {
  const response = await api.post(`/portfolios/${id}/restore/${versionId}`)
  return response.data
}

export const checkSlugAvailability = async (slug) => {
  const response = await api.get(`/portfolios/check-slug/${encodeURIComponent(slug)}`)
  return response.data
}

export const getPublicPortfolio = async (slug) => {
  const response = await api.get(`/public/${encodeURIComponent(slug)}`)
  return response.data
}
