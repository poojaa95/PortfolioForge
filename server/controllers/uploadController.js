import { processUploadedFile } from '../services/cloudinaryService.js'
import fs from 'node:fs/promises'

const hasValidImageSignature = async (file) => {
  const buffer = await fs.readFile(file.path)
  if (file.mimetype === 'image/jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
  if (file.mimetype === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  if (file.mimetype === 'image/gif') return buffer.subarray(0, 6).toString('ascii').match(/^GIF8[79]a$/) !== null
  if (file.mimetype === 'image/webp') return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  return false
}

// @desc    Upload an image (profile photo or project image)
// @route   POST /api/upload
// @access  Private
export const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please provide an image file to upload' })
    }

    if (!(await hasValidImageSignature(req.file))) {
      await fs.unlink(req.file.path).catch(() => {})
      return res.status(400).json({ success: false, message: 'The uploaded file contents do not match a supported image format.' })
    }

    const fileUrl = await processUploadedFile(req, req.file)

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      url: fileUrl,
      fileName: req.file.filename,
    })
  } catch (error) {
    next(error)
  }
}
