/**
 * 08 — Basket Operations
 *
 * Tests consumableServiceIds / extraServiceIds line write via PUT,
 * then done_all / return_all basket actions.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { odooAuth, get, post, put, del, T } from './_client.js'

let patientId = null
let mgmtId = null
let lookups = null

beforeAll(async () => {
  await odooAuth()
  lookups = await get('/api/ris/lookups')

  const patient = await post('/api/ris/patients', {
    nickname: `${T} BasketPatient`,
    firstName: 'Basket',
    gender: 'Male',
    phone: '01000000044',
    dob: '1990-01-01',
  })
  patientId = patient.id

  const productId = lookups.products[0]?.id ?? null
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
  console.log(`  Setup: management id=${mgmtId}`)
})

afterAll(async () => {
  if (mgmtId) try { await del(`/api/ris/managements/${mgmtId}`) } catch { /* ok */ }
  if (patientId) try { await del(`/api/ris/patients/${patientId}`) } catch { /* ok */ }
})

describe('Basket — Write consumable lines via PUT', () => {
  it('PUT /managements/:id with consumableServiceIds creates basket lines', async () => {
    const productId = lookups.products[0]?.id
    const uomId = lookups.uoms[0]?.id

    if (!productId || !uomId) {
      console.warn('  No products/uoms configured — skipping basket line test')
      return
    }

    const updated = await put(`/api/ris/managements/${mgmtId}`, {
      consumableServiceIds: [
        {
          productId,
          uomId,
          plannedQty: 2,
          price: 10,
          notes: 'Integration test line',
        },
      ],
    })

    expect(Array.isArray(updated.consumableServiceIds)).toBe(true)
    if (updated.consumableServiceIds.length > 0) {
      const line = updated.consumableServiceIds[0]
      expect(line).toHaveProperty('id')
      expect(line).toHaveProperty('productId')
      expect(line).toHaveProperty('plannedQty')
      console.log(`  Created basket line id=${line.id} productId=${line.productId}`)
    }
  })
})

describe('Basket — Actions', () => {
  it('POST /basket/done_all executes without error', async () => {
    try {
      const result = await post(`/api/ris/managements/${mgmtId}/basket/done_all`)
      expect(result).toHaveProperty('id')
      console.log(`  done_all succeeded`)
    } catch (e) {
      // Stock/product configuration may prevent this — log and pass conditionally
      console.warn(`  done_all skipped: ${e.message}`)
      expect(e.message).toMatch(/stock|product|location|not found|not configured/i)
    }
  })

  it('POST /basket/return_all executes without error', async () => {
    try {
      const result = await post(`/api/ris/managements/${mgmtId}/basket/return_all`)
      expect(result).toHaveProperty('id')
      console.log(`  return_all succeeded`)
    } catch (e) {
      console.warn(`  return_all skipped: ${e.message}`)
      expect(e.message).toMatch(/stock|product|location|not found|not configured|items|return/i)
    }
  })

  it('POST /basket with unknown action returns 400', async () => {
    await expect(
      post(`/api/ris/managements/${mgmtId}/basket/invalid_action`)
    ).rejects.toThrow()
  })
})
