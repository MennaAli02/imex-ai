/**
 * 04 — Technicians CRUD
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { odooAuth, get, post, put, del, T } from './_client.js'

let createdId = null

beforeAll(async () => { await odooAuth() })
afterAll(async () => {
  if (createdId) try { await del(`/api/ris/technicians/${createdId}`) } catch { /* ok */ }
})

describe('Technicians — Create', () => {
  it('POST /api/ris/technicians creates a technician', async () => {
    const tech = await post('/api/ris/technicians', {
      partnerName: `${T} Tech Integration`,
      specialization: 'CT',
      degree: 'BSc',
      phone: '0500000077',
      email: 'tech.integration@example.com',
      gender: 'female',
      dob: '1995-06-20',
    })
    expect(tech.id).toBeGreaterThan(0)
    expect(tech.partnerName).toContain(T)
    createdId = tech.id
    console.log(`  Created technician id=${createdId}`)
  })
})

describe('Technicians — Read', () => {
  it('GET /api/ris/technicians/:id returns the technician', async () => {
    const tech = await get(`/api/ris/technicians/${createdId}`)
    expect(tech.specialization).toBe('CT')
    expect(tech.gender).toBe('female')
  })

  it('GET /api/ris/technicians list includes the new technician', async () => {
    const list = await get('/api/ris/technicians')
    expect(list.find(t => t.id === createdId)).toBeDefined()
  })
})

describe('Technicians — Update', () => {
  it('PUT /api/ris/technicians/:id updates phone', async () => {
    const updated = await put(`/api/ris/technicians/${createdId}`, { phone: '0500000011' })
    expect(updated.phone).toBe('0500000011')
  })
})

describe('Technicians — Delete', () => {
  it('DELETE /api/ris/technicians/:id removes the record', async () => {
    const result = await del(`/api/ris/technicians/${createdId}`)
    expect(result.deleted).toBe(true)
    createdId = null
  })
})
