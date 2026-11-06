export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`)
  res.status(404)
  next(error)
}

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode)
  let message = err.message

  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413
    message = 'Image files must be 5 MB or smaller.'
  } else if (err.name === 'MulterError' || message.startsWith('Only JPEG, PNG, WebP')) {
    statusCode = 400
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404
    message = 'Resource not found with the requested ID'
  }

  // Mongoose duplicate key error (e.g., unique email or slug)
  if (err.code === 11000) {
    statusCode = 400
    const field = Object.keys(err.keyValue || {})[0] || 'Field'
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists. Please choose another.`
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ')
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  })
}
