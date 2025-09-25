import { connectDB } from '../../lib/mongodb'
import Session from '../../lib/models/Session'
import pusher from '../../lib/pusher'
import { formatSession, setCorsHeaders } from '../../lib/utils'

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
    
    const { sessionId, password } = req.body

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' })
    }

    if (!password || password.length < 1) {
      return res.status(400).json({ error: 'Password is required' })
    }

    const session = await Session.findByIdAndUpdate(
      sessionId,
      { 
        password: password,
        status: 'finalized',
        passwordSubmittedAt: new Date()
      },
      { new: true }
    )

    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    // Notificar usuário via Pusher
    await pusher.trigger(`session-${sessionId}`, 'finalized', {
      sessionId,
      status: session.status
    })

    // Atualizar dashboard admin
    await pusher.trigger('admin-channel', 'session-updated', formatSession(session))

    res.json({ success: true, session: formatSession(session) })

  } catch (error) {
    console.error('Failed to submit password:', error)
    res.status(500).json({ error: 'Failed to submit password' })
  }
}