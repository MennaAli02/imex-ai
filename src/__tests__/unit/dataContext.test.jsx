/**
 * Unit tests for DataContext — verifies CRUD cache updates, special
 * action signatures, and the printDocument download trigger.
 *
 * All network calls are intercepted by MSW so no real Odoo is needed.
 */

import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import { render, act, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { DataProvider, useData } from '../../data/DataContext'

// ── MSW server ────────────────────────────────────────────────────────────────

const PATIENT = { id: 1, nickname: 'Ali', firstName: 'Ali', phone: '0500000001' }
const MANAGEMENT = { id: 10, state: '1', patientId: 1, accession: 'ACC-001', consumableServiceIds: [], extraServiceIds: [], linkedProcedures: [] }

const server = setupServer(
  // Authenticate
  http.post('/web/session/authenticate', () =>
    HttpResponse.json({ jsonrpc: '2.0', result: { uid: 1, name: 'Admin', session_id: 'test-session' } })
  ),
  // Lookups + selections
  http.get('/api/ris/lookups', () =>
    HttpResponse.json({ ok: true, data: { users: [], insuranceCompanies: [], insurancePlans: [], categories: [], products: [], uoms: [], machines: [], discountReasons: [], reportTemplates: [], bodyParts: [], pricelists: [], basketLocations: [] } })
  ),
  http.get('/api/ris/selections', () =>
    HttpResponse.json({ ok: true, data: { STATE_OPTIONS: [], REPORT_STATE_OPTIONS: [], STATE_OF_EXAM_OPTIONS: [], STATE2_OPTIONS: [], PATIENT_CONDITION_OPTIONS: [], PATIENT_TYPE_OPTIONS: [], PATIENT_STATE_OPTIONS: [], GENDER_OPTIONS_CAP: [], GENDER_OPTIONS_LOWER: [], DOCTOR_TYPE_OPTIONS: [], FILE_TYPE_OPTIONS: [] } })
  ),
  // Collections
  http.get('/api/ris/patients', () => HttpResponse.json({ ok: true, data: [PATIENT], count: 1 })),
  http.get('/api/ris/doctors', () => HttpResponse.json({ ok: true, data: [] })),
  http.get('/api/ris/technicians', () => HttpResponse.json({ ok: true, data: [] })),
  http.get('/api/ris/documentTemplates', () => HttpResponse.json({ ok: true, data: [] })),
  http.get('/api/ris/managements', () => HttpResponse.json({ ok: true, data: [MANAGEMENT], count: 1 })),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ── helper: render DataProvider and extract context ───────────────────────────

function renderWithData(callback) {
  let ctx
  function Probe() {
    ctx = useData()
    return null
  }
  const { unmount } = render(
    <DataProvider>
      <Probe />
    </DataProvider>
  )
  return { getCtx: () => ctx, unmount }
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('DataContext — initial load', () => {
  it('populates patients from Odoo on mount', async () => {
    const { getCtx } = renderWithData()
    await waitFor(() => expect(getCtx().loading).toBe(false))
    const patients = getCtx().getAll('patients')
    expect(patients).toHaveLength(1)
    expect(patients[0].nickname).toBe('Ali')
  })

  it('getById returns correct record', async () => {
    const { getCtx } = renderWithData()
    await waitFor(() => expect(getCtx().loading).toBe(false))
    const p = getCtx().getById('patients', 1)
    expect(p).not.toBeNull()
    expect(p.phone).toBe('0500000001')
  })

  it('getById returns null for unknown id', async () => {
    const { getCtx } = renderWithData()
    await waitFor(() => expect(getCtx().loading).toBe(false))
    expect(getCtx().getById('patients', 9999)).toBeNull()
  })
})

describe('DataContext — create', () => {
  it('POST creates a record and adds it to the local cache', async () => {
    const newPatient = { id: 2, nickname: 'Bob', firstName: 'Bob', phone: '' }
    server.use(
      http.post('/api/ris/patients', () => HttpResponse.json({ ok: true, data: newPatient }, { status: 200 }))
    )
    const { getCtx } = renderWithData()
    await waitFor(() => expect(getCtx().loading).toBe(false))

    let created
    await act(async () => {
      created = await getCtx().create('patients', { nickname: 'Bob', firstName: 'Bob' })
    })

    expect(created.id).toBe(2)
    expect(getCtx().getAll('patients')).toHaveLength(2)
    expect(getCtx().getById('patients', 2)?.nickname).toBe('Bob')
  })
})

describe('DataContext — update', () => {
  it('PUT updates the record and replaces it in the cache', async () => {
    const updated = { ...PATIENT, phone: '0599999999' }
    server.use(
      http.put('/api/ris/patients/1', () => HttpResponse.json({ ok: true, data: updated }))
    )
    const { getCtx } = renderWithData()
    await waitFor(() => expect(getCtx().loading).toBe(false))

    await act(async () => {
      await getCtx().update('patients', 1, { phone: '0599999999' })
    })

    expect(getCtx().getById('patients', 1)?.phone).toBe('0599999999')
  })
})

describe('DataContext — remove', () => {
  it('DELETE removes the record from the local cache', async () => {
    server.use(
      http.delete('/api/ris/patients/1', () => HttpResponse.json({ ok: true, data: { id: 1, deleted: true } }))
    )
    const { getCtx } = renderWithData()
    await waitFor(() => expect(getCtx().loading).toBe(false))
    expect(getCtx().getAll('patients')).toHaveLength(1)

    await act(async () => {
      await getCtx().remove('patients', 1)
    })

    expect(getCtx().getAll('patients')).toHaveLength(0)
  })
})

describe('DataContext — cancelManagement sends reason', () => {
  it('sends {reason} in the request body', async () => {
    let capturedBody
    server.use(
      http.post('/api/ris/managements/10/cancel', async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ok: true, data: { ...MANAGEMENT, state: '5' } })
      })
    )
    const { getCtx } = renderWithData()
    await waitFor(() => expect(getCtx().loading).toBe(false))

    await act(async () => {
      await getCtx().cancelManagement(10, 'Duplicate booking')
    })

    expect(capturedBody).toEqual({ reason: 'Duplicate booking' })
  })

  it('sends empty reason when called without argument', async () => {
    let capturedBody
    server.use(
      http.post('/api/ris/managements/10/cancel', async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ok: true, data: { ...MANAGEMENT, state: '5' } })
      })
    )
    const { getCtx } = renderWithData()
    await waitFor(() => expect(getCtx().loading).toBe(false))

    await act(async () => {
      await getCtx().cancelManagement(10)
    })

    expect(capturedBody).toEqual({ reason: '' })
  })
})

describe('DataContext — addProcedure sends machineId not price', () => {
  it('sends {productId, machineId}', async () => {
    let capturedBody
    server.use(
      http.post('/api/ris/managements/10/procedures', async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ok: true, data: { management: MANAGEMENT, created: { id: 99 } }, status: 201 })
      })
    )
    const { getCtx } = renderWithData()
    await waitFor(() => expect(getCtx().loading).toBe(false))

    await act(async () => {
      await getCtx().addProcedure(10, 42, 7)
    })

    expect(capturedBody).toEqual({ productId: 42, machineId: 7 })
    expect(capturedBody).not.toHaveProperty('price')
  })
})

describe('DataContext — printDocument triggers download', () => {
  it('fetches the PDF via odooFetch and triggers a Blob download', async () => {
    const fakeBase64 = btoa('fake-pdf-content')
    server.use(
      http.get('/api/ris/managements/10/print/invoice', () =>
        HttpResponse.json({ ok: true, data: { base64: fakeBase64, fileName: 'invoice_10.pdf', contentType: 'application/pdf' } })
      )
    )

    // Spy at the URL level — safe for jsdom (does not break render)
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake-url')
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    // Capture anchor click via spying on HTMLAnchorElement prototype
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    const { getCtx } = renderWithData()
    await waitFor(() => expect(getCtx().loading).toBe(false))

    await act(async () => {
      await getCtx().printDocument(10, 'invoice')
    })

    // Verify a Blob URL was created and the download anchor was clicked
    expect(createObjectURLSpy).toHaveBeenCalledWith(expect.any(Blob))
    expect(clickSpy).toHaveBeenCalled()
    expect(revokeObjectURLSpy).toHaveBeenCalled()

    createObjectURLSpy.mockRestore()
    revokeObjectURLSpy.mockRestore()
    clickSpy.mockRestore()
  })
})
