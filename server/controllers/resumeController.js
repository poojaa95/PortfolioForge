import mongoose from 'mongoose'
import Portfolio from '../models/Portfolio.js'
import Resume from '../models/Resume.js'

const SECTION_KEYS = ['summary', 'experience', 'education', 'projects', 'skills', 'certifications', 'achievements', 'languages', 'customSections']

const getPublicPortfolioUrl = (slug) => {
  const appUrl = process.env.CLIENT_URL?.trim()
  if (!appUrl || !slug) return ''
  try {
    const url = new URL(appUrl)
    if (['localhost', '127.0.0.1', '::1'].includes(url.hostname)) return ''
    return new URL(`/u/${encodeURIComponent(slug)}`, url).toString()
  } catch {
    return ''
  }
}
const ARRAY_KEYS = ['experience', 'education', 'projects', 'skills', 'certifications', 'achievements', 'languages', 'customSections']

const legacyResume = (portfolio) => ({
  portfolioId: portfolio._id,
  personalInfo: { ...(portfolio.personalInfo?.toObject?.() || portfolio.personalInfo || {}), website: portfolio.personalInfo?.website || portfolio.socialLinks?.portfolio || '' },
  socialLinks: portfolio.socialLinks?.toObject?.() || portfolio.socialLinks || {},
  summary: portfolio.about?.summary || '',
  experience: portfolio.experience || [],
  education: portfolio.education || [],
  projects: portfolio.projects || [],
  skills: portfolio.skills || [],
  certifications: portfolio.certifications || [],
  achievements: portfolio.achievements || portfolio.awards || [],
  languages: [],
  customSections: [],
  templateStyle: 'modern',
  sectionOrder: SECTION_KEYS,
  sectionVisibility: Object.fromEntries(SECTION_KEYS.map((key) => [key, true])),
})

const loadOwnedPortfolio = async (portfolioId, userId) => {
  if (!mongoose.isValidObjectId(portfolioId)) return null
  return Portfolio.findOne({ _id: portfolioId, userId })
}

const normalizePayload = (body) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw Object.assign(new Error('Resume data must be an object.'), { statusCode: 400 })
  const resume = {}
  if (body.personalInfo !== undefined) {
    if (!body.personalInfo || typeof body.personalInfo !== 'object' || Array.isArray(body.personalInfo)) throw Object.assign(new Error('Personal information must be an object.'), { statusCode: 400 })
    resume.personalInfo = Object.fromEntries(['fullName', 'title', 'email', 'phone', 'location', 'website'].map((key) => [key, String(body.personalInfo[key] || '').trim().slice(0, 240)]))
  }
  if (body.socialLinks !== undefined) {
    if (!body.socialLinks || typeof body.socialLinks !== 'object' || Array.isArray(body.socialLinks)) throw Object.assign(new Error('Social links must be an object.'), { statusCode: 400 })
    resume.socialLinks = Object.fromEntries(['github', 'linkedin'].map((key) => [key, String(body.socialLinks[key] || '').trim().slice(0, 500)]))
  }
  if (body.summary !== undefined) {
    if (typeof body.summary !== 'string' || body.summary.length > 6000) throw Object.assign(new Error('Summary must be text of 6,000 characters or fewer.'), { statusCode: 400 })
    resume.summary = body.summary.trim()
  }
  for (const key of ARRAY_KEYS) {
    if (body[key] === undefined) continue
    if (!Array.isArray(body[key]) || body[key].length > 100) throw Object.assign(new Error(`${key} must be a list with no more than 100 entries.`), { statusCode: 400 })
    resume[key] = body[key]
  }
  if (body.sectionOrder !== undefined) {
    if (!Array.isArray(body.sectionOrder) || body.sectionOrder.some((key) => !SECTION_KEYS.includes(key)) || new Set(body.sectionOrder).size !== body.sectionOrder.length) {
      throw Object.assign(new Error('Section order contains an invalid or duplicate section.'), { statusCode: 400 })
    }
    resume.sectionOrder = body.sectionOrder
  }
  if (body.sectionVisibility !== undefined) {
    if (!body.sectionVisibility || typeof body.sectionVisibility !== 'object' || Array.isArray(body.sectionVisibility)) throw Object.assign(new Error('Section visibility must be an object.'), { statusCode: 400 })
    resume.sectionVisibility = Object.fromEntries(SECTION_KEYS.map((key) => [key, body.sectionVisibility[key] !== false]))
  }
  if (body.templateStyle !== undefined) {
    if (!['modern', 'classic', 'minimal'].includes(body.templateStyle)) throw Object.assign(new Error('Choose a supported resume template.'), { statusCode: 400 })
    resume.templateStyle = body.templateStyle
  }
  return resume
}

// Backward-compatible migration: old users read from Portfolio until they save
// resume-specific changes. GET is deliberately read-only and creates no data.
export const getResume = async (req, res, next) => {
  try {
    const portfolio = await loadOwnedPortfolio(req.params.portfolioId, req.user._id)
    if (!portfolio) return res.status(404).json({ success: false, message: 'Portfolio not found' })
    const saved = await Resume.findOne({ portfolioId: portfolio._id, userId: req.user._id }).lean()
    const base = legacyResume(portfolio)
    if (saved) {
      return res.json({ success: true, source: 'saved_resume', resume: { ...base, ...saved, personalInfo: saved.personalInfo, socialLinks: saved.socialLinks } })
    }
    return res.json({ success: true, source: 'portfolio_legacy', resume: base })
  } catch (error) {
    next(error)
  }
}

export const saveResume = async (req, res, next) => {
  try {
    const portfolio = await loadOwnedPortfolio(req.params.portfolioId, req.user._id)
    if (!portfolio) return res.status(404).json({ success: false, message: 'Portfolio not found' })
    const update = normalizePayload(req.body)
    const filter = { portfolioId: portfolio._id, userId: req.user._id }
    const existing = await Resume.findOne(filter).lean()
    const seed = existing || legacyResume(portfolio)
    const insertSeed = Object.fromEntries(Object.entries(seed).filter(([key]) => !['_id', 'userId', 'portfolioId', 'createdAt', 'updatedAt', '__v'].includes(key) && update[key] === undefined))
    const saved = await Resume.findOneAndUpdate(
      filter,
      { $setOnInsert: { ...insertSeed, userId: req.user._id, portfolioId: portfolio._id }, $set: update },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    ).lean()
    res.json({ success: true, message: 'Resume saved successfully', resume: saved })
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') return res.status(400).json({ success: false, message: 'Resume data is invalid. Check each section and try again.' })
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'Resume was saved in another request. Reload and try again.' })
    next(error)
  }
}

// @desc Generate resume formatted data from saved resume fields with a legacy fallback
// @route POST /api/resume/generate
// @access Private
export const generateResume = async (req, res, next) => {
  try {
    const { portfolioId } = req.body
    const portfolio = await loadOwnedPortfolio(portfolioId, req.user._id)
    if (!portfolio) return res.status(404).json({ success: false, message: 'Portfolio not found' })
    const saved = await Resume.findOne({ portfolioId: portfolio._id, userId: req.user._id }).lean()
    const source = saved ? { ...legacyResume(portfolio), ...saved } : legacyResume(portfolio)
    const personalInfo = source.personalInfo || {}
    const socialLinks = source.socialLinks || {}
    const resumeData = {
      header: {
        name: personalInfo.fullName || '', title: personalInfo.title || '', email: personalInfo.email || '',
        phone: personalInfo.phone || '', location: personalInfo.location || '', website: personalInfo.website || '',
        github: socialLinks.github || '', linkedin: socialLinks.linkedin || '', portfolioUrl: getPublicPortfolioUrl(portfolio.slug),
      },
      summary: source.summary ?? portfolio.about?.summary ?? '',
      skills: source.skills || [], experience: source.experience || [], education: source.education || [],
      projects: source.projects || [], certifications: source.certifications || [], achievements: source.achievements || [],
      languages: source.languages || [], customSections: source.customSections || [],
      sectionOrder: source.sectionOrder || SECTION_KEYS, sectionVisibility: source.sectionVisibility || {},
      templateStyle: source.templateStyle || 'modern', generatedAt: new Date(),
    }
    res.json({ success: true, resume: resumeData })
  } catch (error) {
    next(error)
  }
}
