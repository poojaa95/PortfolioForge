import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import {
  getPortfolios,
  deletePortfolio,
  publishPortfolio,
  unpublishPortfolio,
  duplicatePortfolio,
} from '../services/portfolioService.js'
import {
  FolderKanban,
  Globe,
  Eye,
  MousePointerClick,
  Plus,
  Edit3,
  Copy,
  Share2,
  Trash2,
  Sparkles,
  BarChart3,
  FileText,
  Palette,
  Check,
  Power,
  Layers,
} from 'lucide-react'
import Loader from '../components/common/Loader.jsx'
import ShareModal from '../components/common/ShareModal.jsx'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const { user } = useAuth()
  const [portfolios, setPortfolios] = useState([])
  const [loading, setLoading] = useState(true)
  const [sharePortfolio, setSharePortfolio] = useState(null)
  const [copiedSlug, setCopiedSlug] = useState(null)

  const fetchPortfolios = async () => {
    try {
      setLoading(true)
      const res = await getPortfolios()
      if (res.success) {
        setPortfolios(res.portfolios || [])
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load your portfolios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPortfolios()
  }, [])

  const handleTogglePublish = async (portfolio) => {
    try {
      if (portfolio.published) {
        await unpublishPortfolio(portfolio._id)
        toast.success(`"${portfolio.title}" unpublished`)
      } else {
        await publishPortfolio(portfolio._id)
        toast.success(`"${portfolio.title}" is now live on your public URL!`)
      }
      fetchPortfolios()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update publish state')
    }
  }

  const handleDuplicate = async (id) => {
    try {
      await duplicatePortfolio(id)
      toast.success('Portfolio duplicated!')
      fetchPortfolios()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to duplicate portfolio')
    }
  }

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) return
    try {
      await deletePortfolio(id)
      toast.success('Portfolio deleted')
      fetchPortfolios()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete portfolio')
    }
  }

  const handleCopyLink = async (slug) => {
    const url = `${window.location.origin}/u/${slug}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedSlug(slug)
      toast.success('Public URL copied to clipboard!')
      setTimeout(() => setCopiedSlug(null), 2500)
    } catch {
      toast.error('Could not copy the URL. You can copy it from the portfolio preview page.')
    }
  }

  // Aggregate stats across portfolios
  const totalPortfolios = portfolios.length
  const publishedCount = portfolios.filter((p) => p.published).length
  const totalViews = portfolios.reduce((acc, p) => acc + (p.stats?.views || 0), 0)
  const totalClicks = portfolios.reduce((acc, p) => acc + (p.stats?.projectClicks || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-xs">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-purple-600 mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Creator Workspace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Welcome back, {user?.name || 'Creator'}!
            </h1>
            <p className="text-sm text-gray-500 font-light mt-0.5">
              Manage your websites, inspect visitor activity, and customize your templates.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/wizard"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-200 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Portfolio</span>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Portfolios</span>
              <FolderKanban className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-black text-gray-900">{totalPortfolios}</p>
            <p className="text-xs text-gray-400">Created in your account</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Published Live</span>
              <Globe className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-3xl font-black text-gray-900">{publishedCount}</p>
            <p className="text-xs text-emerald-600 font-medium">Publicly accessible</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Visitors</span>
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-black text-gray-900">{totalViews}</p>
            <p className="text-xs text-gray-400">Recorded page views</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Project Clicks</span>
              <MousePointerClick className="w-5 h-5 text-pink-600" />
            </div>
            <p className="text-3xl font-black text-gray-900">{totalClicks}</p>
            <p className="text-xs text-gray-400">Recorded project interactions</p>
          </div>
        </div>

        {/* Quick Actions Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/wizard"
            className="p-4 rounded-2xl bg-white border border-gray-100 hover:border-purple-200 hover:shadow-xs transition-all flex items-center space-x-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">Step Wizard</p>
              <p className="text-[11px] text-gray-400">7-step creation</p>
            </div>
          </Link>

          <Link
            to="/templates"
            className="p-4 rounded-2xl bg-white border border-gray-100 hover:border-purple-200 hover:shadow-xs transition-all flex items-center space-x-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">Templates</p>
              <p className="text-[11px] text-gray-400">6 curated designs</p>
            </div>
          </Link>

          <Link
            to="/analytics"
            className="p-4 rounded-2xl bg-white border border-gray-100 hover:border-purple-200 hover:shadow-xs transition-all flex items-center space-x-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">Analytics</p>
              <p className="text-[11px] text-gray-400">Traffic & insights</p>
            </div>
          </Link>

          <Link
            to="/resume"
            className="p-4 rounded-2xl bg-white border border-gray-100 hover:border-purple-200 hover:shadow-xs transition-all flex items-center space-x-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">Resume Builder</p>
              <p className="text-[11px] text-gray-400">Export PDF resume</p>
            </div>
          </Link>
        </div>

        {/* Portfolios Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">My Portfolios</h2>
            <span className="text-xs text-gray-500 font-medium">
              {portfolios.length} {portfolios.length === 1 ? 'Portfolio' : 'Portfolios'}
            </span>
          </div>

          {loading ? (
            <div className="bg-white rounded-3xl p-12 border border-gray-100 text-center">
              <Loader text="Loading your portfolios..." />
            </div>
          ) : portfolios.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-gray-100 text-center max-w-lg mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                <FolderKanban className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No portfolios created yet</h3>
              <p className="text-sm text-gray-500 font-light">
                Launch your digital identity in 2 minutes. Pick a template and customize your information with live preview.
              </p>
              <div className="pt-2">
                <Link
                  to="/wizard"
                  className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-200"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Your First Portfolio</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {portfolios.map((item) => (
                <div
                  key={item._id}
                  className="bg-white rounded-2xl border border-gray-200/80 hover:border-purple-300 hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden group"
                >
                  {/* Card Header & Status */}
                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-600">
                        {({ minimal: 'Minimal Editorial', developer: 'Modern Developer', creative: 'Creative Designer', student: 'Student & Fresher', corporate: 'Corporate Professional', dark: 'Dark Tech' })[item.templateId] || 'Minimal Editorial'}
                      </span>
                      <div className="flex items-center space-x-2">
                        {item.published ? (
                          <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Published</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            Draft
                          </span>
                        )}
                        <span className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-medium text-gray-500 capitalize">{item.visibility || 'public'}</span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-[11px] text-gray-400">Updated {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'date unavailable'}</p>
                      {(item.personalInfo?.title || item.personalInfo?.fullName) && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                          {[item.personalInfo?.title, item.personalInfo?.fullName].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>

                    {/* Slug & Copy Link */}
                    <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between text-xs font-mono text-gray-600">
                      <span className="truncate">{item.published && item.visibility !== 'private' ? `/u/${item.slug}` : `Slug: ${item.slug}`}</span>
                      {item.published && item.visibility !== 'private' && <button
                        onClick={() => handleCopyLink(item.slug)}
                        title="Copy public portfolio link"
                        aria-label={`Copy public link for ${item.title}`}
                        className="text-gray-400 hover:text-purple-600 transition-colors p-1"
                      >
                        {copiedSlug === item.slug ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>}
                    </div>

                    {/* Quick Stats Pill */}
                    <div className="grid grid-cols-2 gap-2 text-center text-xs font-medium">
                      <div className="p-2 rounded-lg bg-purple-50/50 text-purple-700">
                        <span className="font-bold">{item.stats?.views || 0}</span> views
                      </div>
                      <div className="p-2 rounded-lg bg-pink-50/50 text-pink-700">
                        <span className="font-bold">{item.stats?.projectClicks || 0}</span> clicks
                      </div>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="px-5 py-3 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/editor/${item._id}`}
                        className="inline-flex items-center space-x-1 text-purple-600 hover:text-purple-700 py-1 px-2 rounded-lg hover:bg-purple-50"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </Link>

                      <Link
                        to={item.published && item.visibility !== 'private' ? `/u/${item.slug}` : `/editor/${item._id}`}
                        target={item.published && item.visibility !== 'private' ? '_blank' : undefined}
                        rel={item.published && item.visibility !== 'private' ? 'noreferrer' : undefined}
                        className="inline-flex items-center space-x-1 text-gray-600 hover:text-gray-900 py-1 px-2 rounded-lg hover:bg-gray-100"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </Link>

                      <button
                        onClick={() => setSharePortfolio(item)}
                        className="inline-flex items-center space-x-1 text-gray-600 hover:text-gray-900 py-1 px-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleTogglePublish(item)}
                        title={item.published ? 'Unpublish' : 'Publish to live URL'}
                        className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                          item.published
                            ? 'text-amber-600 hover:bg-amber-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDuplicate(item._id)}
                        title="Duplicate Portfolio"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        <Layers className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(item._id, item.title)}
                        title="Delete Portfolio"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {sharePortfolio && (
        <ShareModal
          isOpen={!!sharePortfolio}
          onClose={() => setSharePortfolio(null)}
          portfolioTitle={sharePortfolio.title}
          slug={sharePortfolio.slug}
        />
      )}
    </div>
  )
}
