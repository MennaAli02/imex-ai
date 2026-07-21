import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../../data/DataContext'
import { isSameDay, startOfWeek } from '../../lib/utils'
import MiniMonthCalendar from '../../components/calendar/MiniMonthCalendar'

// Stand-in for the addon's custom `ris_calendar` OWL widget: a day/week
// time-grid scheduler with modality columns (day mode), weekday columns
// (week mode), drag-to-reschedule, click-empty-slot-to-book, and a
// click-to-preview popup - same interactions as static/src/js/ris_calendar_view.js.

const ROW_HEIGHT = 56
const START_HOUR = 7
const END_HOUR = 21
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i)

const STATE_FILTER_DEFS = [
  { key: '4', label: 'Appointment', color: '#4CAF50', defaultChecked: true },
  { key: '1', label: 'Arrived', color: '#26C6DA', defaultChecked: true },
  { key: '2', label: 'Paid', color: '#1E88E5', defaultChecked: true },
  { key: '3', label: 'Pending', color: '#FF9800', defaultChecked: true },
  { key: '7', label: 'Under Inspection', color: '#9C27B0', defaultChecked: true },
  { key: '8', label: 'Completed', color: '#8BC34A', defaultChecked: true },
  { key: '5', label: 'Cancelled', color: '#F44336', defaultChecked: false },
  { key: '9', label: 'Fully Delivered', color: '#009688', defaultChecked: false },
  { key: '10', label: 'Photos Delivered', color: '#E91E63', defaultChecked: false },
  { key: '11', label: 'Report Delivered', color: '#673AB7', defaultChecked: false },
  { key: '6', label: 'Refunded', color: '#90A4AE', defaultChecked: false },
]

const MODALITY_COLORS = ['#0097A7', '#00897B', '#5C6BC0', '#7E57C2', '#EF5350', '#FF7043']

function fmtAmPm(h, m) {
  const suffix = h >= 12 ? 'PM' : 'AM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`
}

export default function RisScheduler({ onSwitchToList }) {
  const navigate = useNavigate()
  const { getAll, reschedule } = useData()

  const categories = getAll('categories')
  const machines = getAll('machines')
  const managements = getAll('managements')
  const patients = getAll('patients')
  const doctors = getAll('doctors')

  const [mode, setMode] = useState('day')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [modalityFilter, setModalityFilter] = useState(() => new Set(categories.map((c) => c.id)))
  const [stateFilter, setStateFilter] = useState(() => new Set(STATE_FILTER_DEFS.filter((s) => s.defaultChecked).map((s) => s.key)))
  const [popup, setPopup] = useState(null)
  const colRefs = useRef({})

  const events = useMemo(() => {
    return managements
      .filter((m) => m.examDate && stateFilter.has(m.state))
      .map((m) => ({
        ...m,
        _date: new Date(m.examDate),
        _patientName: patients.find((p) => p.id === m.patientId)?.nickname ?? '—',
        _doctorName: doctors.find((d) => d.id === (m.radDoctorId || m.doctorId))?.partnerName ?? '—',
        _productName: null,
      }))
  }, [managements, stateFilter, patients, doctors])

  const weekDays = useMemo(() => {
    const s = startOfWeek(currentDate)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(s)
      d.setDate(s.getDate() + i)
      return d
    })
  }, [currentDate])

  const dayColumns = categories.filter((c) => modalityFilter.has(c.id))
  const columns = mode === 'day' ? dayColumns : weekDays.map((d) => ({ id: d.toISOString(), date: d }))

  const headerTitle = useMemo(() => {
    if (mode === 'day') {
      return currentDate.toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })
    }
    const s = startOfWeek(currentDate)
    const e = new Date(s)
    e.setDate(s.getDate() + 6)
    return `${s.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
  }, [mode, currentDate])

  const goPrev = () => setCurrentDate((d) => { const n = new Date(d); n.setDate(n.getDate() - (mode === 'day' ? 1 : 7)); return n })
  const goNext = () => setCurrentDate((d) => { const n = new Date(d); n.setDate(n.getDate() + (mode === 'day' ? 1 : 7)); return n })
  const goToday = () => setCurrentDate(new Date())

  const toggleModality = (id) => setModalityFilter((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleState = (key) => setStateFilter((s) => { const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n })

  const eventsForColumn = (col) => {
    return events.filter((ev) => {
      if (mode === 'day') {
        return ev.categoryId === col.id && isSameDay(ev._date, currentDate)
      }
      return modalityFilter.has(ev.categoryId) && isSameDay(ev._date, col.date)
    })
  }

  const slotFromOffset = (offsetY) => {
    const hourFloat = offsetY / ROW_HEIGHT
    let hour = START_HOUR + Math.floor(hourFloat)
    let minute = Math.round(((hourFloat % 1) * 60) / 15) * 15
    if (minute === 60) { minute = 0; hour += 1 }
    hour = Math.min(Math.max(hour, START_HOUR), END_HOUR)
    return { hour, minute }
  }

  const buildExamDateString = (hour, minute, colDate) => {
    const d = new Date(colDate)
    d.setHours(hour, minute, 0, 0)
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(hour)}:${pad(minute)}`
  }

  const handleCellClick = (e, col) => {
    if (e.target.closest('.ris-appt-chip')) return
    const rect = e.currentTarget.getBoundingClientRect()
    const { hour, minute } = slotFromOffset(e.clientY - rect.top)
    const colDate = mode === 'day' ? currentDate : col.date
    const examDate = buildExamDateString(hour, minute, colDate)

    const prefill = { examDate }
    if (mode === 'day') {
      prefill.categoryId = col.id
      const machine = machines.find((m) => m.name.toLowerCase().includes(col.name.split(' ')[0].toLowerCase()))
      if (machine) prefill.machineId = machine.id
    }
    navigate('/appointments/new', { state: prefill })
  }

  const handleDragStart = (e, apptId) => {
    e.dataTransfer.setData('text/plain', String(apptId))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDrop = (e, col) => {
    e.preventDefault()
    e.currentTarget.classList.remove('bg-brand-50')
    const apptId = Number(e.dataTransfer.getData('text/plain'))
    if (!apptId) return
    const rect = e.currentTarget.getBoundingClientRect()
    const { hour, minute } = slotFromOffset(e.clientY - rect.top)
    const colDate = mode === 'day' ? currentDate : col.date
    const examDate = buildExamDateString(hour, minute, colDate)
    const vals = { examDate }
    if (mode === 'day') {
      vals.categoryId = col.id
      const machine = machines.find((m) => m.name.toLowerCase().includes(col.name.split(' ')[0].toLowerCase()))
      if (machine) vals.machineId = machine.id
    }
    reschedule(apptId, vals)
  }

  const openPopup = (e, ev) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setPopup({ event: ev, top: rect.bottom + 6, left: rect.left })
  }

  return (
    <div className="h-full flex flex-col md:flex-row gap-4 min-h-0 overflow-hidden">
      {/* Left Filters Card */}
      <div className="w-64 flex-shrink-0 bg-white rounded-3xl border border-[#e2f1f1] p-4 shadow-sm flex flex-col space-y-4 overflow-y-auto max-h-full">
        <button
          type="button"
          onClick={() => navigate('/appointments/new')}
          className="w-full bg-[#00828a] hover:bg-[#006c73] text-white text-xs font-medium px-4 py-2 rounded-full shadow-sm transition-all"
        >
          + New Appointment
        </button>

        <MiniMonthCalendar selectedDate={currentDate} onSelectDay={setCurrentDate} />

        <div className="border-t border-[#edf7f6] pt-3">
          <p className="text-xs font-semibold text-[#00828a] mb-2 uppercase tracking-wider">Modalities</p>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {categories.map((c, i) => (
              <label key={c.id} className="flex items-center gap-2 text-xs font-normal text-slate-700 cursor-pointer hover:text-[#00828a]">
                <input type="checkbox" checked={modalityFilter.has(c.id)} onChange={() => toggleModality(c.id)} className="rounded text-[#00828a] focus:ring-[#00828a] w-3.5 h-3.5" />
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: MODALITY_COLORS[i % MODALITY_COLORS.length] }} />
                <span className="truncate">{c.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="border-t border-[#edf7f6] pt-3">
          <p className="text-xs font-semibold text-[#00828a] mb-2 uppercase tracking-wider">Status</p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {STATE_FILTER_DEFS.map((s) => (
              <label key={s.key} className="flex items-center gap-2 text-xs font-normal text-slate-700 cursor-pointer hover:text-[#00828a]">
                <input type="checkbox" checked={stateFilter.has(s.key)} onChange={() => toggleState(s.key)} className="rounded text-[#00828a] focus:ring-[#00828a] w-3.5 h-3.5" />
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                <span className="truncate">{s.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Right Main Full-Page Calendar Card */}
      <div className="flex-1 min-w-0 min-h-0 bg-white rounded-3xl border border-[#e2f1f1] shadow-md flex flex-col overflow-hidden">
        {/* Header Control Bar */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-[#e2f1f1] bg-[#fafcfc] flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button type="button" onClick={goPrev} className="px-2.5 py-1 rounded-full border border-[#d8f1f2] hover:bg-[#d8f1f2] text-[#00828a] text-xs font-medium">‹</button>
            <button type="button" onClick={goToday} className="px-3.5 py-1 rounded-full bg-[#d8f1f2] text-[#00828a] text-xs font-medium border border-[#bce5e7] hover:bg-[#c6eaec]">Today</button>
            <button type="button" onClick={goNext} className="px-2.5 py-1 rounded-full border border-[#d8f1f2] hover:bg-[#d8f1f2] text-[#00828a] text-xs font-medium">›</button>
            <span className="font-semibold text-[#00828a] text-sm ml-2">{headerTitle}</span>
          </div>
          <div className="flex gap-1 bg-[#d8f1f2]/60 p-1 rounded-full border border-[#bce5e7]">
            {['day', 'week'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all ${mode === m ? 'bg-white shadow text-[#00828a] font-semibold' : 'text-slate-600 hover:text-[#00828a]'}`}
              >
                {m}
              </button>
            ))}
            <button type="button" onClick={onSwitchToList} className="px-3 py-1 rounded-full text-xs font-medium text-slate-600 hover:text-[#00828a]">
              List
            </button>
          </div>
        </div>

        {/* Full-Height Scrollable Time Scheduler Grid */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto w-full custom-scrollbar p-2">
          <div className="flex min-w-full">
            <div className="w-16 flex-shrink-0 pt-8 text-right pr-2 text-xs text-slate-400 font-medium">
              {HOURS.map((h) => (
                <div key={h} style={{ height: ROW_HEIGHT }}>{fmtAmPm(h, 0)}</div>
              ))}
            </div>

            {columns.map((col) => (
              <div key={col.id} className="flex-1 min-w-[150px] border-l border-[#edf7f6]">
                <div className="h-8 flex items-center justify-center text-xs font-semibold text-[#00828a] bg-[#f2f9f9] border-b border-[#e2f1f1] sticky top-0 z-10 rounded-t-xl">
                  {mode === 'day' ? col.name : `${['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'][(col.date.getDay() - 6 + 7) % 7]} ${col.date.getDate()}/${col.date.getMonth() + 1}`}
                </div>
                <div
                  ref={(el) => (colRefs.current[col.id] = el)}
                  className="relative transition-colors"
                  style={{ height: ROW_HEIGHT * HOURS.length }}
                  onClick={(e) => handleCellClick(e, col)}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-[#d8f1f2]/30') }}
                  onDragLeave={(e) => e.currentTarget.classList.remove('bg-[#d8f1f2]/30')}
                  onDrop={(e) => handleDrop(e, col)}
                >
                  {HOURS.map((h, i) => (
                    <div key={h} className="absolute left-0 right-0 border-t border-gray-100" style={{ top: i * ROW_HEIGHT }} />
                  ))}
                  {eventsForColumn(col).map((ev) => {
                    const hour = ev._date.getHours()
                    const minute = ev._date.getMinutes()
                    const top = (hour - START_HOUR) * ROW_HEIGHT + (minute / 60) * ROW_HEIGHT
                    const stateColor = STATE_FILTER_DEFS.find((s) => s.key === ev.state)?.color ?? '#90A4AE'
                    return (
                      <div
                        key={ev.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, ev.id)}
                        onClick={(e) => openPopup(e, ev)}
                        className="ris-appt-chip absolute left-1 right-1 rounded-md px-2 py-1 text-white text-xs shadow cursor-pointer overflow-hidden"
                        style={{ top, height: 26, background: stateColor }}
                        title={`${ev._patientName} - ${fmtAmPm(hour, minute)}`}
                      >
                        {ev._patientName}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {popup && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setPopup(null)} />
          <div
            className="fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 w-72 text-sm"
            style={{ top: popup.top, left: Math.min(popup.left, window.innerWidth - 300) }}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-bold text-brand-700">{popup.event._patientName}</span>
              <button onClick={() => setPopup(null)} className="text-gray-400 hover:text-gray-700">×</button>
            </div>
            <p className="text-gray-500 mb-1">🕒 {popup.event._date.toLocaleString()}</p>
            <p className="text-gray-500 mb-1">🩺 Doctor: {popup.event._doctorName}</p>
            <p className="text-gray-500 mb-3">📋 Accession: {popup.event.accession}</p>
            <button
              onClick={() => navigate(`/appointments/${popup.event.id}`)}
              className="w-full bg-brand-500 hover:bg-brand-700 text-white text-sm font-semibold px-3 py-2 rounded-md"
            >
              Open Appointment
            </button>
          </div>
        </>
      )}
    </div>
  )
}
