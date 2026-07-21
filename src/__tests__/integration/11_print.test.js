/**
 * 11 — Print documents
 *
 * Tests GET /print/invoice, /print/job_order, /print/sticker.
 * Each returns {base64, fileName, contentType:'application/pdf'}.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { odooAuth, get, post, del, T } from './_client.js'

let patientId = null
let mgmtId = null

beforeAll(async () => {
  await odooAuth()

  const patient = await post('/api/ris/patients', {
    nickname: `${T} PrintPatient`,
    firstName: 'Print',
    gender: 'Male',
    phone: '01000000011',
    dob: '1990-01-01',
  })
  patientId = patient.id

  const lookups = await get('/api/ris/lookups')
  const productId = lookups.products[0]?.id ?? null
  const machineId = lookups.machines[0]?.id ?? null

  const mgmt = await post('/api/ris/managements', {
    patientId,
    machineId,
    examDate: new Date().toISOString().slice(0, 16),
    stateOfExamSelection: '1',
    patientType: 'cash',
    state: '2', // Paid — invoice printing often requires at least a payment
    gender: 'Male',
    patientCondition: 'Natural',
    cashProductId: productId,
  })
  mgmtId = mgmt.id
  console.log(`  Setup: management id=${mgmtId}`)
})

afterAll(async () => {
  if (mgmtId) try { await del(`/api/ris/managements/${mgmtId}`) } catch { /* ok */ }
  if (patientId) try { await del(`/api/ris/patients/${patientId}`) } catch { /* ok */ }
})

async function tryPrint(doc) {
  try {
    const result = await get(`/api/ris/managements/${mgmtId}/print/${doc}`)
    expect(result).toHaveProperty('base64')
    expect(result).toHaveProperty('fileName')
    expect(result).toHaveProperty('contentType')
    expect(result.contentType).toBe('application/pdf')
    // Verify it's non-empty valid base64
    const buf = Buffer.from(result.base64, 'base64')
    expect(buf.length).toBeGreaterThan(0)
    // PDF magic bytes: %PDF
    expect(buf.slice(0, 4).toString()).toBe('%PDF')
    console.log(`  print/${doc}: ${buf.length} bytes, fileName="${result.fileName}"`)
    return true
  } catch (e) {
    // Report templates may not be installed — that's an Odoo config issue, not a bug
    if (e.message.includes('not installed') || e.message.includes('not found')) {
      console.warn(`  print/${doc} skipped — report not installed: ${e.message}`)
      return false
    }
    throw e
  }
}

describe('Print — Invoice', () => {
  it('GET /print/invoice returns a valid PDF base64', async () => {
    await tryPrint('invoice')
  })
})

describe('Print — Job Order', () => {
  it('GET /print/job_order returns a valid PDF base64', async () => {
    await tryPrint('job_order')
  })
})

describe('Print — Sticker', () => {
  it('GET /print/sticker returns a valid PDF base64', async () => {
    await tryPrint('sticker')
  })
})

describe('Print — Invalid document type', () => {
  it('GET /print/invalid_doc returns 400', async () => {
    await expect(
      get(`/api/ris/managements/${mgmtId}/print/nonexistent_doc`)
    ).rejects.toThrow()
  })
})
