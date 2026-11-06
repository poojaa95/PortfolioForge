import Portfolio from '../models/Portfolio.js'
import PortfolioVersion from '../models/PortfolioVersion.js'
import Analytics from '../models/Analytics.js'
import Resume from '../models/Resume.js'
import { TEMPLATES } from '../utils/templatesData.js'

// Helper to sanitize slug
const sanitizeSlug = (slug) => {
  return slug
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-') // Replace spaces and non-word chars with -
    .replace(/^-+|-+$/g, '') // Remove leading/trailing -
}

// @desc    Create a new portfolio
// @route   POST /api/portfolios
// @access  Private
export const createPortfolio = async (req, res, next) => {
  try {
    const {
      title,
      slug,
      templateId = 'minimal',
      personalInfo = {},
      about = {},
      education = [],
      skills = [],
      projects = [],
      experience = [],
      certifications = [],
      socialLinks = {},
      theme = {},
      sectionOrder,
      sectionVisibility,
      visibility = 'public',
    } = req.body

    const selectedTemplate = TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0]

    // Formulate a slug if not explicitly passed or clean it up
    let cleanSlug = sanitizeSlug(
      slug ||
        personalInfo.fullName ||
        req.user.name ||
        `portfolio-${Math.floor(1000 + Math.random() * 9000)}`
    )

    if (!cleanSlug) {
      cleanSlug = `portfolio-${Date.now().toString().slice(-6)}`
    }

    // Resolve collisions deterministically before insert; the unique index remains
    // the final guard if two concurrent requests race.
    const baseSlug = cleanSlug
    let suffix = 2
    while (await Portfolio.exists({ slug: cleanSlug })) cleanSlug = `${baseSlug}-${suffix++}`

    const portfolio = await Portfolio.create({
      userId: req.user._id,
      title: title?.trim() || 'My Portfolio',
      slug: cleanSlug,
      templateId,
      personalInfo,
      about,
      education,
      skills,
      projects,
      experience,
      certifications,
      socialLinks,
      theme: {
        ...selectedTemplate.theme,
        ...theme,
      },
      sectionOrder: sectionOrder || ['hero', 'about', 'experience', 'projects', 'skills', 'education', 'certifications', 'contact'],
      sectionVisibility: sectionVisibility || {
        hero: true,
        about: true,
        experience: true,
        projects: true,
        skills: true,
        education: true,
        certifications: true,
        contact: true,
      },
      visibility,
      published: false,
    })

    // Create initial version snapshot
    await PortfolioVersion.create({
      portfolioId: portfolio._id,
      versionNumber: 1,
      title: 'Initial Version',
      snapshot: portfolio.toObject(),
    })

    res.status(201).json({
      success: true,
      message: 'Portfolio created successfully',
      portfolio,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Get all portfolios for current user
// @route   GET /api/portfolios
// @access  Private
export const getPortfolios = async (req, res, next) => {
  try {
    const portfolios = await Portfolio.find({ userId: req.user._id }).sort({ updatedAt: -1 })

    // Attach basic analytics summary to each portfolio for dashboard cards
    const portfolioListWithStats = await Promise.all(
      portfolios.map(async (p) => {
        const totalViews = await Analytics.countDocuments({ portfolioId: p._id, event: 'view' })
        const totalClicks = await Analytics.countDocuments({ portfolioId: p._id, event: 'project_click' })
        return {
          ...p.toObject(),
          stats: {
            views: totalViews,
            projectClicks: totalClicks,
          },
        }
      })
    )

    res.json({
      success: true,
      count: portfolioListWithStats.length,
      portfolios: portfolioListWithStats,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Get single portfolio by ID
// @route   GET /api/portfolios/:id
// @access  Private
export const getPortfolioById = async (req, res, next) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id)

    if (!portfolio) {
      return res.status(404).json({ success: false, message: 'Portfolio not found' })
    }

    if (portfolio.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this portfolio' })
    }

    res.json({
      success: true,
      portfolio,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Update portfolio
// @route   PUT /api/portfolios/:id
// @access  Private
export const updatePortfolio = async (req, res, next) => {
  try {
    let portfolio = await Portfolio.findById(req.params.id)

    if (!portfolio) {
      return res.status(404).json({ success: false, message: 'Portfolio not found' })
    }

    if (portfolio.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized to modify this portfolio' })
    }

    const { slug, ...updateData } = req.body

    // If slug is changing, validate uniqueness
    if (slug && slug !== portfolio.slug) {
      const cleanSlug = sanitizeSlug(slug)
      if (cleanSlug.length < 3) {
        return res.status(400).json({ success: false, message: 'Slug must be at least 3 characters long' })
      }
      const existingSlug = await Portfolio.findOne({ slug: cleanSlug, _id: { $ne: portfolio._id } })
      if (existingSlug) {
        return res.status(400).json({ success: false, message: 'This public URL slug is already taken. Please pick another.' })
      }
      portfolio.slug = cleanSlug
    }

    // Merge allowed fields
    const allowedFields = [
      'title',
      'templateId',
      'personalInfo',
      'about',
      'education',
      'skills',
      'projects',
      'experience',
      'certifications',
      'socialLinks',
      'theme',
      'sectionOrder',
      'sectionVisibility',
      'visibility',
      'seo',
    ]

    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        portfolio[field] = updateData[field]
      }
    })

    await portfolio.save()

    // Create a snapshot version every 10 updates or when requested
    if (req.body.saveSnapshot) {
      const versionCount = await PortfolioVersion.countDocuments({ portfolioId: portfolio._id })
      await PortfolioVersion.create({
        portfolioId: portfolio._id,
        versionNumber: versionCount + 1,
        title: req.body.snapshotTitle || `Snapshot ${versionCount + 1}`,
        snapshot: portfolio.toObject(),
      })
    }

    res.json({
      success: true,
      message: 'Portfolio updated successfully',
      portfolio,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Delete portfolio
// @route   DELETE /api/portfolios/:id
// @access  Private
export const deletePortfolio = async (req, res, next) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id)

    if (!portfolio) {
      return res.status(404).json({ success: false, message: 'Portfolio not found' })
    }

    if (portfolio.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this portfolio' })
    }

    await Analytics.deleteMany({ portfolioId: portfolio._id })
    await PortfolioVersion.deleteMany({ portfolioId: portfolio._id })
    await Resume.deleteOne({ portfolioId: portfolio._id, userId: req.user._id })
    await Portfolio.findByIdAndDelete(portfolio._id)

    res.json({
      success: true,
      message: 'Portfolio and all associated analytics deleted successfully',
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Publish portfolio
// @route   POST /api/portfolios/:id/publish
// @access  Private
export const publishPortfolio = async (req, res, next) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id)

    if (!portfolio) {
      return res.status(404).json({ success: false, message: 'Portfolio not found' })
    }

    if (portfolio.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized action' })
    }

    portfolio.published = true
    portfolio.publishedAt = new Date()
    await portfolio.save()

    // Save a published version snapshot
    const versionCount = await PortfolioVersion.countDocuments({ portfolioId: portfolio._id })
    await PortfolioVersion.create({
      portfolioId: portfolio._id,
      versionNumber: versionCount + 1,
      title: `Published Version (${new Date().toLocaleDateString()})`,
      snapshot: portfolio.toObject(),
    })

    res.json({
      success: true,
      message: 'Portfolio published successfully! It is now live on your public URL.',
      portfolio,
      publicUrl: `/u/${portfolio.slug}`,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Unpublish portfolio
// @route   POST /api/portfolios/:id/unpublish
// @access  Private
export const unpublishPortfolio = async (req, res, next) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id)

    if (!portfolio) {
      return res.status(404).json({ success: false, message: 'Portfolio not found' })
    }

    if (portfolio.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized action' })
    }

    portfolio.published = false
    await portfolio.save()

    res.json({
      success: true,
      message: 'Portfolio unpublished. It is no longer publicly visible.',
      portfolio,
    })
  } catch (error)
    {
    next(error)
  }
}

// @desc    Duplicate portfolio
// @route   POST /api/portfolios/:id/duplicate
// @access  Private
export const duplicatePortfolio = async (req, res, next) => {
  try {
    const source = await Portfolio.findById(req.params.id)

    if (!source) {
      return res.status(404).json({ success: false, message: 'Source portfolio not found' })
    }

    if (source.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized to duplicate this portfolio' })
    }

    const obj = source.toObject()
    delete obj._id
    delete obj.createdAt
    delete obj.updatedAt
    obj.title = `${source.title} (Copy)`
    const copyBase = `${source.slug}-copy`
    obj.slug = copyBase
    let copyIndex = 2
    while (await Portfolio.exists({ slug: obj.slug })) obj.slug = `${copyBase}-${copyIndex++}`
    obj.published = false
    obj.publishedAt = null

    const duplicate = await Portfolio.create(obj)
    await PortfolioVersion.create({ portfolioId: duplicate._id, versionNumber: 1, title: 'Duplicated from source', snapshot: duplicate.toObject() })

    res.status(201).json({
      success: true,
      message: 'Portfolio duplicated successfully',
      portfolio: duplicate,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Get version history
// @route   GET /api/portfolios/:id/versions
// @access  Private
export const getPortfolioVersions = async (req, res, next) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id)
    if (!portfolio || portfolio.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: 'Portfolio not found' })
    }

    const versions = await PortfolioVersion.find({ portfolioId: portfolio._id }).sort({ versionNumber: -1 })

    res.json({
      success: true,
      versions,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Restore version
// @route   POST /api/portfolios/:id/restore/:versionId
// @access  Private
export const restorePortfolioVersion = async (req, res, next) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id)
    if (!portfolio || portfolio.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: 'Portfolio not found' })
    }

    const version = await PortfolioVersion.findOne({
      _id: req.params.versionId,
      portfolioId: portfolio._id,
    })

    if (!version) {
      return res.status(404).json({ success: false, message: 'Version snapshot not found' })
    }

    // Retain user's current slug or keep snapshot fields
    const snapshot = JSON.parse(JSON.stringify(version.snapshot))
    delete snapshot._id
    delete snapshot.slug
    delete snapshot.userId

    Object.assign(portfolio, snapshot)
    await portfolio.save()

    const latestVersion = await PortfolioVersion.findOne({ portfolioId: portfolio._id }).sort({ versionNumber: -1 }).select('versionNumber')
    await PortfolioVersion.create({ portfolioId: portfolio._id, versionNumber: (latestVersion?.versionNumber || 0) + 1, title: `Restored from version ${version.versionNumber}`, snapshot: portfolio.toObject() })

    res.json({
      success: true,
      message: `Restored to version ${version.versionNumber} successfully`,
      portfolio,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Check slug availability
// @route   GET /api/portfolios/check-slug/:slug
// @access  Public
export const checkSlug = async (req, res, next) => {
  try {
    const cleanSlug = sanitizeSlug(req.params.slug)
    const existing = await Portfolio.findOne({ slug: cleanSlug })

    res.json({
      success: true,
      slug: cleanSlug,
      available: !existing,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Get public portfolio by slug (accessible without login)
// @route   GET /api/public/:slug
// @access  Public
export const getPublicPortfolio = async (req, res, next) => {
  try {
    const cleanSlug = sanitizeSlug(req.params.slug)
    const portfolio = await Portfolio.findOne({ slug: cleanSlug })

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found with this URL',
      })
    }

    // Check published status
    if (!portfolio.published) {
      return res.status(403).json({
        success: false,
        isUnpublished: true,
        message: 'This portfolio is currently in draft mode and has not been published yet.',
        title: portfolio.title,
      })
    }

    // Check privacy settings
    if (portfolio.visibility === 'private') {
      return res.status(403).json({
        success: false,
        message: 'This portfolio is set to private by the author.',
      })
    }

    res.json({
      success: true,
      portfolio,
    })
  } catch (error) {
    next(error)
  }
}
