import express from 'express'
import rateLimit from 'express-rate-limit'
import {
  recordView,
  recordProjectClick,
  getPortfolioAnalytics,
} from '../controllers/analyticsController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()
const publicEventLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Analytics event limit reached. Try again later.' },
})

// Public tracking endpoints (invoked when visitors view or interact with a published portfolio)
router.post('/:portfolioId/view', publicEventLimiter, recordView)
router.post('/:portfolioId/project-click', publicEventLimiter, recordProjectClick)

// Protected analytics dashboard query
router.get('/:portfolioId', protect, getPortfolioAnalytics)

export default router
