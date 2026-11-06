import { TEMPLATES } from '../utils/templatesData.js'

// @desc    Get all templates
// @route   GET /api/templates
// @access  Public
export const getTemplates = (req, res) => {
  res.json({
    success: true,
    count: TEMPLATES.length,
    templates: TEMPLATES,
  })
}

// @desc    Get template by ID
// @route   GET /api/templates/:id
// @access  Public
export const getTemplateById = (req, res) => {
  const template = TEMPLATES.find((t) => t.id === req.params.id)
  if (!template) {
    return res.status(404).json({ success: false, message: 'Template not found' })
  }

  res.json({
    success: true,
    template,
  })
}
