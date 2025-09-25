const trimTrailingSlash = (value?: string) => {
  if (!value) {
    return ''
  }

  return value.endsWith('/') ? value.slice(0, -1) : value
}

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value)

const combineWithOrigin = (value: string) => {
  const trimmed = trimTrailingSlash(value)
  if (!trimmed) {
    return ''
  }

  if (isAbsoluteUrl(trimmed)) {
    return trimmed
  }

  if (!runtimeWindow) {
    return trimmed
  }

  const prefix = trimmed.startsWith('/') ? '' : '/'
  return trimTrailingSlash(`${runtimeWindow.location.origin}${prefix}${trimmed}`)
}

const getWindowObject = () => {
  if (typeof window === 'undefined') {
    return undefined
  }
  return window
}

const runtimeWindow = getWindowObject()

const inferDefaultApiBase = () => {
  if (!runtimeWindow) return ''
  return runtimeWindow.location.hostname === 'localhost' ? 'http://localhost:3331' : ''
}

const rawApiBase = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL) || inferDefaultApiBase()

export const API_BASE_URL = combineWithOrigin(rawApiBase)

const inferSocketBase = () => {
  const socketEnv = trimTrailingSlash(import.meta.env.VITE_SOCKET_URL)
  if (socketEnv) {
    return combineWithOrigin(socketEnv)
  }

  if (rawApiBase && isAbsoluteUrl(rawApiBase)) {
    return combineWithOrigin(rawApiBase)
  }

  if (runtimeWindow) {
    return trimTrailingSlash(runtimeWindow.location.origin)
  }

  return ''
}

export const SOCKET_BASE_URL = inferSocketBase()

export const buildApiUrl = (path: string) => {
  if (!path.startsWith('/')) {
    throw new Error('buildApiUrl expects an absolute path starting with "/"')
  }

  if (API_BASE_URL) {
    return `${API_BASE_URL}${path}`
  }

  if (runtimeWindow) {
    return `${runtimeWindow.location.origin}${path}`
  }

  return path
}
