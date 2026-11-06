const list = (value) => Array.isArray(value) ? value : []
const text = (...values) => values.find((value) => typeof value === 'string' && value.trim()) || ''
const defaultSectionOrder = ['hero', 'about', 'experience', 'projects', 'skills', 'education', 'certifications', 'contact']
export const SELECTED_PORTFOLIO_STORAGE_KEY = 'portfolioforge:selectedPortfolioId'
const socialAliases = { 'x': 'twitter', 'x/twitter': 'twitter', 'twitter url': 'twitter', 'github url': 'github', 'linkedin url': 'linkedin', 'website': 'portfolio', 'website url': 'portfolio', 'personal website': 'portfolio', 'portfolio url': 'portfolio' }

const normalizeSocialLinks = (value) => {
  const entries = Array.isArray(value)
    ? value.map((item) => [item?.platform || item?.name, item?.url || item?.href])
    : Object.entries(value && typeof value === 'object' ? value : {}).map(([key, link]) => [key, typeof link === 'string' ? link : text(link?.url, link?.href)])
  return Object.fromEntries(entries
    .map(([rawKey, url]) => {
      const key = String(rawKey || '').trim().toLowerCase().replace(/[_-]+/g, ' ')
      return [socialAliases[key] || key.replace(/\s+/g, ''), url]
    })
    .filter(([key, url]) => key && typeof url === 'string' && url.trim()))
}

export function normalizePortfolioData(portfolio) {
  if (!portfolio || typeof portfolio !== 'object') return null

  const personalInfo = portfolio.personalInfo && typeof portfolio.personalInfo === 'object' ? portfolio.personalInfo : {}
  const about = portfolio.about && typeof portfolio.about === 'object' ? portfolio.about : {}
  const socialLinks = normalizeSocialLinks(portfolio.socialLinks)
  const skills = list(portfolio.skills).map((skill) => typeof skill === 'string'
    ? { name: skill.trim() }
    : { ...skill, name: text(skill?.name, skill?.label, skill?.title) }).filter((skill) => skill.name)
  const education = list(portfolio.education).map((item) => typeof item === 'string'
    ? { degree: item }
    : {
        ...item,
        degree: text(item?.degree, item?.qualification, item?.program, item?.title),
        college: text(item?.college, item?.school, item?.institution),
        university: text(item?.university, item?.institution, item?.college, item?.school),
        startYear: text(item?.startYear, item?.startDate),
        graduationYear: text(item?.graduationYear, item?.endYear, item?.endDate),
      }).filter((item) => item.degree || item.college || item.university || item.description)
  const projects = list(portfolio.projects).map((project) => {
    const technologies = Array.isArray(project?.technologies) ? project.technologies
      : Array.isArray(project?.techStack) ? project.techStack
        : typeof (project?.technologies || project?.techStack) === 'string' ? (project.technologies || project.techStack).split(',') : []
    return {
      ...project,
      title: text(project?.title, project?.name),
      description: text(project?.description, project?.summary),
      technologies: technologies.map((item) => typeof item === 'string' ? item.trim() : text(item?.name, item?.label, item?.title)).filter(Boolean),
      projectImage: text(project?.projectImage, project?.image, project?.imageUrl),
      githubUrl: text(project?.githubUrl, project?.repositoryUrl, project?.github),
      liveDemoUrl: text(project?.liveDemoUrl, project?.demoUrl, project?.url),
    }
  }).filter((project) => project.title || project.description || project.technologies.length)
  const experience = list(portfolio.experience).map((item) => typeof item === 'string'
    ? { description: item }
    : {
        ...item,
        jobRole: text(item?.jobRole, item?.role, item?.title, item?.position),
        companyName: text(item?.companyName, item?.company, item?.organization),
        duration: text(item?.duration, item?.period, item?.dates),
        description: text(item?.description, item?.summary),
      }).filter((item) => item.jobRole || item.companyName || item.description)
  const certifications = list(portfolio.certifications).map((item) => typeof item === 'string'
    ? { certificateName: item }
    : {
        ...item,
        certificateName: text(item?.certificateName, item?.name, item?.title),
        issuingOrganization: text(item?.issuingOrganization, item?.organization, item?.issuer),
        date: text(item?.date, item?.year),
        credentialUrl: text(item?.credentialUrl, item?.verificationUrl, item?.url),
      }).filter((item) => item.certificateName || item.issuingOrganization || item.date)
  const achievements = [...list(portfolio.achievements), ...list(portfolio.awards)].map((item) => typeof item === 'string'
    ? { certificateName: item, type: 'achievement' }
    : { ...item, certificateName: text(item?.certificateName, item?.name, item?.title), type: 'achievement' })
    .filter((item) => item.certificateName)
  const normalizedPersonalInfo = {
    ...personalInfo,
    fullName: text(personalInfo.fullName, personalInfo.name, portfolio.fullName, portfolio.name),
    title: text(personalInfo.title, personalInfo.professionalTitle, personalInfo.role, portfolio.professionalTitle, portfolio.role),
    headline: text(personalInfo.headline, portfolio.headline),
    profilePhoto: text(personalInfo.profilePhoto, personalInfo.avatar, portfolio.profilePhoto, portfolio.avatarUrl),
    email: text(personalInfo.email, portfolio.email),
    phone: text(personalInfo.phone, portfolio.phone),
    location: text(personalInfo.location, portfolio.location),
  }
  const normalizedAbout = {
    ...about,
    summary: text(about.summary, about.professionalSummary, portfolio.summary, portfolio.bio),
    bioLong: text(about.bioLong, about.description, portfolio.bioLong),
  }
  const hasContact = Boolean(normalizedPersonalInfo.email || normalizedPersonalInfo.phone || normalizedPersonalInfo.location || Object.values(socialLinks).some((value) => typeof value === 'string' && value.trim()))
  const hasHero = Boolean(normalizedPersonalInfo.fullName || normalizedPersonalInfo.title || normalizedPersonalInfo.headline || normalizedPersonalInfo.profilePhoto)
  const templateAliases = { 'minimal-editorial': 'minimal', 'modern-developer': 'developer', 'creative-designer': 'creative', 'student-fresher': 'student', 'corporate-professional': 'corporate', 'dark-tech': 'dark' }

  return {
    ...portfolio,
    templateId: templateAliases[portfolio.templateId] || (['minimal', 'developer', 'creative', 'student', 'corporate', 'dark'].includes(portfolio.templateId) ? portfolio.templateId : 'minimal'),
    personalInfo: normalizedPersonalInfo,
    about: normalizedAbout,
    skills,
    projects,
    education,
    experience,
    certifications: [...certifications, ...achievements],
    socialLinks,
    sectionOrder: Array.isArray(portfolio.sectionOrder) && portfolio.sectionOrder.length ? portfolio.sectionOrder : defaultSectionOrder,
    sectionVisibility: { ...(portfolio.sectionVisibility || {}), ...(!hasContact ? { contact: false } : {}), ...(!hasHero ? { hero: false } : {}) },
  }
}

export function portfolioContentScore(portfolio) {
  if (!portfolio) return 0
  const normalized = normalizePortfolioData(portfolio)
  return Number(Boolean(normalized.personalInfo.fullName)) * 4
    + Number(Boolean(normalized.personalInfo.title)) * 2
    + Number(Boolean(normalized.about.summary || normalized.about.bioLong)) * 2
    + normalized.skills.length + normalized.projects.length * 2 + normalized.education.length
    + normalized.experience.length * 2 + normalized.certifications.length
    + Number(Boolean(normalized.personalInfo.email || normalized.personalInfo.phone))
}

export function getDefaultPortfolio(portfolios) {
  return [...list(portfolios)].sort((a, b) => portfolioContentScore(b) - portfolioContentScore(a))[0] || null
}

export function getStoredPortfolioId() {
  return typeof window === 'undefined' ? '' : window.localStorage.getItem(SELECTED_PORTFOLIO_STORAGE_KEY) || ''
}

export function storePortfolioId(id) {
  if (typeof window === 'undefined') return
  if (id) window.localStorage.setItem(SELECTED_PORTFOLIO_STORAGE_KEY, id)
  else window.localStorage.removeItem(SELECTED_PORTFOLIO_STORAGE_KEY)
}
