import mongoose from 'mongoose'

const portfolioVersionSchema = new mongoose.Schema(
  {
    portfolioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Portfolio',
      required: true,
      index: true,
    },
    versionNumber: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      default: 'Version Snapshot',
    },
    snapshot: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

portfolioVersionSchema.index({ portfolioId: 1, versionNumber: -1 })

export default mongoose.model('PortfolioVersion', portfolioVersionSchema)
