import { useState, useEffect, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { getPortfolios } from '../services/portfolioService.js'
import { getResume, saveResume } from '../services/resumeService.js'
import { generateSummary } from '../services/aiService.js'
import { getDefaultPortfolio, getStoredPortfolioId, normalizePortfolioData, storePortfolioId } from '../utils/portfolioData.js'
import {
  FileText,
  Printer,
  Download,
  Mail,
  Phone,
  MapPin,
  Globe,
  Sparkles,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import Loader from '../components/common/Loader.jsx'
import toast from 'react-hot-toast'

// US Letter (8.5in) at 96 CSS px/in, less the 10mm left/right PDF margins.
const PDF_CONTENT_WIDTH_PX = Math.floor(8.5 * 96 - (2 * 10 * 96) / 25.4)
const REFLOW_DIMENSIONS = new Set([
  'width', 'min-width', 'max-width', 'height', 'min-height', 'max-height',
  'inline-size', 'min-inline-size', 'max-inline-size', 'block-size', 'min-block-size', 'max-block-size',
])

const parseCssNumber = (value) => Number.parseFloat(value.trim())

const normalizeHue = (value) => {
  const input = value.trim().toLowerCase()
  const number = parseCssNumber(input)
  if (input.endsWith('turn')) return number * 360
  if (input.endsWith('rad')) return number * (180 / Math.PI)
  if (input.endsWith('grad')) return number * 0.9
  return number
}

// html2canvas 1.4.1 cannot parse CSS Color 4 oklch() values. Modern browsers
// may retain that syntax in computed styles, so normalize it for the export clone.
const oklchToRgb = (expression) => {
  const parts = expression.replaceAll(',', ' ').replace('/', ' / ').trim().split(/\s+/)
  const slashIndex = parts.indexOf('/')
  const colorParts = slashIndex === -1 ? parts : parts.slice(0, slashIndex)
  const lightnessText = colorParts[0]
  const chromaText = colorParts[1]
  const hueText = colorParts[2]
  if (!lightnessText || !chromaText || !hueText) return 'rgb(0, 0, 0)'

  const lightness = lightnessText.endsWith('%') ? parseCssNumber(lightnessText) / 100 : parseCssNumber(lightnessText)
  const chroma = chromaText.endsWith('%') ? (parseCssNumber(chromaText) / 100) * 0.4 : parseCssNumber(chromaText)
  const hue = (normalizeHue(hueText) * Math.PI) / 180
  const alphaText = parts[slashIndex + 1] || '1'
  const parsedAlpha = parseCssNumber(alphaText)
  const alpha = slashIndex === -1 ? 1 : alphaText.endsWith('%') ? parsedAlpha / 100 : parsedAlpha
  const a = chroma * Math.cos(hue)
  const b = chroma * Math.sin(hue)
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3
  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
  const srgb = linear.map((channel) => {
    const bounded = Math.min(1, Math.max(0, channel))
    return Math.round(255 * (bounded <= 0.0031308 ? 12.92 * bounded : 1.055 * bounded ** (1 / 2.4) - 0.055))
  })
  return alpha < 1 ? `rgba(${srgb.join(', ')}, ${Math.min(1, Math.max(0, alpha))})` : `rgb(${srgb.join(', ')})`
}

const normalizeUnsupportedColors = (value) => value.replace(/oklch\(([^()]*)\)/gi, (_, color) => oklchToRgb(color))

const getPublicPortfolioUrl = (slug) => {
  if (!slug) return ''
  const configuredAppUrl = import.meta.env.VITE_APP_URL?.trim()
  const configuredBase = configuredAppUrl || (!['localhost', '127.0.0.1', '::1'].includes(window.location.hostname) ? window.location.origin : '')
  if (!configuredBase) return ''

  try {
    const url = new URL(configuredBase)
    if (['localhost', '127.0.0.1', '::1'].includes(url.hostname)) return ''
    return new URL(`/u/${encodeURIComponent(slug)}`, url).toString()
  } catch {
    return ''
  }
}

const resumeTemplates = [
  { id: 'modern', name: 'Modern Resume', detail: 'Subtle color and a contemporary hierarchy' },
  { id: 'classic', name: 'Classic ATS Resume', detail: 'Single column, clear labels, searchable PDF text' },
  { id: 'minimal', name: 'Minimal Resume', detail: 'Compact serif styling with balanced spacing' },
]

const resumeArraySections = [
  { key: 'experience', title: 'Work Experience', fields: [['jobRole', 'Job title'], ['companyName', 'Company'], ['location', 'Location'], ['duration', 'Dates'], ['description', 'Responsibilities and achievements', 'textarea']] },
  { key: 'education', title: 'Education', fields: [['degree', 'Degree'], ['college', 'Institution'], ['university', 'University'], ['startYear', 'Start date'], ['graduationYear', 'End date'], ['grade', 'Grade or CGPA'], ['description', 'Description', 'textarea']] },
  { key: 'projects', title: 'Projects', fields: [['title', 'Project title'], ['description', 'Description', 'textarea'], ['technologies', 'Technologies (comma separated)'], ['githubUrl', 'GitHub URL'], ['liveDemoUrl', 'Live URL']] },
  { key: 'skills', title: 'Skills', fields: [['name', 'Skill'], ['category', 'Category']] },
  { key: 'certifications', title: 'Certifications', fields: [['certificateName', 'Certification'], ['issuingOrganization', 'Issuer'], ['date', 'Issue date'], ['credentialUrl', 'Credential URL']] },
  { key: 'achievements', title: 'Achievements', fields: [['title', 'Achievement'], ['date', 'Date'], ['description', 'Description', 'textarea']] },
  { key: 'languages', title: 'Languages', fields: [['name', 'Language'], ['proficiency', 'Proficiency']] },
]

const resumeSectionLabels = {
  summary: 'Professional summary', experience: 'Work experience', education: 'Education', projects: 'Projects',
  skills: 'Skills', certifications: 'Certifications', achievements: 'Achievements', languages: 'Languages', customSections: 'Custom sections',
}

const emptyResumeEntry = (section) => section === 'experience'
  ? { jobRole: '', companyName: '', location: '', duration: '', description: '' }
  : section === 'education'
    ? { degree: '', college: '', university: '', startYear: '', graduationYear: '', grade: '', description: '' }
    : section === 'projects'
      ? { title: '', description: '', technologies: [], githubUrl: '', liveDemoUrl: '' }
      : section === 'skills'
        ? { name: '', category: '' }
        : section === 'achievements'
          ? { title: '', date: '', description: '' }
          : section === 'languages'
            ? { name: '', proficiency: '' }
            : { certificateName: '', issuingOrganization: '', date: '', credentialUrl: '' }

const ResumeArrayEditor = ({ section, entries, onChange }) => (
  <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
    <div className="mb-4 flex items-center justify-between gap-3">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{section.title}</h3>
        <p className="mt-0.5 text-xs text-gray-500">{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</p>
      </div>
      <button type="button" onClick={() => onChange([...entries, emptyResumeEntry(section.key)])} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">Add</button>
    </div>
    {entries.length === 0 ? <p className="rounded-lg bg-gray-50 px-3 py-4 text-xs text-gray-500">No {section.title.toLowerCase()} added yet.</p> : <div className="space-y-3">
      {entries.map((entry, index) => <fieldset key={entry._id || `${section.key}-${index}`} className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
        <legend className="px-1 text-[11px] font-semibold text-gray-500">Entry {index + 1}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {section.fields.map(([key, label, type]) => <label key={key} className={`block text-xs font-medium text-gray-600 ${type === 'textarea' ? 'sm:col-span-2' : ''}`}>
            {label}
            {type === 'textarea' ? <textarea rows={3} value={entry[key] || ''} onChange={(event) => onChange(entries.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: event.target.value } : item))} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-normal text-gray-800 outline-none focus:border-purple-400" /> : <input value={key === 'technologies' ? (Array.isArray(entry[key]) ? entry[key].join(', ') : entry[key] || '') : (typeof entry === 'string' && key === 'name' ? entry : entry[key] || '')} onChange={(event) => {
              const value = key === 'technologies' ? event.target.value.split(',').map((item) => item.trim()).filter(Boolean) : event.target.value
              onChange(entries.map((item, itemIndex) => itemIndex === index ? (typeof item === 'string' ? { name: value } : { ...item, [key]: value }) : item))
            }} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-normal text-gray-800 outline-none focus:border-purple-400" />}
          </label>)}
        </div>
        <button type="button" onClick={() => { if (window.confirm(`Delete this ${section.title.toLowerCase()} entry?`)) onChange(entries.filter((_, itemIndex) => itemIndex !== index)) }} className="mt-3 text-xs font-semibold text-red-600 hover:text-red-700">Delete entry</button>
      </fieldset>)}
    </div>}
  </section>
)

const ResumeCustomSectionsEditor = ({ sections, onChange }) => (
  <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
    <div className="mb-4 flex items-center justify-between gap-3">
      <div><h3 className="text-sm font-semibold text-gray-900">Custom sections</h3><p className="mt-0.5 text-xs text-gray-500">Add publications, interests, volunteer work or other details.</p></div>
      <button type="button" onClick={() => onChange([...sections, { title: '', entries: [{ title: '', content: '' }] }])} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">Add section</button>
    </div>
    {sections.length === 0 ? <p className="rounded-lg bg-gray-50 px-3 py-4 text-xs text-gray-500">No custom sections yet.</p> : <div className="space-y-3">
      {sections.map((section, index) => <fieldset key={section._id || `custom-${index}`} className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
        <legend className="px-1 text-[11px] font-semibold text-gray-500">Section {index + 1}</legend>
        <label className="block text-xs font-medium text-gray-600">Section name<input required maxLength={80} value={section.title || ''} onChange={(event) => onChange(sections.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item))} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-normal text-gray-800 outline-none focus:border-purple-400" /></label>
        <div className="mt-3 space-y-2">
          {(section.entries || []).map((entry, entryIndex) => <div key={entry._id || `${index}-${entryIndex}`} className="grid gap-2 rounded-lg border border-gray-100 bg-white p-2 sm:grid-cols-2">
            <input aria-label="Custom entry title" maxLength={120} placeholder="Entry title (optional)" value={entry.title || ''} onChange={(event) => onChange(sections.map((item, itemIndex) => itemIndex === index ? { ...item, entries: item.entries.map((line, lineIndex) => lineIndex === entryIndex ? { ...line, title: event.target.value } : line) } : item))} className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800" />
            <textarea aria-label="Custom entry content" maxLength={3000} rows={2} placeholder="Content" value={entry.content || ''} onChange={(event) => onChange(sections.map((item, itemIndex) => itemIndex === index ? { ...item, entries: item.entries.map((line, lineIndex) => lineIndex === entryIndex ? { ...line, content: event.target.value } : line) } : item))} className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800" />
            <button type="button" onClick={() => { if (window.confirm('Delete this custom-section entry?')) onChange(sections.map((item, itemIndex) => itemIndex === index ? { ...item, entries: item.entries.filter((_, lineIndex) => lineIndex !== entryIndex) } : item)) }} className="text-left text-xs font-semibold text-red-600">Delete entry</button>
          </div>)}
        </div>
        <div className="mt-3 flex gap-4">
          <button type="button" onClick={() => onChange(sections.map((item, itemIndex) => itemIndex === index ? { ...item, entries: [...(item.entries || []), { title: '', content: '' }] } : item))} className="text-xs font-semibold text-purple-700">Add entry</button>
          <button type="button" onClick={() => { if (window.confirm('Delete this custom section and its entries?')) onChange(sections.filter((_, itemIndex) => itemIndex !== index)) }} className="text-xs font-semibold text-red-600">Delete section</button>
        </div>
      </fieldset>)}
    </div>}
  </section>
)

const downloadAtsPdf = async (portfolio) => {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'letter', orientation: 'portrait' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 17
  const contentWidth = pageWidth - margin * 2
  let y = 18
  const text = (value) => String(value || '').replace(/\s+/g, ' ').trim()
  const ensureRoom = (height) => {
    if (y + height > pageHeight - margin) {
      doc.addPage()
      y = margin
    }
  }
  const line = (value, { size = 9, bold = false, gap = 1.2 } = {}) => {
    const content = text(value)
    if (!content) return
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(size)
    const lines = doc.splitTextToSize(content, contentWidth)
    const height = lines.length * (size * 0.42) + gap
    ensureRoom(height)
    doc.text(lines, margin, y)
    y += height
  }
  const section = (heading, minimumContentHeight = 28) => {
    if (y > 18) y += 3
    // Keep the section heading with enough room for its first entry.
    ensureRoom(minimumContentHeight + 9)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(heading.toUpperCase(), margin, y)
    y += 2
    doc.setDrawColor(110, 118, 129)
    doc.setLineWidth(0.25)
    doc.line(margin, y, pageWidth - margin, y)
    y += 4
  }
  const personalInfo = portfolio?.personalInfo || {}
  const about = portfolio?.about || {}
  const education = Array.isArray(portfolio?.education) ? portfolio.education.filter((item) => item && (item.degree || item.college || item.university || item.description)) : []
  const skills = Array.isArray(portfolio?.skills) ? portfolio.skills : []
  const projects = Array.isArray(portfolio?.projects) ? portfolio.projects.filter((item) => item && (item.title || item.description || (Array.isArray(item.technologies) && item.technologies.length))) : []
  const experience = Array.isArray(portfolio?.experience) ? portfolio.experience.filter((item) => item && (item.jobRole || item.companyName || item.description)) : []
  const certifications = Array.isArray(portfolio?.certifications) ? portfolio.certifications.filter((item) => item && (item.certificateName || item.issuingOrganization || item.date)) : []
  line(personalInfo.fullName, { size: 20, bold: true, gap: 1 })
  line(personalInfo.title, { size: 11, bold: true, gap: 2 })
  line([personalInfo.email, personalInfo.phone, personalInfo.location, personalInfo.website, portfolio?.socialLinks?.github, portfolio?.socialLinks?.linkedin, getPublicPortfolioUrl(portfolio?.slug)].filter(Boolean).join('  |  '), { size: 8, gap: 2 })
  const renderSection = {
    summary: () => { if (about.summary) { section('Professional Summary'); line(about.summary) } },
    experience: () => { if (experience.length) { section('Professional Experience'); experience.forEach((item) => { line(`${item.jobRole || ''}${item.companyName ? ` — ${item.companyName}` : ''}`, { bold: true }); line([item.duration, item.location].filter(Boolean).join(' | '), { size: 8 }); line(item.description, { gap: 2 }) }) } },
    projects: () => { if (projects.length) { section('Projects'); projects.forEach((item) => { line(item.title, { bold: true }); if (Array.isArray(item.technologies) && item.technologies.length) line(item.technologies.join(' · '), { size: 8 }); line(item.description, { gap: 2 }) }) } },
    skills: () => { if (skills.length) { section('Skills'); line(skills.map((item) => typeof item === 'string' ? item : item?.name).filter(Boolean).join('  ·  ')) } },
    education: () => { if (education.length) { section('Education', 34); education.forEach((item) => { line(item.degree || item.college, { bold: true }); line([item.university || item.college, [item.startYear, item.graduationYear].filter(Boolean).join(' — '), item.grade].filter(Boolean).join(' | '), { size: 8 }); line(item.description, { gap: 2 }) }) } },
    certifications: () => { if (certifications.length) { section('Certifications', 18); certifications.forEach((item) => line([item.certificateName, item.issuingOrganization, item.date].filter(Boolean).join(' | '), { gap: 2 })) } },
    achievements: () => { if (portfolio?.achievements?.length) { section('Achievements', 18); portfolio.achievements.forEach((item) => line([item.title || item.name, item.date, item.description].filter(Boolean).join(' | '), { gap: 2 })) } },
    languages: () => { if (portfolio?.languages?.length) { section('Languages', 18); portfolio.languages.forEach((item) => line([item.name, item.proficiency].filter(Boolean).join(' | '), { gap: 2 })) } },
    customSections: () => (portfolio?.customSections || []).forEach((custom) => { section(custom.title || 'Additional Information', 18); (custom.entries || []).forEach((entry) => line([entry.title, entry.content].filter(Boolean).join(' — '), { gap: 2 })) }),
  }
  const sectionOrder = portfolio?.sectionOrder || Object.keys(renderSection)
  const visibility = portfolio?.sectionVisibility || {}
  sectionOrder.forEach((key) => { if (visibility[key] !== false) renderSection[key]?.() })
  doc.save(`${(personalInfo.fullName || 'Portfolio').replace(/\s+/g, '_')}_Resume.pdf`)
}

const createPdfExportClone = (source) => {
  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.tabIndex = -1
  Object.assign(iframe.style, {
    position: 'fixed',
    left: '-10000px',
    top: '0',
    width: `${PDF_CONTENT_WIDTH_PX}px`,
    height: `${Math.max(source.scrollHeight, window.innerHeight)}px`,
    border: '0',
    pointerEvents: 'none',
  })
  document.body.appendChild(iframe)

  const frameDocument = iframe.contentDocument
  frameDocument.open()
  frameDocument.write('<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0"></body></html>')
  frameDocument.close()

  const originalNodes = [source, ...source.querySelectorAll('*')]
  const clone = source.cloneNode(true)
  const clonedNodes = [clone, ...clone.querySelectorAll('*')]
  originalNodes.forEach((original, index) => {
    const target = clonedNodes[index]
    const computed = window.getComputedStyle(original)
    for (let propertyIndex = 0; propertyIndex < computed.length; propertyIndex += 1) {
      const property = computed[propertyIndex]
      if (property.startsWith('--')) continue
      // Computed widths/heights often resolve percentages and `auto` to the
      // preview's wide desktop pixels. Let text/container elements reflow at
      // the printable width, while preserving fixed icon dimensions.
      if (REFLOW_DIMENSIONS.has(property) && original.tagName.toLowerCase() !== 'svg') continue
      const value = computed.getPropertyValue(property)
      if (value) target.style.setProperty(property, normalizeUnsupportedColors(value))
    }
    target.removeAttribute('class')
    target.style.animation = 'none'
    target.style.transition = 'none'
  })

  clone.removeAttribute('id')
  clone.style.boxSizing = 'border-box'
  clone.style.width = `${PDF_CONTENT_WIDTH_PX}px`
  clone.style.minWidth = '0'
  clone.style.maxWidth = `${PDF_CONTENT_WIDTH_PX}px`
  clone.style.margin = '0'
  clone.style.paddingLeft = '40px'
  clone.style.paddingRight = '40px'
  clone.style.overflowX = 'hidden'
  clone.style.overflowWrap = 'anywhere'
  clone.style.boxShadow = 'none'
  clone.style.breakInside = 'auto'
  clone.querySelectorAll('[data-pdf-wrap]').forEach((node) => {
    node.style.minWidth = '0'
    node.style.maxWidth = '100%'
    node.style.overflowWrap = 'anywhere'
    node.style.whiteSpace = 'normal'
  })
  clone.querySelectorAll('[data-pdf-flex-wrap]').forEach((node) => {
    node.style.flexWrap = 'wrap'
    node.style.maxWidth = '100%'
    node.style.minWidth = '0'
    node.querySelectorAll(':scope > *').forEach((child) => {
      child.style.minWidth = '0'
      child.style.maxWidth = '100%'
      child.style.overflowWrap = 'anywhere'
    })
  })
  clone.querySelectorAll('[data-pdf-avoid-break], header, h1, h2').forEach((node) => {
    node.style.breakInside = 'avoid'
    node.style.pageBreakInside = 'avoid'
  })
  clone.querySelectorAll('h2').forEach((node) => {
    node.style.breakAfter = 'avoid'
    node.style.pageBreakAfter = 'avoid'
  })
  frameDocument.body.appendChild(clone)
  if (clone.scrollWidth > clone.clientWidth + 1) {
    iframe.remove()
    throw new Error('Some resume content exceeds the printable width. Shorten a long contact field, URL, project label, or skill name and try again.')
  }
  return { iframe, clone }
}

export default function ResumeBuilder() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialId = searchParams.get('id')

  const [portfolios, setPortfolios] = useState([])
  const [selectedPortfolioId, setSelectedPortfolioId] = useState(initialId || '')
  const [selectionError, setSelectionError] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('modern') // 'modern' | 'classic'
  const [loading, setLoading] = useState(true)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [isSavingSummary, setIsSavingSummary] = useState(false)
  const [summaryDraft, setSummaryDraft] = useState(null)
  const [resumeDraft, setResumeDraft] = useState(null)
  const [savedResumeDraft, setSavedResumeDraft] = useState(null)
  const [resumeLoadError, setResumeLoadError] = useState('')
  const [resumeLoading, setResumeLoading] = useState(false)
  const [isSavingResume, setIsSavingResume] = useState(false)
  const [resumeReloadKey, setResumeReloadKey] = useState(0)
  const resumeRequestRef = useRef(0)

  useEffect(() => {
    const selected = portfolios.find((portfolio) => portfolio._id === selectedPortfolioId)
    if (!selected) return
    const requestId = ++resumeRequestRef.current
    setResumeLoading(true)
    setResumeLoadError('')
    setResumeDraft(null)
    setSavedResumeDraft(null)
    getResume(selected._id).then((response) => {
      if (requestId !== resumeRequestRef.current) return
      if (!response.success || !response.resume) throw new Error('Resume data was not returned by the server.')
      const stored = response.resume
      const normalizedPortfolio = normalizePortfolioData({
        ...selected,
        ...stored,
        personalInfo: stored.personalInfo || selected.personalInfo,
        socialLinks: stored.socialLinks || selected.socialLinks,
        about: { summary: stored.summary ?? selected.about?.summary ?? '' },
        certifications: stored.certifications || selected.certifications,
        achievements: [],
        awards: [],
      })
      const nextDraft = {
        ...normalizedPortfolio,
        ...stored,
        portfolioId: selected._id,
        personalInfo: { ...normalizedPortfolio.personalInfo, ...(stored.personalInfo || {}), website: stored.personalInfo?.website ?? selected.socialLinks?.portfolio ?? '' },
        socialLinks: { ...normalizedPortfolio.socialLinks, ...(stored.socialLinks || {}) },
        about: { ...normalizedPortfolio.about, summary: stored.summary ?? normalizedPortfolio.about.summary },
        certifications: normalizedPortfolio.certifications,
        achievements: stored.achievements || [],
        skills: (stored.skills || []).map((skill) => typeof skill === 'string' ? { name: skill, category: '' } : { ...skill }),
        sectionOrder: Array.isArray(stored.sectionOrder) ? [...stored.sectionOrder.filter((key) => resumeSectionLabels[key]), ...Object.keys(resumeSectionLabels).filter((key) => !stored.sectionOrder.includes(key))] : Object.keys(resumeSectionLabels),
        sectionVisibility: stored.sectionVisibility || {},
      }
      setResumeDraft(nextDraft)
      setSavedResumeDraft(structuredClone(nextDraft))
      setSelectedStyle(resumeTemplates.some((template) => template.id === nextDraft.templateStyle) ? nextDraft.templateStyle : 'modern')
    }).catch((error) => {
      if (requestId !== resumeRequestRef.current) return
      setResumeLoadError(error.response?.data?.message || error.message || 'Could not load resume data.')
      toast.error('Could not load saved resume data.')
    }).finally(() => {
      if (requestId === resumeRequestRef.current) setResumeLoading(false)
    })
  }, [portfolios, selectedPortfolioId, resumeReloadKey])

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const res = await getPortfolios()
        if (res.success && res.portfolios) {
          setPortfolios(res.portfolios)
          const requestedId = initialId || getStoredPortfolioId()
          const requestedPortfolio = requestedId
            ? res.portfolios.find((portfolio) => portfolio._id === requestedId)
            : null
          if (requestedPortfolio) {
            setSelectedPortfolioId(requestedPortfolio._id)
            storePortfolioId(requestedPortfolio._id)
            setSelectionError('')
          } else if (!initialId && res.portfolios.length > 0) {
            const defaultPortfolio = getDefaultPortfolio(res.portfolios)
            setSelectedPortfolioId(defaultPortfolio._id)
            storePortfolioId(defaultPortfolio._id)
            setSelectionError('')
          } else if (initialId) {
            setSelectedPortfolioId('')
            setSelectionError('The portfolio in this link is unavailable. Choose one of your portfolios to continue.')
          } else {
            setSelectedPortfolioId('')
          }
        }
      } catch {
        toast.error('Failed to load portfolio information for resume')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [initialId])

  const handlePortfolioChange = (event) => {
    const nextId = event.target.value
    setSelectedPortfolioId(nextId)
    setSummaryDraft(null)
    setResumeDraft(null)
    setSavedResumeDraft(null)
    storePortfolioId(nextId)
    setSelectionError('')
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (nextId) next.set('id', nextId)
      else next.delete('id')
      return next
    }, { replace: true })
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPdf = async () => {
    if (!activePortfolio || !resumeHasContent) {
      toast.error('Select a portfolio with resume information before downloading.')
      return
    }
    const element = document.getElementById('printable-resume')
    if (!element) {
      toast.error('Could not find the resume preview to export.')
      return
    }

    setIsDownloadingPdf(true)
    const toastId = toast.loading('Generating real PDF file...')

    const resumePortfolio = {
      ...(resumeDraft?.portfolioId === activePortfolio?._id ? resumeDraft : activePortfolio),
      about: { ...(resumeDraft?.about || activePortfolio.about), summary: summaryDraft !== null ? summaryDraft : (resumeDraft?.about?.summary ?? activePortfolio.about?.summary) },
    }
    const fileName = `${(resumePortfolio?.personalInfo?.fullName || 'Portfolio').replace(/\s+/g, '_')}_Resume.pdf`

    const opt = {
      margin: [10, 10, 10, 10], // top, left, bottom, right in mm
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' },
    }

    let exportFrame
    try {
      if (selectedStyle === 'classic') {
        if (!resumePortfolio) throw new Error('Select an available portfolio before downloading a resume.')
        await downloadAtsPdf(resumePortfolio)
        toast.success('Searchable ATS resume PDF downloaded successfully!', { id: toastId })
        return
      }
      const { default: html2pdf } = await import('html2pdf.js/src/index.js')
      await document.fonts?.ready
      const exportClone = createPdfExportClone(element)
      exportFrame = exportClone.iframe
      await html2pdf().set({
        ...opt,
        pagebreak: { mode: ['css', 'legacy'] },
      }).from(exportClone.clone).save()
      toast.success('Resume PDF downloaded successfully!', { id: toastId })
    } catch (err) {
      console.error('PDF generation error:', err)
      const reason = err instanceof Error ? err.message : 'Unexpected export error'
      toast.error(`PDF generation failed: ${reason}`, { id: toastId })
    } finally {
      exportFrame?.remove()
      setIsDownloadingPdf(false)
    }
  }

  const activePortfolio = normalizePortfolioData(portfolios.find((p) => p._id === selectedPortfolioId))
  const activeResumeDraft = resumeDraft?.portfolioId === activePortfolio?._id ? resumeDraft : null

  const updateResumeDraftField = (section, field, value) => {
    setResumeDraft((current) => current?.portfolioId === activePortfolio?._id
      ? { ...current, [section]: { ...(current[section] || {}), [field]: value } }
      : current)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader size="lg" text="Preparing resume generator..." />
      </div>
    )
  }

  if (portfolios.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50/50 py-16 px-4 text-center">
        <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">No Portfolios Found</h2>
          <p className="text-sm text-gray-500 font-light">
            You need at least one portfolio to automatically extract your resume details.
          </p>
          <div className="pt-2">
            <Link
              to="/wizard"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-200"
            >
              <span>Create Portfolio</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const personalInfo = activeResumeDraft?.personalInfo || {}
  const publicPortfolioUrl = getPublicPortfolioUrl(activePortfolio?.slug)
  const about = activeResumeDraft?.about || {}
  const experience = Array.isArray(activeResumeDraft?.experience) ? activeResumeDraft.experience.filter((item) => item && (item.jobRole || item.companyName || item.description)) : []
  const education = Array.isArray(activeResumeDraft?.education) ? activeResumeDraft.education.filter((item) => item && (item.degree || item.college || item.university || item.description)) : []
  const skills = Array.isArray(activeResumeDraft?.skills) ? activeResumeDraft.skills : []
  const projects = Array.isArray(activeResumeDraft?.projects) ? activeResumeDraft.projects.filter((item) => item && (item.title || item.description || (Array.isArray(item.technologies) && item.technologies.length))) : []
  const certifications = Array.isArray(activeResumeDraft?.certifications) ? activeResumeDraft.certifications.filter((item) => item && (item.certificateName || item.issuingOrganization || item.date)) : []

  const normalizedSkills = skills
    .map((skill) => typeof skill === 'string' ? skill.trim() : skill?.name?.trim())
    .filter(Boolean)
  const displayedSummary = summaryDraft !== null ? summaryDraft : about.summary || ''
  const resumeOrder = [...(activeResumeDraft?.sectionOrder || Object.keys(resumeSectionLabels)).filter((key) => resumeSectionLabels[key]), ...Object.keys(resumeSectionLabels).filter((key) => !(activeResumeDraft?.sectionOrder || []).includes(key))]
  const resumeIsDirty = Boolean(activeResumeDraft && savedResumeDraft && JSON.stringify(activeResumeDraft) !== JSON.stringify(savedResumeDraft)) || summaryDraft !== null
  const resumeHasContent = Boolean(
    personalInfo.fullName || personalInfo.title || personalInfo.email || personalInfo.phone || personalInfo.location ||
    displayedSummary || education.length || normalizedSkills.length || projects.length || experience.length || certifications.length || activeResumeDraft?.achievements?.length || activeResumeDraft?.languages?.length || activeResumeDraft?.customSections?.length,
  )
  const missingResumeSections = [
    !personalInfo.fullName && 'Full name',
    !personalInfo.title && 'Professional title',
    !(personalInfo.email || personalInfo.phone || personalInfo.location) && 'Contact details',
    !displayedSummary && 'Professional summary',
    !education.length && 'Education',
    !normalizedSkills.length && 'Skills',
    !projects.length && 'Projects',
    !experience.length && 'Experience',
    !certifications.length && 'Certifications',
  ].filter(Boolean)

  const handleGenerateResumeSummary = async () => {
    if (!personalInfo.title?.trim()) {
      toast.error('Add a professional title in your portfolio before generating a resume summary.')
      return
    }

    if (displayedSummary.trim() && !window.confirm('Replace the current professional summary with a new AI draft?')) return

    setIsGeneratingSummary(true)
    try {
    const response = await generateSummary({ role: personalInfo.title, skills: normalizedSkills })
      if (!response.summary?.trim()) throw new Error('Gemini returned an empty resume summary.')
      setSummaryDraft(response.summary.trim())
      setResumeDraft((current) => current?.portfolioId === activePortfolio?._id ? { ...current, about: { ...(current.about || {}), summary: response.summary.trim() } } : current)
      toast.success('AI summary added to the editable field and resume preview.')
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'AI summary generation failed.')
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  const handleSaveSummary = async () => {
    if (!activePortfolio || !activeResumeDraft || summaryDraft === null) return
    setIsSavingSummary(true)
    try {
      const response = await saveResume(activePortfolio._id, { summary: summaryDraft })
      if (!response.success || !response.resume) throw new Error(response.message || 'Could not save the professional summary.')
      const updated = { ...activeResumeDraft, ...response.resume, portfolioId: activePortfolio._id, about: { ...(activeResumeDraft.about || {}), summary: response.resume.summary } }
      setResumeDraft(updated)
      setSavedResumeDraft(structuredClone(updated))
      setSummaryDraft(null)
      toast.success('Professional summary saved to your resume.')
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Could not save the professional summary.')
    } finally {
      setIsSavingSummary(false)
    }
  }

  const handleSaveResume = async () => {
    if (!activePortfolio || !activeResumeDraft) return
    if (personalInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalInfo.email)) {
      toast.error('Enter a valid email address or leave the field blank.')
      return
    }
    const invalidUrl = [personalInfo.website, activeResumeDraft.socialLinks?.github, activeResumeDraft.socialLinks?.linkedin].find((value) => value && !/^https?:\/\//i.test(value))
    if (invalidUrl) {
      toast.error('Website and social links must start with http:// or https://.')
      return
    }
    if ((activeResumeDraft.customSections || []).some((section) => !section.title?.trim())) {
      toast.error('Give every custom section a name before saving.')
      return
    }
    const requiredResumeField = [
      ['experience', 'jobRole', 'Add a job title to each experience entry.'],
      ['education', 'degree', 'Add a degree or qualification to each education entry.'],
      ['projects', 'title', 'Add a title to each project entry.'],
      ['skills', 'name', 'Add a name to each skill entry.'],
      ['certifications', 'certificateName', 'Add a name to each certification entry.'],
      ['achievements', 'title', 'Add a title to each achievement entry.'],
      ['languages', 'name', 'Add a language name to each entry.'],
    ].find(([section, field]) => (activeResumeDraft[section] || []).some((entry) => !(typeof entry === 'string' ? entry : entry?.[field])?.trim?.()) && (activeResumeDraft[section] || []).length)
    if (requiredResumeField) {
      toast.error(requiredResumeField[2])
      return
    }
    const invalidEntryUrl = [
      ...(activeResumeDraft.projects || []).flatMap((project) => [project.githubUrl, project.liveDemoUrl]),
      ...(activeResumeDraft.certifications || []).map((item) => item.credentialUrl),
    ].find((value) => value && !/^https?:\/\//i.test(value))
    if (invalidEntryUrl) {
      toast.error('Project and credential links must start with http:// or https://.')
      return
    }
    setIsSavingResume(true)
    try {
      const response = await saveResume(activePortfolio._id, {
        personalInfo: activeResumeDraft.personalInfo,
        socialLinks: activeResumeDraft.socialLinks,
        summary: summaryDraft !== null ? summaryDraft : activeResumeDraft.about?.summary || '',
        education: activeResumeDraft.education,
        experience: activeResumeDraft.experience,
        projects: activeResumeDraft.projects,
        skills: activeResumeDraft.skills,
        certifications: activeResumeDraft.certifications,
        achievements: activeResumeDraft.achievements,
        languages: activeResumeDraft.languages,
        customSections: activeResumeDraft.customSections,
        sectionOrder: activeResumeDraft.sectionOrder,
        sectionVisibility: activeResumeDraft.sectionVisibility,
        templateStyle: selectedStyle,
      })
      if (!response.success || !response.resume) throw new Error(response.message || 'Could not save resume details.')
      const updated = { ...activeResumeDraft, ...response.resume, portfolioId: activePortfolio._id, about: { ...(activeResumeDraft.about || {}), summary: response.resume.summary } }
      setResumeDraft(updated)
      setSavedResumeDraft(structuredClone(updated))
      setSummaryDraft(null)
      toast.success('Resume details saved.')
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Could not save resume details.')
    } finally {
      setIsSavingResume(false)
    }
  }

  const handleCancelResumeEdits = () => {
    if (!savedResumeDraft) return
    if (JSON.stringify(activeResumeDraft) !== JSON.stringify(savedResumeDraft) && !window.confirm('Discard unsaved resume changes?')) return
    setResumeDraft(structuredClone(savedResumeDraft))
    setSelectedStyle(savedResumeDraft.templateStyle || 'modern')
    setSummaryDraft(null)
  }

  const moveResumeSection = (section, direction) => {
    setResumeDraft((current) => {
      if (!current || current.portfolioId !== activePortfolio?._id) return current
      const order = [...(current.sectionOrder || Object.keys(resumeSectionLabels))]
      const index = order.indexOf(section)
      const nextIndex = index + direction
      if (index < 0 || nextIndex < 0 || nextIndex >= order.length) return current
      ;[order[index], order[nextIndex]] = [order[nextIndex], order[index]]
      return { ...current, sectionOrder: order }
    })
  }

  const toggleResumeSection = (section) => setResumeDraft((current) => current?.portfolioId === activePortfolio?._id
    ? { ...current, sectionVisibility: { ...(current.sectionVisibility || {}), [section]: current.sectionVisibility?.[section] === false } }
    : current)

  const resumeDesign = {
    modern: {
      shell: 'bg-white p-8 sm:p-12 rounded-2xl shadow-xl border border-gray-200 text-gray-900 font-sans',
      heading: 'text-xs font-bold uppercase tracking-wider text-purple-800',
      section: 'py-5 border-b border-gray-100',
      name: 'text-3xl font-extrabold tracking-tight text-gray-900',
      accent: 'text-purple-700',
    },
    classic: {
      shell: 'bg-white p-8 sm:p-12 border border-gray-200 text-gray-900 font-sans',
      heading: 'text-[11px] font-bold uppercase tracking-[0.12em] text-gray-900',
      section: 'py-4 border-b border-gray-200',
      name: 'text-3xl font-bold tracking-tight text-gray-900',
      accent: 'text-gray-900',
    },
    minimal: {
      shell: 'bg-[#fffefa] p-8 sm:p-12 rounded-xl shadow-lg border border-stone-200 text-stone-900 font-serif',
      heading: 'text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-600',
      section: 'py-4 border-b border-stone-200',
      name: 'text-3xl font-medium tracking-tight text-stone-900 font-serif',
      accent: 'text-stone-700',
    },
  }[selectedStyle]

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      {/* Non-printed Toolbar */}
      <div className="max-w-4xl mx-auto mb-6 print:hidden">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <span>Resume Generator</span>
            </h1>
            <p className="text-xs text-gray-500">
              Synchronized from your portfolio data. Download as a PDF file or print.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Source Portfolio Dropdown */}
            <select
              value={selectedPortfolioId}
              onChange={handlePortfolioChange}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800"
            >
              {!selectedPortfolioId && <option value="">Select a portfolio</option>}
              {portfolios.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.title}
                </option>
              ))}
            </select>

            {activePortfolio && <Link to={`/editor/${activePortfolio._id}`} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-800 transition-colors hover:bg-gray-50">
              <FileText className="h-4 w-4" /> Edit Portfolio Details
            </Link>}

            <button
              type="button"
              onClick={handleSaveResume}
              disabled={!activePortfolio || isSavingResume || !activeResumeDraft || !resumeIsDirty}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSavingResume ? 'Saving…' : 'Save Resume Details'}
            </button>
            <button type="button" onClick={handleCancelResumeEdits} disabled={!resumeIsDirty || isSavingResume} className="rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>

            <button
              type="button"
              onClick={handleGenerateResumeSummary}
              disabled={!activePortfolio || !personalInfo.title?.trim() || isGeneratingSummary}
              className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-2.5 text-xs font-semibold text-purple-800 transition-colors hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              {isGeneratingSummary ? 'Generating…' : 'AI Resume Summary'}
            </button>

            {/* Real PDF File Download Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf || !activePortfolio || !resumeHasContent}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-200 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloadingPdf ? 'Exporting...' : 'Download PDF'}</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
              title="Open browser print dialog"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>
        {selectionError && (
          <div role="alert" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {selectionError}
          </div>
        )}
        {resumeLoading && activePortfolio && <div role="status" className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">Loading saved resume details…</div>}
        {resumeLoadError && activePortfolio && <div role="alert" className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"><span>{resumeLoadError}</span><button type="button" onClick={() => setResumeReloadKey((key) => key + 1)} className="font-semibold underline">Retry loading</button></div>}
      </div>

      {activePortfolio && activeResumeDraft && <section aria-label="Edit resume contact information" className="mx-auto mb-5 max-w-4xl rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5 print:hidden">
        <h2 className="text-sm font-semibold text-gray-900">Personal & Contact Details</h2>
        <p className="mt-1 text-xs text-gray-500">Resume details are stored separately and do not change your portfolio profile.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            ['fullName', 'Full name'], ['title', 'Professional title'], ['email', 'Email'], ['phone', 'Phone'], ['location', 'Location'], ['website', 'Website URL'],
          ].map(([field, label]) => <label key={field} className="text-xs font-medium text-gray-600">{label}<input value={personalInfo[field] || ''} onChange={(event) => updateResumeDraftField('personalInfo', field, event.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal text-gray-800 outline-none focus:border-purple-400" /></label>)}
          {[
            ['github', 'GitHub URL'], ['linkedin', 'LinkedIn URL'],
          ].map(([field, label]) => <label key={field} className="text-xs font-medium text-gray-600">{label}<input value={activeResumeDraft.socialLinks?.[field] || ''} onChange={(event) => updateResumeDraftField('socialLinks', field, event.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal text-gray-800 outline-none focus:border-purple-400" /></label>)}
        </div>
      </section>}

      {activePortfolio && activeResumeDraft && <section aria-label="Resume section order and visibility" className="mx-auto mb-5 max-w-4xl rounded-2xl border border-gray-200 bg-white p-4 shadow-sm print:hidden sm:p-5">
        <h2 className="text-sm font-semibold text-gray-900">Resume sections</h2><p className="mt-1 text-xs text-gray-500">Reorder sections or hide them from the preview and downloaded resume.</p>
        <div className="mt-3 divide-y divide-gray-100">{resumeOrder.map((section, index) => <div key={section} className="flex items-center justify-between gap-3 py-2"><label className="flex min-w-0 items-center gap-2 text-xs font-medium text-gray-700"><input type="checkbox" checked={activeResumeDraft.sectionVisibility?.[section] !== false} onChange={() => toggleResumeSection(section)} />{resumeSectionLabels[section]}</label><div className="flex gap-1"><button type="button" aria-label={`Move ${resumeSectionLabels[section]} up`} title="Move up" onClick={() => moveResumeSection(section, -1)} disabled={index === 0} className="rounded-md border border-gray-200 p-1.5 text-gray-600 disabled:opacity-30"><ChevronUp className="h-4 w-4" /></button><button type="button" aria-label={`Move ${resumeSectionLabels[section]} down`} title="Move down" onClick={() => moveResumeSection(section, 1)} disabled={index === resumeOrder.length - 1} className="rounded-md border border-gray-200 p-1.5 text-gray-600 disabled:opacity-30"><ChevronDown className="h-4 w-4" /></button></div></div>)}</div>
      </section>}

      {activePortfolio && activeResumeDraft && <div className="mx-auto mb-5 grid max-w-4xl gap-4 print:hidden">
        {resumeArraySections.map((section) => <ResumeArrayEditor key={section.key} section={section} entries={activeResumeDraft[section.key] || []} onChange={(entries) => setResumeDraft((current) => current?.portfolioId === activePortfolio._id ? { ...current, [section.key]: entries } : current)} />)}
        <ResumeCustomSectionsEditor sections={activeResumeDraft.customSections || []} onChange={(sections) => setResumeDraft((current) => current?.portfolioId === activePortfolio._id ? { ...current, customSections: sections } : current)} />
      </div>}

      {activePortfolio && activeResumeDraft && <section aria-label="Edit professional summary" className="mx-auto mb-5 max-w-4xl rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Professional Summary</h2>
            <p className="mt-1 text-xs text-gray-500">Edit this portfolio-backed field; the resume preview updates as you type.</p>
          </div>
          <button type="button" onClick={handleSaveSummary} disabled={summaryDraft === null || isSavingSummary} className="rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
            {isSavingSummary ? 'Saving…' : 'Save Summary'}
          </button>
        </div>
        <textarea
          aria-label="Professional summary text"
          value={displayedSummary}
          onChange={(event) => setSummaryDraft(event.target.value)}
          rows={4}
          placeholder="Write a concise professional summary, or use AI Resume Summary to generate a draft."
          className="mt-3 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3 text-sm leading-6 text-gray-800 outline-none transition focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100"
        />
      </section>}

      {activePortfolio && resumeHasContent && missingResumeSections.length > 0 && (
        <div className="mx-auto mb-5 max-w-4xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 print:hidden">
          <p className="font-semibold">This resume is incomplete.</p>
          <p className="mt-1">Add these sections in Resume Details above: {missingResumeSections.join(', ')}.</p>
        </div>
      )}

      {activePortfolio && resumeHasContent && <section aria-label="Resume templates" className="mx-auto mb-5 grid max-w-4xl gap-3 sm:grid-cols-3 print:hidden">
        {resumeTemplates.map((template) => <button key={template.id} type="button" onClick={() => { setSelectedStyle(template.id); setResumeDraft((current) => current?.portfolioId === activePortfolio?._id ? { ...current, templateStyle: template.id } : current) }} aria-pressed={selectedStyle === template.id} className={`rounded-2xl border p-3 text-left transition-colors ${selectedStyle === template.id ? 'border-slate-900 bg-white ring-2 ring-slate-900/10 shadow-sm' : 'border-gray-200 bg-white/70 hover:bg-white'}`}>
          <div className={`mb-3 h-16 overflow-hidden rounded-lg border p-2 ${template.id === 'classic' ? 'border-gray-300 bg-white' : template.id === 'minimal' ? 'border-stone-200 bg-[#fffefa]' : 'border-purple-100 bg-white'}`}>
            <div className={`h-2.5 w-2/5 rounded-sm ${template.id === 'modern' ? 'bg-purple-700' : template.id === 'classic' ? 'bg-gray-900' : 'bg-stone-700'}`} />
            <div className="mt-1.5 h-1 w-1/4 rounded-sm bg-gray-300" />
            <div className={`mt-2 h-px ${template.id === 'modern' ? 'bg-purple-200' : template.id === 'classic' ? 'bg-gray-400' : 'bg-stone-300'}`} />
            <div className="mt-2 grid grid-cols-2 gap-1"><div className="h-1 rounded-sm bg-gray-200" /><div className="h-1 rounded-sm bg-gray-200" /><div className="h-1 rounded-sm bg-gray-200" /></div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-gray-900">{template.name}</span>
            {selectedStyle === template.id && <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[9px] font-semibold text-white">Selected</span>}
          </div>
          <span className="mt-1 block text-[10px] leading-4 text-gray-500">{template.detail}</span>
        </button>)}
      </section>}

      {/* Printable Sheet (Standard Letter / A4 Dimension Style) */}
      {!activePortfolio ? (
        <div className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-950">
          <h2 className="font-semibold">Select an available portfolio</h2>
          <p className="mt-2">The resume preview is unavailable until you choose a portfolio from the list above.</p>
          <Link to="/dashboard" className="mt-3 inline-flex font-semibold underline underline-offset-2">Return to dashboard</Link>
        </div>
      ) : resumeLoading ? (
        <div role="status" className="mx-auto max-w-2xl rounded-2xl border border-blue-200 bg-blue-50 p-6 text-center text-sm text-blue-900">Loading saved resume details…</div>
      ) : resumeLoadError ? (
        <div role="alert" className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-900"><p>{resumeLoadError}</p><button type="button" onClick={() => setResumeReloadKey((key) => key + 1)} className="mt-3 font-semibold underline">Retry loading</button></div>
      ) : !resumeHasContent ? (
        <div className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-700">
          <h2 className="font-semibold">This portfolio does not have resume information yet.</h2>
          <p className="mt-2">Add your name, professional title, and at least one resume section to create a useful preview.</p>
          <Link to={`/editor/${activePortfolio._id}`} className="mt-3 inline-flex font-semibold text-purple-700 underline underline-offset-2">Open portfolio editor</Link>
        </div>
      ) : <div className="max-w-4xl mx-auto">
        <div
          id="printable-resume"
          className={`${resumeDesign.shell} print:border-none print:shadow-none print:p-0 print:m-0`}
        >
          {/* Resume Header */}
          <header className={`pb-6 border-b ${selectedStyle === 'modern' ? 'border-purple-200' : selectedStyle === 'classic' ? 'border-gray-900' : 'border-stone-300'}`}>
            <h1 className={resumeDesign.name}>
              {personalInfo.fullName}
            </h1>
            <p className={`text-base font-semibold mt-1 ${resumeDesign.accent}`}>
              {personalInfo.title}
            </p>

            <div data-pdf-wrap className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-600 mt-3">
              {personalInfo.email && (
                <span data-pdf-wrap className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  {personalInfo.email}
                </span>
              )}
              {personalInfo.phone && (
                <span data-pdf-wrap className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  {personalInfo.phone}
                </span>
              )}
              {personalInfo.location && (
                <span data-pdf-wrap className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  {personalInfo.location}
                </span>
              )}
              {personalInfo.website && <span data-pdf-wrap className="text-purple-700">{personalInfo.website}</span>}
              {activeResumeDraft.socialLinks?.github && <span data-pdf-wrap className="text-purple-700">{activeResumeDraft.socialLinks.github}</span>}
              {activeResumeDraft.socialLinks?.linkedin && <span data-pdf-wrap className="text-purple-700">{activeResumeDraft.socialLinks.linkedin}</span>}
              {publicPortfolioUrl && (
                <span data-pdf-wrap className="flex items-center gap-1 font-mono text-purple-700">
                  <Globe className="w-3.5 h-3.5" />
                  {publicPortfolioUrl}
                </span>
              )}
            </div>
          </header>

          <div className="flex flex-col">
          {/* Professional Summary */}
          {displayedSummary && activeResumeDraft.sectionVisibility?.summary !== false && (
            <section style={{ order: resumeOrder.indexOf('summary') }} className={resumeDesign.section}>
              <h2 className={`${resumeDesign.heading} mb-2`}>
                Professional Summary
              </h2>
              <p data-pdf-wrap className="text-xs leading-relaxed text-gray-700 font-light">
                {displayedSummary}
              </p>
            </section>
          )}

          {/* Experience Section */}
          {experience.length > 0 && activeResumeDraft.sectionVisibility?.experience !== false && (
            <section style={{ order: resumeOrder.indexOf('experience') }} className={resumeDesign.section}>
              <h2 className={`${resumeDesign.heading} mb-4`}>
                Professional Experience
              </h2>
              <div className="space-y-4">
                {experience.map((exp, i) => (
                  <div key={i} data-pdf-avoid-break className="space-y-1">
                    <div data-pdf-flex-wrap className="flex items-center justify-between">
                      <span data-pdf-wrap className="text-xs font-bold text-gray-900">
                        {exp.jobRole} — <span className="font-semibold text-purple-700">{exp.companyName}</span>
                      </span>
                      <span data-pdf-wrap className="text-[11px] font-mono text-gray-500">{exp.duration}</span>
                    </div>
                    {exp.location && <p className="text-[11px] text-gray-400">{exp.location}</p>}
                    <p className="text-xs text-gray-600 leading-relaxed font-light pt-0.5">{exp.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Featured Projects */}
          {projects.length > 0 && activeResumeDraft.sectionVisibility?.projects !== false && (
            <section style={{ order: resumeOrder.indexOf('projects') }} className={resumeDesign.section}>
              <h2 className={`${resumeDesign.heading} mb-4`}>
                Key Projects & Technical Implementations
              </h2>
              <div className="space-y-3">
                {projects.map((proj, i) => (
                  <div key={i} data-pdf-avoid-break className="space-y-0.5">
                    <div data-pdf-flex-wrap className="flex items-center justify-between">
                      <span data-pdf-wrap className="text-xs font-bold text-gray-900">{proj.title}</span>
                      {Array.isArray(proj.technologies) && proj.technologies.length > 0 && (
                        <span data-pdf-wrap className="text-[10px] text-purple-700 font-medium">
                          {proj.technologies.join(' • ')}
                        </span>
                      )}
                    </div>
                    <p data-pdf-wrap className="text-xs text-gray-600 font-light leading-relaxed">{proj.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Technical Skills */}
          {normalizedSkills.length > 0 && activeResumeDraft.sectionVisibility?.skills !== false && (
            <section style={{ order: resumeOrder.indexOf('skills') }} className={resumeDesign.section}>
              <h2 className={`${resumeDesign.heading} mb-3`}>
                Technical Proficiencies & Tooling
              </h2>
              <div data-pdf-wrap className="flex flex-wrap gap-1.5">
                {normalizedSkills.map((skill, i) => (
                  <span
                    key={i}
                    data-pdf-wrap
                    className="px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-800 text-[11px] font-medium border border-gray-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Education */}
          {education.length > 0 && activeResumeDraft.sectionVisibility?.education !== false && (
            <section style={{ order: resumeOrder.indexOf('education') }} data-pdf-avoid-break className={resumeDesign.section}>
              <h2 className={`${resumeDesign.heading} mb-3`}>
                Education
              </h2>
              <div className="space-y-2">
                {education.map((edu, i) => (
                  <div key={i} data-pdf-avoid-break className="flex justify-between items-baseline" data-pdf-flex-wrap>
                    <div data-pdf-wrap>
                      <span className="text-xs font-bold text-gray-900">{edu.degree}</span>
                      <p className="text-[11px] text-gray-600">{edu.university || edu.college}</p>
                    </div>
                    <span data-pdf-wrap className="text-[11px] font-mono text-gray-500">
                      {edu.startYear} - {edu.graduationYear}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Certifications */}
          {certifications.length > 0 && activeResumeDraft.sectionVisibility?.certifications !== false && (
            <section style={{ order: resumeOrder.indexOf('certifications') }} className={resumeDesign.section}>
              <h2 className={`${resumeDesign.heading} mb-3`}>
                Certifications & Accreditations
              </h2>
              <div className="space-y-1.5">
                {certifications.map((c, i) => (
                  <div key={i} data-pdf-avoid-break className="flex justify-between text-xs" data-pdf-flex-wrap>
                    <span data-pdf-wrap className="font-semibold text-gray-800">{c.certificateName}</span>
                    <span data-pdf-wrap className="text-gray-500">{c.issuingOrganization} ({c.date})</span>
                  </div>
                ))}
              </div>
            </section>
          )}
          {(activeResumeDraft.achievements || []).length > 0 && activeResumeDraft.sectionVisibility?.achievements !== false && <section style={{ order: resumeOrder.indexOf('achievements') }} className={resumeDesign.section}><h2 className={`${resumeDesign.heading} mb-3`}>Achievements</h2><div className="space-y-2">{activeResumeDraft.achievements.map((item, index) => <article key={item._id || index}><h3 className="text-xs font-semibold text-gray-800">{item.title}</h3>{item.date && <p className="text-[11px] text-gray-500">{item.date}</p>}{item.description && <p data-pdf-wrap className="text-xs leading-relaxed text-gray-700">{item.description}</p>}</article>)}</div></section>}
          {(activeResumeDraft.languages || []).length > 0 && activeResumeDraft.sectionVisibility?.languages !== false && <section style={{ order: resumeOrder.indexOf('languages') }} className={resumeDesign.section}><h2 className={`${resumeDesign.heading} mb-3`}>Languages</h2><div className="flex flex-wrap gap-2">{activeResumeDraft.languages.map((item, index) => <span key={item._id || index} className="text-xs text-gray-700">{item.name}{item.proficiency ? ` · ${item.proficiency}` : ''}</span>)}</div></section>}
          {(activeResumeDraft.customSections || []).length > 0 && activeResumeDraft.sectionVisibility?.customSections !== false && <section style={{ order: resumeOrder.indexOf('customSections') }} className={resumeDesign.section}>{activeResumeDraft.customSections.map((custom, index) => <article key={custom._id || index} className="mb-4"><h2 className={`${resumeDesign.heading} mb-3`}>{custom.title}</h2><div className="space-y-2">{(custom.entries || []).map((entry, entryIndex) => <div key={entry._id || entryIndex}>{entry.title && <h3 className="text-xs font-semibold text-gray-800">{entry.title}</h3>}<p data-pdf-wrap className="text-xs leading-relaxed text-gray-700">{entry.content}</p></div>)}</div></article>)}</section>}
          </div>
        </div>
      </div>}
    </div>
  )
}
