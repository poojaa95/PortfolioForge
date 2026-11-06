import api from './api.js'

export const getPortfolioAnalytics = async (portfolioId) => {
  const response = await api.get(`/analytics/${portfolioId}`)
  return response.data
}

export const recordPageView = async (portfolioId, referrer = '') => {
  try {
    const response = await api.post(`/analytics/${portfolioId}/view`, { referrer })
    return response.data
  } catch (err) {
    // Analytics failures shouldn't break user view
    console.warn('Analytics view record notice:', err.message)
    return null
  }
}

export const recordProjectClick = async (portfolioId, projectData) => {
  try {
    const response = await api.post(`/analytics/${portfolioId}/project-click`, projectData)
    return response.data
  } catch (err) {
    console.warn('Analytics project click record notice:', err.message)
    return null
  }
}
