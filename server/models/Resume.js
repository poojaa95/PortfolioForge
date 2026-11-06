import mongoose from 'mongoose'

const entrySchema = (fields) => new mongoose.Schema(Object.fromEntries(fields.map((field) => [field, { type: String, default: '' }])), { _id: true })

const resumeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  portfolioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Portfolio', required: true, index: true },
  personalInfo: {
    fullName: { type: String, default: '' }, title: { type: String, default: '' }, email: { type: String, default: '' },
    phone: { type: String, default: '' }, location: { type: String, default: '' }, website: { type: String, default: '' },
  },
  socialLinks: { github: { type: String, default: '' }, linkedin: { type: String, default: '' } },
  summary: { type: String, default: '', maxlength: 6000 },
  experience: [entrySchema(['jobRole', 'companyName', 'location', 'duration', 'description'])],
  education: [entrySchema(['degree', 'college', 'university', 'startYear', 'graduationYear', 'grade', 'description'])],
  projects: [new mongoose.Schema({
    title: { type: String, default: '' }, description: { type: String, default: '' }, technologies: [{ type: String }],
    githubUrl: { type: String, default: '' }, liveDemoUrl: { type: String, default: '' },
  })],
  skills: [new mongoose.Schema({ name: { type: String, default: '' }, category: { type: String, default: '' } })],
  certifications: [entrySchema(['certificateName', 'issuingOrganization', 'date', 'credentialUrl'])],
  achievements: [entrySchema(['title', 'description', 'date'])],
  languages: [entrySchema(['name', 'proficiency'])],
  customSections: [new mongoose.Schema({
    title: { type: String, required: true, trim: true, maxlength: 80 },
    entries: [new mongoose.Schema({ title: { type: String, default: '', maxlength: 120 }, content: { type: String, default: '', maxlength: 3000 } })],
  })],
  templateStyle: { type: String, enum: ['modern', 'classic', 'minimal'], default: 'modern' },
  sectionOrder: { type: [String], default: ['summary', 'experience', 'education', 'projects', 'skills', 'certifications', 'achievements', 'languages', 'customSections'] },
  sectionVisibility: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true })

resumeSchema.index({ userId: 1, portfolioId: 1 }, { unique: true })

export default mongoose.model('Resume', resumeSchema)

