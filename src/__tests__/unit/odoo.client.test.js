/**
 * Unit tests for src/lib/odoo.js
 *
 * We test the pure HTTP-handling logic: envelope unwrapping, error surfaces,
 * and the authenticate singleton — all without a real Odoo server.
 * fetch is replaced with vi.fn() per test.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── helpers ──────────────────────────────────────────────────────────────────

/** Build a Response-like object that fetch would return. */
function makeResponse(body, { status = 200, contentType = 'application/json' } = {}) {
  const json = typeof body === 'string' ? body : JSON.stringify(body)
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: { get: (h) => (h === 'content-type' ? contentType : null) },
    json: async () => JSON.parse(json),
    text: async () => json,
  }
}

/** Stub globalThis.fetch to return the given response. */
function stubFetch(response) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(response)
}

// ── module isolation ──────────────────────────────────────────────────────────
// We need a fresh module for each describe block so session state is clean.

async function freshOdoo() {
  vi.resetModules()
  // Stub import.meta.env.DEV = true so odooFetch uses relative paths
  vi.stubEnv('DEV', 'true')
  return import('../../lib/odoo.js')
}

// ── 1. envelope unwrapping ────────────────────────────────────────────────────

describe('odooFetch — envelope unwrapping', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('returns data when envelope has {ok:true, data:[...]}', async () => {
    const { odooFetch, authenticate } = await freshOdoo()

    // stub authenticate so it doesn't actually call /web/session/authenticate
    vi.spyOn(globalThis, 'fetch')
      // first call = authenticate
      .mockResolvedValueOnce(
        makeResponse({ jsonrpc: '2.0', result: { uid: 1, name: 'Admin', session_id: 'abc' } })
      )
      // second call = the actual API
      .mockResolvedValueOnce(
        makeResponse({ ok: true, data: [{ id: 1, name: 'Alice' }] })
      )

    const result = await odooFetch('/api/ris/patients')
    expect(result).toEqual([{ id: 1, name: 'Alice' }])
  })

  it('throws when envelope has {ok:false, error:"..."}', async () => {
    const { odooFetch } = await freshOdoo()

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        makeResponse({ jsonrpc: '2.0', result: { uid: 1, name: 'Admin', session_id: 'abc' } })
      )
      .mockResolvedValueOnce(
        makeResponse({ ok: false, error: 'Record not found.' })
      )

    await expect(odooFetch('/api/ris/patients/999')).rejects.toThrow('Record not found.')
  })

  it('returns payload as-is when there is no data key', async () => {
    const { odooFetch } = await freshOdoo()

    const raw = { uid: 1, login: 'admin' }
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        makeResponse({ jsonrpc: '2.0', result: { uid: 1, name: 'Admin', session_id: 'abc' } })
      )
      .mockResolvedValueOnce(makeResponse(raw))

    const result = await odooFetch('/api/ris/session')
    expect(result).toEqual(raw)
  })

  it('returns text for non-JSON content-type', async () => {
    const { odooFetch } = await freshOdoo()

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        makeResponse({ jsonrpc: '2.0', result: { uid: 1, name: 'Admin', session_id: 'abc' } })
      )
      .mockResolvedValueOnce(makeResponse('plain text', { contentType: 'text/plain' }))

    const result = await odooFetch('/some/text/endpoint')
    expect(result).toBe('plain text')
  })

  it('throws on HTTP 4xx with status text', async () => {
    const { odooFetch } = await freshOdoo()

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        makeResponse({ jsonrpc: '2.0', result: { uid: 1, name: 'Admin', session_id: 'abc' } })
      )
      .mockResolvedValueOnce(makeResponse('Not found', { status: 404, contentType: 'text/html' }))

    await expect(odooFetch('/api/ris/patients/99999')).rejects.toThrow('404')
  })

  it('unwraps nested data correctly for lookups response', async () => {
    const { odooFetch } = await freshOdoo()

    const lookupsPayload = {
      ok: true,
      data: {
        users: [{ id: 1, name: 'Admin' }],
        insuranceCompanies: [],
        categories: [],
      },
    }

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        makeResponse({ jsonrpc: '2.0', result: { uid: 1, name: 'Admin', session_id: 'abc' } })
      )
      .mockResolvedValueOnce(makeResponse(lookupsPayload))

    const result = await odooFetch('/api/ris/lookups')
    expect(result).toEqual(lookupsPayload.data)
    expect(result.users).toHaveLength(1)
  })
})

// ── 2. authenticate singleton ─────────────────────────────────────────────────

describe('authenticate — singleton behaviour', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('calls /web/session/authenticate exactly once even with parallel calls', async () => {
    const { authenticate } = await freshOdoo()

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      makeResponse({ jsonrpc: '2.0', result: { uid: 1, name: 'Admin', session_id: 'tok' } })
    )

    await Promise.all([authenticate(), authenticate(), authenticate()])
    // The JSON-RPC auth call should fire exactly once
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('throws when Odoo returns no uid', async () => {
    const { authenticate } = await freshOdoo()

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      makeResponse({ jsonrpc: '2.0', result: { uid: null } })
    )

    await expect(authenticate()).rejects.toThrow('authentication failed')
  })
})

// ── 3. odooUpload ─────────────────────────────────────────────────────────────

describe('odooUpload — FormData upload', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('sends a POST with FormData (not JSON) and returns parsed JSON', async () => {
    const { odooUpload } = await freshOdoo()

    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        makeResponse({ jsonrpc: '2.0', result: { uid: 1, name: 'Admin', session_id: 'abc' } })
      )
      .mockResolvedValueOnce(
        makeResponse({ ok: true, data: { id: 5, hasCard: true } })
      )

    const file = new File(['(image)'], 'card.png', { type: 'image/png' })
    const result = await odooUpload('/api/ris/managements/5/binary/card', file)

    // second call should NOT have Content-Type: application/json
    const uploadCall = fetchSpy.mock.calls[1]
    const uploadBody = uploadCall[1].body
    expect(uploadBody).toBeInstanceOf(FormData)
    expect(result).toEqual({ ok: true, data: { id: 5, hasCard: true } })
  })
})
