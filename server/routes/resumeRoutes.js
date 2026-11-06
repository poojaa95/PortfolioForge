import express from 'express'
import { generateResume, getResume, saveResume } from '../controllers/resumeController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/generate', protect, generateResume)
router.get('/:portfolioId', protect, getResume)
router.put('/:portfolioId', protect, saveResume)

export default router
