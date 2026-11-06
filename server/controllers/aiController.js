import { smartImproveContent } from '../services/aiService.js'

// @desc    Improve project or about me description
// @route   POST /api/ai/improve-description
// @access  Private
export const improveDescription = async (req, res, next) => {
  try {
    const { type, currentText, role, skills, keywords } = req.body

    const improved = await smartImproveContent({
      type: type || 'project_description',
      currentText: currentText || '',
      role: role || 'Software Engineer',
      skills: skills || [],
      keywords: keywords || '',
    })

    res.json({
      success: true,
      result: improved,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Generate professional summary
// @route   POST /api/ai/generate-summary
// @access  Private
export const generateSummary = async (req, res, next) => {
  try {
    const { role, skills, experienceYears } = req.body
    if (typeof role !== 'string' || !role.trim()) {
      return res.status(400).json({ success: false, message: 'Add a professional title before generating a resume summary.' })
    }

    const summary = await smartImproveContent({
      type: 'about_summary',
      currentText: '',
      role: role.trim(),
      skills: skills || [],
      experienceYears,
    })

    res.json({
      success: true,
      summary,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Suggest skills for role
// @route   POST /api/ai/suggest-skills
// @access  Private
export const suggestSkills = async (req, res, next) => {
  try {
    const { role } = req.body
    const suggested = await smartImproveContent({
      type: 'skills_suggestion',
      role: role || 'Full-Stack Developer',
    })

    res.json({
      success: true,
      skills: suggested,
    })
  } catch (error) {
    next(error)
  }
}
