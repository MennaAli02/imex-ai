/**
 * 02 — Patients CRUD
 * Full create → read → search → update → delete round-trip on ris.patient.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { odooAuth, get, post, put, del, T } from './_client.js'

let createdId = null

beforeAll(async () => { await odooAuth() })

afterAll(async () => {
  if (createdId) {
    try { await del(`/api/ris/patients/${createdId}`) } catch { /* already deleted */ }
  }
})

describe('Patients — Create', () => {
  it('POST /api/ris/patients creates a patient and returns camelCase fields', async () => {
    const payload = {
      nickname: `${T} TestNick`,
      firstName: `${T} First`,
      middleName: 'Mid',
      lastName: 'Last',
      gender: 'Male',
      phone: '01000000099',
      dob: '1990-05-15',
      natId: 'TEST-NAT-001',
      address: '123 Test St',
    }
    const patient = await post('/api/ris/patients', payload)

    expect(patient).toHaveProperty('id')
    expect(patient.id).toBeGreaterThan(0)
    expect(patient.nickname).toBe(payload.nickname)
    expect(patient.firstName).toBe(payload.firstName)
    expect(patient.gender).toBe('Male')
    expect(patient).toHaveProperty('pid')   // server-assigned sequence
    expect(patient).toHaveProperty('age')   // computed

    createdId = patient.id
    console.log(`  Created patient id=${createdId} pid="${patient.pid}"`)
  })
})

describe('Patients — Read', () => {
  it('GET /api/ris/patients/:id returns the created patient', async () => {
    const patient = await get(`/api/ris/patients/${createdId}`)
    expect(patient.id).toBe(createdId)
    expect(patient.nickname).toContain(T)
    expect(patient.phone).toBe('01000000099')
  })

  it('GET /api/ris/patients returns a list including the new patient', async () => {
    const list = await get('/api/ris/patients')
    const found = list.find(p => p.id === createdId)
    expect(found).toBeDefined()
    console.log(`  Total patients: ${list.length}`)
  })

  it('GET /api/ris/patients?search= finds the patient by nickname', async () => {
    const results = await get('/api/ris/patients', { search: 'TestNick' })
    const found = Array.isArray(results)
      ? results.find(p => p.id === createdId)
      : null
    expect(found).toBeDefined()
  })

  it('GET /api/ris/patients/:id returns 400 for non-existent id', async () => {
    await expect(get('/api/ris/patients/9999999')).rejects.toThrow()
  })
})

describe('Patients — Update', () => {
  it('PUT /api/ris/patients/:id updates allowed fields', async () => {
    const updated = await put(`/api/ris/patients/${createdId}`, {
      phone: '01099888777',
      address: 'Updated Address',
    })
    expect(updated.phone).toBe('01099888777')
    expect(updated.address).toBe('Updated Address')
    // read-only fields still present
    expect(updated).toHaveProperty('pid')
  })

  it('read-only fields (pid, age) are not overwritten by PUT', async () => {
    const before = await get(`/api/ris/patients/${createdId}`)
    await put(`/api/ris/patients/${createdId}`, { pid: 'HACKED', age: 999 })
    const after = await get(`/api/ris/patients/${createdId}`)
    expect(after.pid).toBe(before.pid)  // unchanged
  })
})

describe('Patients — Delete', () => {
  it('DELETE /api/ris/patients/:id removes the patient', async () => {
    const result = await del(`/api/ris/patients/${createdId}`)
    expect(result).toMatchObject({ id: createdId, deleted: true })

    // Confirm it's really gone
    await expect(get(`/api/ris/patients/${createdId}`)).rejects.toThrow()
    createdId = null  // prevent afterAll double-delete
  })
})
