/**
 * 09 — Procedures (linked child services)
 *
 * Tests addProcedure → linkedProcedures appears in GET → deleteProcedure removes it.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { odooAuth, get, post, del, T } from './_client.js'

let patientId = null
let mgmtId = null
let childId = null
let productId = null

beforeAll(async () => {
  await odooAuth()

  const lookups = await get('/api/ris/lookups')
  productId = lookups.products[0]?.id ?? null

  const patient = await post('/api/ris/patients', {
    nickname: `${T} ProcedurePatient`,
    firstName: 'Procedure',
    gender: 'Male',
    phone: '01000000033',
    dob: '1990-01-01',
  })
  patientId = patient.id

  const machineId = lookups.machines[0]?.id ?? null
  const mgmt = await post('/api/ris/managements', {
    patientId,
    machineId,
    examDate: new Date().toISOString().slice(0, 16),
    stateOfExamSelection: '1',
    patientType: 'cash',
    state: '1',
    gender: 'Male',
    patientCondition: 'Natural',
    cashProductId: productId,
  })
  mgmtId = mgmt.id
  console.log(`  Setup: management id=${mgmtId} productId=${productId}`)
})

afterAll(async () => {
  if (childId) try { await del(`/api/ris/managements/${mgmtId}/procedures/${childId}`) } catch { /* ok */ }
  if (mgmtId) try { await del(`/api/ris/managements/${mgmtId}`) } catch { /* ok */ }
  if (patientId) try { await del(`/api/ris/patients/${patientId}`) } catch { /* ok */ }
})

describe('Procedures — Add', () => {
  it('POST /procedures creates a linked child management', async () => {
    if (!productId) {
      console.warn('  No products available — skipping procedure tests')
      return
    }
    const result = await post(`/api/ris/managements/${mgmtId}/procedures`, {
      productId,
    })

    expect(result).toHaveProperty('management')
    expect(result).toHaveProperty('created')
    expect(result.created.id).toBeGreaterThan(0)
    expect(result.created.id).not.toBe(mgmtId)

    childId = result.created.id
    console.log(`  Created child management id=${childId}`)
  })

  it('POST /procedures without productId returns 400', async () => {
    await expect(
      post(`/api/ris/managements/${mgmtId}/procedures`, {})
    ).rejects.toThrow()
  })

  it('POST /procedures with invalid productId returns 400', async () => {
    await expect(
      post(`/api/ris/managements/${mgmtId}/procedures`, { productId: 9999999 })
    ).rejects.toThrow()
  })
})

describe('Procedures — Verify in Parent', () => {
  it('GET /managements/:id shows linkedProcedures with new child', async () => {
    if (!childId) { console.warn('  No child created — skipping'); return }
    const parent = await get(`/api/ris/managements/${mgmtId}`)
    const found = parent.linkedProcedures.find(p => p.id === childId)
    expect(found).toBeDefined()
    expect(found).toHaveProperty('productId')
    expect(found).toHaveProperty('state')
    console.log(`  linkedProcedures: ${JSON.stringify(found)}`)
  })
})

describe('Procedures — Delete', () => {
  it('DELETE /procedures/:childId removes the child', async () => {
    if (!childId) { console.warn('  No child created — skipping'); return }
    const result = await del(`/api/ris/managements/${mgmtId}/procedures/${childId}`)
    // returns the refreshed parent management
    expect(result).toHaveProperty('id')
    const stillFound = result.linkedProcedures?.find(p => p.id === childId)
    expect(stillFound).toBeUndefined()
    childId = null
    console.log(`  Child deleted, linkedProcedures now has ${result.linkedProcedures?.length} items`)
  })

  it('DELETE /procedures with wrong parent returns 400', async () => {
    if (!productId) { console.warn('  skipping'); return }
    // Create a child, then try to delete it from wrong parent
    const r = await post(`/api/ris/managements/${mgmtId}/procedures`, { productId })
    const tempChildId = r.created.id
    await expect(
      del(`/api/ris/managements/9999999/procedures/${tempChildId}`)
    ).rejects.toThrow()
    // Clean up
    try { await del(`/api/ris/managements/${mgmtId}/procedures/${tempChildId}`) } catch { /* ok */ }
  })
})
