import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getPortfolios, updatePortfolio } from '../services/portfolioService.js'
import TemplateRenderer from '../templates/TemplateRenderer.jsx'
import { getDefaultPortfolio, getStoredPortfolioId, storePortfolioId } from '../utils/portfolioData.js'
import { ArrowRight, Check, Eye, X } from 'lucide-react'
import toast from 'react-hot-toast'

const templates = [
  { id: 'minimal', name: 'Minimal Editorial', group: 'Editorial', description: 'An airy, typographic portfolio with a calm reading rhythm and generous white space.', accent: '#8b7355' },
  { id: 'developer', name: 'Modern Developer', group: 'Engineering', description: 'A confident technical profile with a code inspired hero, stack badges and project cards.', accent: '#21c5a0' },
  { id: 'creative', name: 'Creative Designer', group: 'Design', description: 'An art directed portfolio with bold type, asymmetrical imagery and expressive color.', accent: '#e7634b' },
  { id: 'student', name: 'Student & Fresher', group: 'Early career', description: 'Education, skills, projects and certifications take the lead for emerging talent.', accent: '#4c78b8' },
  { id: 'corporate', name: 'Corporate Professional', group: 'Leadership', description: 'A formal, structured profile with a neutral palette and clear business hierarchy.', accent: '#64748b' },
  { id: 'dark', name: 'Dark Tech', group: 'Technology', description: 'A premium dark canvas with focused blue and violet accents for technical work.', accent: '#8a79ef' },
]

export default function Templates() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [portfolios, setPortfolios] = useState([])
  const [selectedPortfolioId, setSelectedPortfolioId] = useState('')
  const [previewTemplate, setPreviewTemplate] = useState(null)
  const [deviceView, setDeviceView] = useState('desktop')
  const [busyTemplate, setBusyTemplate] = useState('')
  const [loadingPortfolios, setLoadingPortfolios] = useState(false)
  const [selectionError, setSelectionError] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState(() => {
    const requestedTemplate = searchParams.get('template')
    return templates.some((template) => template.id === requestedTemplate) ? requestedTemplate : 'minimal'
  })
  const requestedPortfolioId = searchParams.get('id')

  useEffect(() => {
    if (authLoading || !isAuthenticated) return
    let cancelled = false
    setLoadingPortfolios(true)
    getPortfolios()
      .then((result) => {
        if (cancelled) return
        const list = result.portfolios || []
        setPortfolios(list)
        const requestedId = requestedPortfolioId || getStoredPortfolioId()
        const requested = list.find((portfolio) => portfolio._id === requestedId)
        const selected = requested || getDefaultPortfolio(list)
        setSelectionError(requestedPortfolioId && !requested ? 'That portfolio ID is unavailable. Choose another portfolio to preview.' : '')
        setSelectedPortfolioId(selected?._id || 'new')
        const requestedTemplate = new URLSearchParams(window.location.search).get('template')
        setSelectedTemplateId(templates.some((template) => template.id === requestedTemplate) ? requestedTemplate : selected?.templateId || 'minimal')
        storePortfolioId(selected?._id)
      })
      .catch(() => {
        if (!cancelled) toast.error('Could not load your portfolios')
      })
      .finally(() => { if (!cancelled) setLoadingPortfolios(false) })
    return () => { cancelled = true }
  }, [authLoading, isAuthenticated, requestedPortfolioId])

  const handlePortfolioSelection = (event) => {
    const nextId = event.target.value
    setSelectedPortfolioId(nextId)
    const nextPortfolio = portfolios.find((portfolio) => portfolio._id === nextId)
    setSelectedTemplateId(nextPortfolio?.templateId || selectedTemplateId)
    setSelectionError('')
    storePortfolioId(nextId === 'new' ? '' : nextId)
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (nextId && nextId !== 'new') next.set('id', nextId)
      else next.delete('id')
      return next
    }, { replace: true })
  }

  const selectedPortfolio = useMemo(
    () => portfolios.find((portfolio) => portfolio._id === selectedPortfolioId),
    [portfolios, selectedPortfolioId],
  )

  const handleSelectTemplate = (templateId) => {
    setSelectedTemplateId(templateId)
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      next.set('template', templateId)
      return next
    }, { replace: true })
  }

  const handleCreateWithSelectedTemplate = () => {
    navigate(`/wizard?template=${encodeURIComponent(selectedTemplateId)}`)
  }

  const handleUseTemplate = async (templateId) => {
    if (!selectedPortfolio) {
      handleSelectTemplate(templateId)
      return
    }
    try {
      setBusyTemplate(templateId)
      const result = await updatePortfolio(selectedPortfolio._id, { templateId })
      if (!result.success) throw new Error(result.message || 'Template could not be applied')
      setPortfolios((current) => current.map((portfolio) => portfolio._id === selectedPortfolio._id ? result.portfolio : portfolio))
      setSelectedTemplateId(templateId)
      toast.success('Template changed. Your portfolio content is unchanged.')
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Could not apply this template')
    } finally {
      setBusyTemplate('')
    }
  }

  const previewData = selectedPortfolio ? { ...selectedPortfolio, templateId: previewTemplate } : null

  return (
    <main className="min-h-screen bg-[#f7f7f5] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-7xl">
        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Portfolio design library</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Choose a look that fits your work.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Six distinct layouts, all ready for your existing profile, projects, education, experience and links.</p>
        </header>

        {!selectedPortfolio && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-700 shadow-sm">
            <p className="font-semibold text-slate-900">Choose a portfolio to preview its real content.</p>
            <p className="mt-1">No personal details are invented for previews. You can still create a new portfolio with any template.</p>
          </div>
        )}

        {isAuthenticated && <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <p className="text-sm font-semibold text-slate-900">Apply a design to</p>
            <p className="mt-1 text-xs text-slate-500">Changing the template keeps your portfolio content intact.</p>
          </div>
          <select value={selectedPortfolioId} onChange={handlePortfolioSelection} disabled={loadingPortfolios} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 sm:w-80">
            <option value="new">A new portfolio</option>
            {portfolios.map((portfolio) => <option key={portfolio._id} value={portfolio._id}>{portfolio.title}</option>)}
          </select>
        </div>}
        <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700">Ready to start?</p>
            <p className="mt-1 text-sm text-slate-700">Selected template: <span className="font-semibold text-slate-950">{templates.find((template) => template.id === selectedTemplateId)?.name || 'Minimal Editorial'}</span></p>
          </div>
          <button type="button" onClick={handleCreateWithSelectedTemplate} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-800">
            Create Portfolio with This Template <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        {selectionError && <p role="alert" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{selectionError}</p>}

        <section aria-label="Portfolio templates" className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => {
            const selected = selectedTemplateId === template.id
            return <article key={template.id} className={`group overflow-hidden rounded-2xl border bg-white transition-all ${selected ? 'border-slate-900 ring-2 ring-slate-900/10 shadow-lg' : 'border-slate-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg'}`}>
              <TemplateCardPreview portfolio={selectedPortfolio ? { ...selectedPortfolio, templateId: template.id } : null} template={template} />
              <div className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{template.group}</p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-950">{template.name}</h2>
                  </div>
                  {selected && <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-semibold text-white"><Check className="h-3 w-3" />Selected</span>}
                </div>
                <p className="mt-2 min-h-[3rem] text-sm leading-6 text-slate-600">{template.description}</p>
                <div className="mt-5 grid grid-cols-2 gap-2.5">
                  <button type="button" onClick={() => setPreviewTemplate(template.id)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"><Eye className="h-4 w-4" />Preview</button>
                  <button type="button" onClick={() => handleUseTemplate(template.id)} disabled={!!busyTemplate || loadingPortfolios} className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:brightness-95 disabled:cursor-wait disabled:opacity-60" style={{ backgroundColor: '#17212f' }}>{busyTemplate === template.id ? 'Applying…' : selectedPortfolio ? 'Apply to portfolio' : 'Select template'}{selectedPortfolio ? <ArrowRight className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}</button>
                </div>
              </div>
            </article>
          })}
        </section>
      </div>

      {previewTemplate && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-2 sm:p-5" role="dialog" aria-modal="true" aria-label={`${templates.find((item) => item.id === previewTemplate)?.name} preview`}>
        <div className="flex h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-6">
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-slate-500">Live template preview</p><h2 className="mt-0.5 text-sm font-semibold text-slate-900">{templates.find((item) => item.id === previewTemplate)?.name}{selectedPortfolio ? ` · ${selectedPortfolio.title}` : ''}</h2></div>
            <div className="flex items-center gap-2">
              <div className="hidden rounded-lg bg-slate-100 p-1 sm:flex">{['desktop', 'tablet', 'mobile'].map((size) => <button key={size} type="button" onClick={() => setDeviceView(size)} className={`rounded-md px-3 py-1.5 text-[11px] font-medium capitalize ${deviceView === size ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{size}</button>)}</div>
              <button type="button" onClick={() => selectedPortfolio ? handleUseTemplate(previewTemplate) : handleSelectTemplate(previewTemplate)} disabled={!!busyTemplate} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800">{selectedPortfolio ? 'Use this template' : 'Select template'}</button>
              <button type="button" onClick={() => setPreviewTemplate(null)} aria-label="Close preview" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="flex-1 overflow-auto bg-slate-100 p-2 sm:p-5">
            <div className="mx-auto overflow-hidden rounded-xl bg-white shadow-lg transition-all" style={{ width: deviceView === 'mobile' ? 390 : deviceView === 'tablet' ? 768 : '100%', maxWidth: '100%', minHeight: '100%' }}>
              {selectedPortfolio
                ? <TemplateRenderer portfolio={previewData} isPreview />
                : <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center"><p className="text-lg font-semibold text-slate-900">A portfolio is needed for a live preview</p><p className="mt-2 max-w-md text-sm leading-6 text-slate-600">Create or select a portfolio to see this template filled with your actual profile, skills and projects.</p></div>}
            </div>
          </div>
        </div>
      </div>}
    </main>
  )
}

function TemplateCardPreview({ portfolio, template }) {
  const viewportRef = useRef(null)
  const [scale, setScale] = useState(0)
  const designWidth = 1100

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return undefined
    const observer = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / designWidth)
    })
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={viewportRef} className="relative isolate h-[460px] overflow-hidden border-b border-slate-200 bg-slate-100" aria-label={`${template.name} live portfolio preview`}>
      {portfolio
        ? <div aria-hidden="true" inert data-template-id={template.id} className="pointer-events-none absolute left-0 top-0 origin-top-left" style={{ width: `${designWidth}px`, transform: `scale(${scale})`, visibility: scale ? 'visible' : 'hidden' }}>
            <TemplateRenderer portfolio={portfolio} isPreview />
          </div>
        : <div className="flex h-full items-center justify-center px-8 text-center"><div><p className="font-semibold text-slate-800">Live preview needs a portfolio</p><p className="mt-2 text-sm leading-5 text-slate-600">Create one to see your information in this template.</p></div></div>}
    </div>
  )
}
