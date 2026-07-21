/**
 * odoo.js — Thin Odoo 17 REST + JSON-RPC client
 *
 * Reads config from Vite env vars:
 *   VITE_ODOO_URL      — base URL of the Odoo instance (e.g. http://localhost:8017)
 *   VITE_ODOO_DB       — database name (e.g. ris_17)
 *   VITE_ODOO_USER     — login username (e.g. admin)
 *   VITE_ODOO_PASSWORD — login password
 *
 * In dev, the Vite proxy forwards /api/* and /web/* to VITE_ODOO_URL
 * so the browser always calls the same origin (no CORS).
 * In production, point your reverse-proxy (nginx etc.) similarly.
 */

const ODOO_URL = import.meta.env.VITE_ODOO_URL || 'http://localhost:8017'
const ODOO_DB = import.meta.env.VITE_ODOO_DB || 'ris_17'
const ODOO_USER = import.meta.env.VITE_ODOO_USER || 'admin'
const ODOO_PASSWORD = import.meta.env.VITE_ODOO_PASSWORD || 'admin'

// Session state — persisted in memory while the tab is open
let _sessionId = null
let _authPromise = null // singleton so we don't double-authenticate

// ─── JSON-RPC helper ──────────────────────────────────────────────────────────

async function jsonRpc(path, method, params = {}) {
  const body = JSON.stringify({
    jsonrpc: '2.0',
    method: 'call',
    id: Date.now(),
    params,
  })

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
  if (_sessionId) {
    headers['X-Openerp-Session-Id'] = _sessionId
  }

  // In dev, Vite proxy rewrites to ODOO_URL; use relative path.
  // In prod builds, use the absolute URL from env.
  const url = import.meta.env.DEV ? path : `${ODOO_URL}${path}`

  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include', // send/receive session cookies
    headers,
    body,
  })

  if (!response.ok) {
    throw new Error(`Odoo JSON-RPC ${path} failed: ${response.status} ${response.statusText}`)
  }

  const json = await response.json()

  if (json.error) {
    throw new Error(`Odoo error: ${json.error.data?.message || json.error.message}`)
  }

  return json.result
}

// ─── Session Authentication ───────────────────────────────────────────────────

/**
 * Authenticates with Odoo and stores the session_id.
 * Only called once per page load; subsequent calls return the cached promise.
 */
export async function authenticate() {
  if (_sessionId) return _sessionId
  if (_authPromise) return _authPromise

  _authPromise = (async () => {
    const result = await jsonRpc('/web/session/authenticate', 'call', {
      db: ODOO_DB,
      login: ODOO_USER,
      password: ODOO_PASSWORD,
    })

    if (!result || !result.uid) {
      throw new Error('Odoo authentication failed — check VITE_ODOO_USER / VITE_ODOO_PASSWORD')
    }

    // Odoo 17 uses HttpOnly cookie sessions; session_id may not appear in the JSON body.
    _sessionId = result.session_id || result.uid?.toString() || 'cookie'
    console.info('[odoo] Authenticated as', result.name, '(uid:', result.uid, ')')
    return _sessionId
  })()

  return _authPromise
}

/**
 * Returns the current session id (or empty string before auth).
 */
export function getSessionId() {
  return _sessionId || ''
}

// ─── REST API helper ──────────────────────────────────────────────────────────

/**
 * Fetches any Odoo REST endpoint.
 * Automatically ensures the session is authenticated first.
 *
 * @param {string} path   — e.g. '/api/ris/managements'
 * @param {RequestInit} options — standard fetch options
 * @returns {Promise<any>} parsed JSON body
 */
export async function odooFetch(path, options = {}) {
  // Ensure we have a valid session before any REST call
  await authenticate()

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers || {}),
  }
  if (_sessionId) {
    headers['X-Openerp-Session-Id'] = _sessionId
  }

  // Relative path in dev (Vite proxy), absolute in prod
  const url = import.meta.env.DEV ? path : `${ODOO_URL}${path}`

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Odoo REST ${path} → ${response.status} ${response.statusText}${text ? ': ' + text : ''}`)
  }

  // Unwrap the {ok, data} envelope produced by ris_api.py.
  // Non-JSON endpoints (binary downloads) are returned as text.
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    return response.text()
  }

  const payload = await response.json()

  if (payload && typeof payload === 'object') {
    if (payload.ok === false) {
      throw new Error(payload.error || 'Odoo API error')
    }
    // Standard ris_api envelope: { ok: true, data: <actual payload> }
    if ('data' in payload) {
      return payload.data
    }
  }

  return payload
}

/**
 * Uploads a file to an Odoo binary endpoint.
 * Uses FormData instead of JSON.
 */
export async function odooUpload(path, file) {
  await authenticate()

  const formData = new FormData()
  formData.append('file', file)

  const headers = {}
  if (_sessionId) {
    headers['X-Openerp-Session-Id'] = _sessionId
  }

  const url = import.meta.env.DEV ? path : `${ODOO_URL}${path}`

  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Odoo upload to ${path} failed: ${response.status} ${response.statusText}`)
  }

  return response.json()
}
