import api from './api.js'

export const uploadImage = async (file) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Choose a JPEG, PNG, WebP, or GIF image.')
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Images must be 5 MB or smaller.')
  }

  const formData = new FormData()
  formData.append('image', file)

  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}
