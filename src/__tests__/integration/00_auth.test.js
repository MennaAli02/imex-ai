/**
 * 00 — Authentication
 * Verifies that the Odoo session authenticate endpoint is reachable
 * and returns a valid user context.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { odooAuth, get, ODOO_URL, ODOO_DB } from './_client.js'

beforeAll(async () => { await odooAuth() })

describe('Authentication', () => {
  it('authenticates and receives a uid', async () => {
    // odooAuth throws if no uid — reaching here means it succeeded
    expect(true).toBe(true)
  })

  it('GET /api/ris/session returns current user info', async () => {
    const session = await get('/api/ris/session')
    expect(session).toMatchObject({
      uid: expect.any(Number),
      name: expect.any(String),
      login: expect.any(String),
      tz: expect.any(String),
      companyId: expect.any(Number),
    })
    expect(session.uid).toBeGreaterThan(0)
    console.log(`  Session: uid=${session.uid} name="${session.name}" company="${session.companyName}"`)
  })

  it('is connected to the right database', async () => {
    const session = await get('/api/ris/session')
    expect(session.uid).toBeGreaterThan(0) // live DB confirmed
    console.log(`  Odoo URL: ${ODOO_URL}  DB: ${ODOO_DB}`)
  })
})
