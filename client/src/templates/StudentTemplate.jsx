import {
  GraduationCap,
  ExternalLink,
  Github,
  Linkedin,
  Twitter,
  Mail,
  MapPin,
  FileBadge,
} from 'lucide-react'
import AdditionalSocialLinks from './AdditionalSocialLinks.jsx'

export default function StudentTemplate({ portfolio, onProjectClick }) {
  const {
    personalInfo = {},
    about = {},
    education = [],
    skills = [],
    projects = [],
    experience = [],
    certifications = [],
    socialLinks = {},
    theme = {},
    sectionOrder = ['hero', 'education', 'about', 'skills', 'projects', 'experience', 'certifications', 'contact'],
    sectionVisibility = {},
  } = portfolio || {}

  const primaryColor = theme?.primaryColor || '#2563eb'
  const isVisible = (section) => sectionVisibility?.[section] !== false

  const renderSection = (sectionKey) => {
    if (!isVisible(sectionKey)) return null

    switch (sectionKey) {
      case 'hero':
        if (!(personalInfo.fullName || personalInfo.title || personalInfo.headline || personalInfo.profilePhoto)) return null
        return (
          <section key="hero" className="py-12 md:py-18 border-b border-blue-50">
            <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-8">
              <div className="space-y-4 max-w-xl text-center md:text-left">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  <span>Student & Graduate Portfolio</span>
                </div>
                {personalInfo.fullName && <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">{personalInfo.fullName}</h1>}
                {personalInfo.title && <p className="text-lg md:text-xl font-medium" style={{ color: primaryColor }}>{personalInfo.title}</p>}
                {personalInfo.headline && (
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {personalInfo.headline}
                  </p>
                )}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-gray-500 pt-2">
                  {personalInfo.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-500" />
                      {personalInfo.location}
                    </span>
                  )}
                  {personalInfo.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-blue-500" />
                      {personalInfo.email}
                    </span>
                  )}
                </div>
              </div>

              {personalInfo.profilePhoto && (
                <div className="shrink-0">
                  <img
                    src={personalInfo.profilePhoto}
                    alt={personalInfo.fullName}
                    className="w-36 h-36 md:w-44 md:h-44 rounded-2xl object-cover ring-4 ring-blue-100 shadow-md"
                  />
                </div>
              )}
            </div>
          </section>
        )

      case 'education':
        if (!education || education.length === 0) return null
        return (
          <section key="education" className="py-12 border-b border-gray-100">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-6">
              <GraduationCap className="w-4 h-4" />
              <span>Academic Education & Coursework</span>
            </div>
            <div className="space-y-4">
              {education.map((edu, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-blue-50/40 border border-blue-100 shadow-2xs flex flex-col sm:flex-row justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-bold text-gray-900">{edu.degree}</h3>
                      {edu.grade && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white">
                          {edu.grade}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-blue-800">
                      {edu.university} {edu.college && `• ${edu.college}`}
                    </p>
                    {edu.description && (
                      <p className="text-xs text-gray-600 leading-relaxed pt-1">{edu.description}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-xs font-medium text-gray-500 bg-white px-3 py-1 rounded-full border border-blue-200">
                      {edu.startYear} - {edu.graduationYear}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )

      case 'about':
        if (!about.summary) return null
        return (
          <section key="about" className="py-12 border-b border-gray-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-4">
              Career Objective & Background
            </h2>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs">
              <p className="text-base text-gray-700 leading-relaxed">{about.summary}</p>
              {about.bioLong && <p className="mt-3 text-sm text-gray-600 leading-relaxed">{about.bioLong}</p>}
            </div>
          </section>
        )

      case 'skills':
        if (!skills || skills.length === 0) return null
        return (
          <section key="skills" className="py-12 border-b border-gray-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-6">
              Skills & Core Competencies
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {skills.map((s, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-gray-200 bg-white hover:border-blue-300 transition-all">
                  <div className="flex justify-between items-center text-xs font-bold text-gray-800">
                    <span className="truncate">{s.name}</span>
                    <span className="text-blue-600">{s.proficiencyLevel}%</span>
                  </div>
                  <div className="w-full bg-blue-100 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${s.proficiencyLevel}%` }} />
                  </div>
                  {s.category && <p className="text-[10px] text-gray-400 mt-1">{s.category}</p>}
                </div>
              ))}
            </div>
          </section>
        )

      case 'projects':
        if (!projects || projects.length === 0) return null
        return (
          <section key="projects" className="py-12 border-b border-gray-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-6">
              Academic & Personal Projects
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((proj, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  {proj.projectImage && (
                    <img src={proj.projectImage} alt={proj.title} className="w-full h-40 object-cover" />
                  )}
                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">{proj.title}</h3>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">{proj.description}</p>
                    </div>

                    {proj.technologies && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {proj.technologies.map((t, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center space-x-4 pt-3 border-t border-gray-100 text-xs font-semibold">
                      {proj.liveDemoUrl && (
                        <a
                          href={proj.liveDemoUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => onProjectClick?.(proj.title, proj._id, 'demo')}
                          className="inline-flex items-center space-x-1 text-blue-600 hover:underline"
                        >
                          <span>Live Demo</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {proj.githubUrl && (
                        <a
                          href={proj.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => onProjectClick?.(proj.title, proj._id, 'github')}
                          className="inline-flex items-center space-x-1 text-gray-600 hover:text-gray-900"
                        >
                          <Github className="w-3.5 h-3.5" />
                          <span>GitHub</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )

      case 'experience':
        if (!experience || experience.length === 0) return null
        return (
          <section key="experience" className="py-12 border-b border-gray-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-6">
              Internships & Work Experience
            </h2>
            <div className="space-y-4">
              {experience.map((exp, idx) => (
                <div key={idx} className="p-5 rounded-xl border border-gray-200 bg-white space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-gray-900">
                      {exp.jobRole} <span className="text-blue-600">at {exp.companyName}</span>
                    </h3>
                    <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2.5 py-0.5 rounded-md">
                      {exp.duration}
                    </span>
                  </div>
                  {exp.location && <p className="text-xs text-gray-400">{exp.location}</p>}
                  <p className="text-xs text-gray-600 leading-relaxed pt-1">{exp.description}</p>
                </div>
              ))}
            </div>
          </section>
        )

      case 'certifications':
        if (!certifications || certifications.length === 0) return null
        return (
          <section key="certifications" className="py-12 border-b border-gray-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-6">
              Certificates & Honors
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {certifications.map((c, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-gray-200 bg-white flex items-center space-x-3">
                  <FileBadge className="w-5 h-5 text-blue-600 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">{c.certificateName}</h4>
                    <p className="text-[11px] text-gray-500">{c.issuingOrganization} • {c.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )

      case 'contact':
        return (
          <section key="contact" className="py-16 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">Get in Touch</h2>
              {personalInfo.email && (
                <a
                  href={`mailto:${personalInfo.email}`}
                  className="mx-auto flex w-fit max-w-full items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-xs bg-blue-600 hover:bg-blue-700"
                >
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span className="min-w-0 break-all">{personalInfo.email}</span>
                </a>
              )}
              {personalInfo.phone && <a href={`tel:${personalInfo.phone}`} className="mx-auto block w-fit max-w-full break-words text-sm text-gray-500 hover:text-gray-900">{personalInfo.phone}</a>}
              <div className="flex justify-center space-x-4 pt-3 text-gray-400">
                {socialLinks.github && <a href={socialLinks.github} target="_blank" rel="noreferrer" className="hover:text-gray-900"><Github className="w-4 h-4" /></a>}
                {socialLinks.linkedin && <a href={socialLinks.linkedin} target="_blank" rel="noreferrer" className="hover:text-blue-600"><Linkedin className="w-4 h-4" /></a>}
                {socialLinks.twitter && <a href={socialLinks.twitter} target="_blank" rel="noreferrer" className="hover:text-sky-600"><Twitter className="w-4 h-4" /></a>}
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
    <div className="min-h-full bg-white text-gray-900 font-sans px-6 md:px-12 max-w-5xl mx-auto">
      {sectionOrder.map((key) => renderSection(key))}
    </div>
  )
}
