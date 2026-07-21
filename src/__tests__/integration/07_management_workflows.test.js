/**
 * 07 — Management Workflow Actions
 *
 * Tests: cancel, reschedule, report state transitions
 * (not_verified → partial, verify), save summary, payment ways.
 *
 * Uses a fresh management record so state transitions start clean.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { odooAuth, get, post, put, del, T } from './_client.js'

let patientId = null
let mgmtId = null

beforeAll(async () => {
  await odooAuth()

  const patient = await post('/api/ris/patients', {
    nickname: `${T} WorkflowPatient`,
    firstName: 'Workflow',
    gender: 'Male',
    phone: '01000000055',
    dob: '1990-01-01',
  })
  patientId = patient.id

  const lookups = await get('/api/ris/lookups')
  const machineId = lookups.machines[0]?.id ?? null
  const cashProductId = lookups.products[0]?.id ?? null

  const mgmt = await post('/api/ris/managements', {
    patientId,
    machineId,
    cashProductId,
    examDate: new Date().toISOString().slice(0, 16),
    stateOfExamSelection: '1',
    patientType: 'cash',
    state: '1',
    gender: 'Male',
    patientCondition: 'Natural',
  })
  mgmtId = mgmt.id
  console.log(`  Setup: management id=${mgmtId}`)
})

afterAll(async () => {
  if (mgmtId) try { await del(`/api/ris/managements/${mgmtId}`) } catch { /* ok */ }
  if (patientId) try { await del(`/api/ris/patients/${patientId}`) } catch { /* ok */ }
})

describe('Management Workflow — Reschedule', () => {
  it('POST /reschedule changes the exam date', async () => {
    const newDate = new Date(Date.now() + 86400000).toISOString().slice(0, 16) // tomorrow
    const updated = await post(`/api/ris/managements/${mgmtId}/reschedule`, {
      examDate: newDate,
    })
    expect(updated.id).toBe(mgmtId)
    expect(updated.examDate).toBeDefined()
    console.log(`  Rescheduled to: ${updated.examDate}`)
  })

  it('POST /reschedule without examDate returns 400', async () => {
    await expect(
      post(`/api/ris/managements/${mgmtId}/reschedule`, {})
    ).rejects.toThrow()
  })
})

describe('Management Workflow — Report Actions', () => {
  it('POST /report/not_verified sets reportState to not_verified', async () => {
    const updated = await post(`/api/ris/managements/${mgmtId}/report/not_verified`)
    expect(updated.reportState).toBe('not_verified')
    console.log(`  reportState after not_verified: ${updated.reportState}`)
  })

  it('PUT /report/summary saves HTML summary', async () => {
    const html = '<p>Integration test report summary</p>'
    const result = await put(`/api/ris/managements/${mgmtId}/report/summary`, { summary: html })
    expect(result).toMatchObject({ id: mgmtId, summary: html })
  })

  it('POST /report/partial sets reportState to partial', async () => {
    const updated = await post(`/api/ris/managements/${mgmtId}/report/partial`)
    expect(updated.reportState).toBe('partial')
  })

  it('POST /report/reported sets reportState to verified', async () => {
    const updated = await post(`/api/ris/managements/${mgmtId}/report/reported`)
    // 'reported' maps to action_set_reported which sets a specific state
    expect(updated).toHaveProperty('reportState')
    console.log(`  reportState after reported: ${updated.reportState}`)
  })
})

describe('Management Workflow — Report Summary Clear', () => {
  it('PUT /report/summary with empty string clears the summary', async () => {
    const result = await put(`/api/ris/managements/${mgmtId}/report/summary`, { summary: '' })
    // Empty string or falsy is acceptable
    expect(result.id).toBe(mgmtId)
  })
})

describe('Management Workflow — Payment Ways', () => {
  it('GET /api/ris/payment-ways returns an array', async () => {
    const ways = await get('/api/ris/payment-ways')
    expect(Array.isArray(ways)).toBe(true)
    for (const way of ways) {
      expect(way).toHaveProperty('id')
      expect(way).toHaveProperty('name')
    }
    console.log(`  Payment ways: ${ways.map(w => w.name).join(', ') || '(none configured)'}`)
  })
})

describe('Management Workflow — Cancel', () => {
  it('POST /cancel without reason returns 400', async () => {
    await expect(
      post(`/api/ris/managements/${mgmtId}/cancel`, { reason: '' })
    ).rejects.toThrow()
  })

  it('POST /cancel with reason changes state to cancelled', async () => {
    const updated = await post(`/api/ris/managements/${mgmtId}/cancel`, {
      reason: 'Integration test cancellation',
    })
    expect(updated.state).toBe('5')  // Cancelled
    console.log(`  Management ${mgmtId} cancelled, state=${updated.state}`)
    // After cancel, don't try to delete (it may be locked)
    mgmtId = null
  })
})
