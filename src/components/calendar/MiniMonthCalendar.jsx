import { useState } from 'react'
import { isSameDay } from '../../lib/utils'

// Small month-jump calendar, used as the sidebar mini-calendar in the
// RIS Appointment scheduler.
export default function MiniMonthCalendar({ selectedDate, onSelectDay }) {
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth())

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  const weeks = (() => {
    const first = new Date(viewYear, viewMonth, 1)
    const last = new Date(viewYear, viewMonth + 1, 0)
    const startPad = (first.getDay() - 6 + 7) % 7
    const days = []
    for (let i = 0; i < startPad; i++) days.push(null)
    for (let d = 1; d <= last.getDate(); d++) days.push(d)
    const rows = []
    for (let i = 0; i < days.length; i += 7) rows.push(days.slice(i, i + 7))
    if (rows.length && rows[rows.length - 1].length < 7) {
      while (rows[rows.length - 1].length < 7) rows[rows.length - 1].push(null)
    }
    return rows
  })()

  const goPrev = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1) } else setViewMonth((m) => m - 1)
  }
  const goNext = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1) } else setViewMonth((m) => m + 1)
  }

  const today = new Date()

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 text-xs">
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={goPrev} className="px-2 text-gray-500 hover:text-brand-700">‹</button>
        <span className="font-semibold text-brand-700">{monthLabel}</span>
        <button type="button" onClick={goNext} className="px-2 text-gray-500 hover:text-brand-700">›</button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-gray-400 mb-1">
        {['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 gap-0.5 mb-0.5">
          {week.map((day, di) => {
            if (!day) return <span key={di} />
            const date = new Date(viewYear, viewMonth, day)
            const isToday = isSameDay(date, today)
            const isSelected = isSameDay(date, selectedDate)
            return (
              <button
                key={di}
                type="button"
                onClick={() => onSelectDay(date)}
                className={[
                  'py-1 rounded-full',
                  isSelected ? 'bg-brand-500 text-white font-semibold' : isToday ? 'text-brand-700 font-semibold' : 'hover:bg-gray-100',
                ].join(' ')}
              >
                {day}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
