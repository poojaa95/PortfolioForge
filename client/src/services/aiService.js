import api from './api.js'

export const improveContent = async ({ type, currentText, role, skills, keywords }) => {
  const response = await api.post('/ai/improve-description', {
    type,
    currentText,
    role,
    skills,
    keywords,
  })
  return response.data
}

export const generateSummary = async ({ role, skills, experienceYears }) => {
  const response = await api.post('/ai/generate-summary', {
    role,
    skills,
    experienceYears,
  })
  return response.data
}

export const suggestSkills = async ({ role }) => {
  const response = await api.post('/ai/suggest-skills', { role })
  return response.data
}
