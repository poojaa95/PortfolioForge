import Analytics from '../models/Analytics.js'
import Portfolio from '../models/Portfolio.js'
import { createHmac } from 'node:crypto'

// Detect device from user-agent
const detectDevice = (ua = '') => {
  const uaLower = ua.toLowerCase()
  if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(uaLower)) {
    return 'mobile'
  }
  if (/ipad|tablet/i.test(uaLower)) {
    return 'tablet'
  }
  return 'desktop'
}

// @desc    Record page view
// @route   POST /api/analytics/:portfolioId/view
// @access  Public
export const recordView = async (req, res, next) => {
  try {
    const { portfolioId } = req.params
    const portfolio = await Portfolio.findById(portfolioId)
    if (!portfolio) {
      return res.status(404).json({ success: false, message: 'Portfolio not found' })
    }
    if (!portfolio.published || portfolio.visibility === 'private') {
      return res.status(404).json({ success: false, message: 'Portfolio not found' })
    }

    const userAgent = req.headers['user-agent'] || ''
    const referrer = req.body.referrer || req.headers['referer'] || 'direct'
    const clientIp = req.ip || req.socket.remoteAddress || 'anonymous'
    // Store a one-way visitor identifier instead of retaining the raw IP.
    const visitorIp = createHmac('sha256', process.env.JWT_SECRET).update(`${clientIp}|${userAgent}`).digest('hex')
    const device = detectDevice(userAgent)

    // Count at most one view per visitor per portfolio in a 30 minute window.
    const recentView = await Analytics.exists({
      portfolioId: portfolio._id,
      event: 'view',
      visitorIp,
      createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) },
    })
    if (recentView) return res.status(200).json({ success: true, message: 'View already recorded recently' })

    await Analytics.create({
      portfolioId: portfolio._id,
      event: 'view',
      visitorIp,
      userAgent: userAgent.slice(0, 200),
      device,
      referrer: referrer.slice(0, 200),
      metadata: req.body.metadata || {},
    })

    res.status(201).json({ success: true, message: 'View recorded' })
  } catch (error) {
    next(error)
  }
}

// @desc    Record project click
// @route   POST /api/analytics/:portfolioId/project-click
// @access  Public
export const recordProjectClick = async (req, res, next) => {
  try {
    const { portfolioId } = req.params
    const { projectTitle, projectId, linkType } = req.body

    const portfolio = await Portfolio.findById(portfolioId)
    if (!portfolio) {
      return res.status(404).json({ success: false, message: 'Portfolio not found' })
    }

    if (!portfolio.published || portfolio.visibility === 'private') {
      return res.status(404).json({ success: false, message: 'Portfolio not found' })
    }
    const project = portfolio.projects.id(projectId)
    if (!project || !['github', 'demo'].includes(linkType || 'demo')) {
      return res.status(400).json({ success: false, message: 'Invalid project interaction' })
    }

    const userAgent = req.headers['user-agent'] || ''
    const clientIp = req.ip || req.socket.remoteAddress || 'anonymous'
    const visitorIp = createHmac('sha256', process.env.JWT_SECRET).update(`${clientIp}|${userAgent}`).digest('hex')
    const device = detectDevice(userAgent)

    await Analytics.create({
      portfolioId: portfolio._id,
      event: 'project_click',
      visitorIp,
      userAgent: userAgent.slice(0, 200),
      device,
      referrer: 'portfolio-internal',
      metadata: {
        projectTitle: project.title || projectTitle || 'Untitled Project',
        projectId: project._id,
        linkType: linkType || 'demo',
      },
    })

    res.status(201).json({ success: true, message: 'Project click recorded' })
  } catch (error) {
    next(error)
  }
}

// @desc    Get analytics for portfolio
// @route   GET /api/analytics/:portfolioId
// @access  Private
export const getPortfolioAnalytics = async (req, res, next) => {
  try {
    const { portfolioId } = req.params

    const portfolio = await Portfolio.findById(portfolioId)
    if (!portfolio) {
      return res.status(404).json({ success: false, message: 'Portfolio not found' })
    }

    if (portfolio.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to analytics' })
    }

    const totalViews = await Analytics.countDocuments({ portfolioId, event: 'view' })
    const totalProjectClicks = await Analytics.countDocuments({ portfolioId, event: 'project_click' })
    const uniqueVisitors = (await Analytics.distinct('visitorIp', { portfolioId, event: 'view' })).length

    // Aggregate in MongoDB to keep response work bounded and provide monthly trends.
    const days = 14
    const chartData = []
    const now = new Date()

    const daily = await Analytics.aggregate([
      { $match: { portfolioId: portfolio._id, createdAt: { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1)) } } },
      { $group: { _id: { day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, event: '$event' }, count: { $sum: 1 } } },
    ])
    const dailyMap = new Map(daily.map((item) => [`${item._id.day}|${item._id.event}`, item.count]))

    for (let i = days - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 0, 0, 0)
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 23, 59, 59)

      const key = start.toISOString().slice(0, 10)
      const dateLabel = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      chartData.push({
        date: dateLabel,
        views: dailyMap.get(`${key}|view`) || 0,
        projectClicks: dailyMap.get(`${key}|project_click`) || 0,
      })
    }

    const monthlyTraffic = await Analytics.aggregate([
      { $match: { portfolioId: portfolio._id, createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 11, 1) } } },
      { $group: { _id: { month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, event: '$event' }, count: { $sum: 1 } } },
      { $sort: { '_id.month': 1 } },
    ])
    const monthlyMap = new Map(monthlyTraffic.map((item) => [`${item._id.month}|${item._id.event}`, item.count]))
    const monthlyData = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1)
      const month = date.toISOString().slice(0, 7)
      return { month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), views: monthlyMap.get(`${month}|view`) || 0, projectClicks: monthlyMap.get(`${month}|project_click`) || 0 }
    })

    // Device breakdown
    const desktopViews = await Analytics.countDocuments({ portfolioId, event: 'view', device: 'desktop' })
    const mobileViews = await Analytics.countDocuments({ portfolioId, event: 'view', device: 'mobile' })
    const tabletViews = await Analytics.countDocuments({ portfolioId, event: 'view', device: 'tablet' })

    const deviceStats = [
      { name: 'Desktop', value: desktopViews || 0, color: '#7c3aed' },
      { name: 'Mobile', value: mobileViews || 0, color: '#06b6d4' },
      { name: 'Tablet', value: tabletViews || 0, color: '#ec4899' },
    ]

    // Project clicks breakdown
    const projectClickEvents = await Analytics.find({
      portfolioId,
      event: 'project_click',
    }).select('metadata')

    const projectCounts = {}
    projectClickEvents.forEach((ev) => {
      const title = ev.metadata?.projectTitle || 'Other Project'
      projectCounts[title] = (projectCounts[title] || 0) + 1
    })

    const projectClickStats = Object.keys(projectCounts).map((key) => ({
      name: key,
      clicks: projectCounts[key],
    })).sort((a, b) => b.clicks - a.clicks).slice(0, 6)

    // Recent events log
    const recentActivity = await Analytics.find({ portfolioId })
      .sort({ createdAt: -1 })
      .limit(12)
      .lean()

    res.json({
      success: true,
      stats: {
        totalViews,
        uniqueVisitors,
        totalProjectClicks,
        clickThroughRate: totalViews > 0 ? ((totalProjectClicks / totalViews) * 100).toFixed(1) + '%' : '0%',
      },
      chartData,
      monthlyData,
      deviceStats,
      projectClickStats,
      recentActivity,
    })
  } catch (error) {
    next(error)
  }
}
