import { useEffect, useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Award,
  BriefcaseBusiness,
  Code2,
  ExternalLink,
  Github,
  Globe2,
  GraduationCap,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  Twitter,
  Youtube,
  Instagram,
} from 'lucide-react'

const defaultSectionOrder = ['hero', 'about', 'experience', 'projects', 'skills', 'education', 'certifications', 'social', 'contact']
const sectionLabels = {
  about: 'About',
  skills: 'Skills',
  projects: 'Work',
  experience: 'Experience',
  education: 'Education',
  certifications: 'Credentials',
  social: 'Social',
  contact: 'Contact',
}

const safeList = (value) => Array.isArray(value) ? value.filter(Boolean) : []
const hasText = (value) => typeof value === 'string' && value.trim().length > 0

export default function DeveloperTemplate({ portfolio, onProjectClick, isPreview = false }) {
  const rootRef = useRef(null)
  const [layoutWidth, setLayoutWidth] = useState(0)
  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined
    const observer = new ResizeObserver(([entry]) => setLayoutWidth(entry.contentRect.width))
    observer.observe(root)
    return () => observer.disconnect()
  }, [])
  const wideLayout = layoutWidth >= 960
  const mediumLayout = layoutWidth >= 720
  const data = portfolio || {}
  const personalInfo = data.personalInfo || {}
  const about = data.about || {}
  const experience = safeList(data.experience).filter((item) => item.jobRole || item.companyName || item.description)
  const education = safeList(data.education).filter((item) => item.degree || item.university || item.college || item.description)
  const projects = safeList(data.projects).filter((item) => item.title || item.description || safeList(item.technologies).length)
  const certifications = safeList(data.certifications).filter((item) => item.certificateName || item.issuingOrganization || item.date)
  const skills = safeList(data.skills).map((skill) => typeof skill === 'string' ? { name: skill.trim(), category: '' } : skill).filter((skill) => hasText(skill?.name))
  const socialLinks = data.socialLinks || {}
  const theme = data.theme || {}
  const accent = theme.primaryColor || '#8b5cf6'
  const sectionVisibility = data.sectionVisibility || {}
  const configuredOrder = safeList(data.sectionOrder)
  const sectionOrder = [...new Set([...configuredOrder, ...defaultSectionOrder])]
  const isVisible = (key) => sectionVisibility[key] !== false

  const socialItems = [
    { key: 'github', label: 'GitHub', href: socialLinks.github, Icon: Github },
    { key: 'linkedin', label: 'LinkedIn', href: socialLinks.linkedin, Icon: Linkedin },
    { key: 'twitter', label: 'X / Twitter', href: socialLinks.twitter, Icon: Twitter },
    { key: 'portfolio', label: 'Website', href: socialLinks.portfolio, Icon: Globe2 },
    { key: 'instagram', label: 'Instagram', href: socialLinks.instagram, Icon: Instagram },
    { key: 'youtube', label: 'YouTube', href: socialLinks.youtube, Icon: Youtube },
  ].filter((item) => hasText(item.href))

  const summary = hasText(about.summary) ? about.summary : ''
  const bioLong = hasText(about.bioLong) ? about.bioLong : ''
  const headline = hasText(personalInfo.headline) ? personalInfo.headline : ''
  const heroSummary = headline || summary
  const hasNameOrRole = hasText(personalInfo.fullName) || hasText(personalInfo.title)
  const hasHeroContent = hasNameOrRole || heroSummary || hasText(personalInfo.profilePhoto)
  const hasContact = hasText(personalInfo.email) || hasText(personalInfo.phone) || hasText(personalInfo.location) || socialItems.length > 0
  const skillsByCategory = skills.reduce((groups, skill) => {
    const category = hasText(skill.category) ? skill.category : 'Technologies'
    groups.set(category, [...(groups.get(category) || []), skill])
    return groups
  }, new Map())

  const sectionHasContent = (key) => ({
    hero: hasHeroContent,
    about: summary || bioLong,
    skills: skills.length > 0,
    projects: projects.length > 0,
    experience: experience.length > 0,
    education: education.length > 0,
    certifications: certifications.length > 0,
    social: socialItems.length > 0,
    contact: hasContact,
  }[key])

  const navigationItems = sectionOrder
    .filter((key) => key !== 'hero' && sectionLabels[key] && isVisible(key) && (sectionHasContent(key) || isPreview))
    .map((key) => ({ key, label: sectionLabels[key] }))

  const emptyState = (key, message) => isPreview ? (
    <div key={key} className="rounded-2xl border border-dashed border-white/15 bg-white/[0.025] px-5 py-6 text-sm text-slate-400">
      {message}
    </div>
  ) : null

  const renderSection = (key) => {
    if (!isVisible(key)) return null

    switch (key) {
      case 'hero': {
        if (!hasHeroContent && !isPreview) return null
        return (
          <section id="hero" key="hero" className={`relative grid scroll-mt-28 items-center gap-12 py-16 sm:py-20 ${wideLayout ? 'min-h-[650px] grid-cols-[1.08fr_.92fr] gap-16 py-24' : ''}`}>
            <div className="relative z-10 max-w-3xl">
              {hasText(personalInfo.title) && (
                <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/[0.07] px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-200">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} />
                  {personalInfo.title}
                </p>
              )}
              {hasText(personalInfo.fullName) ? (
                <h1 className="max-w-4xl text-5xl font-semibold leading-[1.04] tracking-[-0.055em] text-white sm:text-6xl lg:text-[5.25rem]">
                  {personalInfo.fullName}
                  <span className="ml-2 text-violet-400" style={{ color: accent }}>.</span>
                </h1>
              ) : isPreview ? <p className="text-sm text-slate-400">Add your name in the editor to complete this introduction.</p> : null}
              {heroSummary ? (
                <p className="mt-7 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8 line-clamp-4">{heroSummary}</p>
              ) : isPreview ? <p className="mt-6 text-sm text-slate-500">Add a headline or summary to introduce your work.</p> : null}
              {(hasText(personalInfo.location) || hasText(personalInfo.email)) && (
                <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-400">
                  {hasText(personalInfo.location) && <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-500" />{personalInfo.location}</span>}
                  {hasText(personalInfo.email) && <a className="inline-flex items-center gap-2 transition-colors hover:text-white" href={`mailto:${personalInfo.email}`}><Mail className="h-4 w-4 text-slate-500" />{personalInfo.email}</a>}
                </div>
              )}
              <div className="mt-9 flex flex-wrap items-center gap-3">
                {hasText(personalInfo.email) && <a href={`mailto:${personalInfo.email}`} className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition duration-200 hover:-translate-y-0.5 hover:brightness-110" style={{ backgroundColor: accent }}>Get in touch <ArrowUpRight className="h-4 w-4" /></a>}
                {projects.length > 0 && <a href="#projects" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-5 py-3 text-sm font-medium text-slate-200 transition duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.07]">Explore work <ArrowDown className="h-4 w-4" /></a>}
              </div>
            </div>

            {personalInfo.profilePhoto || projects.length > 0 || skills.length > 0 ? (
              <div className={`relative mx-auto w-full max-w-xl ${wideLayout ? 'ml-auto' : ''}`}>
                <div className="absolute -inset-8 rounded-[2.5rem] opacity-20 blur-3xl" style={{ background: `radial-gradient(circle at 50% 45%, ${accent}, transparent 68%)` }} />
                {personalInfo.profilePhoto ? (
                  <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900 shadow-2xl shadow-black/40">
                    <img src={personalInfo.profilePhoto} alt={personalInfo.fullName ? `${personalInfo.fullName} profile` : 'Profile'} className="aspect-[4/4.5] w-full object-cover" />
                    {skills.length > 0 && <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-transparent p-5 pt-16 sm:p-7 sm:pt-20"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Selected toolkit</p><div className="mt-3 flex flex-wrap gap-2">{skills.slice(0, 4).map((skill, index) => <span key={`${skill.name}-${index}`} className="rounded-lg border border-white/10 bg-slate-950/60 px-2.5 py-1.5 text-xs text-slate-100">{skill.name}</span>)}</div></div>}
                  </div>
                ) : (
                  <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0c1222] p-5 shadow-2xl shadow-black/40 sm:p-7">
                    <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                      <div className="flex gap-1.5" aria-hidden="true"><span className="h-2.5 w-2.5 rounded-full bg-rose-400/80"/><span className="h-2.5 w-2.5 rounded-full bg-amber-300/80"/><span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80"/></div>
                      <span className="text-[11px] font-medium tracking-wide text-slate-500">{hasText(data.slug) ? `${data.slug}.ts` : 'developer.ts'}</span>
                    </div>
                    <div className="overflow-hidden pt-6 font-mono text-xs leading-7 sm:text-sm">
                      <p className="text-slate-500"><span className="text-violet-300">const</span> profile = &#123;</p>
                      {hasText(personalInfo.fullName) && <p className="pl-5 text-slate-300"><span className="text-sky-300">name</span>: <span className="text-emerald-300">"{personalInfo.fullName}"</span>,</p>}
                      {hasText(personalInfo.title) && <p className="pl-5 text-slate-300"><span className="text-sky-300">role</span>: <span className="text-emerald-300">"{personalInfo.title}"</span>,</p>}
                      {skills.length > 0 && <p className="pl-5 text-slate-300"><span className="text-sky-300">focus</span>: [<span className="text-amber-200">{skills.slice(0, 3).map((skill) => ` "${skill.name}"`).join(',')}</span> ],</p>}
                      {projects.length > 0 && <p className="pl-5 text-slate-300"><span className="text-sky-300">projects</span>: <span className="text-amber-200">{projects.length}</span>,</p>}
                      <p className="text-slate-500">&#125;</p>
                    </div>
                    {projects[0] && <a href="#projects" className="mt-6 block rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 transition-colors hover:border-violet-300/30 hover:bg-white/[0.06] sm:p-5"><div className="flex items-center justify-between gap-4"><span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-200" style={{ color: accent }}>Featured work</span><ArrowUpRight className="h-4 w-4 text-slate-500" /></div><p className="mt-3 line-clamp-1 text-base font-semibold text-white sm:text-lg">{projects[0].title || 'Project'}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{projects[0].description}</p></a>}
                  </div>
                )}
                {hasText(personalInfo.fullName) && <div className="absolute -bottom-4 -left-3 hidden rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3 shadow-xl backdrop-blur sm:block"><p className="text-xs font-semibold text-white">{personalInfo.fullName}</p>{hasText(personalInfo.title) && <p className="mt-1 text-[10px] text-slate-400">{personalInfo.title}</p>}</div>}
              </div>
            ) : isPreview ? <div className="rounded-[2rem] border border-dashed border-white/15 p-10 text-center text-sm text-slate-500">Add a profile image, skills or project to build this visual panel.</div> : null}
          </section>
        )
      }

      case 'about':
        if (!summary && !bioLong) return emptyState(key, 'Add a professional summary or biography to populate this section.')
        return (
          <section id="about" key="about" className="scroll-mt-28 border-t border-white/[0.08] py-14 sm:py-20">
            <SectionEyebrow number="01" icon={<Sparkles className="h-4 w-4" />}>About</SectionEyebrow>
            <div className={`grid gap-7 ${wideLayout ? 'grid-cols-[.65fr_1.35fr] gap-14' : ''}`}>
              <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">A little about my work.</h2>
              <div className="space-y-4 text-base leading-8 text-slate-300">
                {summary && <p>{summary}</p>}
                {bioLong && <p className="text-sm leading-7 text-slate-400">{bioLong}</p>}
                {hasText(about.highlightYears) && <p className="text-sm font-medium text-violet-200" style={{ color: accent }}>{about.highlightYears} years of experience</p>}
              </div>
            </div>
          </section>
        )

      case 'skills':
        if (!skills.length) return emptyState(key, 'Add technologies and skills in the editor to show your toolkit.')
        return (
          <section id="skills" key="skills" className="scroll-mt-28 border-t border-white/[0.08] py-14 sm:py-20">
            <SectionEyebrow number="02" icon={<Code2 className="h-4 w-4" />}>Skills</SectionEyebrow>
            <div className={`grid gap-8 ${wideLayout ? 'grid-cols-[.65fr_1.35fr] gap-14' : ''}`}>
              <div><h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Tools I work with.</h2><p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">A selection of technologies and strengths from my day-to-day practice.</p></div>
              <div className="space-y-6">
                {[...skillsByCategory.entries()].map(([category, entries]) => <div key={category}><p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">{category}</p><div className="flex flex-wrap gap-2">{entries.map((skill, index) => <span key={`${skill.name}-${index}`} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3.5 py-2.5 text-sm text-slate-200 transition duration-200 hover:-translate-y-0.5 hover:border-violet-300/30 hover:bg-white/[0.07]"><span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} />{skill.name}</span>)}</div></div>)}
              </div>
            </div>
          </section>
        )

      case 'projects':
        if (!projects.length) return emptyState(key, 'Add a project to showcase your work here.')
        return (
          <section id="projects" key="projects" className="scroll-mt-28 border-t border-white/[0.08] py-14 sm:py-20">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div><SectionEyebrow number="03" icon={<BriefcaseBusiness className="h-4 w-4" />}>Selected work</SectionEyebrow><h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Projects I’m proud of.</h2></div>
              <span className="pb-1 text-xs text-slate-500">{projects.length} {projects.length === 1 ? 'project' : 'projects'}</span>
            </div>
            <div className={`mt-9 grid gap-5 ${mediumLayout ? 'grid-cols-2 gap-6' : ''}`}>
              {projects.map((project, index) => (
                <article key={project._id || `${project.title}-${index}`} className={`group overflow-hidden rounded-[1.5rem] border border-white/[0.09] bg-[#0c1222] transition duration-300 hover:-translate-y-1 hover:border-violet-300/30 hover:shadow-2xl hover:shadow-black/30 ${project.featured && mediumLayout ? 'col-span-2 grid grid-cols-[.9fr_1.1fr]' : ''}`}>
                  {project.projectImage ? <div className={`min-h-52 overflow-hidden bg-slate-900 ${mediumLayout ? 'min-h-64' : ''}`}><img src={project.projectImage} alt={project.title || 'Project'} loading="lazy" className={`h-full min-h-52 w-full object-cover transition duration-500 group-hover:scale-[1.025] ${mediumLayout ? 'min-h-64' : ''}`} /></div> : <div className={`relative flex min-h-40 items-center justify-between overflow-hidden border-b border-white/[0.07] bg-gradient-to-br from-violet-500/[0.12] via-slate-900 to-sky-500/[0.08] px-6 py-6 ${mediumLayout ? 'min-h-48' : ''}`}><div className="absolute -right-10 -top-14 h-48 w-48 rounded-full border border-white/[0.07]"/><div className="absolute -right-3 -top-7 h-32 w-32 rounded-full border border-white/[0.07]"/><div className="relative"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Project {String(index + 1).padStart(2, '0')}</p>{hasText(project.title) && <p className="mt-3 max-w-xs text-2xl font-semibold tracking-tight text-white">{project.title}</p>}</div><Code2 className="relative mr-3 h-8 w-8 text-violet-200/80" style={{ color: accent }} /></div>}
                  <div className="flex min-w-0 flex-col p-5 sm:p-7">
                    <div className="flex items-start justify-between gap-4"><h3 className="text-lg font-semibold leading-snug text-white sm:text-xl">{project.title}</h3>{project.featured && <span className="shrink-0 rounded-full border border-violet-300/20 bg-violet-300/[0.08] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-violet-200" style={{ color: accent }}>Featured</span>}</div>
                    {hasText(project.description) && <p className="mt-3 text-sm leading-7 text-slate-400">{project.description}</p>}
                    {safeList(project.technologies).length > 0 && <div className="mt-5 flex flex-wrap gap-2">{safeList(project.technologies).map((technology, technologyIndex) => <span key={`${technology}-${technologyIndex}`} className="rounded-lg border border-white/[0.09] bg-white/[0.035] px-2.5 py-1.5 text-[11px] font-medium text-slate-300">{technology}</span>)}</div>}
                    {(hasText(project.githubUrl) || hasText(project.liveDemoUrl)) && <div className="mt-auto flex flex-wrap gap-3 border-t border-white/[0.08] pt-5">
                      {hasText(project.githubUrl) && <a href={project.githubUrl} target="_blank" rel="noreferrer" onClick={() => onProjectClick?.(project.title, project._id, 'github')} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-white/20 hover:text-white"><Github className="h-3.5 w-3.5" />Source <ArrowUpRight className="h-3 w-3" /></a>}
                      {hasText(project.liveDemoUrl) && <a href={project.liveDemoUrl} target="_blank" rel="noreferrer" onClick={() => onProjectClick?.(project.title, project._id, 'demo')} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-white transition-colors hover:brightness-110" style={{ backgroundColor: accent }}>Live project <ExternalLink className="h-3.5 w-3.5" /></a>}
                    </div>}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )

      case 'experience':
        if (!experience.length) return emptyState(key, 'Add work experience in the editor to build your experience timeline.')
        return (
          <section id="experience" key="experience" className="scroll-mt-28 border-t border-white/[0.08] py-14 sm:py-20">
            <SectionEyebrow number="04" icon={<BriefcaseBusiness className="h-4 w-4" />}>Experience</SectionEyebrow>
            <div className={`mt-8 grid gap-4 ${mediumLayout ? 'grid-cols-2' : ''}`}>
              {experience.map((item, index) => <article key={item._id || `${item.companyName}-${index}`} className="rounded-2xl border border-white/[0.09] bg-white/[0.025] p-5 sm:p-6 transition-colors hover:border-white/15 hover:bg-white/[0.04]">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-base font-semibold text-white">{item.jobRole || item.companyName}</h3>{item.companyName && item.jobRole && <p className="mt-1 text-sm font-medium" style={{ color: accent }}>{item.companyName}</p>}</div>{hasText(item.duration) && <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-slate-400">{item.duration}</span>}</div>
                {(hasText(item.location) || item.isCurrent) && <p className="mt-3 text-xs text-slate-500">{item.location}{item.location && item.isCurrent ? ' · ' : ''}{item.isCurrent ? 'Current' : ''}</p>}
                {hasText(item.description) && <p className="mt-4 text-sm leading-7 text-slate-400">{item.description}</p>}
              </article>)}
            </div>
          </section>
        )

      case 'education':
        if (!education.length) return emptyState(key, 'Add education details in the editor to display your academic background.')
        return (
          <section id="education" key="education" className="scroll-mt-28 border-t border-white/[0.08] py-14 sm:py-20">
            <SectionEyebrow number="05" icon={<GraduationCap className="h-4 w-4" />}>Education</SectionEyebrow>
            <div className={`mt-8 grid gap-4 ${mediumLayout ? 'grid-cols-2' : ''}`}>
              {education.map((item, index) => <article key={item._id || `${item.degree}-${index}`} className="rounded-2xl border border-white/[0.09] bg-[#0c1222] p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold text-white">{item.degree || item.college || item.university}</h3>{item.university && item.degree && <p className="mt-1 text-sm text-slate-300">{item.university}</p>}{item.college && item.college !== item.university && <p className="mt-1 text-sm text-slate-400">{item.college}</p>}</div><GraduationCap className="h-5 w-5 shrink-0" style={{ color: accent }} /></div>
                {(hasText(item.startYear) || hasText(item.graduationYear)) && <p className="mt-4 text-xs text-slate-500">{item.startYear}{item.startYear && item.graduationYear ? ' — ' : ''}{item.graduationYear}</p>}
                {hasText(item.grade) && <p className="mt-2 text-xs font-medium text-slate-300">{item.grade}</p>}
                {hasText(item.description) && <p className="mt-3 text-sm leading-6 text-slate-400">{item.description}</p>}
              </article>)}
            </div>
          </section>
        )

      case 'certifications':
        if (!certifications.length) return emptyState(key, 'Add certifications or achievements to highlight your credentials.')
        return (
          <section id="certifications" key="certifications" className="scroll-mt-28 border-t border-white/[0.08] py-14 sm:py-20">
            <SectionEyebrow number="06" icon={<Award className="h-4 w-4" />}>Certifications & achievements</SectionEyebrow>
            <div className={`mt-8 grid gap-3 ${mediumLayout ? 'grid-cols-2' : ''}`}>
              {certifications.map((item, index) => <article key={item._id || `${item.certificateName}-${index}`} className="flex items-start gap-4 rounded-2xl border border-white/[0.09] bg-white/[0.025] p-5 transition-colors hover:border-white/15"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-300/15 bg-violet-300/[0.07]" style={{ color: accent }}><Award className="h-4 w-4" /></span><div className="min-w-0 flex-1"><h3 className="text-sm font-semibold leading-6 text-white">{item.certificateName || item.issuingOrganization}</h3>{item.issuingOrganization && item.certificateName && <p className="mt-0.5 text-xs text-slate-400">{item.issuingOrganization}</p>}{hasText(item.date) && <p className="mt-2 text-[10px] uppercase tracking-wider text-slate-500">{item.date}</p>}</div>{hasText(item.credentialUrl) && <a href={item.credentialUrl} target="_blank" rel="noreferrer" aria-label={`View ${item.certificateName || 'credential'}`} className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-white"><ExternalLink className="h-4 w-4" /></a>}</article>)}
            </div>
          </section>
        )

      case 'social':
        if (!socialItems.length) return emptyState(key, 'Add social and professional profile links in the editor.')
        return (
          <section id="social" key="social" className="scroll-mt-28 border-t border-white/[0.08] py-12 sm:py-16">
            <SectionEyebrow number="07" icon={<Globe2 className="h-4 w-4" />}>Around the web</SectionEyebrow>
            <div className="mt-6 flex flex-wrap gap-3">{socialItems.map(({ key, label, href, Icon }) => <a key={key} href={href} target="_blank" rel="noreferrer" className="group inline-flex items-center gap-3 rounded-xl border border-white/[0.09] bg-white/[0.025] px-4 py-3 text-sm text-slate-300 transition duration-200 hover:-translate-y-0.5 hover:border-violet-300/30 hover:bg-white/[0.06] hover:text-white"><Icon className="h-4 w-4 text-slate-500 transition-colors group-hover:text-violet-200" style={{ color: accent }} />{label}<ArrowUpRight className="h-3.5 w-3.5 text-slate-600" /></a>)}</div>
          </section>
        )

      case 'contact':
        if (!hasContact) return emptyState(key, 'Add an email, phone number or social profile to make it easy to connect.')
        return (
          <section id="contact" key="contact" className="scroll-mt-28 border-t border-white/[0.08] py-16 sm:py-24">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#111a30] via-[#0d1426] to-[#12102a] px-6 py-9 sm:px-10 sm:py-12 lg:px-14">
              <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full opacity-15 blur-3xl" style={{ backgroundColor: accent }} />
              <div className={`relative grid items-end gap-8 ${wideLayout ? 'grid-cols-[1fr_auto]' : ''}`}>
                <div><SectionEyebrow icon={<Mail className="h-4 w-4" />}>Contact</SectionEyebrow><h2 className="mt-5 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">Have a project in mind?</h2><p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">Get in touch using the contact details or profiles below.</p>
                  <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-300">{hasText(personalInfo.email) && <a href={`mailto:${personalInfo.email}`} className="inline-flex items-center gap-2 hover:text-white"><Mail className="h-4 w-4 text-slate-500" />{personalInfo.email}</a>}{hasText(personalInfo.phone) && <a href={`tel:${personalInfo.phone}`} className="inline-flex items-center gap-2 hover:text-white"><Phone className="h-4 w-4 text-slate-500" />{personalInfo.phone}</a>}{hasText(personalInfo.location) && <span className="inline-flex items-center gap-2 text-slate-400"><MapPin className="h-4 w-4 text-slate-500" />{personalInfo.location}</span>}</div>
                </div>
                {hasText(personalInfo.email) && <a href={`mailto:${personalInfo.email}`} className="inline-flex w-fit items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:brightness-110" style={{ backgroundColor: accent }}>Send an email <ArrowRight className="h-4 w-4" /></a>}
              </div>
              {socialItems.length > 0 && <div className="relative mt-8 flex flex-wrap gap-2 border-t border-white/[0.08] pt-5">{socialItems.map(({ key, label, href, Icon }) => <a key={key} href={href} target="_blank" rel="noreferrer" aria-label={label} className="rounded-lg border border-white/10 p-2.5 text-slate-400 transition-colors hover:border-white/20 hover:bg-white/[0.06] hover:text-white"><Icon className="h-4 w-4" /></a>)}</div>}
            </div>
          </section>
        )

      default:
        return null
    }
  }

  return (
    <div ref={rootRef} className="relative isolate min-h-screen overflow-hidden bg-[#080b16] font-sans text-slate-100" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden"><div className="absolute -top-72 left-[8%] h-[32rem] w-[32rem] rounded-full opacity-[0.12] blur-[110px]" style={{ backgroundColor: accent }} /><div className="absolute right-[-10rem] top-[34rem] h-[28rem] w-[28rem] rounded-full bg-blue-500/10 blur-[120px]" /><div className="absolute inset-x-0 top-0 h-[42rem] bg-gradient-to-b from-[#0d1325]/70 to-transparent" /></div>
      <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#080b16]/85 backdrop-blur-xl">
        <nav aria-label="Portfolio navigation" className="mx-auto flex min-h-[72px] max-w-[1320px] items-center justify-between gap-5 px-4 sm:px-6 lg:px-10">
          <a href="#hero" className="min-w-0 truncate text-sm font-semibold tracking-tight text-white sm:text-base">{hasText(personalInfo.fullName) ? personalInfo.fullName : 'Portfolio'}<span className="ml-1.5" style={{ color: accent }}>/</span></a>
          <div className="flex min-w-0 items-center gap-1 overflow-x-auto text-xs text-slate-400 sm:gap-2 sm:text-sm">
            {navigationItems.map(({ key, label }) => <a key={key} href={`#${key}`} className="shrink-0 rounded-lg px-2.5 py-2 transition-colors hover:bg-white/[0.05] hover:text-white sm:px-3">{label}</a>)}
            {hasText(personalInfo.email) && wideLayout && <a href={`mailto:${personalInfo.email}`} className="ml-1 inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 font-medium text-white transition-colors hover:border-white/20 hover:bg-white/[0.06]">Contact <ArrowUpRight className="h-3.5 w-3.5" /></a>}
          </div>
        </nav>
      </header>

      <main className="relative mx-auto w-full max-w-[1320px] px-4 sm:px-6 lg:px-10">
        <div className="divide-y-0">
          {sectionOrder.map((key) => renderSection(key))}
        </div>
      </main>

      <footer className="relative border-t border-white/[0.07]">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-3 px-4 py-7 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10"><span>{hasText(personalInfo.fullName) ? personalInfo.fullName : 'Portfolio'}{hasText(personalInfo.title) ? ` · ${personalInfo.title}` : ''}</span><span>© {new Date().getFullYear()}{hasText(personalInfo.fullName) ? ` ${personalInfo.fullName}` : ''}</span></div>
      </footer>
    </div>
  )
}

function SectionEyebrow({ number, icon, children }) {
  return <div className="mb-5 flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-200">{icon}<span>{number && `${number} / `}{children}</span></div>
}
