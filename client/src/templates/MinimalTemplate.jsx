import {
  Mail,
  MapPin,
  ExternalLink,
  Github,
  Linkedin,
  Twitter,
  Award,
} from 'lucide-react'
import AdditionalSocialLinks from './AdditionalSocialLinks.jsx'

export default function MinimalTemplate({ portfolio, onProjectClick }) {
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
    sectionOrder = ['hero', 'about', 'experience', 'projects', 'skills', 'education', 'certifications', 'contact'],
    sectionVisibility = {},
  } = portfolio || {}

  const primaryColor = theme?.primaryColor || '#7c3aed'
  const isVisible = (section) => sectionVisibility?.[section] !== false

  const renderSection = (sectionKey) => {
    if (!isVisible(sectionKey)) return null

    switch (sectionKey) {
      case 'hero':
        if (!(personalInfo.fullName || personalInfo.title || personalInfo.headline || personalInfo.profilePhoto)) return null
        return (
          <section key="hero" className="py-16 md:py-24 border-b border-gray-100">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              <div className="space-y-4 max-w-2xl">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: primaryColor }} />
                  <span>Portfolio</span>
                </div>
                {personalInfo.fullName && <h1 className="font-serif text-4xl md:text-6xl font-normal tracking-tight text-gray-900 leading-tight">
                  Hello, I'm{' '}
                  <span className="font-semibold" style={{ color: primaryColor }}>
                    {personalInfo.fullName}
                  </span>
                </h1>}
                <p className="text-xl md:text-2xl text-gray-600 font-light leading-relaxed">
                  {personalInfo.title}
                </p>
                {personalInfo.headline && (
                  <p className="text-base text-gray-500 italic max-w-xl">
                    "{personalInfo.headline}"
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 pt-2">
                  {personalInfo.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {personalInfo.location}
                    </span>
                  )}
                  {personalInfo.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-gray-400" />
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
                    className="w-36 h-36 md:w-44 md:h-44 rounded-2xl object-cover shadow-sm ring-4 ring-gray-50"
                  />
                </div>
              )}
            </div>
          </section>
        )

      case 'about':
        if (!about.summary) return null
        return (
          <section key="about" className="py-14 border-b border-gray-100">
            <h2 className="text-xs uppercase tracking-widest font-semibold text-gray-400 mb-6">About Me</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 text-lg text-gray-700 leading-relaxed font-light">
                {about.summary}
                {about.bioLong && <p className="mt-4 text-base text-gray-600">{about.bioLong}</p>}
              </div>
              {about.highlightYears && (
                <div className="bg-gray-50 p-6 rounded-2xl flex flex-col justify-center border border-gray-100">
                  <span className="text-4xl font-light text-gray-900" style={{ color: primaryColor }}>
                    {about.highlightYears}
                  </span>
                  <span className="text-xs uppercase font-medium text-gray-500 tracking-wider mt-1">
                    Years of Professional Craft
                  </span>
                </div>
              )}
            </div>
          </section>
        )

      case 'experience':
        if (!experience || experience.length === 0) return null
        return (
          <section key="experience" className="py-14 border-b border-gray-100">
            <h2 className="text-xs uppercase tracking-widest font-semibold text-gray-400 mb-8">Experience</h2>
            <div className="space-y-10">
              {experience.map((exp, idx) => (
                <div key={idx} className="group grid grid-cols-1 md:grid-cols-4 gap-4 items-baseline">
                  <div className="text-sm text-gray-400 font-mono">
                    {exp.duration}
                  </div>
                  <div className="md:col-span-3 space-y-2">
                    <div className="flex flex-wrap items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">
                        {exp.jobRole} <span className="text-gray-400">at</span> {exp.companyName}
                      </h3>
                      {exp.location && <span className="text-xs text-gray-400">{exp.location}</span>}
                    </div>
                    <p className="text-sm text-gray-600 font-light leading-relaxed">{exp.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )

      case 'projects':
        if (!projects || projects.length === 0) return null
        return (
          <section key="projects" className="py-14 border-b border-gray-100">
            <h2 className="text-xs uppercase tracking-widest font-semibold text-gray-400 mb-8">Selected Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {projects.map((proj, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-2xl border border-gray-100 bg-white hover:border-gray-300 hover:shadow-xs transition-all space-y-4"
                >
                  {proj.projectImage && (
                    <img
                      src={proj.projectImage}
                      alt={proj.title}
                      className="w-full h-44 object-cover rounded-xl"
                    />
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">{proj.title}</h3>
                      {proj.featured && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                          Featured
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 font-light leading-relaxed">{proj.description}</p>
                  </div>

                  {proj.technologies && proj.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {proj.technologies.map((tech, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-2.5 py-1 text-xs rounded-lg bg-gray-50 text-gray-600 border border-gray-100"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center space-x-4 pt-3 text-xs font-medium">
                    {proj.liveDemoUrl && (
                      <a
                        href={proj.liveDemoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => onProjectClick?.(proj.title, proj._id, 'demo')}
                        className="inline-flex items-center space-x-1.5 text-purple-600 hover:underline"
                        style={{ color: primaryColor }}
                      >
                        <span>Live Demo</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {proj.githubUrl && (
                      <a
                        href={proj.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => onProjectClick?.(proj.title, proj._id, 'github')}
                        className="inline-flex items-center space-x-1.5 text-gray-600 hover:text-gray-900"
                      >
                        <Github className="w-3.5 h-3.5" />
                        <span>Source Code</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )

      case 'skills':
        if (!skills || skills.length === 0) return null
        return (
          <section key="skills" className="py-14 border-b border-gray-100">
            <h2 className="text-xs uppercase tracking-widest font-semibold text-gray-400 mb-8">Technical Expertise</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {skills.map((skill, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-gray-50/70 border border-gray-100 space-y-2">
                  <div className="flex justify-between items-center text-sm font-medium text-gray-800">
                    <span>{skill.name}</span>
                    <span className="text-xs text-gray-400">{skill.proficiencyLevel}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${skill.proficiencyLevel}%`, backgroundColor: primaryColor }}
                    />
                  </div>
                  {skill.category && <p className="text-[11px] text-gray-400">{skill.category}</p>}
                </div>
              ))}
            </div>
          </section>
        )

      case 'education':
        if (!education || education.length === 0) return null
        return (
          <section key="education" className="py-14 border-b border-gray-100">
            <h2 className="text-xs uppercase tracking-widest font-semibold text-gray-400 mb-8">Education</h2>
            <div className="space-y-6">
              {education.map((edu, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                  <div>
                    <h3 className="text-base font-medium text-gray-900">
                      {edu.degree} {edu.college && `– ${edu.college}`}
                    </h3>
                    <p className="text-sm text-gray-500">{edu.university}</p>
                    {edu.description && <p className="text-xs text-gray-500 mt-1">{edu.description}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono text-gray-400">
                      {edu.startYear} - {edu.graduationYear}
                    </span>
                    {edu.grade && <p className="text-xs text-gray-500 font-medium">{edu.grade}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )

      case 'certifications':
        if (!certifications || certifications.length === 0) return null
        return (
          <section key="certifications" className="py-14 border-b border-gray-100">
            <h2 className="text-xs uppercase tracking-widest font-semibold text-gray-400 mb-8">Certifications</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {certifications.map((cert, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-gray-100 flex items-start space-x-3">
                  <Award className="w-5 h-5 mt-0.5 text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">{cert.certificateName}</h4>
                    <p className="text-xs text-gray-500">{cert.issuingOrganization} • {cert.date}</p>
                    {cert.credentialUrl && (
                      <a
                        href={cert.credentialUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-purple-600 hover:underline mt-1 inline-flex items-center gap-1"
                        style={{ color: primaryColor }}
                      >
                        <span>Verify Credential</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )

      case 'contact':
        if (!(personalInfo.email || personalInfo.phone || personalInfo.location || Object.values(socialLinks).some(Boolean))) return null
        return (
          <section key="contact" className="py-16">
            <div className="max-w-xl mx-auto text-center space-y-4">
              <h2 className="text-2xl font-light text-gray-900">Contact</h2>
              {personalInfo.email && (
                <a
                  href={`mailto:${personalInfo.email}`}
                  className="mx-auto flex w-fit max-w-full items-center gap-2 px-6 py-3 rounded-full text-sm font-medium text-white shadow-xs transition-transform active:scale-95"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Mail className="w-4 h-4 shrink-0" />
                  <span className="min-w-0 break-all">{personalInfo.email}</span>
                </a>
              )}
              {personalInfo.phone && <a href={`tel:${personalInfo.phone}`} className="mx-auto block w-fit max-w-full break-words text-sm text-gray-500 hover:text-gray-900">{personalInfo.phone}</a>}
              {/* Social Links */}
              <div className="flex justify-center space-x-5 pt-4">
                {socialLinks.github && (
                  <a href={socialLinks.github} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-900">
                    <Github className="w-5 h-5" />
                  </a>
                )}
                {socialLinks.linkedin && (
                  <a href={socialLinks.linkedin} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-600">
                    <Linkedin className="w-5 h-5" />
                  </a>
                )}
                {socialLinks.twitter && (
                  <a href={socialLinks.twitter} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-sky-500">
                    <Twitter className="w-5 h-5" />
                  </a>
                )}
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
    <div className="min-h-full bg-[#fffefa] text-gray-900 font-sans px-6 md:px-12 max-w-6xl mx-auto">
      {sectionOrder.map((key) => renderSection(key))}
    </div>
  )
}
