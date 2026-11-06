import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getPublicPortfolio } from '../services/portfolioService.js'
import { recordPageView, recordProjectClick } from '../services/analyticsService.js'
import TemplateRenderer from '../templates/TemplateRenderer.jsx'
import Loader from '../components/common/Loader.jsx'
import { Sparkles, Lock, Globe } from 'lucide-react'

export default function PublicPortfolio() {
  const { username, slug } = useParams()
  const portfolioSlug = slug || username

  const [portfolio, setPortfolio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorState, setErrorState] = useState(null)

  useEffect(() => {
    let cancelled = false
    const loadPublicPortfolio = async () => {
      try {
        setLoading(true)
        setErrorState(null)
        setPortfolio(null)
        const res = await getPublicPortfolio(portfolioSlug)

        if (!cancelled && res.success && res.portfolio) {
          setPortfolio(res.portfolio)

          // Set dynamic page title
          document.title =
            res.portfolio.seo?.metaTitle ||
            `${res.portfolio.personalInfo?.fullName || 'Portfolio'} | PortfolioForge`

          const description = res.portfolio.seo?.metaDescription || res.portfolio.about?.summary || ''
          const setMeta = (key, value, property = false) => {
            const selector = property ? `meta[property="${key}"]` : `meta[name="${key}"]`
            let element = document.head.querySelector(selector)
            if (!element) {
              element = document.createElement('meta')
              property ? element.setAttribute('property', key) : element.setAttribute('name', key)
              document.head.appendChild(element)
            }
            element.content = value
          }
          setMeta('description', description)
          setMeta('og:title', document.title, true)
          setMeta('og:description', description, true)
          setMeta('og:image', res.portfolio.seo?.ogImage || res.portfolio.personalInfo?.profilePhoto || '', true)
          setMeta('robots', res.portfolio.visibility === 'unlisted' ? 'noindex,nofollow' : 'index,follow')

          // Record real page view event in backend MongoDB
          recordPageView(res.portfolio._id, document.referrer)
        }
      } catch (err) {
        if (cancelled) return
        if (err.response?.status === 403 && err.response?.data?.isUnpublished) {
          setErrorState({
            type: 'unpublished',
            title: err.response.data.title || 'Portfolio Unpublished',
            message:
              err.response.data.message ||
              'This portfolio is currently in draft mode and has not been published yet.',
          })
        } else if (err.response?.status === 403) {
          setErrorState({
            type: 'private',
            title: 'Private Portfolio',
            message: err.response.data?.message || 'This portfolio is marked as private by the owner.',
          })
        } else {
          setErrorState({
            type: 'not_found',
            title: 'Portfolio Not Found',
            message: `No public portfolio was found for "/u/${portfolioSlug}".`,
          })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    if (portfolioSlug) {
      loadPublicPortfolio()
    }
    return () => { cancelled = true }
  }, [portfolioSlug])

  // Track clicks on project links
  const handleProjectClick = (projectTitle, projectId, linkType) => {
    if (portfolio?._id) {
      recordProjectClick(portfolio._id, {
        projectTitle,
        projectId,
        linkType,
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader size="lg" text="Loading portfolio..." />
      </div>
    )
  }

  // Unpublished State Display
  if (errorState?.type === 'unpublished') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <div className="max-w-md bg-white p-8 rounded-3xl border border-gray-200 shadow-xl space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-gray-900">{errorState.title}</h1>
            <p className="text-sm text-gray-500 font-light leading-relaxed">
              {errorState.message}
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-200 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create Your Own Portfolio</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Not Found State Display
  if (errorState || !portfolio) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <div className="max-w-md bg-white p-8 rounded-3xl border border-gray-200 shadow-xl space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
            <Globe className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-gray-900">{errorState?.title || '404 - Not Found'}</h1>
            <p className="text-sm text-gray-500 font-light leading-relaxed">
              {errorState?.message || 'We could not locate this portfolio.'}
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-200 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Explore PortfolioForge</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Render the Selected Portfolio Template
  return (
    <TemplateRenderer
      portfolio={portfolio}
      onProjectClick={handleProjectClick}
      isPreview={false}
    />
  )
}
