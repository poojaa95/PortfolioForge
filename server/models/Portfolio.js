import mongoose from 'mongoose'

const educationSchema = new mongoose.Schema({
  degree: { type: String, default: '' },
  college: { type: String, default: '' },
  university: { type: String, default: '' },
  startYear: { type: String, default: '' },
  graduationYear: { type: String, default: '' },
  description: { type: String, default: '' },
  grade: { type: String, default: '' },
})

const skillSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  category: { type: String, default: 'Frontend' }, // Frontend, Backend, Database, Tools, Soft Skills, Other
  proficiencyLevel: { type: Number, default: 80, min: 0, max: 100 }, // 0 to 100
})

const projectSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  technologies: [{ type: String }],
  projectImage: { type: String, default: '' },
  githubUrl: { type: String, default: '' },
  liveDemoUrl: { type: String, default: '' },
  featured: { type: Boolean, default: false },
})

const experienceSchema = new mongoose.Schema({
  companyName: { type: String, default: '' },
  jobRole: { type: String, default: '' },
  duration: { type: String, default: '' },
  location: { type: String, default: '' },
  description: { type: String, default: '' },
  isCurrent: { type: Boolean, default: false },
})

const certificationSchema = new mongoose.Schema({
  certificateName: { type: String, default: '' },
  issuingOrganization: { type: String, default: '' },
  date: { type: String, default: '' },
  credentialUrl: { type: String, default: '' },
})

const portfolioSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      default: 'My Professional Portfolio',
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    templateId: {
      type: String,
      enum: ['minimal', 'developer', 'creative', 'student', 'corporate', 'dark'],
      default: 'minimal',
    },
    personalInfo: {
      fullName: { type: String, default: '' },
      title: { type: String, default: '' }, // e.g., Senior Full-Stack Engineer
      headline: { type: String, default: '' }, // short catchy headline
      profilePhoto: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      location: { type: String, default: '' },
    },
    about: {
      summary: { type: String, default: '' },
      highlightYears: { type: String, default: '' },
      bioLong: { type: String, default: '' },
    },
    education: [educationSchema],
    skills: [skillSchema],
    projects: [projectSchema],
    experience: [experienceSchema],
    certifications: [certificationSchema],
    socialLinks: {
      github: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      twitter: { type: String, default: '' },
      portfolio: { type: String, default: '' },
      instagram: { type: String, default: '' },
      youtube: { type: String, default: '' },
    },
    theme: {
      primaryColor: { type: String, default: '#7c3aed' }, // purple accent by default
      accentColor: { type: String, default: '#3b82f6' },
      font: { type: String, default: 'Inter' }, // Inter, Roboto, Poppins, Playfair Display, Space Grotesk
      layoutStyle: { type: String, default: 'modern' },
      darkMode: { type: Boolean, default: false },
      customCss: { type: String, default: '' },
    },
    sectionOrder: {
      type: [String],
      default: ['hero', 'about', 'experience', 'projects', 'skills', 'education', 'certifications', 'contact'],
    },
    sectionVisibility: {
      hero: { type: Boolean, default: true },
      about: { type: Boolean, default: true },
      experience: { type: Boolean, default: true },
      projects: { type: Boolean, default: true },
      skills: { type: Boolean, default: true },
      education: { type: Boolean, default: true },
      certifications: { type: Boolean, default: true },
      contact: { type: Boolean, default: true },
    },
    visibility: {
      type: String,
      enum: ['public', 'private', 'unlisted'],
      default: 'public',
    },
    published: {
      type: Boolean,
      default: false,
      index: true,
    },
    publishedAt: {
      type: Date,
    },
    seo: {
      metaTitle: { type: String, default: '' },
      metaDescription: { type: String, default: '' },
      keywords: { type: String, default: '' },
      ogImage: { type: String, default: '' },
    },
  },
  { timestamps: true }
)

export default mongoose.model('Portfolio', portfolioSchema)
