import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const uploadDir = path.join(__dirname, '..', 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const ext = file.safeExtension || path.extname(file.originalname).toLowerCase()
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `upload-${uniqueSuffix}${ext}`)
  },
})

export const MAX_UPLOAD_FILE_SIZE = 5 * 1024 * 1024
const allowedExtensions = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
}

export const isSupportedImage = (file) => {
  const extensions = allowedExtensions[file.mimetype]
  const extension = path.extname(file.originalname).toLowerCase()
  return Boolean(extensions?.includes(extension))
}

// File filter validates the declared MIME type and matching extension.
const fileFilter = (req, file, cb) => {
  if (isSupportedImage(file)) {
    const extension = path.extname(file.originalname).toLowerCase()
    file.safeExtension = file.mimetype === 'image/jpeg' ? '.jpg' : extension
    cb(null, true)
  } else {
    cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'), false)
  }
}

export const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_FILE_SIZE },
  fileFilter,
})
