/**
 * 12 — Scheduler / Calendar events
 *
 * Tests GET /api/ris/managements/events with various date/filter combinations.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { odooAuth, get, post, del, T } from './_client.js'

let patientId = null
let mgmtId = null

/** Format a JS Date to 'YYYY-MM-DDTHH:MM' in local time (matches the JS datetime format). */
function toLocalDT(d) {
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const now = new Date()
const examDate = toLocalDT(now)
const dayStart = toLocalDT(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0))
const dayEnd = toLocalDT(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59))

beforeAll(async () => {
  await odooAuth()

  const patient = await post('/api/ris/patients', {
    nickname: `${T} SchedulerPatient`,
    firstName: 'Scheduler',
    gender: 'Male',
    phone: '01000000000',
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
    examDate,
    stateOfExamSelection: '1',
    patientType: 'cash',
    state: '1',
    gender: 'Male',
    patientCondition: 'Natural',
  })
  mgmtId = mgmt.id
  console.log(`  Setup: management id=${mgmtId} examDate="${examDate}"`)
})

afterAll(async () => {
  if (mgmtId) try { await del(`/api/ris/managements/${mgmtId}`) } catch { /* ok */ }
  if (patientId) try { await del(`/api/ris/patients/${patientId}`) } catch { /* ok */ }
})

describe('Scheduler events — basic query', () => {
  it('GET /api/ris/managements/events returns an array', async () => {
    const events = await get('/api/ris/managements/events')
    expect(Array.isArray(events)).toBe(true)
    console.log(`  Total events (no filter): ${events.length}`)
  })

  it('each event has the expected scheduler shape', async () => {
    const events = await get('/api/ris/managements/events')
    for (const evt of events) {
      expect(evt).toHaveProperty('id')
      expect(evt).toHaveProperty('examDate')
      expect(evt).toHaveProperty('state')
      expect(evt).toHaveProperty('patientId')
      expect(evt).toHaveProperty('patientName')
      expect(evt).toHaveProperty('categoryId')
      expect(evt).toHaveProperty('machineId')
      expect(evt).toHaveProperty('doctorId')
      expect(evt).toHaveProperty('productName')
    }
  })
})

describe('Scheduler events — date window filter', () => {
  it('dateFrom / dateTo narrows results to today', async () => {
    const events = await get('/api/ris/managements/events', {
      dateFrom: dayStart,
      dateTo: dayEnd,
    })
    expect(Array.isArray(events)).toBe(true)
    // The management we created today should be in the results
    const found = events.find(e => e.id === mgmtId)
    expect(found).toBeDefined()
    console.log(`  Events today: ${events.length}, found our record: ${!!found}`)
  })

  it('dateTo in the past returns no events from today', async () => {
    const yesterday = toLocalDT(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59))
    const lastWeek = toLocalDT(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 8, 0, 0))
    const events = await get('/api/ris/managements/events', {
      dateFrom: lastWeek,
      dateTo: yesterday,
    })
    const found = events.find(e => e.id === mgmtId)
    expect(found).toBeUndefined()
  })
})

describe('Scheduler events — state filter', () => {
  it('?states=1 returns only Arrived records', async () => {
    const events = await get('/api/ris/managements/events', { states: '1' })
    const found = events.find(e => e.id === mgmtId)
    expect(found).toBeDefined()
    for (const e of events) {
      expect(e.state).toBe('1')
    }
    console.log(`  Arrived events: ${events.length}`)
  })

  it('?states=5 (Cancelled) does not include our Arrived record', async () => {
    const events = await get('/api/ris/managements/events', { states: '5' })
    const found = events.find(e => e.id === mgmtId)
    expect(found).toBeUndefined()
  })
})

describe('Scheduler events — patient filter', () => {
  it('?patientIds=<id> returns only that patient\'s events', async () => {
    const events = await get('/api/ris/managements/events', { patientIds: String(patientId) })
    expect(events.length).toBeGreaterThanOrEqual(1)
    for (const e of events) {
      expect(e.patientId).toBe(patientId)
    }
    console.log(`  Events for patient ${patientId}: ${events.length}`)
  })
})
