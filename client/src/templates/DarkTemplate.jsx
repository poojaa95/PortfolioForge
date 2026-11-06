import {
  ExternalLink,
  Github,
  Linkedin,
  Twitter,
  Mail,
  MapPin,
  Flame,
} from 'lucide-react'
import AdditionalSocialLinks from './AdditionalSocialLinks.jsx'

export default function DarkTemplate({ portfolio, onProjectClick }) {
  const {
    personalInfo = {},
    about = {},
    education = [],
    skills = [],
    projects = [],
    experience = [],
    certifications = [],
    socialLinks = {},
    sectionOrder = ['hero', 'about', 'experience', 'projects', 'skills', 'education', 'certifications', 'contact'],
    sectionVisibility = {},
  } = portfolio || {}

  const isVisible = (section) => sectionVisibility?.[section] !== false

  const renderSection = (sectionKey) => {
    if (!isVisible(sectionKey)) return null

    switch (sectionKey) {
      case 'hero':
        if (!(personalInfo.fullName || personalInfo.title || personalInfo.headline || personalInfo.profilePhoto)) return null
        return (
          <section key="hero" className="py-16 md:py-24 relative">
            <div className="absolute top-10 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-8 relative z-10">
              <div className="space-y-5 max-w-xl text-center md:text-left">
                {personalInfo.title && <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-semibold backdrop-blur-md">
                  <Flame className="w-3.5 h-3.5 text-purple-400" />
                  <span>{personalInfo.title}</span>
                </div>}
                {personalInfo.fullName && <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight">
                  I'm{' '}
                  <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                    {personalInfo.fullName}
                  </span>
                </h1>}
                {personalInfo.headline && (
                  <p className="text-sm text-slate-400 leading-relaxed max-w-lg">
                    {personalInfo.headline}
                  </p>
                )}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-400 pt-2">
                  {personalInfo.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-purple-400" />
                      {personalInfo.location}
                    </span>
                  )}
                  {personalInfo.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-purple-400" />
                      {personalInfo.email}
                    </span>
                  )}
                </div>
              </div>

              {personalInfo.profilePhoto && (
                <div className="relative shrink-0">
                  <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-purple-600 to-cyan-500 opacity-60 blur-md" />
                  <img
                    src={personalInfo.profilePhoto}
                    alt={personalInfo.fullName}
                    className="relative w-40 h-40 md:w-52 md:h-52 rounded-3xl object-cover ring-2 ring-purple-500/30 shadow-2xl"
                  />
                </div>
              )}
            </div>
          </section>
        )

      case 'about':
        if (!about.summary) return null
        return (
          <section key="about" className="py-12 border-t border-slate-800/80">
            <h2 className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-6">
              Executive Profile
            </h2>
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md shadow-xl space-y-4">
              <p className="text-lg text-slate-200 font-light leading-relaxed">{about.summary}</p>
              {about.bioLong && <p className="text-sm text-slate-400 leading-relaxed">{about.bioLong}</p>}
            </div>
          </section>
        )

      case 'projects':
        if (!projects || projects.length === 0) return null
        return (
          <section key="projects" className="py-12 border-t border-slate-800/80">
            <h2 className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-8">
              Highlighted Systems & Products
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((proj, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-purple-500/50 hover:shadow-purple-500/10 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
                >
                  {proj.projectImage && (
                    <img src={proj.projectImage} alt={proj.title} className="w-full h-44 object-cover border-b border-slate-800" />
                  )}
                  <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold text-white">{proj.title}</h3>
                        {proj.featured && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                            Core
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 font-light leading-relaxed">{proj.description}</p>
                    </div>

                    {proj.technologies && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {proj.technologies.map((t, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-slate-800 text-purple-300 border border-slate-700/60"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center space-x-4 pt-3 border-t border-slate-800 text-xs font-semibold">
                      {proj.liveDemoUrl && (
                        <a
                          href={proj.liveDemoUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => onProjectClick?.(proj.title, proj._id, 'demo')}
                          className="inline-flex items-center space-x-1.5 text-purple-400 hover:text-purple-300"
                        >
                          <span>Live System</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {proj.githubUrl && (
                        <a
                          href={proj.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => onProjectClick?.(proj.title, proj._id, 'github')}
                          className="inline-flex items-center space-x-1.5 text-slate-400 hover:text-white"
                        >
                          <Github className="w-3.5 h-3.5" />
                          <span>Source</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )

      case 'skills':
        if (!skills || skills.length === 0) return null
        return (
          <section key="skills" className="py-12 border-t border-slate-800/80">
            <h2 className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-8">
              Technical Proficiencies
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {skills.map((s, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-200">
                    <span className="truncate">{s.name}</span>
                    <span className="text-purple-400">{s.proficiencyLevel}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full" style={{ width: `${s.proficiencyLevel}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )

      case 'experience':
        if (!experience || experience.length === 0) return null
        return (
          <section key="experience" className="py-12 border-t border-slate-800/80">
            <h2 className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-8">
              Career Trajectory
            </h2>
            <div className="space-y-4">
              {experience.map((exp, idx) => (
                <div key={idx} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-white">
                      {exp.jobRole} <span className="text-purple-400">@ {exp.companyName}</span>
                    </h3>
                    <span className="text-xs font-mono text-purple-300 bg-purple-950/60 border border-purple-800/60 px-2.5 py-0.5 rounded-md">
                      {exp.duration}
                    </span>
                  </div>
                  {exp.location && <p className="text-xs text-slate-400">{exp.location}</p>}
                  <p className="text-xs text-slate-300 font-light leading-relaxed pt-1">{exp.description}</p>
                </div>
              ))}
            </div>
          </section>
        )

      case 'education':
        if (!education || education.length === 0) return null
        return (
          <section key="education" className="py-12 border-t border-slate-800/80">
            <h2 className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-8">
              Education
            </h2>
            <div className="space-y-4">
              {education.map((edu, idx) => (
                <div key={idx} className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col sm:flex-row justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white">{edu.degree}</h3>
                    <p className="text-xs text-slate-300">{edu.university || edu.college}</p>
                    {edu.description && <p className="text-xs text-slate-400 mt-1">{edu.description}</p>}
                  </div>
                  <div className="text-right shrink-0 text-xs font-mono text-slate-400">
                    <span>{edu.startYear} - {edu.graduationYear}</span>
                    {edu.grade && <p className="text-purple-400 font-bold">{edu.grade}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )

      case 'certifications':
        if (!certifications || certifications.length === 0) return null
        return (
          <section key="certifications" className="py-12 border-t border-slate-800/80">
            <h2 className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-8">
              Certifications & Badges
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {certifications.map((c, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white">{c.certificateName}</p>
                    <p className="text-[11px] text-slate-400">{c.issuingOrganization} • {c.date}</p>
                  </div>
                  {c.credentialUrl && (
                    <a href={c.credentialUrl} target="_blank" rel="noreferrer" className="text-purple-400 hover:text-purple-300">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )

      case 'contact':
        return (
          <section key="contact" className="py-20 border-t border-slate-800/80 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <h2 className="text-2xl font-bold text-white">Contact</h2>
              {personalInfo.email && (
                <a
                  href={`mailto:${personalInfo.email}`}
                  className="mx-auto flex w-fit max-w-full items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs text-white shadow-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-transform active:scale-95"
                >
                  <Mail className="w-4 h-4 shrink-0" />
                  <span className="min-w-0 break-all">{personalInfo.email}</span>
                </a>
              )}
              {personalInfo.phone && <a href={`tel:${personalInfo.phone}`} className="mx-auto block w-fit max-w-full break-words text-sm text-slate-400 hover:text-white">{personalInfo.phone}</a>}
              <div className="flex justify-center space-x-5 pt-4 text-slate-400">
                {socialLinks.github && <a href={socialLinks.github} target="_blank" rel="noreferrer" className="hover:text-white"><Github className="w-4 h-4" /></a>}
                {socialLinks.linkedin && <a href={socialLinks.linkedin} target="_blank" rel="noreferrer" className="hover:text-purple-400"><Linkedin className="w-4 h-4" /></a>}
                {socialLinks.twitter && <a href={socialLinks.twitter} target="_blank" rel="noreferrer" className="hover:text-cyan-400"><Twitter className="w-4 h-4" /></a>}
              </div>
              <AdditionalSocialLinks links={socialLinks} />
            </div>
          </section>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-full bg-slate-950 text-slate-100 font-sans px-6 md:px-12 max-w-5xl mx-auto">
      {sectionOrder.map((key) => renderSection(key))}
    </div>
  )
}
