import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../../data/DataContext'
import { colorForId, isSameDay, startOfWeek } from '../../lib/utils'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'

const EVENT_LIMIT = 2
const WEEKDAY_LABELS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']

// Stand-in for the plain Odoo <calendar> view used by WorkList
export default function WorkListCalendar({ onSwitchToList }) {
  const navigate = useNavigate()
  const { getAll } = useData()

  const managements = getAll('managements')
  const patients = getAll('patients')
  const doctors = getAll('doctors')

  const [scale, setScale] = useState('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [patientFilter, setPatientFilter] = useState(() => new Set(patients.map((p) => p.id)))
  const [doctorFilter, setDoctorFilter] = useState(() => new Set(doctors.map((d) => d.id)))
  const [expanded, setExpanded] = useState(() => new Set())

  const events = useMemo(() => {
    return managements
      .filter((m) => m.examDate)
      .filter((m) => patientFilter.has(m.patientId))
      .filter((m) => !m.doctorId || doctorFilter.has(m.doctorId))
      .map((m) => ({
        ...m,
        _date: new Date(m.examDate),
        _patientName: patients.find((p) => p.id === m.patientId)?.nickname ?? '—',
      }))
  }, [managements, patientFilter, doctorFilter, patients])

  const eventsForDay = (date) => events.filter((ev) => isSameDay(ev._date, date)).sort((a, b) => a._date - b._date)

  const goPrev = () => setCurrentDate((d) => {
    const n = new Date(d)
    if (scale === 'day') n.setDate(n.getDate() - 1)
    else if (scale === 'week') n.setDate(n.getDate() - 7)
    else n.setMonth(n.getMonth() - 1)
    return n
  })
  const goNext = () => setCurrentDate((d) => {
    const n = new Date(d)
    if (scale === 'day') n.setDate(n.getDate() + 1)
    else if (scale === 'week') n.setDate(n.getDate() + 7)
    else n.setMonth(n.getMonth() + 1)
    return n
  })
  const goToday = () => setCurrentDate(new Date())

  const togglePatient = (id) => setPatientFilter((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleDoctor = (id) => setDoctorFilter((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleExpanded = (key) => setExpanded((s) => { const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n })

  const headerTitle = useMemo(() => {
    if (scale === 'day') return currentDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    if (scale === 'month') return currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    const s = startOfWeek(currentDate)
    const e = new Date(s)
    e.setDate(s.getDate() + 6)
    return `${s.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
  }, [scale, currentDate])

  const renderDayChips = (date, dense) => {
    const dayEvents = eventsForDay(date)
    const key = date.toDateString()
    const isExpanded = expanded.has(key)
    const visible = isExpanded ? dayEvents : dayEvents.slice(0, EVENT_LIMIT)
    const hidden = dayEvents.length - visible.length

    return (
      <div className="space-y-1 mt-1">
        {visible.map((ev) => (
          <button
            key={ev.id}
            type="button"
            onClick={() => navigate(`/management/${ev.id}`)}
            className="w-full text-left text-xs px-2.5 py-1.5 rounded-xl text-white font-medium truncate block shadow-xs transition-transform hover:scale-[1.02]"
            style={{ background: colorForId(ev.patientId) }}
            title={`${ev._patientName} - ${ev._date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`}
          >
            {!dense && <span className="opacity-90 mr-1 text-[11px] font-normal">{ev._date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>}
            <span>{ev._patientName}</span>
          </button>
        ))}
        {hidden > 0 && (
          <button type="button" onClick={() => toggleExpanded(key)} className="text-[11px] text-[#00828a] font-medium hover:underline">
            +{hidden} more
          </button>
        )}
        {isExpanded && dayEvents.length > EVENT_LIMIT && (
          <button type="button" onClick={() => toggleExpanded(key)} className="text-[11px] text-slate-400 hover:underline block">
            show less
          </button>
        )}
      </div>
    )
  }

  const monthGrid = useMemo(() => {
    const first = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const last = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    const startPad = (first.getDay() - 6 + 7) % 7
    const days = []
    for (let i = 0; i < startPad; i++) days.push(null)
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), d))
    while (days.length % 7 !== 0) days.push(null)
    const rows = []
    for (let i = 0; i < days.length; i += 7) rows.push(days.slice(i, i + 7))
    return rows
  }, [currentDate])

  const weekDays = useMemo(() => {
    const s = startOfWeek(currentDate)
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(s); d.setDate(s.getDate() + i); return d })
  }, [currentDate])

  const today = new Date()

  return (
    <div className="h-full flex flex-col md:flex-row gap-4 min-h-0 overflow-hidden">
      {/* Left Filters Card */}
      <div className="w-64 flex-shrink-0 bg-white rounded-3xl border border-[#e2f1f1] p-4 shadow-sm flex flex-col space-y-4 overflow-y-auto max-h-full">
        <div>
          <p className="text-xs font-semibold text-[#00828a] mb-2 uppercase tracking-wider">Patients</p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {patients.map((p) => (
              <label key={p.id} className="flex items-center gap-2 text-xs font-normal text-slate-700 cursor-pointer hover:text-[#00828a]">
                <input type="checkbox" checked={patientFilter.has(p.id)} onChange={() => togglePatient(p.id)} className="rounded text-[#00828a] focus:ring-[#00828a] w-3.5 h-3.5" />
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: colorForId(p.id) }} />
                <span className="truncate">{p.nickname}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="border-t border-[#edf7f6] pt-3">
          <p className="text-xs font-semibold text-[#00828a] mb-2 uppercase tracking-wider">Doctors</p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {doctors.map((d) => (
              <label key={d.id} className="flex items-center gap-2 text-xs font-normal text-slate-700 cursor-pointer hover:text-[#00828a]">
                <input type="checkbox" checked={doctorFilter.has(d.id)} onChange={() => toggleDoctor(d.id)} className="rounded text-[#00828a] focus:ring-[#00828a] w-3.5 h-3.5" />
                <span className="truncate">{d.partnerName}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Right Main Full-Page Calendar Card */}
      <div className="flex-1 min-w-0 min-h-0 bg-white rounded-3xl border border-[#e2f1f1] shadow-md flex flex-col overflow-hidden">
        {/* Calendar Header Controls */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-[#e2f1f1] bg-[#fafcfc] flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button type="button" onClick={goPrev} className="p-1.5 rounded-xl border border-[#d8f1f2] hover:bg-[#d8f1f2] text-[#00828a] transition-all">
              <FiChevronLeft size={16} />
            </button>
            <button type="button" onClick={goToday} className="px-3.5 py-1.5 rounded-full bg-[#d8f1f2] text-[#00828a] text-xs font-medium border border-[#bce5e7] hover:bg-[#c6eaec]">
              Today
            </button>
            <button type="button" onClick={goNext} className="p-1.5 rounded-xl border border-[#d8f1f2] hover:bg-[#d8f1f2] text-[#00828a] transition-all">
              <FiChevronRight size={16} />
            </button>
            <span className="font-semibold text-[#00828a] text-sm ml-2">{headerTitle}</span>
          </div>

          <div className="flex gap-1 bg-[#d8f1f2]/60 p-1 rounded-full border border-[#bce5e7]">
            {['day', 'week', 'month'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScale(s)}
                className={`px-3.5 py-1 rounded-full text-xs font-medium capitalize transition-all ${scale === s ? 'bg-white shadow text-[#00828a] font-semibold' : 'text-slate-600 hover:text-[#00828a]'}`}
              >
                {s}
              </button>
            ))}
            <button type="button" onClick={onSwitchToList} className="px-3.5 py-1 rounded-full text-xs font-medium text-slate-600 hover:text-[#00828a]">
              List
            </button>
          </div>
        </div>

        {/* Full-Height Calendar Grid Container */}
        <div className="flex-1 min-h-0 p-4 overflow-y-auto flex flex-col">
          {scale === 'day' && (
            <div className="flex-1 min-h-0 border border-[#e2f1f1] rounded-2xl p-4 bg-white shadow-2xs flex flex-col">
              <p className="font-semibold text-[#00828a] mb-3 text-sm">{currentDate.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              <div className="flex-1 min-h-0 overflow-y-auto">
                {renderDayChips(currentDate, false)}
                {eventsForDay(currentDate).length === 0 && <p className="text-xs text-slate-400 mt-2">No bookings for this day</p>}
              </div>
            </div>
          )}

          {scale === 'week' && (
            <div className="flex-1 min-h-0 grid grid-cols-7 gap-2.5 h-full">
              {weekDays.map((d, i) => {
                const isToday = isSameDay(d, today)
                return (
                  <div key={i} className={`flex-1 h-full min-h-0 border rounded-2xl p-3 flex flex-col transition-all ${isToday ? 'border-[#00828a] bg-[#f2f9f9]/80 shadow-xs' : 'border-[#e2f1f1] bg-white'}`}>
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#edf7f6]">
                      <span className="text-xs font-semibold text-[#00828a]">{WEEKDAY_LABELS[i]}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${isToday ? 'bg-[#00828a] text-white' : 'text-slate-600'}`}>{d.getDate()}</span>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto">
                      {renderDayChips(d, false)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {scale === 'month' && (
            <div className="flex-1 min-h-0 flex flex-col h-full space-y-2">
              <div className="flex-shrink-0 grid grid-cols-7 text-center text-xs font-semibold text-[#00828a] py-1 bg-[#f2f9f9] rounded-xl border border-[#e2f1f1]">
                {WEEKDAY_LABELS.map((w) => <span key={w}>{w}</span>)}
              </div>
              <div className="flex-1 min-h-0 flex flex-col gap-1.5">
                {monthGrid.map((row, rIdx) => (
                  <div key={rIdx} className="flex-1 grid grid-cols-7 gap-1.5 min-h-0">
                    {row.map((d, cIdx) => (
                      <div key={cIdx} className={`h-full min-h-0 border rounded-xl p-1.5 flex flex-col overflow-hidden ${d && isSameDay(d, today) ? 'border-[#00828a] bg-[#f2f9f9]' : 'border-[#e2f1f1] bg-white'}`}>
                        {d && (
                          <>
                            <p className="text-[11px] font-semibold text-slate-500 mb-1">{d.getDate()}</p>
                            <div className="flex-1 min-h-0 overflow-y-auto">
                              {renderDayChips(d, true)}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
