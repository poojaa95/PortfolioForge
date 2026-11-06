import express from 'express'
import {
  createPortfolio,
  getPortfolios,
  getPortfolioById,
  updatePortfolio,
  deletePortfolio,
  publishPortfolio,
  unpublishPortfolio,
  duplicatePortfolio,
  getPortfolioVersions,
  restorePortfolioVersion,
  checkSlug,
} from '../controllers/portfolioController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

// Public slug check
router.get('/check-slug/:slug', checkSlug)

// Protected CRUD & operations
router.route('/').post(protect, createPortfolio).get(protect, getPortfolios)

router.route('/:id').get(protect, getPortfolioById).put(protect, updatePortfolio).delete(protect, deletePortfolio)

router.post('/:id/publish', protect, publishPortfolio)
router.post('/:id/unpublish', protect, unpublishPortfolio)
router.post('/:id/duplicate', protect, duplicatePortfolio)
router.get('/:id/versions', protect, getPortfolioVersions)
router.post('/:id/restore/:versionId', protect, restorePortfolioVersion)

export default router
