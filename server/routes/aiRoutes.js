import express from 'express'
import rateLimit from 'express-rate-limit'
import { improveDescription, generateSummary, suggestSkills } from '../controllers/aiController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'AI request limit reached. Try again later.' },
})

router.post('/improve-description', protect, aiLimiter, improveDescription)
router.post('/generate-summary', protect, aiLimiter, generateSummary)
router.post('/suggest-skills', protect, aiLimiter, suggestSkills)

export default router
