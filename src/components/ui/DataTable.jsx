import { useMemo, useState, useRef, useEffect } from 'react'
import { FiFilter } from 'react-icons/fi'
import SearchInput from './SearchInput'

export default function DataTable({
  title,
  columns,
  rows,
  onRowClick,
  onRowDoubleClick,
  onCreate,
  searchKeys = [],
  getRowClassName,
  initialVisibleKeys,
}) {
  const [query, setQuery] = useState('')
  const [showColumnSelector, setShowColumnSelector] = useState(false)
  const columnSelectorRef = useRef(null)

  useEffect(() => {
    function handleClickOutsideSelector(event) {
      if (columnSelectorRef.current && !columnSelectorRef.current.contains(event.target)) {
        setShowColumnSelector(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutsideSelector)
    return () => document.removeEventListener('mousedown', handleClickOutsideSelector)
  }, [])

  const [visibleKeys, setVisibleKeys] = useState(() => initialVisibleKeys ?? columns.map((c) => c.key))

  const visibleColumns = useMemo(() => {
    return columns.filter((c) => visibleKeys.includes(c.key))
  }, [columns, visibleKeys])

  const filtered = useMemo(() => {
    if (!query.trim()) return rows
    const q = query.toLowerCase()
    return rows.filter((row) =>
      searchKeys.some((key) => String(row[key] ?? '').toLowerCase().includes(q))
    )
  }, [rows, query, searchKeys])

  return (
    <div className="bg-white rounded-2xl w-full h-full border border-[var(--line)] shadow-xs overflow-hidden flex flex-col transition-all duration-300">
      
      {/* Table Header Bar */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-4 px-6 py-3.5 border-b border-[var(--line)] bg-[var(--mist)]/40">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-[var(--ink)] tracking-tight font-sans">{title}</h2>
          <span className="px-3 py-0.5 rounded-full bg-blue-50 text-[var(--blue)] border border-blue-200 text-xs font-mono font-semibold">
            {filtered.length} {filtered.length === 1 ? 'record' : 'records'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {searchKeys.length > 0 && <SearchInput value={query} onChange={setQuery} />}

          {/* Toggle Columns Dropdown */}
          <div className="relative" ref={columnSelectorRef}>
            <button
              type="button"
              onClick={() => setShowColumnSelector(!showColumnSelector)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-xl border border-[var(--line)] bg-white hover:bg-slate-50 text-[var(--ink)] transition-all shadow-xs"
              title="Toggle Columns"
            >
              <FiFilter size={13} className="text-[var(--blue)]" />
              <span>Columns</span>
            </button>

            {showColumnSelector && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 mt-2 w-64 rounded-2xl shadow-xl bg-white border border-[var(--line)] z-50 py-3 px-3 text-left font-normal text-slate-700"
              >
                <div className="text-[10px] font-mono font-bold text-[var(--blue)] mb-2 px-1 uppercase tracking-wider">
                  Visible Columns
                </div>
                <div className="max-h-72 overflow-y-auto space-y-1">
                  {columns.map((col) => (
                    <label
                      key={col.key}
                      className="flex items-center gap-2.5 py-1.5 px-2 hover:bg-slate-50 rounded-xl cursor-pointer text-xs font-medium text-[var(--ink)] transition-colors"
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
                        className="rounded text-[var(--blue)] focus:ring-[var(--blue)] w-3.5 h-3.5"
                      />
                      <span>{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {onCreate && (
            <button
              type="button"
              onClick={onCreate}
              className="btn-primary text-xs !py-1.5 !px-3.5"
            >
              + New Record
            </button>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto w-full">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-[var(--mist)]">
            <tr className="border-b border-[var(--line)] text-[11px] font-mono uppercase text-[var(--muted)] tracking-wider">
              {visibleColumns.map((c) => (
                <th key={c.key} className="px-5 py-3 font-bold whitespace-nowrap">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)] font-sans">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={visibleColumns.length} className="px-6 py-14 text-center text-slate-400 font-normal text-sm">
                  <div className="max-w-xs mx-auto text-center space-y-1">
                    <p className="text-[var(--ink)] font-semibold text-sm">No records found</p>
                    <p className="text-xs text-[var(--muted)]">Try adjusting your filters or search query.</p>
                  </div>
                </td>
              </tr>
            )}
            {filtered.map((row) => {
              const customBg = getRowClassName ? getRowClassName(row) : 'hover:bg-slate-50/80'
              return (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row)}
                  onDoubleClick={() => onRowDoubleClick?.(row)}
                  className={`cursor-pointer transition-colors ${customBg}`}
                >
                  {visibleColumns.map((c) => (
                    <td key={c.key} className="px-5 py-3.5 whitespace-nowrap text-[var(--ink)] text-xs">
                      {c.render ? c.render(row) : row[c.key]}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Table Footer Bar */}
      <div className="shrink-0 px-5 py-3 border-t border-[var(--line)] bg-[var(--mist)]/40 flex items-center justify-between text-xs text-[var(--muted)] font-mono">
        <span>Showing {filtered.length} of {rows.length} total entries</span>
        <span className="text-[11px] text-[var(--blue)] font-sans font-medium">Double-click any row to view details</span>
      </div>

    </div>
  )
}
