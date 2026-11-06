import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  getPortfolioById,
  updatePortfolio,
  publishPortfolio,
  unpublishPortfolio,
  getPortfolioVersions,
  restorePortfolioVersion,
  checkSlugAvailability,
} from '../services/portfolioService.js'
import { uploadImage } from '../services/uploadService.js'
import { improveContent } from '../services/aiService.js'
import TemplateRenderer from '../templates/TemplateRenderer.jsx'
import { normalizePortfolioData, storePortfolioId } from '../utils/portfolioData.js'
import ShareModal from '../components/common/ShareModal.jsx'
import Loader from '../components/common/Loader.jsx'
import {
  User,
  FileText,
  Briefcase,
  FolderGit2,
  Cpu,
  GraduationCap,
  Award,
  Share2,
  Palette,
  Layers,
  Search,
  History,
  Save,
  Check,
  Copy,
  Plus,
  Trash2,
  Upload,
  Bot,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Monitor,
  Tablet,
  Smartphone,
  ArrowLeft,
  Power,
  RefreshCw,
  Moon,
  Sun,
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function PortfolioEditor() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [portfolio, setPortfolio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('personal')
  const [saveStatus, setSaveStatus] = useState('saved') // 'saved' | 'unsaved' | 'saving'
  const [deviceView, setDeviceView] = useState('desktop') // 'desktop' | 'tablet' | 'mobile'
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [versions, setVersions] = useState([])
  const [loadingVersions, setLoadingVersions] = useState(false)
  const [slugStatus, setSlugStatus] = useState(null)

  const autoSaveTimerRef = useRef(null)
  const portfolioRef = useRef(null)
  const sectionNavRef = useRef(null)
  const saveQueueRef = useRef(Promise.resolve())
  const editRevisionRef = useRef(0)
  const draggedSectionRef = useRef(null)
  portfolioRef.current = portfolio

  useEffect(() => () => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
  }, [])

  useEffect(() => {
    sectionNavRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
      behavior: 'smooth',
    })
  }, [activeTab])

  // Fetch portfolio data
  const fetchPortfolio = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getPortfolioById(id)
      if (res.success && res.portfolio) {
        const normalized = normalizePortfolioData(res.portfolio)
        setPortfolio(normalized)
        storePortfolioId(normalized._id)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load portfolio')
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => {
    if (id) {
      fetchPortfolio()
    }
  }, [id, fetchPortfolio])

  // Save changes to API
  const handleSave = async (options = {}) => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    setSaveStatus('saving')
    const saveTask = async () => {
      const latestPortfolio = portfolioRef.current
      if (!latestPortfolio) return
      const savedRevision = editRevisionRef.current
      try {
        const res = await updatePortfolio(latestPortfolio._id, {
          ...latestPortfolio,
          saveSnapshot: options.snapshot || false,
          snapshotTitle: options.snapshotTitle,
        })
        if (res.success && res.portfolio) {
          if (savedRevision === editRevisionRef.current) {
            const normalized = normalizePortfolioData(res.portfolio)
            portfolioRef.current = normalized
            setPortfolio(normalized)
            setSaveStatus('saved')
            if (options.manual) toast.success('Portfolio saved successfully!')
          } else {
            setSaveStatus('unsaved')
          }
        }
      } catch (err) {
        setSaveStatus('unsaved')
        toast.error(err.response?.data?.message || 'Failed to save changes')
      }
    }
    const queuedSave = saveQueueRef.current.catch(() => {}).then(saveTask)
    saveQueueRef.current = queuedSave
    await queuedSave
  }

  // Trigger debounced auto-save on state change
  const updatePortfolioState = (updater) => {
    const previous = portfolioRef.current
    if (!previous) return
    const next = typeof updater === 'function' ? updater(previous) : { ...previous, ...updater }
    portfolioRef.current = next
    editRevisionRef.current += 1
    setPortfolio(next)
    setSaveStatus('unsaved')

    // Debounce auto-save on state change
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    autoSaveTimerRef.current = setTimeout(() => handleSave(), 2500)
  }

  // Publish / Unpublish Toggle
  const handleTogglePublish = async () => {
    if (!portfolio) return
    try {
      if (portfolio.published) {
        await unpublishPortfolio(portfolio._id)
        setPortfolio((prev) => ({ ...prev, published: false }))
        toast.success('Portfolio unpublished')
      } else {
        await publishPortfolio(portfolio._id)
        setPortfolio((prev) => ({ ...prev, published: true, publishedAt: new Date() }))
        toast.success('Portfolio published! Live on your public URL.')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Publish toggle failed')
    }
  }

  // Photo Upload Handler
  const handleImageUpload = async (e, callback) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const res = await uploadImage(file)
      if (res.success && res.url) {
        callback(res.url)
        toast.success('Image uploaded successfully')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Image upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  // AI Content Generation
  const handleAiPolish = async (type, currentText, callback) => {
    setIsAiLoading(true)
    try {
      const res = await improveContent({
        type,
        currentText,
        role: portfolio?.personalInfo?.title || '',
        skills: portfolio?.skills?.map((skill) => (typeof skill === 'string' ? skill : skill?.name)).filter(Boolean) || [],
      })
      if (res.result) {
        callback(res.result)
        toast.success('AI enhancement applied!')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI assistant temporarily unavailable')
    } finally {
      setIsAiLoading(false)
    }
  }

  // Slug check
  const handleSlugVerify = async (slugVal) => {
    if (!slugVal || slugVal.length < 3) return
    try {
      const res = await checkSlugAvailability(slugVal)
      setSlugStatus(res.available ? 'available' : 'taken')
    } catch {
      setSlugStatus(null)
    }
  }

  // Version History
  const fetchVersions = async () => {
    if (!portfolio) return
    setLoadingVersions(true)
    try {
      const res = await getPortfolioVersions(portfolio._id)
      if (res.success) {
        setVersions(res.versions || [])
      }
    } catch {
      toast.error('Failed to load version snapshots')
    } finally {
      setLoadingVersions(false)
    }
  }

  const handleRestoreVersion = async (versionId) => {
    if (!window.confirm('Restore this version snapshot? Unsaved changes will be replaced.')) return
    try {
      const res = await restorePortfolioVersion(portfolio._id, versionId)
      if (res.success && res.portfolio) {
        setPortfolio(res.portfolio)
        toast.success('Restored to selected version!')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Restore failed')
    }
  }

  // Section Reordering Helpers
  const moveSection = (index, direction) => {
    const order = [...portfolio.sectionOrder]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= order.length) return
    const [moved] = order.splice(index, 1)
    order.splice(targetIndex, 0, moved)
    updatePortfolioState({ sectionOrder: order })
  }

  const dropSection = (targetIndex) => {
    const sourceIndex = draggedSectionRef.current
    draggedSectionRef.current = null
    if (sourceIndex === null || sourceIndex === targetIndex) return
    updatePortfolioState((prev) => {
      const order = [...(prev.sectionOrder || [])]
      const [moved] = order.splice(sourceIndex, 1)
      order.splice(targetIndex, 0, moved)
      return { ...prev, sectionOrder: order }
    })
  }

  const toggleSectionVisibility = (secKey) => {
    updatePortfolioState((prev) => ({
      ...prev,
      sectionVisibility: {
        ...prev.sectionVisibility,
        [secKey]: !prev.sectionVisibility[secKey],
      },
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader size="lg" text="Loading your portfolio workspace..." />
      </div>
    )
  }

  if (!portfolio) return null

  const tabs = [
    { id: 'personal', label: 'Personal & Bio', icon: User },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'projects', label: 'Projects', icon: FolderGit2 },
    { id: 'skills', label: 'Skills', icon: Cpu },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'certifications', label: 'Certifications', icon: Award },
    { id: 'socials', label: 'Social & Links', icon: Share2 },
    { id: 'theme', label: 'Theme & Fonts', icon: Palette },
    { id: 'sections', label: 'Section Layout', icon: Layers },
    { id: 'seo', label: 'SEO & URL Slug', icon: Search },
    { id: 'versions', label: 'Version History', icon: History },
  ]
  const profileInitials = portfolio.personalInfo?.fullName
    ?.trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const deviceWidthClass =
    deviceView === 'mobile'
      ? 'w-[375px]'
      : deviceView === 'tablet'
      ? 'w-[768px]'
      : 'w-full'

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Top Bar */}
      <header className="h-16 bg-white border-b border-gray-200 px-3 sm:px-6 flex items-center justify-between gap-2 shrink-0 z-30 overflow-hidden">
        {/* Left: Back + Title + Status */}
        <div className="flex min-w-0 flex-1 items-center space-x-2 sm:space-x-3">
          <Link
            to="/dashboard"
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={portfolio.title}
                onChange={(e) => updatePortfolioState({ title: e.target.value })}
                className="w-[112px] min-w-0 truncate font-bold text-gray-900 text-sm sm:w-auto sm:max-w-[260px] sm:text-base bg-transparent border-b border-transparent hover:border-gray-300 focus:border-purple-600 focus:outline-hidden px-1"
              />
              {portfolio.published ? (
                <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live</span>
                </span>
              ) : (
                <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Draft
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-400 pl-1">
              <span className="max-w-[112px] truncate sm:max-w-none">/u/{portfolio.slug}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/u/${portfolio.slug}`)
                  toast.success('Public URL copied!')
                }}
                className="hover:text-purple-600"
              >
                <Copy className="w-3 h-3 inline" />
              </button>
            </div>
          </div>
        </div>

        {/* Middle: Save Status Indicator */}
        <div className="hidden md:flex items-center space-x-2 text-xs">
          {saveStatus === 'saving' && (
            <span className="flex items-center space-x-1 text-purple-600 animate-pulse font-medium">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Saving changes...</span>
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center space-x-1 text-emerald-600 font-medium">
              <Check className="w-3.5 h-3.5" />
              <span>All changes saved</span>
            </span>
          )}
          {saveStatus === 'unsaved' && (
            <span className="text-amber-600 font-medium">Unsaved changes</span>
          )}
        </div>

        {/* Right Action Tools */}
        <div className="flex shrink-0 items-center space-x-1.5 sm:space-x-3">
          {/* Viewport Frame Switcher */}
          <div className="hidden lg:flex items-center bg-gray-100 rounded-xl p-1 space-x-1">
            <button
              onClick={() => setDeviceView('desktop')}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                deviceView === 'desktop' ? 'bg-white shadow-xs text-purple-600 font-bold' : 'text-gray-500 hover:text-gray-800'
              }`}
              title="Desktop View"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeviceView('tablet')}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                deviceView === 'tablet' ? 'bg-white shadow-xs text-purple-600 font-bold' : 'text-gray-500 hover:text-gray-800'
              }`}
              title="Tablet View"
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeviceView('mobile')}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                deviceView === 'mobile' ? 'bg-white shadow-xs text-purple-600 font-bold' : 'text-gray-500 hover:text-gray-800'
              }`}
              title="Mobile View"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          {/* Share Modal Trigger */}
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors cursor-pointer"
            title="Share Portfolio"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Resume link */}
          <Link
            to={`/resume?id=${portfolio._id}`}
            className="hidden sm:inline-flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Resume</span>
          </Link>

          {/* Publish / Unpublish Button */}
          <button
            onClick={handleTogglePublish}
            className={`inline-flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              portfolio.published
                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-200'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{portfolio.published ? 'Unpublish' : 'Publish Live'}</span>
          </button>

          {/* Manual Save Button */}
          <button
            onClick={() => handleSave({ manual: true, snapshot: true, snapshotTitle: 'User Manual Save' })}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-200 transition-all active:scale-95 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save</span>
          </button>
        </div>
      </header>

      {/* Editor Main Content: Left Nav + Center Form + Right Live Preview */}
      <div className="flex-1 flex min-h-0 flex-col overflow-hidden lg:flex-row">
        {/* Left Sidebar Navigation */}
        <aside aria-label="Portfolio editor sections" className="h-14 w-full bg-white border-b border-gray-200 flex shrink-0 overflow-x-auto overscroll-x-contain scroll-smooth snap-x snap-proximity lg:h-auto lg:w-56 lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden lg:border-b-0 lg:border-r">
          <div ref={sectionNavRef} role="tablist" aria-label="Portfolio editor sections" className="flex min-w-max flex-row gap-1 p-2 lg:min-w-0 lg:flex-col lg:gap-0 lg:p-3 lg:space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    if (tab.id === 'versions') fetchVersions()
                  }}
                  title={tab.label}
                  aria-label={tab.label}
                  role="tab"
                  aria-selected={isActive}
                  className={`flex shrink-0 snap-start items-center space-x-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer lg:w-full lg:space-x-3 ${
                    isActive
                      ? 'bg-purple-50 text-purple-700 shadow-2xs font-bold'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-purple-600' : 'text-gray-400'}`} />
                  <span className="hidden truncate lg:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </aside>

        {/* Center Editing Area */}
        <main className="min-h-0 min-w-0 w-full flex-1 bg-white border-b border-gray-200 flex flex-col overflow-y-auto p-4 sm:p-6 space-y-6 lg:w-[480px] lg:flex-none lg:border-b-0 lg:border-r">
          {/* TAB 1: Personal Info & Bio */}
          {activeTab === 'personal' && (
            <div className="space-y-5">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900">Personal & Bio Information</h3>
                <p className="text-xs text-gray-500">Real-time updates appear immediately on the preview.</p>
              </div>

              {/* Profile Photo Uploader */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">Profile Photo</label>
                <div className="flex items-center space-x-4">
                  {portfolio.personalInfo?.profilePhoto ? (
                    <img
                      src={portfolio.personalInfo.profilePhoto}
                      alt="Profile"
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-purple-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-700 font-bold flex items-center justify-center">
                      {profileInitials || <User className="h-6 w-6" aria-hidden="true" />}
                    </div>
                  )}
                  <div>
                    <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploading ? 'Uploading...' : 'Upload Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleImageUpload(e, (url) =>
                            updatePortfolioState((prev) => ({
                              ...prev,
                              personalInfo: { ...prev.personalInfo, profilePhoto: url },
                            }))
                          )
                        }
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-gray-400 mt-1">Direct upload or paste image URL below</p>
                  </div>
                </div>
                <input
                  type="text"
                  value={portfolio.personalInfo?.profilePhoto || ''}
                  onChange={(e) =>
                    updatePortfolioState((prev) => ({
                      ...prev,
                      personalInfo: { ...prev.personalInfo, profilePhoto: e.target.value },
                    }))
                  }
                  placeholder="Or enter image URL..."
                  className="mt-2 w-full px-3 py-2 text-xs rounded-xl border border-gray-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  value={portfolio.personalInfo?.fullName || ''}
                  onChange={(e) =>
                    updatePortfolioState((prev) => ({
                      ...prev,
                      personalInfo: { ...prev.personalInfo, fullName: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Professional Title</label>
                <input
                  type="text"
                  value={portfolio.personalInfo?.title || ''}
                  onChange={(e) =>
                    updatePortfolioState((prev) => ({
                      ...prev,
                      personalInfo: { ...prev.personalInfo, title: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-700 uppercase">Headline / Tagline</label>
                  <button
                    type="button"
                    onClick={() =>
                      handleAiPolish('headline', portfolio.personalInfo?.headline || '', (res) =>
                        updatePortfolioState((prev) => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, headline: res },
                        }))
                      )
                    }
                    className="text-xs font-bold text-purple-600 hover:text-purple-700"
                  >
                    ✨ AI Headline
                  </button>
                </div>
                <input
                  type="text"
                  value={portfolio.personalInfo?.headline || ''}
                  onChange={(e) =>
                    updatePortfolioState((prev) => ({
                      ...prev,
                      personalInfo: { ...prev.personalInfo, headline: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    value={portfolio.personalInfo?.email || ''}
                    onChange={(e) =>
                      updatePortfolioState((prev) => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, email: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Phone</label>
                  <input
                    type="text"
                    value={portfolio.personalInfo?.phone || ''}
                    onChange={(e) =>
                      updatePortfolioState((prev) => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, phone: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Location</label>
                <input
                  type="text"
                  value={portfolio.personalInfo?.location || ''}
                  onChange={(e) =>
                    updatePortfolioState((prev) => ({
                      ...prev,
                      personalInfo: { ...prev.personalInfo, location: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200"
                  placeholder="San Francisco, CA (or Remote)"
                />
              </div>

              {/* About Summary with AI */}
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700 uppercase">About Me Summary</label>
                  <button
                    type="button"
                    onClick={() =>
                      handleAiPolish('about_summary', portfolio.about?.summary || '', (res) =>
                        updatePortfolioState((prev) => ({
                          ...prev,
                          about: { ...prev.about, summary: res },
                        }))
                      )
                    }
                    disabled={isAiLoading}
                    className="inline-flex items-center space-x-1 text-xs font-bold text-purple-600 hover:text-purple-700"
                  >
                    <Bot className="w-3 h-3" />
                    <span>✨ Improve with AI</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={portfolio.about?.summary || ''}
                  onChange={(e) =>
                    updatePortfolioState((prev) => ({
                      ...prev,
                      about: { ...prev.about, summary: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Highlight Years</label>
                <input
                  type="text"
                  value={portfolio.about?.highlightYears || ''}
                  onChange={(e) =>
                    updatePortfolioState((prev) => ({
                      ...prev,
                      about: { ...prev.about, highlightYears: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200"
                  placeholder="4+"
                />
              </div>
            </div>
          )}

          {/* TAB 2: Experience */}
          {activeTab === 'experience' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900">Work Experience ({portfolio.experience?.length || 0})</h3>
                <button
                  type="button"
                  onClick={() =>
                    updatePortfolioState((prev) => ({
                      ...prev,
                      experience: [
                        ...prev.experience,
                        { companyName: '', jobRole: '', duration: '', location: '', description: '', isCurrent: false },
                      ],
                    }))
                  }
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Role</span>
                </button>
              </div>

              {portfolio.experience?.map((exp, idx) => (
                <div key={idx} className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-3 relative">
                  <button
                    type="button"
                    onClick={() => {
                      const arr = portfolio.experience.filter((_, i) => i !== idx)
                      updatePortfolioState({ experience: arr })
                    }}
                    className="absolute top-3 right-3 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={exp.jobRole}
                      onChange={(e) => {
                        const arr = [...portfolio.experience]
                        arr[idx].jobRole = e.target.value
                        updatePortfolioState({ experience: arr })
                      }}
                      placeholder="Role (e.g. Lead Engineer)"
                      className="px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs font-semibold"
                    />
                    <input
                      type="text"
                      value={exp.companyName}
                      onChange={(e) => {
                        const arr = [...portfolio.experience]
                        arr[idx].companyName = e.target.value
                        updatePortfolioState({ experience: arr })
                      }}
                      placeholder="Company"
                      className="px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={exp.duration}
                      onChange={(e) => {
                        const arr = [...portfolio.experience]
                        arr[idx].duration = e.target.value
                        updatePortfolioState({ experience: arr })
                      }}
                      placeholder="Duration (e.g. 2022 - Present)"
                      className="px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs font-mono"
                    />
                    <input
                      type="text"
                      value={exp.location || ''}
                      onChange={(e) => {
                        const arr = [...portfolio.experience]
                        arr[idx].location = e.target.value
                        updatePortfolioState({ experience: arr })
                      }}
                      placeholder="Location"
                      className="px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs"
                    />
                  </div>

                  <textarea
                    rows={3}
                    value={exp.description}
                    onChange={(e) => {
                      const arr = [...portfolio.experience]
                      arr[idx].description = e.target.value
                      updatePortfolioState({ experience: arr })
                    }}
                    placeholder="Role responsibilities and achievements..."
                    className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs leading-relaxed"
                  />
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: Projects */}
          {activeTab === 'projects' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900">Featured Projects ({portfolio.projects?.length || 0})</h3>
                <button
                  type="button"
                  onClick={() =>
                    updatePortfolioState((prev) => ({
                      ...prev,
                      projects: [
                        ...prev.projects,
                        { title: '', description: '', technologies: [], projectImage: '', githubUrl: '', liveDemoUrl: '', featured: false },
                      ],
                    }))
                  }
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Project</span>
                </button>
              </div>

              {portfolio.projects?.map((proj, idx) => (
                <div key={idx} className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-3 relative">
                  <button
                    type="button"
                    onClick={() => {
                      const arr = portfolio.projects.filter((_, i) => i !== idx)
                      updatePortfolioState({ projects: arr })
                    }}
                    className="absolute top-3 right-3 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={proj.title}
                      onChange={(e) => {
                        const arr = [...portfolio.projects]
                        arr[idx].title = e.target.value
                        updatePortfolioState({ projects: arr })
                      }}
                      placeholder="Project Title"
                      className="flex-1 px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs font-bold"
                    />
                    <label className="flex items-center space-x-1 text-xs text-purple-700 bg-purple-50 px-2 py-1.5 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={proj.featured || false}
                        onChange={(e) => {
                          const arr = [...portfolio.projects]
                          arr[idx].featured = e.target.checked
                          updatePortfolioState({ projects: arr })
                        }}
                        className="rounded-sm accent-purple-600"
                      />
                      <span>Featured</span>
                    </label>
                  </div>

                  {/* Project Image */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={proj.projectImage || ''}
                      onChange={(e) => {
                        const arr = [...portfolio.projects]
                        arr[idx].projectImage = e.target.value
                        updatePortfolioState({ projects: arr })
                      }}
                      placeholder="Project image URL..."
                      className="flex-1 px-3 py-1.5 bg-white rounded-lg border border-gray-200 text-xs"
                    />
                    <label className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-lg cursor-pointer shrink-0">
                      Upload
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={(e) =>
                          handleImageUpload(e, (url) => {
                            const arr = [...portfolio.projects]
                            arr[idx].projectImage = url
                            updatePortfolioState({ projects: arr })
                          })
                        }
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Description with AI */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold text-gray-600 uppercase">Description</span>
                      <button
                        type="button"
                        onClick={() =>
                          handleAiPolish('project_description', proj.description, (res) => {
                            const arr = [...portfolio.projects]
                            arr[idx].description = res
                            updatePortfolioState({ projects: arr })
                          })
                        }
                        className="text-[11px] font-bold text-purple-600 hover:text-purple-700"
                      >
                        ✨ Polish Description
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={proj.description}
                      onChange={(e) => {
                        const arr = [...portfolio.projects]
                        arr[idx].description = e.target.value
                        updatePortfolioState({ projects: arr })
                      }}
                      placeholder="What this project solves and tools used..."
                      className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs"
                    />
                  </div>

                  <input
                    type="text"
                    value={proj.technologies?.join(', ') || ''}
                    onChange={(e) => {
                      const arr = [...portfolio.projects]
                      arr[idx].technologies = e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                      updatePortfolioState({ projects: arr })
                    }}
                    placeholder="Technologies (e.g. React, Node.js, Express)"
                    className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={proj.githubUrl || ''}
                      onChange={(e) => {
                        const arr = [...portfolio.projects]
                        arr[idx].githubUrl = e.target.value
                        updatePortfolioState({ projects: arr })
                      }}
                      placeholder="GitHub URL"
                      className="px-3 py-1.5 bg-white rounded-lg border border-gray-200 text-xs"
                    />
                    <input
                      type="text"
                      value={proj.liveDemoUrl || ''}
                      onChange={(e) => {
                        const arr = [...portfolio.projects]
                        arr[idx].liveDemoUrl = e.target.value
                        updatePortfolioState({ projects: arr })
                      }}
                      placeholder="Live Demo URL"
                      className="px-3 py-1.5 bg-white rounded-lg border border-gray-200 text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: Skills */}
          {activeTab === 'skills' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900">Skills ({portfolio.skills?.length || 0})</h3>
                <button
                  type="button"
                  onClick={() =>
                    updatePortfolioState((prev) => ({
                      ...prev,
                      skills: [...prev.skills, { name: '', category: 'Frontend', proficiencyLevel: 80 }],
                    }))
                  }
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Skill</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {portfolio.skills?.map((s, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={s.name}
                        onChange={(e) => {
                          const arr = [...portfolio.skills]
                          arr[idx].name = e.target.value
                          updatePortfolioState({ skills: arr })
                        }}
                        placeholder="Skill Name"
                        className="flex-1 px-2.5 py-1.5 bg-white rounded-lg border border-gray-200 text-xs font-semibold"
                      />
                      <select
                        value={s.category}
                        onChange={(e) => {
                          const arr = [...portfolio.skills]
                          arr[idx].category = e.target.value
                          updatePortfolioState({ skills: arr })
                        }}
                        className="px-2 py-1.5 bg-white rounded-lg border border-gray-200 text-xs"
                      >
                        <option value="Frontend">Frontend</option>
                        <option value="Backend">Backend</option>
                        <option value="Database">Database</option>
                        <option value="Tools">Tools</option>
                        <option value="Design">Design</option>
                        <option value="Soft Skills">Soft Skills</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const arr = portfolio.skills.filter((_, i) => i !== idx)
                          updatePortfolioState({ skills: arr })
                        }}
                        className="text-gray-400 hover:text-red-500 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center space-x-3 text-xs">
                      <span className="text-gray-400 text-[11px]">Proficiency:</span>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        value={s.proficiencyLevel}
                        onChange={(e) => {
                          const arr = [...portfolio.skills]
                          arr[idx].proficiencyLevel = Number(e.target.value)
                          updatePortfolioState({ skills: arr })
                        }}
                        className="flex-1 accent-purple-600"
                      />
                      <span className="font-bold text-purple-700 w-10 text-right">{s.proficiencyLevel}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: Education */}
          {activeTab === 'education' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900">Education ({portfolio.education?.length || 0})</h3>
                <button
                  type="button"
                  onClick={() =>
                    updatePortfolioState((prev) => ({
                      ...prev,
                      education: [
                        ...prev.education,
                        { degree: '', college: '', university: '', startYear: '', graduationYear: '', description: '', grade: '' },
                      ],
                    }))
                  }
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Degree</span>
                </button>
              </div>

              {portfolio.education?.map((edu, idx) => (
                <div key={idx} className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-3 relative">
                  <button
                    type="button"
                    onClick={() => {
                      const arr = portfolio.education.filter((_, i) => i !== idx)
                      updatePortfolioState({ education: arr })
                    }}
                    className="absolute top-3 right-3 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    value={edu.degree}
                    onChange={(e) => {
                      const arr = [...portfolio.education]
                      arr[idx].degree = e.target.value
                      updatePortfolioState({ education: arr })
                    }}
                    placeholder="Degree (e.g. B.S. in Computer Science)"
                    className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs font-bold"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={edu.university}
                      onChange={(e) => {
                        const arr = [...portfolio.education]
                        arr[idx].university = e.target.value
                        updatePortfolioState({ education: arr })
                      }}
                      placeholder="University"
                      className="px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs"
                    />
                    <input
                      type="text"
                      value={edu.grade || ''}
                      onChange={(e) => {
                        const arr = [...portfolio.education]
                        arr[idx].grade = e.target.value
                        updatePortfolioState({ education: arr })
                      }}
                      placeholder="Grade / GPA"
                      className="px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={edu.startYear}
                      onChange={(e) => {
                        const arr = [...portfolio.education]
                        arr[idx].startYear = e.target.value
                        updatePortfolioState({ education: arr })
                      }}
                      placeholder="Start Year"
                      className="px-3 py-1.5 bg-white rounded-lg border border-gray-200 text-xs font-mono"
                    />
                    <input
                      type="text"
                      value={edu.graduationYear}
                      onChange={(e) => {
                        const arr = [...portfolio.education]
                        arr[idx].graduationYear = e.target.value
                        updatePortfolioState({ education: arr })
                      }}
                      placeholder="Graduation Year"
                      className="px-3 py-1.5 bg-white rounded-lg border border-gray-200 text-xs font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 6: Certifications */}
          {activeTab === 'certifications' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900">Certificates ({portfolio.certifications?.length || 0})</h3>
                <button
                  type="button"
                  onClick={() =>
                    updatePortfolioState((prev) => ({
                      ...prev,
                      certifications: [
                        ...prev.certifications,
                        { certificateName: 'Certification Name', issuingOrganization: 'Issuer', date: '2023', credentialUrl: '' },
                      ],
                    }))
                  }
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Certificate</span>
                </button>
              </div>

              {portfolio.certifications?.map((c, idx) => (
                <div key={idx} className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-2.5 relative">
                  <button
                    type="button"
                    onClick={() => {
                      const arr = portfolio.certifications.filter((_, i) => i !== idx)
                      updatePortfolioState({ certifications: arr })
                    }}
                    className="absolute top-3 right-3 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    value={c.certificateName}
                    onChange={(e) => {
                      const arr = [...portfolio.certifications]
                      arr[idx].certificateName = e.target.value
                      updatePortfolioState({ certifications: arr })
                    }}
                    placeholder="Certificate Name"
                    className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs font-bold"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={c.issuingOrganization}
                      onChange={(e) => {
                        const arr = [...portfolio.certifications]
                        arr[idx].issuingOrganization = e.target.value
                        updatePortfolioState({ certifications: arr })
                      }}
                      placeholder="Issuer (e.g. AWS)"
                      className="px-3 py-1.5 bg-white rounded-lg border border-gray-200 text-xs"
                    />
                    <input
                      type="text"
                      value={c.date}
                      onChange={(e) => {
                        const arr = [...portfolio.certifications]
                        arr[idx].date = e.target.value
                        updatePortfolioState({ certifications: arr })
                      }}
                      placeholder="Date"
                      className="px-3 py-1.5 bg-white rounded-lg border border-gray-200 text-xs"
                    />
                  </div>

                  <input
                    type="text"
                    value={c.credentialUrl || ''}
                    onChange={(e) => {
                      const arr = [...portfolio.certifications]
                      arr[idx].credentialUrl = e.target.value
                      updatePortfolioState({ certifications: arr })
                    }}
                    placeholder="Verification URL"
                    className="w-full px-3 py-1.5 bg-white rounded-lg border border-gray-200 text-xs"
                  />
                </div>
              ))}
            </div>
          )}

          {/* TAB 7: Socials */}
          {activeTab === 'socials' && (
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900">Social Profiles & Contact</h3>
                <p className="text-xs text-gray-500">Provide direct communication links for visitors.</p>
              </div>

              {['linkedin', 'github', 'twitter', 'portfolio', 'instagram', 'youtube'].map((key) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1 capitalize">
                    {key} Link
                  </label>
                  <input
                    type="text"
                    value={portfolio.socialLinks?.[key] || ''}
                    onChange={(e) =>
                      updatePortfolioState((prev) => ({
                        ...prev,
                        socialLinks: { ...prev.socialLinks, [key]: e.target.value },
                      }))
                    }
                    placeholder={`https://${key}.com/...`}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200"
                  />
                </div>
              ))}
            </div>
          )}

          {/* TAB 8: Theme & Fonts */}
          {activeTab === 'theme' && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900">Theme Styling & Identity</h3>
                <p className="text-xs text-gray-500">Instantly switch template layout, fonts, and brand colors.</p>
              </div>

              {/* Template Switcher */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">
                  Active Layout Template
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'minimal', name: 'Minimal Editorial', desc: 'Elegant type, light canvas, generous whitespace' },
                    { id: 'developer', name: 'Modern Developer', desc: 'Monospace, terminal vibes, code stack' },
                    { id: 'creative', name: 'Creative Designer', desc: 'Vibrant spotlight gradients' },
                    { id: 'student', name: 'Student & Graduate', desc: 'Education & coursework timeline' },
                    { id: 'corporate', name: 'Corporate Professional', desc: 'Formal structure and a neutral executive palette' },
                    { id: 'dark', name: 'Dark Tech', desc: 'Premium dark surfaces with violet and blue accents' },
                  ].map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => updatePortfolioState({ templateId: tpl.id })}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        portfolio.templateId === tpl.id
                          ? 'border-purple-600 bg-purple-50/70 ring-2 ring-purple-500/20'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold text-gray-900">{tpl.name}</p>
                        <p className="text-[11px] text-gray-500">{tpl.desc}</p>
                      </div>
                      {portfolio.templateId === tpl.id && (
                        <Check className="w-4 h-4 text-purple-600 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary Color Swatches */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">
                  Primary Brand Accent
                </label>
                <div className="flex items-center space-x-3">
                  {[
                    '#7c3aed', // Purple
                    '#2563eb', // Blue
                    '#059669', // Emerald
                    '#ec4899', // Pink
                    '#d97706', // Amber
                    '#0f172a', // Slate/Black
                  ].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() =>
                        updatePortfolioState((prev) => ({
                          ...prev,
                          theme: { ...prev.theme, primaryColor: color },
                        }))
                      }
                      className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer ${
                        portfolio.theme?.primaryColor === color ? 'scale-115 border-gray-900 ring-2 ring-purple-300' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <input
                    type="color"
                    value={portfolio.theme?.primaryColor || '#7c3aed'}
                    onChange={(e) =>
                      updatePortfolioState((prev) => ({
                        ...prev,
                        theme: { ...prev.theme, primaryColor: e.target.value },
                      }))
                    }
                    className="w-8 h-8 rounded-full border border-gray-200 cursor-pointer p-0"
                    title="Custom Color"
                  />
                </div>
              </div>

              {/* Font Family Picker */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">
                  Typography Font Family
                </label>
                <select
                  value={portfolio.theme?.font || 'Inter'}
                  onChange={(e) =>
                    updatePortfolioState((prev) => ({
                      ...prev,
                      theme: { ...prev.theme, font: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white"
                >
                  <option value="Inter">Inter (Clean Modern Sans-Serif)</option>
                  <option value="Space Grotesk">Space Grotesk (Tech Monospace)</option>
                  <option value="Poppins">Poppins (Friendly Geometric)</option>
                  <option value="Playfair Display">Playfair Display (Executive Serif)</option>
                  <option value="Roboto">Roboto (Classic Neutral)</option>
                </select>
              </div>

              {/* Dark Mode Force Switch */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-900">Dark Mode Palette</p>
                  <p className="text-[11px] text-gray-500">Render dark background and light text</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updatePortfolioState((prev) => ({
                      ...prev,
                      theme: { ...prev.theme, darkMode: !prev.theme?.darkMode },
                    }))
                  }
                  className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                    portfolio.theme?.darkMode ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border-gray-200'
                  }`}
                >
                  {portfolio.theme?.darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* TAB 9: Section Layout (Reorder & Visibility) */}
          {activeTab === 'sections' && (
            <div className="space-y-5">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900">Section Layout & Ordering</h3>
                <p className="text-xs text-gray-500">
                  Rearrange the flow of your portfolio sections or hide sections you don't need.
                </p>
              </div>

              <div className="space-y-2">
                {portfolio.sectionOrder?.map((secKey, idx) => {
                  const isVis = portfolio.sectionVisibility?.[secKey] !== false
                  return (
                    <div
                      key={secKey}
                      draggable
                      onDragStart={() => { draggedSectionRef.current = idx }}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => dropSection(idx)}
                      onDragEnd={() => { draggedSectionRef.current = null }}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                        isVis ? 'bg-white border-gray-200' : 'bg-gray-100 border-gray-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="cursor-grab select-none text-gray-400" aria-label="Drag to reorder section">⠿</span>
                        <input
                          type="checkbox"
                          checked={isVis}
                          onChange={() => toggleSectionVisibility(secKey)}
                          className="rounded-sm accent-purple-600"
                        />
                        <span className="text-xs font-bold text-gray-900 capitalize">
                          {secKey === 'hero' ? 'Hero Introduction' : secKey}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1 text-gray-400">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveSection(idx, 'up')}
                          className="p-1 hover:text-purple-600 disabled:opacity-30 cursor-pointer"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === portfolio.sectionOrder.length - 1}
                          onClick={() => moveSection(idx, 'down')}
                          className="p-1 hover:text-purple-600 disabled:opacity-30 cursor-pointer"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* TAB 10: SEO & Slug Settings */}
          {activeTab === 'seo' && (
            <div className="space-y-5">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900">SEO & Public URL Slug</h3>
                <p className="text-xs text-gray-500">Customize search snippet and unique link.</p>
              </div>

              {/* Slug Handle */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1.5">
                  Public URL Handle
                </label>
                <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 p-2 focus-within:ring-2 focus-within:ring-purple-500">
                  <span className="text-xs font-mono text-gray-400 pl-1">/u/</span>
                  <input
                    type="text"
                    value={portfolio.slug}
                    onChange={(e) => {
                      const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
                      updatePortfolioState({ slug: val })
                      handleSlugVerify(val)
                    }}
                    className="flex-1 bg-transparent px-1 text-xs font-mono text-gray-900 focus:outline-hidden"
                  />
                  {slugStatus === 'available' && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                      Available
                    </span>
                  )}
                  {slugStatus === 'taken' && (
                    <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                      Taken
                    </span>
                  )}
                </div>
              </div>

              {/* SEO Meta Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Meta Page Title
                </label>
                <input
                  type="text"
                  value={portfolio.seo?.metaTitle || ''}
                  onChange={(e) =>
                    updatePortfolioState((prev) => ({
                      ...prev,
                      seo: { ...prev.seo, metaTitle: e.target.value },
                    }))
                  }
                  placeholder={`${portfolio.personalInfo?.fullName || 'Alex'} | ${portfolio.personalInfo?.title || 'Portfolio'}`}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200"
                />
              </div>

              {/* SEO Meta Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Meta Description
                </label>
                <textarea
                  rows={3}
                  value={portfolio.seo?.metaDescription || ''}
                  onChange={(e) =>
                    updatePortfolioState((prev) => ({
                      ...prev,
                      seo: { ...prev.seo, metaDescription: e.target.value },
                    }))
                  }
                  placeholder="Summary for search engines and social cards..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200"
                />
              </div>

              {/* Privacy Setting */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">
                  Visibility Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['public', 'unlisted', 'private'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => updatePortfolioState({ visibility: mode })}
                      className={`py-2 px-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                        portfolio.visibility === mode
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 11: Version History */}
          {activeTab === 'versions' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Version History</h3>
                  <p className="text-xs text-gray-500">Snapshots captured when published or manually saved.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSave({ snapshot: true, snapshotTitle: 'User Created Snapshot', manual: true })}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 cursor-pointer"
                >
                  Create Snapshot
                </button>
              </div>

              {loadingVersions ? (
                <div className="py-8 text-center">
                  <Loader size="sm" text="Loading snapshots..." />
                </div>
              ) : versions.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No snapshots saved yet.</p>
              ) : (
                <div className="space-y-3">
                  {versions.map((ver) => (
                    <div
                      key={ver._id}
                      className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-gray-900">
                          v{ver.versionNumber} – {ver.title || 'Snapshot'}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {new Date(ver.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRestoreVersion(ver._id)}
                        className="px-2.5 py-1 text-xs font-semibold text-purple-600 hover:bg-purple-50 rounded-lg cursor-pointer"
                      >
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>

        {/* Right Area: Real-Time Live Preview Frame */}
        <div className="hidden min-w-0 flex-1 bg-gray-100 overflow-y-auto p-3 sm:p-6 lg:flex lg:flex-col lg:items-center">
          <div className="w-full flex items-center justify-between mb-3 text-xs text-gray-500 max-w-5xl">
            <span className="font-semibold text-gray-600">
              Live Real-Time Preview ({portfolio.templateId || 'minimal'})
            </span>
            <a
              href={`/u/${portfolio.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1 text-purple-600 hover:underline"
            >
              <span>Open Public Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div
            className={`${deviceWidthClass} transition-all duration-300 shadow-xl rounded-2xl overflow-hidden bg-white min-h-[85vh] border border-gray-200`}
          >
            <TemplateRenderer portfolio={portfolio} isPreview={true} />
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {isShareModalOpen && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          portfolioTitle={portfolio.title}
          slug={portfolio.slug}
        />
      )}
    </div>
  )
}
