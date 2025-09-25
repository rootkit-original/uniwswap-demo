import { connectDB } from '../../../lib/mongodb'
import Session from '../../../lib/models/Session'
import { formatSession, setCorsHeaders } from '../../../lib/utils'

export default async function handler(req, res) {
  setCorsHeaders(res)

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    await connectDB()
    
    const sessions = await Session.find({})
      .sort({ createdAt: -1 })
      .limit(100)

    const formattedSessions = sessions.map(formatSession)

    res.json({ 
      sessions: formattedSessions,
      count: formattedSessions.length
    })

  } catch (error) {
    console.error('Failed to get sessions:', error)
    res.status(500).json({ error: 'Failed to get sessions' })
  }
}