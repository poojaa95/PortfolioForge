import mongoose from 'mongoose'

const analyticsSchema = new mongoose.Schema(
  {
    portfolioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Portfolio',
      required: true,
      index: true,
    },
    event: {
      type: String,
      enum: ['view', 'project_click', 'contact_click', 'resume_download'],
      default: 'view',
      index: true,
    },
    visitorIp: {
      type: String,
      default: 'anonymous',
    },
    userAgent: {
      type: String,
      default: '',
    },
    device: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'unknown'],
      default: 'desktop',
    },
    referrer: {
      type: String,
      default: 'direct',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

analyticsSchema.index({ portfolioId: 1, createdAt: -1 })

export default mongoose.model('Analytics', analyticsSchema)
