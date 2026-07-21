/**
 * 03 — Doctors CRUD
 * Full round-trip on ris.doctor (has a partner_field resolution).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { odooAuth, get, post, put, del, T } from './_client.js'

let createdId = null

beforeAll(async () => { await odooAuth() })

afterAll(async () => {
  if (createdId) {
    try { await del(`/api/ris/doctors/${createdId}`) } catch { /* ok */ }
  }
})

describe('Doctors — Create', () => {
  it('POST /api/ris/doctors creates a doctor with partner resolution', async () => {
    const doc = await post('/api/ris/doctors', {
      partnerName: `${T} Dr. Integration Test`,
      specialization: 'Radiology',
      degree: 'MD',
      phone: '0500000088',
      email: 'integration.test@example.com',
      doctorType: 'doctor',
      gender: 'male',
      dob: '1980-01-01',
    })

    expect(doc.id).toBeGreaterThan(0)
    expect(doc.partnerName).toContain(T)
    expect(doc.specialization).toBe('Radiology')
    expect(doc.doctorType).toBe('doctor')

    createdId = doc.id
    console.log(`  Created doctor id=${createdId} partnerName="${doc.partnerName}"`)
  })
})

describe('Doctors — Read', () => {
  it('GET /api/ris/doctors returns list with new doctor', async () => {
    const list = await get('/api/ris/doctors')
    expect(list.find(d => d.id === createdId)).toBeDefined()
    console.log(`  Total doctors: ${list.length}`)
  })

  it('GET /api/ris/doctors/:id returns the doctor', async () => {
    const doc = await get(`/api/ris/doctors/${createdId}`)
    expect(doc.id).toBe(createdId)
    expect(doc.email).toBe('integration.test@example.com')
    expect(doc).toHaveProperty('partnerId')
    expect(doc).toHaveProperty('doctorTemplateIds')
  })
})

describe('Doctors — Update', () => {
  it('PUT /api/ris/doctors/:id updates degree', async () => {
    const updated = await put(`/api/ris/doctors/${createdId}`, { degree: 'PhD' })
    expect(updated.degree).toBe('PhD')
  })
})

describe('Doctors — Delete', () => {
  it('DELETE /api/ris/doctors/:id removes the doctor', async () => {
    const result = await del(`/api/ris/doctors/${createdId}`)
    expect(result.deleted).toBe(true)
    createdId = null
  })
})
