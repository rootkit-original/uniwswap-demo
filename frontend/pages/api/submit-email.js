import { connectDB } from '../../../lib/mongodb'
import Session from '../../../lib/models/Session'
import pusher from '../../../lib/pusher'
import { validateEmail, formatSession, setCorsHeaders } from '../../../lib/utils'

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
    
    const { sessionId, email } = req.body

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' })
    }

    if (!email || !validateEmail(email)) {
      return res.status(400).json({ error: 'A valid email address is required' })
    }

    const session = await Session.findByIdAndUpdate(
      sessionId,
      { 
        email: email.trim(),
        status: 'awaiting-password',
        emailSubmittedAt: new Date()
      },
      { new: true }
    )

    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    // Notificar usuário via Pusher
    await pusher.trigger(`session-${sessionId}`, 'request-password', {
      sessionId,
      status: session.status
    })

    // Atualizar dashboard admin
    await pusher.trigger('admin-channel', 'session-updated', formatSession(session))

    res.json({ success: true, session: formatSession(session) })

  } catch (error) {
    console.error('Failed to submit email:', error)
    res.status(500).json({ error: 'Failed to submit email' })
  }
}