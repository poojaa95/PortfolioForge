import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { v2 as cloudinary } from 'cloudinary'
import { getCloudinaryConfiguration, processUploadedFile } from './services/cloudinaryService.js'
import { isSupportedImage, MAX_UPLOAD_FILE_SIZE } from './middleware/uploadMiddleware.js'

const originalEnv = Object.fromEntries(['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'].map((name) => [name, process.env[name]]))

try {
  for (const name of Object.keys(originalEnv)) delete process.env[name]
  assert.deepEqual(getCloudinaryConfiguration(), { mode: 'local', configured: false })

  const testUpload = await processUploadedFile(
    { protocol: 'http', get: () => '127.0.0.1:5000' },
    { path: 'unused-by-local-fallback', filename: 'upload-test.png' }
  )
  assert.equal(testUpload, 'http://127.0.0.1:5000/uploads/upload-test.png')

  process.env.CLOUDINARY_CLOUD_NAME = 'not-a-real-cloud'
  const partial = getCloudinaryConfiguration()
  assert.equal(partial.mode, 'incomplete')
  assert.deepEqual(partial.missing.sort(), ['CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'])

  const partialModule = await import('./services/cloudinaryService.js?partial-config-test')
  const partialTemp = path.join(path.dirname(fileURLToPath(import.meta.url)), 'uploads', `cloudinary-partial-test-${Date.now()}.png`)
  await fs.writeFile(partialTemp, 'test image bytes')
  await assert.rejects(
    partialModule.processUploadedFile({}, { path: partialTemp, filename: path.basename(partialTemp) }),
    (error) => error.statusCode === 503 && /CLOUDINARY_API_KEY/.test(error.message) && /CLOUDINARY_API_SECRET/.test(error.message)
  )
  await assert.rejects(fs.access(partialTemp))

  assert.equal(isSupportedImage({ mimetype: 'image/jpeg', originalname: 'photo.JPG' }), true)
  assert.equal(isSupportedImage({ mimetype: 'image/png', originalname: 'photo.png' }), true)
  assert.equal(isSupportedImage({ mimetype: 'image/webp', originalname: 'photo.webp' }), true)
  assert.equal(isSupportedImage({ mimetype: 'image/gif', originalname: 'photo.gif' }), true)
  assert.equal(isSupportedImage({ mimetype: 'image/svg+xml', originalname: 'photo.svg' }), false)
  assert.equal(isSupportedImage({ mimetype: 'image/png', originalname: 'photo.jpg' }), false)
  assert.equal(MAX_UPLOAD_FILE_SIZE, 5 * 1024 * 1024)

  process.env.CLOUDINARY_API_KEY = 'test-only-not-a-real-key'
  process.env.CLOUDINARY_API_SECRET = 'test-only-not-a-real-secret'
  const configuredModule = await import('./services/cloudinaryService.js?configured-upload-test')
  const originalCloudinaryUpload = cloudinary.uploader.upload
  const serverDirectory = path.dirname(fileURLToPath(import.meta.url))
  const tempFile = (name) => path.join(serverDirectory, 'uploads', name)
  const successfulTemp = tempFile(`cloudinary-test-${Date.now()}.png`)
  await fs.writeFile(successfulTemp, 'test image bytes')
  cloudinary.uploader.upload = async () => ({ secure_url: 'https://res.cloudinary.com/test-only/image/upload/portfolioforge/test.png' })
  const uploadedUrl = await configuredModule.processUploadedFile({}, { path: successfulTemp, filename: path.basename(successfulTemp) })
  assert.match(uploadedUrl, /^https:\/\/res\.cloudinary\.com\//)
  await assert.rejects(fs.access(successfulTemp))

  const failedTemp = tempFile(`cloudinary-failure-test-${Date.now()}.png`)
  await fs.writeFile(failedTemp, 'test image bytes')
  cloudinary.uploader.upload = async () => { throw new Error('provider detail must not leak') }
  await assert.rejects(
    configuredModule.processUploadedFile({}, { path: failedTemp, filename: path.basename(failedTemp) }),
    (error) => error.statusCode === 502 && /Cloudinary upload failed/.test(error.message) && !error.message.includes('provider detail')
  )
  await assert.rejects(fs.access(failedTemp))
  cloudinary.uploader.upload = originalCloudinaryUpload

  console.log('PASS: local mode, partial configuration detection, supported/rejected file types, 5 MiB cap, mocked Cloudinary success URL, failure response and temp-file cleanup')
} finally {
  for (const [name, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[name]
    else process.env[name] = value
  }
}
