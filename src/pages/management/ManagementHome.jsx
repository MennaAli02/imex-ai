import { useState } from 'react'
import { FiList, FiCalendar } from 'react-icons/fi'
import ManagementList from './ManagementList'
import WorkListCalendar from './WorkListCalendar'

export default function ManagementHome() {
  const [view, setView] = useState('list')

  return (
    <div className="h-full flex flex-col min-h-0 space-y-4">
      {/* View Toggle */}
      <div className="flex-shrink-0 flex items-center justify-between">
        <div className="flex gap-1.5 bg-white p-1 rounded-xl border border-[var(--line)] shadow-xs">
          <button
            type="button"
            onClick={() => setView('list')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              view === 'list'
                ? 'bg-[var(--blue)] text-white shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            <FiList size={14} />
            <span>List View</span>
          </button>
          <button
            type="button"
            onClick={() => setView('calendar')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              view === 'calendar'
                ? 'bg-[var(--blue)] text-white shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            <FiCalendar size={14} />
            <span>Calendar View</span>
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {view === 'list' ? <ManagementList /> : <WorkListCalendar onSwitchToList={() => setView('list')} />}
      </div>
    </div>
  )
}
