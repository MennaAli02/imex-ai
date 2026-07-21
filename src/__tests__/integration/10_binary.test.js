/**
 * 10 — Binary fields: ID card image upload and download
 *
 * Tests POST /binary/card (upload base64 image) and GET /binary/card (retrieve).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { odooAuth, get, post, api, del, T } from './_client.js'

let patientId = null
let mgmtId = null

// 1×1 white PNG in base64 (smallest valid PNG)
const TINY_PNG_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg=='

beforeAll(async () => {
  await odooAuth()

  const patient = await post('/api/ris/patients', {
    nickname: `${T} BinaryPatient`,
    firstName: 'Binary',
    gender: 'Male',
    phone: '01000000022',
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

describe('Binary — ID Card Upload', () => {
  it('GET /binary/card before upload returns empty base64', async () => {
    const binary = await api('GET', `/api/ris/managements/${mgmtId}/binary/card`)
    expect(binary).toHaveProperty('base64')
    expect(binary).toHaveProperty('contentType')
    // Before upload, base64 is empty
    expect(binary.base64).toBe('')
    console.log(`  Before upload: hasCard=false`)
  })

  it('POST /binary/card stores the image and returns {card: true}', async () => {
    const result = await api('POST', `/api/ris/managements/${mgmtId}/binary/card`, {
      base64: TINY_PNG_B64,
    })
    expect(result).toMatchObject({ id: mgmtId, card: true })
    console.log(`  Upload result: ${JSON.stringify(result)}`)
  })

  it('GET /binary/card after upload returns the stored image', async () => {
    const binary = await api('GET', `/api/ris/managements/${mgmtId}/binary/card`)
    expect(binary.base64.length).toBeGreaterThan(0)
    expect(binary.contentType).toContain('image')
    // The returned base64 should decode to binary data
    const buf = Buffer.from(binary.base64, 'base64')
    expect(buf.length).toBeGreaterThan(0)
    console.log(`  Retrieved card: ${buf.length} bytes, type="${binary.contentType}"`)
  })

  it('GET /managements/:id shows hasCard=true after upload', async () => {
    const mgmt = await get(`/api/ris/managements/${mgmtId}`)
    expect(mgmt.hasCard).toBe(true)
    expect(mgmt).toHaveProperty('cardImageName')
  })

  it('POST /binary/card with data: URL prefix strips the prefix correctly', async () => {
    const dataUrl = `data:image/png;base64,${TINY_PNG_B64}`
    const result = await api('POST', `/api/ris/managements/${mgmtId}/binary/card`, {
      base64: dataUrl,
    })
    expect(result.card).toBe(true)
  })

  it('POST /binary/card with empty base64 clears the image', async () => {
    const result = await api('POST', `/api/ris/managements/${mgmtId}/binary/card`, {
      base64: '',
    })
    expect(result).toHaveProperty('card')
    // After clearing, hasCard should be false
    const mgmt = await get(`/api/ris/managements/${mgmtId}`)
    expect(mgmt.hasCard).toBe(false)
  })
})

describe('Binary — Document Template file', () => {
  let templateId = null

  it('POST /api/ris/documentTemplates + binary/file round-trip', async () => {
    const tpl = await post('/api/ris/documentTemplates', {
      name: `${T} Binary File Test`,
      active: true,
    })
    templateId = tpl.id

    // Upload a fake file
    const fakeDocx = Buffer.from('PK\x03\x04fake docx').toString('base64')
    const uploadResult = await api('POST', `/api/ris/documentTemplates/${templateId}/binary/file`, {
      base64: fakeDocx,
      fileName: 'test.docx',
    })
    expect(uploadResult.file).toBe(true)

    // Download and verify
    const dl = await api('GET', `/api/ris/documentTemplates/${templateId}/binary/file`)
    expect(dl.base64.length).toBeGreaterThan(0)
    expect(dl.fileName).toBe('test.docx')

    // Clean up
    await del(`/api/ris/documentTemplates/${templateId}`)
    console.log(`  Document template binary round-trip OK`)
  })
})
