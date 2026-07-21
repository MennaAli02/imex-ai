/**
 * Integration helper — shared Odoo HTTP client for all integration tests.
 *
 * Uses the same .env variables as the React app.
 * Run with: npm run test:integration
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

function parseDotEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env'), 'utf8')
    const out = {}
    for (const line of raw.split('\n')) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const eq = t.indexOf('=')
      if (eq === -1) continue
      out[t.slice(0, eq).trim()] = t.slice(eq + 1).trim()
    }
    return out
  } catch {
    return {}
  }
}

const env = parseDotEnv()

export const ODOO_URL = env.VITE_ODOO_URL || 'http://localhost:8017'
export const ODOO_DB = env.VITE_ODOO_DB || 'ris_17'
export const ODOO_USER = env.VITE_ODOO_USER || 'admin'
export const ODOO_PASSWORD = env.VITE_ODOO_PASSWORD || 'admin'

/** Shared session state across all integration suites (single-fork mode). */
let _sessionCookie = null

/**
 * Authenticate with Odoo. Called in beforeAll of the first suite;
 * subsequent suites reuse _sessionCookie.
 */
export async function odooAuth() {
  if (_sessionCookie) return _sessionCookie

  const res = await fetch(`${ODOO_URL}/web/session/authenticate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      id: 1,
      params: { db: ODOO_DB, login: ODOO_USER, password: ODOO_PASSWORD },
    }),
    credentials: 'include',
  })

  // Capture Set-Cookie header for reuse
  const setCookie = res.headers.get('set-cookie')
  if (setCookie) _sessionCookie = setCookie

  const json = await res.json()
  if (!json.result?.uid) {
    throw new Error(`Odoo auth failed: ${JSON.stringify(json.error || json.result)}`)
  }
  console.log(`  ✓ Authenticated as ${json.result.name} (uid ${json.result.uid})`)
  return _sessionCookie
}

/**
 * Thin REST client for integration tests.
 * Automatically authenticates and unwraps the {ok, data} envelope.
 */
export async function api(method, path, body) {
  await odooAuth()

  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' }
  if (_sessionCookie) headers['Cookie'] = _sessionCookie

  const res = await fetch(`${ODOO_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const text = await res.text()
  let payload
  try { payload = JSON.parse(text) } catch { payload = text }

  if (typeof payload === 'object' && payload !== null) {
    if (payload.ok === false) throw new Error(`API error on ${method} ${path}: ${payload.error}`)
    if ('data' in payload) return payload.data
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${method} ${path}: ${text}`)
  return payload
}

export const get = (path, params) => {
  const qs = params ? '?' + new URLSearchParams(params).toString() : ''
  return api('GET', path + qs)
}
export const post = (path, body) => api('POST', path, body)
export const put = (path, body) => api('PUT', path, body)
export const del = (path) => api('DELETE', path)

/** Unique test prefix so test records are identifiable in the DB. */
export const T = '[TEST]'
