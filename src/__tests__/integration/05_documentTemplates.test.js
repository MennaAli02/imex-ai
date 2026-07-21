/**
 * 05 — Document Templates CRUD
 * document.template has a binary 'file' field (handled via /binary/ endpoint).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { odooAuth, get, post, put, del, api, T } from './_client.js'

let createdId = null

beforeAll(async () => { await odooAuth() })
afterAll(async () => {
  if (createdId) try { await del(`/api/ris/documentTemplates/${createdId}`) } catch { /* ok */ }
})

describe('Document Templates — Create', () => {
  it('POST /api/ris/documentTemplates creates a template', async () => {
    const tpl = await post('/api/ris/documentTemplates', {
      name: `${T} Integration Template`,
      description: 'Created by integration test',
      active: true,
    })
    expect(tpl.id).toBeGreaterThan(0)
    expect(tpl.name).toContain(T)
    expect(tpl).toHaveProperty('hasFile')  // binary presence flag
    createdId = tpl.id
    console.log(`  Created template id=${createdId}`)
  })
})

describe('Document Templates — Read', () => {
  it('GET /api/ris/documentTemplates/:id returns the template', async () => {
    const tpl = await get(`/api/ris/documentTemplates/${createdId}`)
    expect(tpl.description).toBe('Created by integration test')
    expect(tpl.active).toBe(true)
    expect(tpl.hasFile).toBe(false)  // no file uploaded yet
  })

  it('GET /api/ris/documentTemplates list includes the template', async () => {
    const list = await get('/api/ris/documentTemplates')
    expect(list.find(t => t.id === createdId)).toBeDefined()
  })
})

describe('Document Templates — Binary file upload', () => {
  it('POST /api/ris/documentTemplates/:id/binary/file stores base64 file', async () => {
    // Minimal fake .docx base64 (just enough to not be empty)
    const fakeBase64 = Buffer.from('PK fake docx content').toString('base64')
    const result = await api('POST', `/api/ris/documentTemplates/${createdId}/binary/file`, {
      base64: fakeBase64,
      fileName: 'test_template.docx',
    })
    expect(result).toMatchObject({ id: createdId, file: true })
  })

  it('GET /api/ris/documentTemplates/:id/binary/file retrieves stored file', async () => {
    const binary = await api('GET', `/api/ris/documentTemplates/${createdId}/binary/file`)
    expect(binary).toHaveProperty('base64')
    expect(binary.base64.length).toBeGreaterThan(0)
    expect(binary).toHaveProperty('fileName')
    expect(binary).toHaveProperty('contentType')
    console.log(`  Binary file retrieved, size=${binary.base64.length} chars`)
  })
})

describe('Document Templates — Update', () => {
  it('PUT /api/ris/documentTemplates/:id updates name and description', async () => {
    const updated = await put(`/api/ris/documentTemplates/${createdId}`, {
      name: `${T} Updated Template`,
      description: 'Updated description',
    })
    expect(updated.name).toContain('Updated')
    expect(updated.description).toBe('Updated description')
  })
})

describe('Document Templates — Delete', () => {
  it('DELETE /api/ris/documentTemplates/:id removes the template', async () => {
    const result = await del(`/api/ris/documentTemplates/${createdId}`)
    expect(result.deleted).toBe(true)
    createdId = null
  })
})
