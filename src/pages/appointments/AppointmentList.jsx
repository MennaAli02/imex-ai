import { useMemo, useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../../data/DataContext'
import Badge from '../../components/ui/Badge'
import SearchInput from '../../components/ui/SearchInput'
import { STATE_OPTIONS } from '../../data/seed'
import { formatDateTime } from '../../lib/utils'
import { FiFilter, FiChevronDown, FiChevronRight, FiCheck, FiPrinter } from 'react-icons/fi'

// Stand-in for the "Ris Appointment" tree view (ris_tree_view): default
// landing screen for the module, grouped by patient by default (matches the
// view's search_default_group_by_main_ris context).
export default function AppointmentList() {
  const navigate = useNavigate()
  const { getAll, update, remove } = useData()
  const [showColumnSelector, setShowColumnSelector] = useState(null)
  const columnSelectorRef = useRef(null)

  useEffect(() => {
    function handleClickOutsideSelector(event) {
      if (columnSelectorRef.current && !columnSelectorRef.current.contains(event.target)) {
        setShowColumnSelector(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutsideSelector)
    return () => document.removeEventListener('mousedown', handleClickOutsideSelector)
  }, [])
  const [query, setQuery] = useState('')
  const [groupByPatient, setGroupByPatient] = useState(true)
  const [collapsedGroups, setCollapsedGroups] = useState(new Set())

  const toggleGroup = (key) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const records = getAll('managements')
  const patients = getAll('patients')
  const machines = getAll('machines')
  const products = getAll('products')
  const doctors = getAll('doctors')
  const users = getAll('users')
  const insurancePlans = getAll('insurancePlans')

  const nameOf = (list, id) => list.find((r) => r.id === id)?.name ?? list.find((r) => r.id === id)?.partnerName ?? '—'
  const stateLabel = (value) => STATE_OPTIONS.find((o) => o.value === value)?.label ?? value

  const rows = useMemo(() => {
    return records.map((r) => {
      const patient = patients.find((p) => p.id === r.patientId)
      return {
        ...r,
        _patient: patient?.nickname ?? '—',
        _patientId: patient?.id ?? null,
        _pid: patient?.pid ?? '—',
        _natId: patient?.natId ?? '—',
        _phone: patient?.phone ?? '—',
        _machine: nameOf(machines, r.machineId),
        _product: nameOf(products, r.cashProductId),
        _plan: insurancePlans.find((p) => p.id === r.plansId)?.name ?? '—',
        _doctor: nameOf(doctors, r.doctorId),
        _createUid: nameOf(users, r.createUid),
      }
    })
  }, [records, patients, machines, products, doctors, users, insurancePlans])

  const filtered = useMemo(() => {
    if (!query.trim()) return rows
    const q = query.toLowerCase()
    return rows.filter((r) => [r._patient, r._pid, r.accession].some((v) => String(v ?? '').toLowerCase().includes(q)))
  }, [rows, query])

  const groups = useMemo(() => {
    if (!groupByPatient) return null
    const map = new Map()
    filtered.forEach((row) => {
      const key = row._patientId ?? 'unknown'
      if (!map.has(key)) map.set(key, { patientId: row._patientId, patientName: row._patient, rows: [] })
      map.get(key).rows.push(row)
    })
    return Array.from(map.values())
  }, [filtered, groupByPatient])

  const masterColumns = useMemo(() => [
    { key: '_pid', label: 'PID' },
    { key: '_patient', label: 'Patient' },
    { key: '_natId', label: 'National ID' },
    { key: '_phone', label: 'Phone' },
    { key: '_machine', label: 'Machine' },
    { key: '_product', label: 'Procedure' },
    { key: '_plan', label: 'Insurance Plan' },
    { key: '_doctor', label: 'Doctor' },
    { key: 'examDate', label: 'Exam Date', render: (row) => formatDateTime(row.examDate) },
    { key: '_createUid', label: 'Created By' },
    { key: 'durationDisplay', label: 'Duration' },
    {
      key: 'state',
      label: 'Status',
      render: (row) => <Badge text={stateLabel(row.state)} color={row.state === '2' ? 'success' : 'gray'} />,
    },
    { key: 'totalDurationDisplay', label: 'Total Duration' },
    {
      key: 'action_buttons',
      label: 'Actions',
      render: (row) => <ActionsDropdown row={row} update={update} remove={remove} />,
    },
  ], [update, remove])

  const [visibleKeys, setVisibleKeys] = useState(() => [
    '_patient',
    '_product',
    '_doctor',
    'examDate',
    'durationDisplay',
    'state',
    'totalDurationDisplay',
  ])

  const columns = useMemo(() => {
    const columnMap = new Map(masterColumns.map((c) => [c.key, c]))
    const keysWithoutActions = visibleKeys.filter((k) => k !== 'action_buttons')
    const orderedColumns = keysWithoutActions
      .map((k) => columnMap.get(k))
      .filter(Boolean)

    const actionsCol = columnMap.get('action_buttons')
    if (actionsCol) {
      orderedColumns.push(actionsCol)
    }
    return orderedColumns
  }, [masterColumns, visibleKeys])

  const renderTable = (tableRows, groupKey = 'default') => (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-gray-50 text-gray-600 text-left">
          {columns.map((c) => {
            const isActions = c.key === 'action_buttons'
            return (
              <th key={c.key} className="px-6 py-3.5 font-semibold whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <span>{c.label}</span>
                  {isActions && (
                    <div className="relative inline-block" ref={showColumnSelector === groupKey ? columnSelectorRef : null}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowColumnSelector(showColumnSelector === groupKey ? null : groupKey)
                        }}
                        className="text-gray-500 hover:text-gray-700 p-0.5 rounded hover:bg-gray-100 transition-colors flex items-center justify-center"
                        title="Toggle Columns"
                      >
                        <FiFilter size={14} />
                      </button>
                      {showColumnSelector === groupKey && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 mt-1 w-56 rounded-md shadow-lg bg-white border border-gray-200 z-50 py-2 px-3 text-left font-normal text-gray-700"
                        >
                          <div className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Columns</div>
                          <div className="max-h-60 overflow-y-auto space-y-1">
                            {masterColumns.filter((col) => col.key !== 'action_buttons').map((col) => (
                              <label
                                key={col.key}
                                className="flex items-center gap-2 py-1 px-1.5 hover:bg-gray-50 rounded cursor-pointer text-xs"
                              >
                                <input
                                  type="checkbox"
                                  checked={visibleKeys.includes(col.key)}
                                  onChange={() => {
                                    setVisibleKeys((prev) => {
                                      if (prev.includes(col.key)) {
                                        return prev.filter((k) => k !== col.key)
                                      } else {
                                        return [...prev, col.key]
                                      }
                                    })
                                  }}
                                  className="rounded text-brand-500 focus:ring-brand-500 w-3.5 h-3.5"
                                />
                                <span>{col.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </th>
            )
          })}
        </tr>
      </thead>
      <tbody>
        {tableRows.map((row) => (
          <tr key={row.id} onClick={() => navigate(`/appointments/${row.id}`)} className="border-t border-gray-100 hover:bg-brand-50 cursor-pointer">
            {columns.map((c) => (
              <td key={c.key} className="px-6 py-4 whitespace-nowrap">{c.render ? c.render(row) : row[c.key]}</td>
            ))}
          </tr>
        ))}
        {tableRows.length === 0 && (
          <tr>
            <td colSpan={columns.length} className="px-4 py-6 text-center text-gray-400">No records found</td>
          </tr>
        )}
      </tbody>
    </table>
  )


  return (
    <div className="bg-white rounded-3xl w-full max-h-full border border-[#e2f1f1] shadow-md flex flex-col justify-between overflow-hidden transition-all duration-300">
      {/* Table Top Header Bar */}
      <div className="flex-shrink-0 flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-[#e2f1f1] bg-[#fafcfc]">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base font-semibold text-[#00828a] tracking-tight">Appointment List</h2>
          <span className="px-3 py-0.5 rounded-full bg-[#d8f1f2] text-[#00828a] border border-[#bce5e7] text-[11px] font-medium">
            {filtered.length} records
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setGroupByPatient((v) => !v)}
            aria-pressed={groupByPatient}
            className={[
              'flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-full border transition-all shadow-xs',
              groupByPatient
                ? 'bg-[#00828a] border-[#00828a] text-white'
                : 'bg-white border-[#d8f1f2] text-[#00828a] hover:bg-[#f2f9f9]',
            ].join(' ')}
          >
            <span
              className={[
                'h-3.5 w-3.5 rounded-sm border flex items-center justify-center text-[10px] leading-none',
                groupByPatient ? 'bg-white border-white text-[#00828a]' : 'border-[#00828a]',
              ].join(' ')}
            >
              {groupByPatient ? '✓' : ''}
            </span>
            <span>Group by Patient</span>
          </button>

          <SearchInput value={query} onChange={setQuery} />

          <button
            type="button"
            onClick={() => navigate('/appointments/new')}
            className="bg-[#00828a] hover:bg-[#006c73] text-white text-xs font-medium px-4 py-2 rounded-full shadow-sm transition-all"
          >
            + New Appointment
          </button>
        </div>
      </div>

      {/* Independent Scrollable Table Body */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto w-full custom-scrollbar">
        {groupByPatient
          ? groups.map((g) => {
              const key = g.patientId ?? 'unknown'
              const isCollapsed = collapsedGroups.has(key)
              return (
                <div key={key} className="border-b border-[#e2f1f1]">
                  <div
                    onClick={() => toggleGroup(key)}
                    className="flex items-center gap-2.5 bg-[#d8f1f2]/50 px-5 py-2.5 cursor-pointer select-none border-b border-[#bce5e7]/50"
                  >
                    <span className={`text-[#00828a] text-xs transition-transform ${isCollapsed ? '-rotate-90' : ''}`}>▾</span>
                    <span className="font-semibold text-xs text-[#00828a]">{g.patientName}</span>
                    <span className="text-[11px] text-slate-500 font-medium">({g.rows.length})</span>
                    {g.patientId && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/patients/${g.patientId}`)
                        }}
                        className="ml-auto text-[11px] bg-white text-[#00828a] font-medium px-3 py-0.5 rounded-full border border-[#bce5e7] hover:bg-[#d8f1f2]"
                      >
                        ↗ Open Patient
                      </button>
                    )}
                  </div>
                  {!isCollapsed && renderTable(g.rows, key)}
                </div>
              )
            })
          : renderTable(filtered, 'default')}
      </div>

      {/* Table Bottom Footer Bar */}
      <div className="flex-shrink-0 px-5 py-2.5 border-t border-[#e2f1f1] bg-[#fafcfc] flex items-center justify-between text-xs text-slate-500 font-normal">
        <span>Showing {filtered.length} total entries</span>
        <span className="text-[11px] text-[#00828a]">Double-click any row to view details</span>
      </div>
    </div>
  )
}

function ActionsDropdown({ row, update, remove }) {
  const { cancelManagement, printDocument } = useData()
  const [isOpen, setIsOpen] = useState(false)
  const [activeSubmenu, setActiveSubmenu] = useState(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
        setActiveSubmenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleStateChange = async (newState) => {
    try {
      await update('managements', row.id, { state: newState })
    } catch (e) {
      console.error('State update failed', e)
    }
    setIsOpen(false)
    setActiveSubmenu(null)
  }

  const handlePrint = (label) => {
    let type = 'invoice'
    if (label.toLowerCase().includes('job')) type = 'job_order'
    else if (label.toLowerCase().includes('label') || label.toLowerCase().includes('sticker')) type = 'sticker'
    printDocument(row.id, type)
    setIsOpen(false)
    setActiveSubmenu(null)
  }

  const handleCancel = async () => {
    try {
      await cancelManagement(row.id)
    } catch (e) {
      console.error('Cancel failed', e)
    }
    setIsOpen(false)
    setActiveSubmenu(null)
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this exam?')) {
      try {
        await remove('managements', row.id)
      } catch (e) {
        console.error('Delete failed', e)
      }
    }
    setIsOpen(false)
    setActiveSubmenu(null)
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
          setActiveSubmenu(null)
        }}
        className="inline-flex items-center gap-1 bg-[#00828a] hover:bg-[#006c73] text-white text-xs font-medium px-3.5 py-1.5 rounded-full shadow-sm transition-colors"
      >
        Actions
        <FiChevronDown size={14} />
      </button>

      {isOpen && (
        <div 
          onClick={(e) => e.stopPropagation()} 
          className="absolute right-0 mt-1 w-56 rounded-2xl shadow-xl bg-white border border-[#d8f1f2] z-50 py-1"
        >
          {/* Change Examination Status */}
          <div className="relative group">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setActiveSubmenu(activeSubmenu === 'status' ? null : 'status')
              }}
              className="w-full flex items-center justify-between px-4 py-2 text-sm text-slate-700 hover:bg-[#f2f9f9] text-left font-medium"
            >
              <span className="flex items-center gap-2">Change Status 🔁</span>
              <FiChevronRight size={14} className="text-slate-400" />
            </button>

            {activeSubmenu === 'status' && (
              <div 
                className="absolute right-full top-0 mr-1 w-52 rounded-2xl shadow-xl bg-white border border-[#d8f1f2] z-50 py-1 max-h-60 overflow-y-auto"
              >
                {STATE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStateChange(opt.value)
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2 text-xs text-slate-700 hover:bg-[#f2f9f9] text-left ${row.state === opt.value ? 'bg-[#d8f1f2] font-semibold text-[#00828a]' : ''}`}
                  >
                    <span>{opt.value === '4' ? 'Appointment' :
                           opt.value === '1' ? 'Arrived' :
                           opt.value === '2' ? 'Paid' :
                           opt.value === '3' ? 'Pending' :
                           opt.value === '7' ? 'Under Inspection' :
                           opt.value === '8' ? 'Completed' :
                           opt.value === '5' ? 'Cancelled' :
                           opt.value === '10' ? 'Photos Delivered' :
                           opt.value === '11' ? 'Report Delivered' :
                           opt.value === '9' ? 'Fully Delivered' :
                           opt.value === '6' ? 'Refunded' : opt.label}</span>
                    {row.state === opt.value && <FiCheck size={12} className="text-[#00828a]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 my-1"></div>

          {/* Print */}
          <div className="relative group">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setActiveSubmenu(activeSubmenu === 'print' ? null : 'print')
              }}
              className="w-full flex items-center justify-between px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 text-left font-medium"
            >
              <span className="flex items-center gap-2"><FiPrinter className="text-cyan-600" /> Print</span>
              <FiChevronRight size={14} className="text-slate-400" />
            </button>

            {activeSubmenu === 'print' && (
              <div 
                className="absolute right-full top-0 mr-1 w-56 rounded-xl shadow-xl bg-white border border-slate-200 z-50 py-1"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePrint('Print Patient Invoice')
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                >
                  <FiPrinter size={13} className="text-cyan-600" /> Print Invoice
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePrint('Print Work Order')
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-100 border-t border-slate-100 flex items-center gap-2"
                >
                  <FiPrinter size={13} className="text-cyan-600" /> Print Work Order
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePrint('Print Work Order Sticker')
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-100 border-t border-slate-100 flex items-center gap-2"
                >
                  <FiPrinter size={13} className="text-cyan-600" /> Print Sticker
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 my-1"></div>

          {/* Cancel */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleCancel()
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-medium"
          >
            Cancel
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleDelete()
            }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium border-t border-gray-50"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
