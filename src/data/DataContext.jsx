import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { odooFetch, odooUpload } from '../lib/odoo'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [db, setDb] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load all data from the Odoo backend on mount
  useEffect(() => {
    async function init() {
      try {
        const [lookups, selections, patients, doctors, technicians, documentTemplates, managements] =
          await Promise.all([
            odooFetch('/api/ris/lookups'),
            odooFetch('/api/ris/selections'),
            odooFetch('/api/ris/patients'),
            odooFetch('/api/ris/doctors'),
            odooFetch('/api/ris/technicians'),
            odooFetch('/api/ris/documentTemplates'),
            odooFetch('/api/ris/managements'),
          ])

        setDb({
          ...lookups,
          ...selections,
          patients,
          doctors,
          technicians,
          documentTemplates,
          managements,
        })
        console.info('[RIS] Data loaded from Odoo backend.')
      } catch (err) {
        console.error('[RIS] Failed to load data from Odoo:', err)
        setError(err.message || 'Could not connect to Odoo backend.')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const api = useMemo(() => {
    // ── Reads (synchronous, from in-memory cache) ─────────────────────────────

    const getAll = (collection) => db[collection] || []

    const getById = (collection, id) =>
      (db[collection] || []).find((r) => String(r.id) === String(id)) || null

    // ── Writes (live Odoo calls, then update local cache) ─────────────────────

    const create = async (collection, vals) => {
      const created = await odooFetch(`/api/ris/${collection}`, {
        method: 'POST',
        body: JSON.stringify(vals),
      })
      setDb((prev) => ({ ...prev, [collection]: [...(prev[collection] || []), created] }))
      return created
    }

    const update = async (collection, id, vals) => {
      const updated = await odooFetch(`/api/ris/${collection}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(vals),
      })
      setDb((prev) => ({
        ...prev,
        [collection]: (prev[collection] || []).map((r) =>
          String(r.id) === String(id) ? updated : r
        ),
      }))
      return updated
    }

    const remove = async (collection, id) => {
      await odooFetch(`/api/ris/${collection}/${id}`, { method: 'DELETE' })
      setDb((prev) => ({
        ...prev,
        [collection]: (prev[collection] || []).filter((r) => String(r.id) !== String(id)),
      }))
    }

    // ── Odoo-specific operations ───────────────────────────────────────────────

    const onchangePatient = async (patientId) =>
      odooFetch(`/api/ris/managements/onchange/patient/${patientId}`)

    const onchangeProduct = async (productId, planId) => {
      const query = planId ? `?planId=${planId}` : ''
      return odooFetch(`/api/ris/managements/onchange/product/${productId}${query}`)
    }

    const reschedule = async (id, vals) => {
      const updated = await odooFetch(`/api/ris/managements/${id}/reschedule`, {
        method: 'POST',
        body: JSON.stringify(vals),
      })
      setDb((prev) => ({
        ...prev,
        managements: (prev.managements || []).map((r) =>
          String(r.id) === String(id) ? updated : r
        ),
      }))
      return updated
    }

    const extractCard = async (id, kind) =>
      odooFetch(`/api/ris/managements/${id}/extract`, {
        method: 'POST',
        body: JSON.stringify({ kind }),
      })

    const cancelManagement = async (id, reason = '') => {
      const updated = await odooFetch(`/api/ris/managements/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      })
      setDb((prev) => ({
        ...prev,
        managements: (prev.managements || []).map((r) =>
          String(r.id) === String(id) ? updated : r
        ),
      }))
      return updated
    }

    const payManagement = async (id, payload) =>
      odooFetch(`/api/ris/managements/${id}/pay`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })

    const reportPartial = async (id) => {
      const updated = await odooFetch(`/api/ris/managements/${id}/report/partial`, { method: 'POST' })
      setDb((prev) => ({
        ...prev,
        managements: (prev.managements || []).map((r) =>
          String(r.id) === String(id) ? { ...r, ...updated } : r
        ),
      }))
      return updated
    }

    const reportNotVerified = async (id) => {
      const updated = await odooFetch(`/api/ris/managements/${id}/report/not_verified`, { method: 'POST' })
      setDb((prev) => ({
        ...prev,
        managements: (prev.managements || []).map((r) =>
          String(r.id) === String(id) ? { ...r, ...updated } : r
        ),
      }))
      return updated
    }

    const reportVerify = async (id) => {
      const updated = await odooFetch(`/api/ris/managements/${id}/report/verify`, { method: 'POST' })
      setDb((prev) => ({
        ...prev,
        managements: (prev.managements || []).map((r) =>
          String(r.id) === String(id) ? { ...r, ...updated } : r
        ),
      }))
      return updated
    }

    const saveReportSummary = async (id, summary) => {
      const updated = await odooFetch(`/api/ris/managements/${id}/report/summary`, {
        method: 'PUT',
        body: JSON.stringify({ summary }),
      })
      setDb((prev) => ({
        ...prev,
        managements: (prev.managements || []).map((r) =>
          String(r.id) === String(id) ? { ...r, ...updated } : r
        ),
      }))
      return updated
    }

    const saveReportPdf = async (id, pdfData) => {
      const updated = await odooFetch(`/api/ris/managements/${id}/report/save-pdf`, {
        method: 'POST',
        body: JSON.stringify({ pdfData }),
      })
      setDb((prev) => ({
        ...prev,
        managements: (prev.managements || []).map((r) =>
          String(r.id) === String(id) ? { ...r, ...updated } : r
        ),
      }))
      return updated
    }

    const printDocument = async (id, documentType) => {
      // Fetch the PDF via odooFetch so the session cookie is included,
      // then trigger a browser download from the returned base64 payload.
      const data = await odooFetch(`/api/ris/managements/${id}/print/${documentType}`)
      // data = { base64, fileName, contentType }
      const byteChars = atob(data.base64)
      const byteArr = new Uint8Array(byteChars.length)
      for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i)
      const blob = new Blob([byteArr], { type: data.contentType || 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = data.fileName || `${documentType}_${id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    }

    const applyTemplate = async (id, templateId) => {
      const updated = await odooFetch(`/api/ris/managements/${id}/apply-template/${templateId}`, {
        method: 'POST',
      })
      setDb((prev) => ({
        ...prev,
        managements: (prev.managements || []).map((r) =>
          String(r.id) === String(id) ? { ...r, ...updated } : r
        ),
      }))
      return updated
    }

    const addProcedure = async (id, productId, machineId) => {
      const updated = await odooFetch(`/api/ris/managements/${id}/procedures`, {
        method: 'POST',
        body: JSON.stringify({ productId, machineId }),
      })
      setDb((prev) => ({
        ...prev,
        managements: (prev.managements || []).map((r) =>
          String(r.id) === String(id)
            ? { ...r, linkedProcedures: [...(r.linkedProcedures || []), updated] }
            : r
        ),
      }))
      return updated
    }

    const deleteProcedure = async (id, childId) => {
      await odooFetch(`/api/ris/managements/${id}/procedures/${childId}`, { method: 'DELETE' })
      setDb((prev) => ({
        ...prev,
        managements: (prev.managements || []).map((r) =>
          String(r.id) === String(id)
            ? { ...r, linkedProcedures: (r.linkedProcedures || []).filter((p) => String(p.id) !== String(childId)) }
            : r
        ),
      }))
    }

    const uploadCardImage = async (id, file) => {
      const data = await odooUpload(`/api/ris/managements/${id}/binary/card`, file)
      setDb((prev) => ({
        ...prev,
        managements: (prev.managements || []).map((r) =>
          String(r.id) === String(id) ? { ...r, ...data } : r
        ),
      }))
      return data
    }

    const uploadTemplateFile = async (id, file) => {
      const data = await odooUpload(`/api/ris/documentTemplates/${id}/binary/file`, file)
      setDb((prev) => ({
        ...prev,
        documentTemplates: (prev.documentTemplates || []).map((r) =>
          String(r.id) === String(id) ? { ...r, ...data } : r
        ),
      }))
      return data
    }

    return {
      // State
      loading,
      error,
      // CRUD
      getAll,
      getById,
      create,
      update,
      remove,
      // Odoo-specific
      onchangePatient,
      onchangeProduct,
      reschedule,
      extractCard,
      cancelManagement,
      payManagement,
      reportPartial,
      reportNotVerified,
      reportVerify,
      saveReportSummary,
      saveReportPdf,
      printDocument,
      applyTemplate,
      addProcedure,
      deleteProcedure,
      uploadCardImage,
      uploadTemplateFile,
    }
  }, [db, loading, error])

  return <DataContext.Provider value={api}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within a DataProvider')
  return ctx
}
