import {
  Palette,
  Sparkles,
  ExternalLink,
  Github,
  Linkedin,
  Twitter,
  Mail,
  MapPin,
  Heart,
  Layers,
  Award,
} from 'lucide-react'
import AdditionalSocialLinks from './AdditionalSocialLinks.jsx'

export default function CreativeTemplate({ portfolio, onProjectClick }) {
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
          <section key="hero" className="py-16 md:py-24 relative overflow-hidden">
            {/* Background subtle gradient orb */}
            <div className="absolute top-0 right-10 w-72 h-72 bg-pink-100 rounded-full blur-3xl opacity-60 -z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-100 rounded-full blur-3xl opacity-60 -z-10 pointer-events-none" />

            <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-10">
              <div className="space-y-6 max-w-2xl text-center md:text-left">
                {personalInfo.title && <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-pink-50 border border-pink-200 text-pink-700 text-xs font-bold tracking-wide">
                  <Sparkles className="w-3.5 h-3.5 text-pink-500 animate-spin" />
                  {personalInfo.title}
                </div>}
                {personalInfo.fullName && <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight leading-none"><span className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">{personalInfo.fullName}</span></h1>}
                {personalInfo.title && <p className="text-xl md:text-2xl font-semibold text-gray-700">{personalInfo.title}</p>}
                {personalInfo.headline && (
                  <p className="text-base text-gray-600 leading-relaxed font-light">
                    {personalInfo.headline}
                  </p>
                )}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-semibold text-gray-500 pt-2">
                  {personalInfo.location && (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white shadow-xs border border-gray-100">
                      <MapPin className="w-3.5 h-3.5 text-pink-500" />
                      {personalInfo.location}
                    </span>
                  )}
                  {personalInfo.email && (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white shadow-xs border border-gray-100">
                      <Mail className="w-3.5 h-3.5 text-purple-500" />
                      {personalInfo.email}
                    </span>
                  )}
                </div>
              </div>

              {personalInfo.profilePhoto && (
                <div className="relative shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-3xl transform rotate-3 scale-105 opacity-80" />
                  <img
                    src={personalInfo.profilePhoto}
                    alt={personalInfo.fullName}
                    className="relative w-44 h-44 md:w-56 md:h-56 rounded-3xl object-cover shadow-2xl ring-4 ring-white"
                  />
                </div>
              )}
            </div>
          </section>
        )

      case 'about':
        if (!about.summary) return null
        return (
          <section key="about" className="py-14">
            <div className="bg-gradient-to-br from-purple-50/80 via-white to-pink-50/50 p-8 md:p-12 rounded-3xl border border-purple-100/60 shadow-xs space-y-6">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-pink-600">
                <Palette className="w-4 h-4" />
                <span>The Creative Mindset</span>
              </div>
              <p className="text-xl md:text-2xl font-light text-gray-800 leading-relaxed">
                "{about.summary}"
              </p>
              {about.bioLong && <p className="text-base text-gray-600 font-normal leading-relaxed">{about.bioLong}</p>}
            </div>
          </section>
        )

      case 'projects':
        if (!projects || projects.length === 0) return null
        return (
          <section key="projects" className="py-14">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Featured Works</h2>
                <p className="text-sm text-gray-500 mt-1">A curated showcase of design, code, and aesthetics</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {projects.map((proj, idx) => (
                <div
                  key={idx}
                  className="group relative rounded-3xl overflow-hidden border border-gray-100 bg-white shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="relative overflow-hidden aspect-video bg-gray-100">
                    {proj.projectImage ? (
                      <img
                        src={proj.projectImage}
                        alt={proj.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-pink-100 to-purple-100 text-purple-400">
                        <Layers className="w-12 h-12 opacity-50" />
                      </div>
                    )}
                    {proj.featured && (
                      <span className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r from-pink-500 to-purple-600 shadow-md">
                        Spotlight
                      </span>
                    )}
                  </div>

                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-pink-600 transition-colors">
                        {proj.title}
                      </h3>
                      <p className="text-sm text-gray-600 font-light mt-1.5 leading-relaxed">{proj.description}</p>
                    </div>

                    {proj.technologies && (
                      <div className="flex flex-wrap gap-2">
                        {proj.technologies.map((tech, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 rounded-full text-xs font-semibold bg-pink-50 text-pink-700"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center space-x-4 pt-3 border-t border-gray-100 text-xs font-bold">
                      {proj.liveDemoUrl && (
                        <a
                          href={proj.liveDemoUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => onProjectClick?.(proj.title, proj._id, 'demo')}
                          className="inline-flex items-center space-x-1.5 text-pink-600 hover:text-pink-700"
                        >
                          <span>Explore Project</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {proj.githubUrl && (
                        <a
                          href={proj.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => onProjectClick?.(proj.title, proj._id, 'github')}
                          className="inline-flex items-center space-x-1.5 text-gray-600 hover:text-gray-900"
                        >
                          <Github className="w-3.5 h-3.5" />
                          <span>Code Repository</span>
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
          <section key="skills" className="py-14">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-8">Design & Dev Tooling</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {skills.map((s, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-white border border-gray-100 shadow-xs hover:border-pink-200 hover:shadow-md transition-all text-center space-y-2"
                >
                  <p className="text-base font-bold text-gray-900">{s.name}</p>
                  <div className="flex items-center justify-center space-x-1 text-xs text-pink-600 font-semibold">
                    <Heart className="w-3 h-3 fill-pink-500 text-pink-500" />
                    <span>{s.proficiencyLevel}% Mastery</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )

      case 'experience':
        if (!experience || experience.length === 0) return null
        return (
          <section key="experience" className="py-14">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-8">Creative Journey</h2>
            <div className="space-y-6">
              {experience.map((exp, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-3xl bg-gray-50/70 border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg font-bold text-gray-900">{exp.jobRole}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white text-gray-700 border border-gray-200">
                        {exp.companyName}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 font-light">{exp.description}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-xs font-bold text-pink-600 bg-pink-50 px-3 py-1 rounded-full">
                      {exp.duration}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )

      case 'education':
        if (!education || education.length === 0) return null
        return (
          <section key="education" className="py-14">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-8">Education & Roots</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {education.map((edu, idx) => (
                <div key={idx} className="p-6 rounded-2xl border border-gray-100 bg-white space-y-2">
                  <h3 className="text-lg font-bold text-gray-900">{edu.degree}</h3>
                  <p className="text-sm text-purple-600 font-medium">{edu.university || edu.college}</p>
                  <p className="text-xs text-gray-400">{edu.startYear} - {edu.graduationYear}</p>
                  {edu.description && <p className="text-xs text-gray-600 mt-2">{edu.description}</p>}
                </div>
              ))}
            </div>
          </section>
        )

      case 'certifications':
        if (!certifications || certifications.length === 0) return null
        return (
          <section key="certifications" className="py-14">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-8">Honors & Accreditations</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {certifications.map((c, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-white border border-gray-100 flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{c.certificateName}</h4>
                    <p className="text-xs text-gray-500">{c.issuingOrganization} • {c.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )

      case 'contact':
        return (
          <section key="contact" className="py-20 text-center">
            <div className="max-w-2xl mx-auto p-10 rounded-3xl bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-600 text-white shadow-2xl space-y-6">
              <h2 className="text-3xl md:text-4xl font-black">Contact</h2>
              {personalInfo.email && (
                <a
                  href={`mailto:${personalInfo.email}`}
                  className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-full text-sm font-bold text-gray-900 bg-white hover:bg-gray-100 shadow-md transition-transform active:scale-95"
                >
                  <Mail className="w-4 h-4 text-pink-600" />
                  <span>{personalInfo.email}</span>
                </a>
              )}
              {personalInfo.phone && <a href={`tel:${personalInfo.phone}`} className="text-sm text-white/80 hover:text-white">{personalInfo.phone}</a>}
              <div className="flex justify-center space-x-6 pt-4 text-white/80">
                {socialLinks.github && <a href={socialLinks.github} target="_blank" rel="noreferrer" className="hover:text-white"><Github className="w-5 h-5" /></a>}
                {socialLinks.linkedin && <a href={socialLinks.linkedin} target="_blank" rel="noreferrer" className="hover:text-white"><Linkedin className="w-5 h-5" /></a>}
                {socialLinks.twitter && <a href={socialLinks.twitter} target="_blank" rel="noreferrer" className="hover:text-white"><Twitter className="w-5 h-5" /></a>}
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
