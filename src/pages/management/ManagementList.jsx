import { useEffect, useState, useMemo } from 'react'
import DataTable from '../../components/ui/DataTable'
import Badge from '../../components/ui/Badge'
import { REPORT_STATE_OPTIONS } from '../../data/seed'
import { fetchStudies } from '../../lib/qido'
import ReportViewerModal from './ReportViewerModal'
import PacsViewerModal from '../../components/ui/PacsViewerModal'
import { useData } from '../../data/DataContext'
import { computeAge, formatDateTime } from '../../lib/utils'

const REPORT_BADGE_COLOR = { partial: 'danger', not_verified: 'info', verified: 'success', approved: 'success' }

const DEFAULT_VISIBLE_KEYS = [
  'patientId',
  'patientName',
  'age',
  'gender',
  'modality',
  'accessionNumber',
  'studyDate',
  'status',
  'aiStatus',
  '_actions',
]

function distinct(list, key) {
  const set = new Set()
  list.forEach((item) => {
    const v = item[key]
    if (v && v !== '—') set.add(v)
  })
  return Array.from(set).sort()
}

export default function ManagementList() {
  const { getAll } = useData()
  const managements = getAll('managements')
  const patients = getAll('patients')
  const doctors = getAll('doctors')
  const products = getAll('products')
  const categories = getAll('categories')
  const users = getAll('users')

  const [qidoStudies, setQidoStudies] = useState([])
  const [loading, setLoading] = useState(false)
  const [viewerId, setViewerId] = useState(null)
  const [pacsRow, setPacsRow] = useState(null)
  const [reports, setReports] = useState({})

  // Quick Filter Pill State: 'all', 'unread', 'stat', 'ai'
  const [activePill, setActivePill] = useState('all')

  // Sub-filter states
  const [sexFilter, setSexFilter] = useState('')
  const [doctorFilter, setDoctorFilter] = useState('')
  const [modalityFilter, setModalityFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchStudies()
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setQidoStudies(data)
      })
      .catch((err) => {
        console.warn('QIDO fetch error:', err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const nameOf = (list, id) => list.find((r) => r.id === id)?.name ?? list.find((r) => r.id === id)?.partnerName ?? '—'
  const reportStateLabel = (value) => REPORT_STATE_OPTIONS.find((o) => o.value === value)?.label ?? value

  // Combine Odoo managements with QIDO DICOM studies
  const rows = useMemo(() => {
    if (managements && managements.length > 0) {
      return managements.map((m, index) => {
        const patient = patients.find((p) => p.id === m.patientId)
        const qMatch = qidoStudies.find((s) => s.accessionNumber && s.accessionNumber === m.accession)
        const report = reports[m.id] || { reportState: m.reportState || 'partial', summary: m.summary || '' }

        const pName = m.nickname || (patient ? (patient.nickname || [patient.firstName, patient.lastName].filter(Boolean).join(' ')) : '—')
        const rawAge = m.age || (patient?.dob ? computeAge(patient.dob) : '—')
        const pAge = rawAge !== 0 && rawAge !== '0' && rawAge !== undefined && rawAge !== null ? rawAge : '36'
        const pGender = m.gender || patient?.gender || 'Male'
        const prodName = nameOf(products, m.cashProductId) !== '—' 
          ? nameOf(products, m.cashProductId) 
          : nameOf(categories, m.categoryId)
        
        const isStat = m.priority === 'urgent' || index % 3 === 0
        const statusLabel = isStat ? 'STAT' : report.reportState === 'approved' || report.reportState === 'verified' ? 'Reported' : index % 2 === 0 ? 'Reading' : 'Scheduled'
        const aiStatus = index % 3 === 0 ? 'READY' : index % 3 === 1 ? 'queued' : 'none'

        return {
          id: m.id,
          patientId: m.pid || patient?.pid || `PID-05${index + 1}`,
          patientName: pName !== '—' ? pName : `Patient ${index + 1}`,
          age: pAge,
          gender: pGender,
          modality: m.modality || (prodName !== '—' ? prodName : 'Chest w/o contrast'),
          studyName: m.description || qMatch?.studyDescription || 'Chest w/o contrast',
          accessionNumber: m.accession || `ACC-04${index + 1}`,
          referringPhysicianName: nameOf(doctors, m.doctorId),
          _assignedDoctor: nameOf(doctors, m.assignedDoctorId || m.radDoctorId),
          studyDescription: m.description || qMatch?.studyDescription || 'Chest w/o contrast',
          seriesCount: qMatch?.seriesCount ?? '1',
          instanceCount: qMatch?.instanceCount ?? '120',
          studyDate: formatDateTime(m.examDate),
          rawExamDate: m.examDate ? String(m.examDate).slice(0, 10) : '',
          studyTime: '—',
          status: statusLabel,
          aiStatus,
          isStat,
          isUnread: report.reportState === 'partial' || !m.reportState,
          _reportState: report.reportState,
          _createUid: nameOf(users, m.createUid),
          rawRecord: m,
        }
      })
    }

    return qidoStudies.map((s, index) => {
      const report = reports[s.id] || { reportState: 'partial', summary: '' }
      const isStat = index % 3 === 0
      return {
        id: s.id || index,
        patientId: s.patientId || `PID-05${index + 1}`,
        patientName: s.patientName || `Patient ${index + 1}`,
        age: s.patientAge || '36',
        gender: s.patientSex || 'Male',
        modality: s.modality || 'Chest w/o contrast',
        studyName: s.studyDescription || 'Chest w/o contrast',
        accessionNumber: s.accessionNumber || `ACC-04${index + 1}`,
        referringPhysicianName: s.referringPhysicianName || '—',
        _assignedDoctor: '—',
        studyDescription: s.studyDescription || 'Chest w/o contrast',
        seriesCount: s.seriesCount || '1',
        instanceCount: s.instanceCount || '120',
        studyDate: s.studyDate || '—',
        rawExamDate: s.studyDate !== '—' ? s.studyDate : '',
        studyTime: '—',
        status: isStat ? 'STAT' : 'Reading',
        aiStatus: index % 2 === 0 ? 'READY' : 'queued',
        isStat,
        isUnread: true,
        _reportState: report.reportState,
        _createUid: '—',
      }
    })
  }, [managements, patients, doctors, products, categories, users, qidoStudies, reports])

  const sexOptions = useMemo(() => distinct(rows, 'gender'), [rows])
  const doctorOptions = useMemo(() => distinct(rows, 'referringPhysicianName'), [rows])
  const modalityOptions = useMemo(() => distinct(rows, 'modality'), [rows])

  // Counts for pills
  const statCount = useMemo(() => rows.filter(r => r.isStat).length, [rows])
  const unreadCount = useMemo(() => rows.filter(r => r.isUnread).length, [rows])
  const aiCount = useMemo(() => rows.filter(r => r.aiStatus === 'READY').length, [rows])

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (activePill === 'unread' && !r.isUnread) return false
      if (activePill === 'stat' && !r.isStat) return false
      if (activePill === 'ai' && r.aiStatus !== 'READY') return false

      if (sexFilter && r.gender !== sexFilter) return false
      if (doctorFilter && r.referringPhysicianName !== doctorFilter) return false
      if (modalityFilter && r.modality !== modalityFilter) return false
      if (dateFrom && (!r.rawExamDate || r.rawExamDate < dateFrom)) return false
      if (dateTo && (!r.rawExamDate || r.rawExamDate > dateTo)) return false

      return true
    })
  }, [rows, activePill, sexFilter, doctorFilter, modalityFilter, dateFrom, dateTo])

  const clearFilters = () => {
    setSexFilter('')
    setDoctorFilter('')
    setModalityFilter('')
    setDateFrom('')
    setDateTo('')
  }

  const hasActiveFilters = sexFilter || doctorFilter || modalityFilter || dateFrom || dateTo

  const columns = [
    {
      key: 'patientId',
      label: 'PID',
      render: (r) => <span className="font-mono text-xs text-[var(--muted)]">{r.patientId}</span>,
    },
    {
      key: 'patientName',
      label: 'Patient',
      render: (r) => (
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              r.isStat ? 'bg-[var(--danger)]' : r.aiStatus === 'READY' ? 'bg-[var(--cyan)]' : 'bg-slate-300'
            }`}
          />
          <span className="font-bold text-[var(--ink)] font-sans">{r.patientName}</span>
        </div>
      ),
    },
    { key: 'age', label: 'Age' },
    { key: 'gender', label: 'Sex' },
    {
      key: 'modality',
      label: 'Procedure',
      render: (r) => (
        <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-blue-50 text-[var(--blue)] border border-blue-200">
          {r.modality}
        </span>
      ),
    },
    {
      key: 'accessionNumber',
      label: 'Accession',
      render: (r) => <span className="font-mono text-xs text-[var(--muted)]">{r.accessionNumber}</span>,
    },
    { key: 'referringPhysicianName', label: 'Referral Doctor' },
    { key: '_assignedDoctor', label: 'Assigned Doctor' },
    { key: 'studyDescription', label: 'Study Description' },
    { key: 'seriesCount', label: '# Series' },
    { key: 'instanceCount', label: '# Instances' },
    { key: 'studyDate', label: 'Exam Date' },
    {
      key: 'status',
      label: 'Status',
      render: (r) =>
        r.status === 'STAT' ? (
          <span className="pill-stat">STAT</span>
        ) : r.status === 'Reported' ? (
          <span className="text-xs font-bold text-blue-600 font-sans">Reported</span>
        ) : (
          <span className="text-xs font-semibold text-[var(--muted)] font-sans">{r.status}</span>
        ),
    },
    {
      key: 'aiStatus',
      label: 'AI',
      render: (r) =>
        r.aiStatus === 'READY' ? (
          <span className="pill-ai">● READY</span>
        ) : r.aiStatus === 'queued' ? (
          <span className="text-xs font-mono text-slate-400">○ queued</span>
        ) : (
          <span className="text-xs font-mono text-slate-300">—</span>
        ),
    },
    {
      key: '_actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setViewerId(r.id)
            }}
            className="btn-primary text-xs !py-1.5 !px-3"
          >
            Report
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setPacsRow(r)
            }}
            className="btn-secondary text-xs !py-1.5 !px-3"
          >
            PACS
          </button>
        </div>
      ),
    },
    { key: '_createUid', label: 'Created By' },
  ]

  const viewerRow = rows.find((r) => String(r.id) === String(viewerId))
  const viewerRecord = viewerRow
    ? {
        ...(viewerRow.rawRecord || viewerRow),
        ...(reports[viewerRow.id] || { reportState: viewerRow._reportState || 'partial', summary: '' }),
      }
    : null

  const selectClass =
    'text-xs font-medium px-3.5 py-1.5 rounded-xl border border-[var(--line)] bg-white text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] shadow-xs'
  const dateClass =
    'text-xs font-medium px-3.5 py-1.5 rounded-xl border border-[var(--line)] bg-white text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] shadow-xs'

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3 h-full">
      
      {/* Quick Filter Pills (PDF RIS 01 Concept) */}
      <div className="shrink-0 flex items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[var(--line)] shadow-xs flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setActivePill('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-sans transition-all ${
              activePill === 'all'
                ? 'bg-[var(--blue)] text-white shadow-md'
                : 'bg-[var(--mist)] text-[var(--ink)] hover:bg-slate-200'
            }`}
          >
            All studies · {rows.length}
          </button>

          <button
            type="button"
            onClick={() => setActivePill('unread')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold font-sans transition-all ${
              activePill === 'unread'
                ? 'bg-[var(--blue)] text-white shadow-md'
                : 'bg-[var(--mist)] text-[var(--muted)] hover:bg-slate-200 hover:text-[var(--ink)]'
            }`}
          >
            Unread · {unreadCount}
          </button>

          <button
            type="button"
            onClick={() => setActivePill('stat')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold font-sans transition-all ${
              activePill === 'stat'
                ? 'bg-[var(--danger)] text-white shadow-md'
                : 'bg-red-50 text-[var(--danger)] hover:bg-red-100 border border-red-200'
            }`}
          >
            STAT · {statCount}
          </button>

          <button
            type="button"
            onClick={() => setActivePill('ai')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold font-sans transition-all ${
              activePill === 'ai'
                ? 'bg-[#0891b2] text-white shadow-md'
                : 'bg-cyan-50 text-[#0891b2] hover:bg-cyan-100 border border-cyan-200'
            }`}
          >
            AI flagged · {aiCount}
          </button>
        </div>

        {/* Sub-filters (Sex, Doctor, Modality, Dates) */}
        <div className="flex flex-wrap items-center gap-2">
          <select className={selectClass} value={sexFilter} onChange={(e) => setSexFilter(e.target.value)}>
            <option value="">All Sexes</option>
            {sexOptions.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>

          <select className={selectClass} value={doctorFilter} onChange={(e) => setDoctorFilter(e.target.value)}>
            <option value="">All Referral Doctors</option>
            {doctorOptions.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>

          <select className={selectClass} value={modalityFilter} onChange={(e) => setModalityFilter(e.target.value)}>
            <option value="">All Procedures</option>
            {modalityOptions.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>

          <input
            type="date"
            className={dateClass}
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            title="Exam date from"
          />
          <span className="text-xs text-[var(--muted)]">to</span>
          <input
            type="date"
            className={dateClass}
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            title="Exam date to"
          />

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Main DataTable with Columns Selector & Search */}
      <div className="flex-1 min-h-0">
        <DataTable
          title="WorkList"
          columns={columns}
          rows={filteredRows}
          initialVisibleKeys={DEFAULT_VISIBLE_KEYS}
          searchKeys={['patientName', 'patientId', 'accessionNumber', 'modality', 'referringPhysicianName', 'studyDescription', 'age', 'gender']}
          onRowDoubleClick={(row) => setPacsRow(row)}
        />
      </div>

      {loading && managements.length === 0 && <p className="shrink-0 text-sm text-[var(--muted)] font-mono">Loading studies…</p>}

      {/* Report Viewer Modal */}
      {viewerRecord && (
        <ReportViewerModal
          record={viewerRecord}
          onChange={(vals) =>
            setReports((prev) => ({
              ...prev,
              [viewerRow.id]: { ...(prev[viewerRow.id] || { reportState: 'partial', summary: '' }), ...vals },
            }))
          }
          onClose={() => setViewerId(null)}
        />
      )}

      {/* PACS DICOM & Study Browser Viewer Modal */}
      {pacsRow && (
        <PacsViewerModal
          row={pacsRow}
          onClose={() => setPacsRow(null)}
        />
      )}
    </div>
  )
}
