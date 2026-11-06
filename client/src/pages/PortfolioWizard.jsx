import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { createPortfolio, checkSlugAvailability } from '../services/portfolioService.js'
import { uploadImage } from '../services/uploadService.js'
import { improveContent } from '../services/aiService.js'
import {
  User,
  GraduationCap,
  Cpu,
  FolderGit2,
  Briefcase,
  Award,
  Share2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  Bot,
  CheckCircle2,
  Save,
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function PortfolioWizard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [slugStatus, setSlugStatus] = useState(null)

  const initialTemplate = searchParams.get('template') || 'minimal'

  // Wizard Master State
  const [formData, setFormData] = useState({
    title: 'My Portfolio',
    slug: 'my-portfolio',
    templateId: initialTemplate,
    personalInfo: {
      fullName: '', title: '', headline: '', profilePhoto: '', email: '', phone: '', location: '',
    },
    about: { summary: '', highlightYears: '', bioLong: '' },
    education: [], skills: [], projects: [], experience: [], certifications: [],
    socialLinks: { github: '', linkedin: '', twitter: '', portfolio: '', instagram: '', youtube: '' },
  })

  // Dynamic Array Handlers
  const addEducation = () => {
    setFormData((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        { degree: '', college: '', university: '', startYear: '', graduationYear: '', description: '', grade: '' },
      ],
    }))
  }

  const removeEducation = (index) => {
    setFormData((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }))
  }

  const addSkill = () => {
    setFormData((prev) => ({
      ...prev,
      skills: [...prev.skills, { name: '', category: 'Frontend', proficiencyLevel: 80 }],
    }))
  }

  const removeSkill = (index) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }))
  }

  const addProject = () => {
    setFormData((prev) => ({
      ...prev,
      projects: [
        ...prev.projects,
        { title: '', description: '', technologies: [], projectImage: '', githubUrl: '', liveDemoUrl: '', featured: false },
      ],
    }))
  }

  const removeProject = (index) => {
    setFormData((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index),
    }))
  }

  const addExperience = () => {
    setFormData((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        { companyName: '', jobRole: '', duration: '', location: '', description: '', isCurrent: false },
      ],
    }))
  }

  const removeExperience = (index) => {
    setFormData((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }))
  }

  const addCertification = () => {
    setFormData((prev) => ({
      ...prev,
      certifications: [
        ...prev.certifications,
        { certificateName: '', issuingOrganization: '', date: '', credentialUrl: '' },
      ],
    }))
  }

  const removeCertification = (index) => {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index),
    }))
  }

  // Upload Photo Handler
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const res = await uploadImage(file)
      if (res.success && res.url) {
        setFormData((prev) => ({
          ...prev,
          personalInfo: { ...prev.personalInfo, profilePhoto: res.url },
        }))
        toast.success('Photo uploaded!')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }

  // AI Content Assistant inside Wizard
  const handleAiImprove = async (type, currentText, updateCallback) => {
    setIsAiLoading(true)
    try {
      const res = await improveContent({
        type,
        currentText,
        role: formData.personalInfo.title,
        skills: formData.skills.map((s) => s.name),
      })
      if (res.result) {
        updateCallback(res.result)
        toast.success('Polished with AI!')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI assistant currently unavailable')
    } finally {
      setIsAiLoading(false)
    }
  }

  // Slug check
  const handleSlugCheck = async (slugVal) => {
    if (!slugVal || slugVal.length < 3) return
    try {
      const res = await checkSlugAvailability(slugVal)
      setSlugStatus(res.available ? 'available' : 'taken')
    } catch {
      setSlugStatus(null)
    }
  }

  // Final Submit
  const handleFinalSave = async () => {
    for (let step = 1; step <= 7; step += 1) {
      const validationError = validateStep(step)
      if (validationError) {
        setCurrentStep(step)
        toast.error(validationError)
        return
      }
    }
    setIsSubmitting(true)
    try {
      const res = await createPortfolio(formData)
      if (res.success && res.portfolio) {
        toast.success('Portfolio created successfully!')
        navigate(`/editor/${res.portfolio._id}`)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create portfolio')
    } finally {
      setIsSubmitting(false)
    }
  }

  const validateStep = (step) => {
    if (step === 1) {
      if (!formData.personalInfo.fullName.trim()) return 'Enter your name to continue.'
      if (formData.personalInfo.email && !/^\S+@\S+\.\S+$/.test(formData.personalInfo.email)) return 'Enter a valid email address.'
    }
    if (step === 2 && formData.education.some((entry) => !entry.degree.trim() || !(entry.university || entry.college).trim())) {
      return 'Complete the degree and institution fields, or remove the unfinished education entry.'
    }
    if (step === 3 && formData.skills.some((entry) => !entry.name.trim())) return 'Enter a name for each skill or remove the empty skill.'
    if (step === 4 && formData.projects.some((entry) => !entry.title.trim())) return 'Enter a title for each project or remove the empty project.'
    if (step === 5 && formData.experience.some((entry) => !entry.jobRole.trim() || !entry.companyName.trim())) {
      return 'Complete the role and company fields, or remove the unfinished experience entry.'
    }
    if (step === 6 && formData.certifications.some((entry) => !entry.certificateName.trim())) {
      return 'Enter a name for each certification or remove the empty certification.'
    }
    if (step === 7 && formData.slug.trim().length < 3) return 'Your portfolio URL must be at least 3 characters.'
    return null
  }

  const goToNextStep = () => {
    const error = validateStep(currentStep)
    if (error) {
      toast.error(error)
      return
    }
    setCurrentStep((step) => Math.min(step + 1, steps.length))
  }

  const steps = [
    { num: 1, label: 'Personal', icon: User },
    { num: 2, label: 'Education', icon: GraduationCap },
    { num: 3, label: 'Skills', icon: Cpu },
    { num: 4, label: 'Projects', icon: FolderGit2 },
    { num: 5, label: 'Experience', icon: Briefcase },
    { num: 6, label: 'Certificates', icon: Award },
    { num: 7, label: 'Social & Launch', icon: Share2 },
  ]

  return (
    <div className="min-h-screen bg-gray-50/50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Wizard Top Step Indicator */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
                Step {currentStep} of {steps.length}
              </span>
              <h2 className="text-lg font-bold text-gray-900">{steps[currentStep - 1]?.label} Details</h2>
            </div>
            <button
              onClick={handleFinalSave}
              disabled={isSubmitting}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save & Go to Editor</span>
            </button>
          </div>

          {/* Progress Bar & Badges */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {steps.map((st) => {
              const Icon = st.icon
              const isPast = st.num < currentStep
              const isCurrent = st.num === currentStep
              return (
                <button
                  key={st.num}
                  onClick={() => {
                    if (st.num <= currentStep) {
                      setCurrentStep(st.num)
                      return
                    }
                    for (let step = currentStep; step < st.num; step += 1) {
                      const error = validateStep(step)
                      if (error) {
                        toast.error(error)
                        return
                      }
                    }
                    setCurrentStep(st.num)
                  }}
                  className={`flex flex-col items-center py-2 px-1 rounded-xl text-center transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-purple-600 text-white shadow-xs'
                      : isPast
                      ? 'bg-purple-50 text-purple-700'
                      : 'text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4 mb-1" />
                  <span className="text-[10px] font-bold hidden sm:inline">{st.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Step Form Container */}
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          {/* STEP 1: Personal Info & About Me */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h3 className="text-xl font-bold text-gray-900">Personal & Contact Information</h3>
                <p className="text-xs text-gray-500 mt-0.5">Let visitors know who you are and what you do.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.personalInfo.fullName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        personalInfo: { ...formData.personalInfo, fullName: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    placeholder="Alex Morgan"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Professional Title
                  </label>
                  <input
                    type="text"
                    value={formData.personalInfo.title}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        personalInfo: { ...formData.personalInfo, title: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    placeholder="Senior Full-Stack Engineer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.personalInfo.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        personalInfo: { ...formData.personalInfo, email: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    placeholder="alex@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.personalInfo.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        personalInfo: { ...formData.personalInfo, phone: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    placeholder="+1 (555) 234-5678"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.personalInfo.location}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        personalInfo: { ...formData.personalInfo, location: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    placeholder="San Francisco, CA (or Remote)"
                  />
                </div>
              </div>

              {/* Profile Photo Upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Profile Photo
                </label>
                <div className="flex items-center space-x-4">
                  {formData.personalInfo.profilePhoto ? (
                    <img
                      src={formData.personalInfo.profilePhoto}
                      alt="Avatar"
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-purple-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg">
                      <User className="w-7 h-7" />
                    </div>
                  )}
                  <div>
                    <label className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploading ? 'Uploading...' : 'Upload Image'}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-gray-400 mt-1">PNG, JPG, or WebP up to 5MB</p>
                  </div>
                </div>
              </div>

              {/* About Me with AI Assistant */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    About Me Summary
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      handleAiImprove('about_summary', formData.about.summary, (res) =>
                        setFormData((p) => ({ ...p, about: { ...p.about, summary: res } }))
                      )
                    }
                    disabled={isAiLoading}
                    className="inline-flex items-center space-x-1 text-xs font-bold text-purple-600 hover:text-purple-700 cursor-pointer"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>{isAiLoading ? 'Polishing...' : '✨ Polish with AI'}</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={formData.about.summary}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      about: { ...formData.about, summary: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  placeholder="Introduce yourself, your core passions, and achievements..."
                />
              </div>
            </div>
          )}

          {/* STEP 2: Education */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Academic Background</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Degrees, universities, honors, and coursework.</p>
                </div>
                <button
                  type="button"
                  onClick={addEducation}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Degree</span>
                </button>
              </div>

              {formData.education.map((edu, idx) => (
                <div key={idx} className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-4 relative">
                  <button
                    type="button"
                    onClick={() => removeEducation(idx)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Degree</label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => {
                          const arr = [...formData.education]
                          arr[idx].degree = e.target.value
                          setFormData({ ...formData, education: arr })
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                        placeholder="B.S. in Computer Science"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">University / Institute</label>
                      <input
                        type="text"
                        value={edu.university}
                        onChange={(e) => {
                          const arr = [...formData.education]
                          arr[idx].university = e.target.value
                          setFormData({ ...formData, education: arr })
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                        placeholder="State University"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Start Year</label>
                      <input
                        type="text"
                        value={edu.startYear}
                        onChange={(e) => {
                          const arr = [...formData.education]
                          arr[idx].startYear = e.target.value
                          setFormData({ ...formData, education: arr })
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                        placeholder="2018"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Graduation Year</label>
                      <input
                        type="text"
                        value={edu.graduationYear}
                        onChange={(e) => {
                          const arr = [...formData.education]
                          arr[idx].graduationYear = e.target.value
                          setFormData({ ...formData, education: arr })
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                        placeholder="2022"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Description / Honors</label>
                      <input
                        type="text"
                        value={edu.description}
                        onChange={(e) => {
                          const arr = [...formData.education]
                          arr[idx].description = e.target.value
                          setFormData({ ...formData, education: arr })
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                        placeholder="Focused on algorithms, software architecture, and distributed databases."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STEP 3: Skills */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Technical & Professional Skills</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Categorize your expertise and proficiency levels.</p>
                </div>
                <button
                  type="button"
                  onClick={addSkill}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Skill</span>
                </button>
              </div>

              <div className="space-y-3">
                {formData.skills.map((skill, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-gray-50/70 border border-gray-200 rounded-xl">
                    <input
                      type="text"
                      value={skill.name}
                      onChange={(e) => {
                        const arr = [...formData.skills]
                        arr[idx].name = e.target.value
                        setFormData({ ...formData, skills: arr })
                      }}
                      className="w-full sm:w-1/3 px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm"
                      placeholder="Skill name (e.g. React.js)"
                    />
                    <select
                      value={skill.category}
                      onChange={(e) => {
                        const arr = [...formData.skills]
                        arr[idx].category = e.target.value
                        setFormData({ ...formData, skills: arr })
                      }}
                      className="w-full sm:w-1/4 px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm"
                    >
                      <option value="Frontend">Frontend</option>
                      <option value="Backend">Backend</option>
                      <option value="Database">Database</option>
                      <option value="Tools">Tools / DevOps</option>
                      <option value="Design">Design / UX</option>
                      <option value="Soft Skills">Soft Skills</option>
                    </select>

                    <div className="flex items-center space-x-2 w-full sm:flex-1">
                      <input
                        type="range"
                        min="20"
                        max="100"
                        value={skill.proficiencyLevel}
                        onChange={(e) => {
                          const arr = [...formData.skills]
                          arr[idx].proficiencyLevel = Number(e.target.value)
                          setFormData({ ...formData, skills: arr })
                        }}
                        className="w-full accent-purple-600"
                      />
                      <span className="text-xs font-bold text-purple-700 w-10 text-right">
                        {skill.proficiencyLevel}%
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeSkill(idx)}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Projects */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Featured Projects</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Showcase your best builds, repositories, and applications.</p>
                </div>
                <button
                  type="button"
                  onClick={addProject}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Project</span>
                </button>
              </div>

              {formData.projects.map((proj, idx) => (
                <div key={idx} className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-4 relative">
                  <button
                    type="button"
                    onClick={() => removeProject(idx)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Project Title</label>
                      <input
                        type="text"
                        value={proj.title}
                        onChange={(e) => {
                          const arr = [...formData.projects]
                          arr[idx].title = e.target.value
                          setFormData({ ...formData, projects: arr })
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                        placeholder="E-Commerce Microservices"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Technologies (comma separated)</label>
                      <input
                        type="text"
                        value={proj.technologies?.join(', ')}
                        onChange={(e) => {
                          const arr = [...formData.projects]
                          arr[idx].technologies = e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                          setFormData({ ...formData, projects: arr })
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                        placeholder="React, Node.js, MongoDB"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">GitHub URL</label>
                      <input
                        type="text"
                        value={proj.githubUrl}
                        onChange={(e) => {
                          const arr = [...formData.projects]
                          arr[idx].githubUrl = e.target.value
                          setFormData({ ...formData, projects: arr })
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                        placeholder="https://github.com/..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Live Demo URL</label>
                      <input
                        type="text"
                        value={proj.liveDemoUrl}
                        onChange={(e) => {
                          const arr = [...formData.projects]
                          arr[idx].liveDemoUrl = e.target.value
                          setFormData({ ...formData, projects: arr })
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                        placeholder="https://example.com"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-gray-700 uppercase">Project Description</label>
                        <button
                          type="button"
                          onClick={() =>
                            handleAiImprove('project_description', proj.description, (res) => {
                              const arr = [...formData.projects]
                              arr[idx].description = res
                              setFormData({ ...formData, projects: arr })
                            })
                          }
                          disabled={isAiLoading}
                          className="text-xs font-bold text-purple-600 hover:text-purple-700"
                        >
                          ✨ Polish Description
                        </button>
                      </div>
                      <textarea
                        rows={3}
                        value={proj.description}
                        onChange={(e) => {
                          const arr = [...formData.projects]
                          arr[idx].description = e.target.value
                          setFormData({ ...formData, projects: arr })
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                        placeholder="Explain problem solved, architectural approach, and measurable outcome..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STEP 5: Experience */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Work Experience</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Companies, roles, leadership, and accomplishments.</p>
                </div>
                <button
                  type="button"
                  onClick={addExperience}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Role</span>
                </button>
              </div>

              {formData.experience.map((exp, idx) => (
                <div key={idx} className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-4 relative">
                  <button
                    type="button"
                    onClick={() => removeExperience(idx)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Job Role</label>
                      <input
                        type="text"
                        value={exp.jobRole}
                        onChange={(e) => {
                          const arr = [...formData.experience]
                          arr[idx].jobRole = e.target.value
                          setFormData({ ...formData, experience: arr })
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                        placeholder="Lead Software Engineer"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Company Name</label>
                      <input
                        type="text"
                        value={exp.companyName}
                        onChange={(e) => {
                          const arr = [...formData.experience]
                          arr[idx].companyName = e.target.value
                          setFormData({ ...formData, experience: arr })
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                        placeholder="Google / Stripe"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Duration</label>
                      <input
                        type="text"
                        value={exp.duration}
                        onChange={(e) => {
                          const arr = [...formData.experience]
                          arr[idx].duration = e.target.value
                          setFormData({ ...formData, experience: arr })
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                        placeholder="2022 - Present"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Location</label>
                      <input
                        type="text"
                        value={exp.location}
                        onChange={(e) => {
                          const arr = [...formData.experience]
                          arr[idx].location = e.target.value
                          setFormData({ ...formData, experience: arr })
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                        placeholder="San Francisco, CA (or Remote)"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Role Description</label>
                      <textarea
                        rows={3}
                        value={exp.description}
                        onChange={(e) => {
                          const arr = [...formData.experience]
                          arr[idx].description = e.target.value
                          setFormData({ ...formData, experience: arr })
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                        placeholder="Highlight technical ownership, key metrics, and impact..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STEP 6: Certifications & Achievements */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Certificates & Achievements</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Showcase industry accreditations and credentials.</p>
                </div>
                <button
                  type="button"
                  onClick={addCertification}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Certificate</span>
                </button>
              </div>

              {formData.certifications.map((c, idx) => (
                <div key={idx} className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-4 relative">
                  <button
                    type="button"
                    onClick={() => removeCertification(idx)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Certificate Name</label>
                      <input
                        type="text"
                        value={c.certificateName}
                        onChange={(e) => {
                          const arr = [...formData.certifications]
                          arr[idx].certificateName = e.target.value
                          setFormData({ ...formData, certifications: arr })
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                        placeholder="AWS Solutions Architect"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Issuing Organization</label>
                      <input
                        type="text"
                        value={c.issuingOrganization}
                        onChange={(e) => {
                          const arr = [...formData.certifications]
                          arr[idx].issuingOrganization = e.target.value
                          setFormData({ ...formData, certifications: arr })
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                        placeholder="Amazon Web Services"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Issue Date</label>
                      <input
                        type="text"
                        value={c.date}
                        onChange={(e) => {
                          const arr = [...formData.certifications]
                          arr[idx].date = e.target.value
                          setFormData({ ...formData, certifications: arr })
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                        placeholder="2023"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Credential URL</label>
                      <input
                        type="text"
                        value={c.credentialUrl}
                        onChange={(e) => {
                          const arr = [...formData.certifications]
                          arr[idx].credentialUrl = e.target.value
                          setFormData({ ...formData, certifications: arr })
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STEP 7: Template Choice, Slug, & Launch */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h3 className="text-xl font-bold text-gray-900">Choose Template & Public URL</h3>
                <p className="text-xs text-gray-500 mt-0.5">Pick your visual aesthetic and claim your handle.</p>
              </div>

              {/* Template Radio Grid */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
                  Visual Layout Identity
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'minimal', name: 'Minimal Editorial', desc: 'Elegant typography and generous whitespace' },
                    { id: 'developer', name: 'Modern Developer', desc: 'Terminal & code badge vibes' },
                    { id: 'creative', name: 'Creative Designer', desc: 'Vibrant spotlight gradients' },
                    { id: 'student', name: 'Student & Graduate', desc: 'Education & coursework first' },
                    { id: 'corporate', name: 'Corporate Professional', desc: 'Formal structure and a neutral business palette' },
                    { id: 'dark', name: 'Dark Tech', desc: 'Premium dark styling with violet and blue accents' },
                  ].map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, templateId: tpl.id })}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        formData.templateId === tpl.id
                          ? 'border-purple-600 bg-purple-50/60 ring-2 ring-purple-500/20'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-gray-900">{tpl.name}</span>
                        {formData.templateId === tpl.id && (
                          <CheckCircle2 className="w-4 h-4 text-purple-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{tpl.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Slug Handle */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Public URL Slug
                </label>
                <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 p-2 focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent">
                  <span className="text-xs font-mono text-gray-500 pl-2">{window.location.host}/u/</span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => {
                      const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
                      setFormData({ ...formData, slug: val })
                      handleSlugCheck(val)
                    }}
                    className="flex-1 bg-transparent px-1 text-sm font-mono text-gray-900 focus:outline-hidden"
                    placeholder="your-custom-slug"
                  />
                  {slugStatus === 'available' && (
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                      Available
                    </span>
                  )}
                  {slugStatus === 'taken' && (
                    <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                      Taken
                    </span>
                  )}
                </div>
              </div>

              {/* Social Links */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
                  Online Profiles & Links
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={formData.socialLinks.linkedin}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        socialLinks: { ...formData.socialLinks, linkedin: e.target.value },
                      })
                    }
                    className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                    placeholder="LinkedIn URL"
                  />
                  <input
                    type="text"
                    value={formData.socialLinks.github}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        socialLinks: { ...formData.socialLinks, github: e.target.value },
                      })
                    }
                    className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                    placeholder="GitHub URL"
                  />
                  <input
                    type="text"
                    value={formData.socialLinks.twitter}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        socialLinks: { ...formData.socialLinks, twitter: e.target.value },
                      })
                    }
                    className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                    placeholder="Twitter / X profile URL"
                  />
                  <input
                    type="text"
                    value={formData.socialLinks.portfolio}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        socialLinks: { ...formData.socialLinks, portfolio: e.target.value },
                      })
                    }
                    className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                    placeholder="Personal website URL"
                  />
                  <input
                    type="url"
                    value={formData.socialLinks.instagram}
                    onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, instagram: e.target.value } })}
                    className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                    placeholder="Instagram URL"
                  />
                  <input
                    type="url"
                    value={formData.socialLinks.youtube}
                    onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, youtube: e.target.value } })}
                    className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                    placeholder="YouTube URL"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Wizard Footer Navigation */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-100">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {currentStep < steps.length ? (
              <button
                type="button"
                onClick={goToNextStep}
                className="inline-flex items-center space-x-1.5 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-200 transition-all cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSave}
                disabled={isSubmitting}
                className="inline-flex items-center space-x-2 px-8 py-3 rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSubmitting ? 'Creating Portfolio...' : 'Complete & Open Editor'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
