import api from './api.js'

export const generateResumeData = async (portfolioId, templateStyle = 'modern') => {
  const response = await api.post('/resume/generate', { portfolioId, templateStyle })
  return response.data
}

export const getResume = async (portfolioId) => {
  const response = await api.get(`/resume/${encodeURIComponent(portfolioId)}`)
  return response.data
}

export const saveResume = async (portfolioId, data) => {
  const response = await api.put(`/resume/${encodeURIComponent(portfolioId)}`, data)
  return response.data
}
