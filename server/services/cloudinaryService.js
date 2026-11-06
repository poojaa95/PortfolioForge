import { v2 as cloudinary } from 'cloudinary'
import fs from 'node:fs/promises'

const cloudinaryEnvNames = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']

export const getCloudinaryConfiguration = () => {
  const present = cloudinaryEnvNames.filter((name) => Boolean(process.env[name]?.trim()))
  if (present.length === 0) return { mode: 'local', configured: false }
  if (present.length !== cloudinaryEnvNames.length) {
    return { mode: 'incomplete', configured: false, missing: cloudinaryEnvNames.filter((name) => !process.env[name]?.trim()) }
  }
  return { mode: 'cloudinary', configured: true }
}

const cloudinaryConfiguration = getCloudinaryConfiguration()
if (cloudinaryConfiguration.mode === 'cloudinary') {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
}

export const processUploadedFile = async (req, file) => {
  if (!file) return null

  if (cloudinaryConfiguration.mode === 'incomplete') {
    await fs.unlink(file.path).catch(() => {})
    throw Object.assign(
      new Error(`Cloudinary configuration is incomplete. Set ${cloudinaryConfiguration.missing.join(', ')} or leave all Cloudinary settings empty to use local storage.`),
      { statusCode: 503 }
    )
  }

  if (cloudinaryConfiguration.mode === 'cloudinary') {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'portfolioforge',
        resource_type: 'image',
      })
      await fs.unlink(file.path).catch(() => {})
      return result.secure_url
    } catch {
      await fs.unlink(file.path).catch(() => {})
      // Never silently downgrade a configured Cloudinary upload to ephemeral
      // local storage; let the client explain that the upload did not finish.
      throw Object.assign(new Error('Cloudinary upload failed. Please try again later.'), { statusCode: 502 })
    }
  }

  const baseUrl = `${req.protocol}://${req.get('host')}`
  return `${baseUrl}/uploads/${file.filename}`
}
