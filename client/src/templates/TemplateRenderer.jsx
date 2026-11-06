import MinimalTemplate from './MinimalTemplate.jsx'
import DeveloperTemplate from './DeveloperTemplate.jsx'
import CreativeTemplate from './CreativeTemplate.jsx'
import StudentTemplate from './StudentTemplate.jsx'
import DarkTemplate from './DarkTemplate.jsx'
import CorporateTemplate from './CorporateTemplate.jsx'
import { Sparkles } from 'lucide-react'
import { normalizePortfolioData } from '../utils/portfolioData.js'

export default function TemplateRenderer({ portfolio, onProjectClick, isPreview = false }) {
  if (!portfolio) {
    return (
      <div className="p-8 text-center text-gray-500">
        No portfolio data available
      </div>
    )
  }

  const normalizedPortfolio = normalizePortfolioData(portfolio)
  const templateId = normalizedPortfolio.templateId || 'minimal'
  const font = normalizedPortfolio.theme?.font || 'Inter'

  const fontFamilies = {
    Inter: 'Inter, ui-sans-serif, system-ui, sans-serif',
    Roboto: 'Roboto, Arial, sans-serif',
    Poppins: 'Poppins, Trebuchet MS, sans-serif',
    'Space Grotesk': 'Space Grotesk, Courier New, monospace',
    'Playfair Display': 'Playfair Display, Georgia, serif',
  }

  const selectedFont = fontFamilies[font] || fontFamilies.Inter

  const renderTemplateComponent = () => {
    switch (templateId) {
      case 'developer':
        return <DeveloperTemplate portfolio={normalizedPortfolio} onProjectClick={onProjectClick} isPreview={isPreview} />
      case 'creative':
        return <CreativeTemplate portfolio={normalizedPortfolio} onProjectClick={onProjectClick} isPreview={isPreview} />
      case 'student':
        return <StudentTemplate portfolio={normalizedPortfolio} onProjectClick={onProjectClick} isPreview={isPreview} />
      case 'dark':
        return <DarkTemplate portfolio={normalizedPortfolio} onProjectClick={onProjectClick} isPreview={isPreview} />
      case 'corporate':
        return <CorporateTemplate portfolio={normalizedPortfolio} onProjectClick={onProjectClick} isPreview={isPreview} />
      case 'minimal':
      default:
        return <MinimalTemplate portfolio={normalizedPortfolio} onProjectClick={onProjectClick} isPreview={isPreview} />
    }
  }

  const isDarkMode = templateId === 'dark' || normalizedPortfolio.theme?.darkMode
  const { personalInfo, about } = normalizedPortfolio
  const hasContent = Boolean(personalInfo.fullName || personalInfo.title || personalInfo.headline || personalInfo.profilePhoto || personalInfo.email || personalInfo.phone || about.summary || about.bioLong || normalizedPortfolio.skills.length || normalizedPortfolio.projects.length || normalizedPortfolio.education.length || normalizedPortfolio.experience.length || normalizedPortfolio.certifications.length || Object.values(normalizedPortfolio.socialLinks).some(Boolean))
  if (!hasContent) {
    return <div className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center gap-3 p-8 text-center text-slate-600">
      <h1 className="text-xl font-semibold text-slate-900">This portfolio needs more information</h1>
      <p>Add a name, summary, contact detail, skill, project, education or experience entry to preview it.</p>
      {isPreview && normalizedPortfolio._id && <a className="font-semibold text-purple-700 underline underline-offset-2" href={`/editor/${normalizedPortfolio._id}`}>Open portfolio editor</a>}
    </div>
  }

  return (
    <div className={`w-full min-h-screen ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-white text-gray-900'} transition-colors duration-200`} style={{ fontFamily: selectedFont }}>
      {renderTemplateComponent()}

      {/* Powered by PortfolioForge Badge on Public Portfolio */}
      {!isPreview && (
        <div className={`py-8 text-center border-t ${isDarkMode ? 'border-slate-900 bg-slate-950/80 text-slate-500' : 'border-gray-100 bg-gray-50/50 text-gray-400'} text-xs`}>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-1.5 hover:text-purple-600 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Built & Published with <strong>PortfolioForge</strong></span>
          </a>
        </div>
      )}
    </div>
  )
}
