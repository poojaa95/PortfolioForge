import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'
import connectDB from './config/db.js'

import authRoutes from './routes/authRoutes.js'
import portfolioRoutes from './routes/portfolioRoutes.js'
import analyticsRoutes from './routes/analyticsRoutes.js'
import templateRoutes from './routes/templateRoutes.js'
import publicRoutes from './routes/publicRoutes.js'
import aiRoutes from './routes/aiRoutes.js'
import resumeRoutes from './routes/resumeRoutes.js'
import uploadRoutes from './routes/uploadRoutes.js'
import { notFound, errorHandler } from './middleware/errorMiddleware.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 5000

// Render terminates TLS and forwards the original client IP through one proxy.
// Do not trust proxy headers from direct clients outside production.
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1)

const configuredOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean)
const isLocalDevelopmentOrigin = (origin) => {
  try {
    const url = new URL(origin)
    return ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) && ['http:', 'https:'].includes(url.protocol)
  } catch {
    return false
  }
}

// Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  if (process.env.NODE_ENV === 'production' && req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  next()
})
app.use(
  cors({
    origin: (origin, callback) => {
      // Non-browser clients commonly omit Origin; browser origins must be configured
      // or be a localhost origin during development.
      if (!origin || configuredOrigins.includes(origin.replace(/\/$/, '')) ||
        (process.env.NODE_ENV !== 'production' && isLocalDevelopmentOrigin(origin))) {
        return callback(null, true)
      }
      return callback(new Error('Origin is not allowed by CORS'))
    },
    credentials: true,
  })
)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Serve uploaded static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Health check
app.get('/api/health', (req, res) => {
  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting']
  const database = dbStates[mongoose.connection.readyState] || 'unknown'
  res.status(mongoose.connection.readyState === 1 ? 200 : 503).json({
    status: mongoose.connection.readyState === 1 ? 'ok' : 'unavailable',
    app: 'PortfolioForge API',
    database,
    timestamp: new Date().toISOString(),
  })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/portfolios', portfolioRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/templates', templateRoutes)
app.use('/api/public', publicRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/resume', resumeRoutes)
app.use('/api/upload', uploadRoutes)

// Error handling middleware
app.use(notFound)
app.use(errorHandler)

// Connect to MongoDB and start the server
const startServer = async () => {
  try {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || /^(replace|your|change|portfolioforge)/i.test(process.env.JWT_SECRET)) {
      throw new Error('JWT_SECRET must be set to a non-placeholder value of at least 32 characters')
    }
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not configured')
    }
    await connectDB()
    const onListening = () => {
      console.log(`PortfolioForge server running on port ${PORT}`)
    }
    const server = process.env.NODE_ENV === 'production'
      ? app.listen(PORT, '0.0.0.0', onListening)
      : app.listen(PORT, onListening)

    const shutdown = (signal) => {
      console.log(`${signal} received; closing server`)
      server.close(async (error) => {
        if (error) {
          console.error(`Server shutdown failed: ${error.message}`)
          process.exitCode = 1
        }
        await mongoose.disconnect()
      })
    }
    process.once('SIGINT', () => shutdown('SIGINT'))
    process.once('SIGTERM', () => shutdown('SIGTERM'))
  } catch (err) {
    console.error(`PortfolioForge startup failed: ${err.message}`)
    process.exitCode = 1
  }
}

startServer()
