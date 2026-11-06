import express from 'express'
import { getPublicPortfolio } from '../controllers/portfolioController.js'

const router = express.Router()

// Accessible without authentication: GET /api/public/:slug
router.get('/:slug', getPublicPortfolio)

export default router
