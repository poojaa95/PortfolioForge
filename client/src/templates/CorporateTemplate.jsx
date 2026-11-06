import { Award, BriefcaseBusiness, ExternalLink, Github, GraduationCap, Linkedin, Mail, MapPin, Phone, Twitter } from 'lucide-react'
import AdditionalSocialLinks from './AdditionalSocialLinks.jsx'

const defaultOrder = ['hero', 'about', 'experience', 'projects', 'skills', 'education', 'certifications', 'contact']

export default function CorporateTemplate({ portfolio = {}, onProjectClick }) {
  const {
    personalInfo = {}, about = {}, education = [], skills = [], projects = [], experience = [],
    certifications = [], socialLinks = {}, theme = {}, sectionOrder = defaultOrder, sectionVisibility = {},
  } = portfolio
  const accent = theme.primaryColor || '#334155'
  const isVisible = (key) => sectionVisibility?.[key] !== false
  const ordered = [...new Set([...sectionOrder, ...defaultOrder])]

  const renderMain = (key) => {
    if (!isVisible(key)) return null
    if (key === 'hero' && (personalInfo.fullName || personalInfo.title || personalInfo.headline || personalInfo.profilePhoto)) return (
      <header key={key} className="border-b border-slate-200 pb-8 sm:pb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: accent }}>Professional Profile</p>
        <h1 className="mt-4 text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900 leading-tight">
          {personalInfo.fullName}
        </h1>
        {personalInfo.title && <p className="mt-2 text-lg sm:text-xl text-slate-600">{personalInfo.title}</p>}
        {personalInfo.headline && <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500">{personalInfo.headline}</p>}
      </header>
    )
    if (key === 'about' && (about.summary || about.bioLong)) return (
      <section key={key} className="py-7 border-b border-slate-200">
        <SectionHeading>Profile</SectionHeading>
        {about.summary && <p className="text-sm leading-7 text-slate-700">{about.summary}</p>}
        {about.bioLong && <p className="mt-3 text-sm leading-7 text-slate-600">{about.bioLong}</p>}
      </section>
    )
    if (key === 'experience' && experience.length) return (
      <section key={key} className="py-7 border-b border-slate-200">
        <SectionHeading icon={<BriefcaseBusiness className="h-4 w-4" />}>Experience</SectionHeading>
        <div className="space-y-6">
          {experience.map((item, index) => <article key={`${item.companyName}-${index}`} className="border-l-2 border-amber-700/50 pl-4">
            <div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
              <h3 className="font-semibold text-slate-900">{item.jobRole}{item.jobRole && item.companyName && <span className="font-normal text-slate-500"> at </span>}{item.companyName}</h3>
              <span className="text-xs text-slate-500">{item.duration}</span>
            </div>
            {item.location && <p className="mt-1 text-xs text-slate-500">{item.location}</p>}
            {item.description && <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>}
          </article>)}
        </div>
      </section>
    )
    if (key === 'projects' && projects.length) return (
      <section key={key} className="py-7 border-b border-slate-200">
        <SectionHeading>Selected Projects</SectionHeading>
        <div className="space-y-5">
          {projects.map((project, index) => <article key={`${project.title}-${index}`} className="grid sm:grid-cols-[150px_1fr] gap-4 rounded-lg border border-slate-200 bg-white p-3.5">
            {project.projectImage && <img src={project.projectImage} alt={project.title} className="h-28 w-full rounded object-cover sm:h-full sm:min-h-28" />}
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-semibold text-slate-900">{project.title}</h3>
                {project.featured && <span className="text-[10px] uppercase tracking-wider text-amber-800">Featured</span>}
              </div>
              {project.description && <p className="mt-2 text-sm leading-6 text-slate-600">{project.description}</p>}
              {!!project.technologies?.length && <div className="mt-3 flex flex-wrap gap-1.5">{project.technologies.map((technology) => <span key={technology} className="rounded bg-slate-100 px-2 py-1 text-[11px] text-slate-600">{technology}</span>)}</div>}
              <div className="mt-3 flex flex-wrap gap-4 text-xs font-medium">
                {project.liveDemoUrl && <a href={project.liveDemoUrl} target="_blank" rel="noreferrer" onClick={() => onProjectClick?.(project.title, project._id, 'demo')} className="inline-flex items-center gap-1 text-slate-700 hover:text-amber-800">View project <ExternalLink className="h-3 w-3" /></a>}
                {project.githubUrl && <a href={project.githubUrl} target="_blank" rel="noreferrer" onClick={() => onProjectClick?.(project.title, project._id, 'github')} className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-950"><Github className="h-3 w-3" /> Source</a>}
              </div>
            </div>
          </article>)}
        </div>
      </section>
    )
    return null
  }

  const renderAside = (key) => {
    if (!isVisible(key)) return null
    if (key === 'skills' && skills.length) return <section key={key} className="py-5 border-b border-slate-200"><SectionHeading>Expertise</SectionHeading><div className="flex flex-wrap gap-2">{skills.map((skill, index) => <span key={`${skill.name}-${index}`} className="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700">{skill.name}</span>)}</div></section>
    if (key === 'education' && education.length) return <section key={key} className="py-5 border-b border-slate-200"><SectionHeading icon={<GraduationCap className="h-4 w-4" />}>Education</SectionHeading><div className="space-y-4">{education.map((item, index) => <article key={`${item.degree}-${index}`}><h3 className="text-sm font-semibold text-slate-900">{item.degree || item.college}</h3><p className="mt-1 text-xs leading-5 text-slate-600">{item.university || item.college}</p><p className="mt-1 text-[11px] text-slate-500">{[item.startYear, item.graduationYear].filter(Boolean).join(' — ')}{item.grade ? ` · ${item.grade}` : ''}</p>{item.description && <p className="mt-2 text-xs leading-5 text-slate-500">{item.description}</p>}</article>)}</div></section>
    if (key === 'certifications' && certifications.length) return <section key={key} className="py-5 border-b border-slate-200"><SectionHeading icon={<Award className="h-4 w-4" />}>Certifications</SectionHeading><div className="space-y-3">{certifications.map((item, index) => <article key={`${item.certificateName}-${index}`}><h3 className="text-sm font-semibold text-slate-900">{item.certificateName}</h3><p className="mt-1 text-xs text-slate-500">{[item.issuingOrganization, item.date].filter(Boolean).join(' · ')}</p>{item.credentialUrl && <a href={item.credentialUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-slate-600 hover:text-amber-800">Credential <ExternalLink className="h-3 w-3" /></a>}</article>)}</div></section>
    if (key === 'contact') return <section key={key} className="py-5"><SectionHeading>Contact & Links</SectionHeading><div className="space-y-3 text-xs text-slate-600">{personalInfo.email && <a href={`mailto:${personalInfo.email}`} className="flex items-center gap-2 break-all hover:text-slate-950"><Mail className="h-3.5 w-3.5 shrink-0" />{personalInfo.email}</a>}{personalInfo.phone && <a href={`tel:${personalInfo.phone}`} className="flex items-center gap-2 hover:text-slate-950"><Phone className="h-3.5 w-3.5 shrink-0" />{personalInfo.phone}</a>}{personalInfo.location && <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 shrink-0" />{personalInfo.location}</p>}<div className="flex flex-wrap gap-3 pt-1">{socialLinks.github && <Social href={socialLinks.github} label="GitHub" icon={<Github className="h-4 w-4" />} />}{socialLinks.linkedin && <Social href={socialLinks.linkedin} label="LinkedIn" icon={<Linkedin className="h-4 w-4" />} />}{socialLinks.twitter && <Social href={socialLinks.twitter} label="Twitter" icon={<Twitter className="h-4 w-4" />} />}{socialLinks.portfolio && <Social href={socialLinks.portfolio} label="Website" icon={<ExternalLink className="h-4 w-4" />} />}</div><AdditionalSocialLinks links={socialLinks} /></div></section>
    return null
  }

  const mainKeys = ordered.filter((key) => ['hero', 'about', 'experience', 'projects'].includes(key))
  const asideKeys = ordered.filter((key) => ['skills', 'education', 'certifications', 'contact'].includes(key))
  return <div className="mx-auto min-h-screen max-w-6xl bg-[#f7f6f2] px-5 py-8 text-slate-800 sm:px-8 md:px-12 md:py-14">
    <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_260px] md:gap-12">
      <main className="min-w-0">{mainKeys.map(renderMain)}</main>
      <aside className="min-w-0 md:border-l md:border-slate-200 md:pl-8">
        {personalInfo.profilePhoto && <img src={personalInfo.profilePhoto} alt={personalInfo.fullName || 'Profile'} className="mb-3 h-24 w-24 rounded-full border-4 border-white object-cover shadow-sm" />}
        {asideKeys.map(renderAside)}
      </aside>
    </div>
    <div className="mt-8 border-t border-slate-200 pt-4 text-[10px] uppercase tracking-[0.18em] text-slate-400">Portfolio · {portfolio.title || 'Professional Profile'}</div>
  </div>
}

function SectionHeading({ children, icon }) {
  return <h2 className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{icon}<span>{children}</span></h2>
}

function Social({ href, label, icon }) {
  return <a href={href} target="_blank" rel="noreferrer" aria-label={label} className="text-slate-500 transition-colors hover:text-amber-800">{icon}</a>
}
