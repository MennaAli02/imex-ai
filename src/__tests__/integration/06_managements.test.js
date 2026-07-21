/**
 * 06 — Managements CRUD + onchange helpers
 *
 * ris.management is the core model; its serializer is the most complex.
 * Tests cover: create, read (full shape with line arrays), partial update,
 * onchange/patient, onchange/product.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { odooAuth, get, post, put, del, T } from './_client.js'

// We'll create a patient first, then a management referencing it.
let patientId = null
let managementId = null

// Grab a product from lookups to use as cashProductId
let productId = null
let lookups = null

beforeAll(async () => {
  await odooAuth()

  // Create a disposable patient
  const patient = await post('/api/ris/patients', {
    nickname: `${T} MgmtPatient`,
    firstName: 'Mgmt',
    lastName: 'Patient',
    gender: 'Male',
    phone: '01000000060',
    dob: '1990-01-01',
  })
  patientId = patient.id

  // Grab lookups for valid IDs
  lookups = await get('/api/ris/lookups')
  productId = lookups.products[0]?.id ?? null
})

afterAll(async () => {
  if (managementId) try { await del(`/api/ris/managements/${managementId}`) } catch { /* ok */ }
  if (patientId) try { await del(`/api/ris/patients/${patientId}`) } catch { /* ok */ }
})

describe('Managements — Create', () => {
  it('POST /api/ris/managements creates a management record', async () => {
    const machineId = lookups.machines[0]?.id ?? null
    const payload = {
      patientId,
      machineId,
      examDate: new Date().toISOString().slice(0, 16),
      stateOfExamSelection: '1',
      patientType: 'cash',
      patientCondition: 'Natural',
      gender: 'Male',
      state: '1',
      cashProductId: productId,
    }

    let mgmt
    try {
      mgmt = await post('/api/ris/managements', payload)
    } catch (err) {
      console.log('--- ERROR IN POST /managements ---')
      console.log(err.message)
      console.log('-----------------------------------')
      throw err
    }
    expect(mgmt.id).toBeGreaterThan(0)
    expect(mgmt.patientId).toBe(patientId)
    expect(mgmt.state).toBe('1')
    // Verify line arrays are present
    expect(Array.isArray(mgmt.consumableServiceIds)).toBe(true)
    expect(Array.isArray(mgmt.extraServiceIds)).toBe(true)
    expect(Array.isArray(mgmt.linkedProcedures)).toBe(true)
    // Verify extra computed fields
    expect(mgmt).toHaveProperty('accession')
    expect(mgmt).toHaveProperty('cashReceipt')
    expect(mgmt).toHaveProperty('isMain')

    managementId = mgmt.id
    console.log(`  Created management id=${managementId} accession="${mgmt.accession}"`)
  })
})

describe('Managements — Read', () => {
  it('GET /api/ris/managements/:id returns full record shape', async () => {
    const mgmt = await get(`/api/ris/managements/${managementId}`)
    expect(mgmt.id).toBe(managementId)
    expect(mgmt).toHaveProperty('consumableServiceIds')
    expect(mgmt).toHaveProperty('extraServiceIds')
    expect(mgmt).toHaveProperty('linkedProcedures')
    expect(mgmt).toHaveProperty('cashReceipt')
    expect(mgmt).toHaveProperty('isMain')
    expect(mgmt).toHaveProperty('mainRisId')
    expect(mgmt).toHaveProperty('durationDisplay')
    expect(mgmt).toHaveProperty('totalDurationDisplay')
  })

  it('GET /api/ris/managements returns a list that includes the new record', async () => {
    const list = await get('/api/ris/managements')
    const found = list.find(m => m.id === managementId)
    expect(found).toBeDefined()
    console.log(`  Total managements: ${list.length}`)
  })

  it('GET /api/ris/managements with domain filter works', async () => {
    const domain = JSON.stringify([['id', '=', managementId]])
    const list = await get('/api/ris/managements', { domain })
    expect(list).toHaveLength(1)
    expect(list[0].id).toBe(managementId)
  })
})

describe('Managements — Partial Update', () => {
  it('PUT /api/ris/managements/:id updates weight and height', async () => {
    const updated = await put(`/api/ris/managements/${managementId}`, {
      weight: 75,
      height: 175,
      bloodPressure: 120,
      temperature: 36.8,
    })
    expect(updated.weight).toBe(75)
    expect(updated.height).toBe(175)
    expect(updated.bloodPressure).toBe(120)
    expect(updated.temperature).toBeCloseTo(36.8, 1)
  })

  it('PUT updates exam notes fields', async () => {
    const updated = await put(`/api/ris/managements/${managementId}`, {
      examReason: 'Integration test exam reason',
      medicalInfo: 'No known allergies',
      description: 'Test description',
      otherComments: 'Test comments',
    })
    expect(updated.examReason).toBe('Integration test exam reason')
    expect(updated.medicalInfo).toBe('No known allergies')
  })
})

describe('Managements — onchange/patient', () => {
  it('GET /api/ris/managements/onchange/patient/:id returns patient defaults', async () => {
    const defaults = await get(`/api/ris/managements/onchange/patient/${patientId}`)
    expect(defaults).toMatchObject({
      patientId,
      gender: expect.any(String),
      phone: expect.any(String),
    })
    expect(defaults).toHaveProperty('pid')
    console.log(`  onchange/patient: pid="${defaults.pid}" phone="${defaults.phone}"`)
  })

  it('onchange/patient throws for unknown patient', async () => {
    await expect(
      get('/api/ris/managements/onchange/patient/9999999')
    ).rejects.toThrow()
  })
})

describe('Managements — onchange/product', () => {
  it('GET /api/ris/managements/onchange/product/:id returns price and category', async () => {
    if (!productId) {
      console.warn('  No products in Odoo — skipping onchange/product test')
      return
    }
    const data = await get(`/api/ris/managements/onchange/product/${productId}`)
    expect(data).toHaveProperty('cashProductId')
    expect(data).toHaveProperty('examPrice')
    expect(data).toHaveProperty('categoryId')
    expect(data.cashProductId).toBe(productId)
    console.log(`  onchange/product: price=${data.examPrice} category=${data.categoryId}`)
  })
})
