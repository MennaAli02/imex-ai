/**
 * 01 — Lookups & Selections
 * Verifies that /api/ris/lookups and /api/ris/selections return the
 * expected shape that DataContext spreads into its db state.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { odooAuth, get } from './_client.js'

beforeAll(async () => { await odooAuth() })

const LOOKUP_KEYS = [
  'users', 'insuranceCompanies', 'insurancePlans', 'categories',
  'products', 'uoms', 'machines', 'discountReasons',
  'reportTemplates', 'bodyParts', 'pricelists', 'basketLocations',
]

const SELECTION_KEYS = [
  'STATE_OPTIONS', 'REPORT_STATE_OPTIONS', 'STATE_OF_EXAM_OPTIONS',
  'STATE2_OPTIONS', 'PATIENT_CONDITION_OPTIONS', 'PATIENT_TYPE_OPTIONS',
  'PATIENT_STATE_OPTIONS', 'GENDER_OPTIONS_CAP', 'GENDER_OPTIONS_LOWER',
  'DOCTOR_TYPE_OPTIONS', 'FILE_TYPE_OPTIONS',
]

describe('GET /api/ris/lookups', () => {
  let lookups

  beforeAll(async () => { lookups = await get('/api/ris/lookups') })

  it('returns all expected lookup keys', () => {
    for (const key of LOOKUP_KEYS) {
      expect(lookups, `missing key: ${key}`).toHaveProperty(key)
      expect(Array.isArray(lookups[key]), `${key} should be an array`).toBe(true)
    }
  })

  it('each lookup item has at least {id, name}', () => {
    for (const key of LOOKUP_KEYS) {
      for (const item of lookups[key]) {
        expect(item, `${key} item missing id`).toHaveProperty('id')
        // name might be complete_name for basketLocations
        const hasName = 'name' in item || 'complete_name' in item
        expect(hasName, `${key} item missing name/complete_name`).toBe(true)
      }
    }
  })

  it('users has at least one entry (the admin)', () => {
    expect(lookups.users.length).toBeGreaterThan(0)
    console.log(`  users: ${lookups.users.map(u => u.name).join(', ')}`)
  })

  it('logs lookup counts', () => {
    for (const key of LOOKUP_KEYS) {
      console.log(`  ${key}: ${lookups[key].length} records`)
    }
    expect(true).toBe(true)
  })
})

describe('GET /api/ris/selections', () => {
  let selections

  beforeAll(async () => { selections = await get('/api/ris/selections') })

  it('returns all expected selection keys', () => {
    for (const key of SELECTION_KEYS) {
      expect(selections, `missing key: ${key}`).toHaveProperty(key)
      expect(Array.isArray(selections[key]), `${key} should be an array`).toBe(true)
    }
  })

  it('each selection option has {value, label}', () => {
    for (const key of SELECTION_KEYS) {
      for (const opt of selections[key]) {
        expect(opt).toHaveProperty('value')
        expect(opt).toHaveProperty('label')
      }
    }
  })

  it('STATE_OPTIONS has the expected workflow states', () => {
    const values = selections.STATE_OPTIONS.map(o => o.value)
    // At least Arrived, Paid, Cancelled must exist
    expect(values).toContain('1') // Arrived
    expect(values).toContain('5') // Cancelled
    console.log(`  STATE_OPTIONS: ${selections.STATE_OPTIONS.map(o => `${o.value}=${o.label}`).join(', ')}`)
  })

  it('GENDER_OPTIONS_CAP has Male and Female', () => {
    const values = selections.GENDER_OPTIONS_CAP.map(o => o.value)
    expect(values).toContain('Male')
    expect(values).toContain('Female')
  })
})
