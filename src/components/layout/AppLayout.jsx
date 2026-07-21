import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  FiCalendar,
  FiLayers,
  FiUsers,
  FiFileText,
  FiBell,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi'
import { FaUserDoctor, FaMicroscope } from 'react-icons/fa6'

const NAV_SECTIONS = [
  {
    items: [
      { to: '/appointments', label: 'Appointments', icon: FiCalendar },
      { to: '/management', label: 'WorkList', icon: FiLayers },
    ],
  },
  {
    title: 'CRM & STAFF',
    items: [
      { to: '/patients', label: 'Patients', icon: FiUsers },
      { to: '/doctors', label: 'Doctors', icon: FaUserDoctor },
      { to: '/radiographers', label: 'Radiographers', icon: FaMicroscope },
    ],
  },
  {
    title: 'TEMPLATES',
    items: [{ to: '/document-templates', label: 'Document Templates', icon: FiFileText }],
  },
]

const ROUTE_LABELS = {
  '/appointments': 'Appointment Management & Scheduling',
  '/management': 'WorkList Dashboard',
  '/patients': 'Patient Directory',
  '/doctors': 'Doctor Directory',
  '/radiographers': 'Radiographer Directory',
  '/document-templates': 'Document Templates',
}

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  const currentTitle =
    Object.entries(ROUTE_LABELS).find(([path]) => location.pathname.startsWith(path))?.[1] ||
    'iMex AI · RIS & PACS'

  return (
    <div className="h-screen max-h-screen flex font-sans text-[var(--ink)] selection:bg-[var(--blue)] selection:text-white relative overflow-hidden bg-[var(--mist)]">
      
      {/* Deep Ink Floating Sidebar (#0B1B33) styled like original RIS */}
      <aside
        className={[
          'bg-[var(--ink)] text-white flex-shrink-0 flex flex-col transition-all duration-300 shadow-xl z-20 relative my-3 ml-3 rounded-3xl border border-slate-800/60 overflow-hidden h-[calc(100vh-24px)]',
          collapsed ? 'w-20' : 'w-64',
        ].join(' ')}
      >
        {/* Brand Header */}
        <div className={`py-4 border-b border-slate-800/80 bg-[#06090f] transition-all duration-300 ${collapsed ? 'px-2 flex flex-col items-center gap-2' : 'px-5 flex items-center justify-between gap-3'}`}>
          {!collapsed ? (
            <>
              <NavLink to="/appointments" className="flex items-center gap-3 group min-w-0">
                {/* iMex AI Pill Icon Logo */}
                <div className="flex flex-col gap-1 w-6 py-0.5 justify-center flex-shrink-0">
                  <div className="h-1 bg-[#22D3EE] rounded-full w-4 transition-all group-hover:w-5" />
                  <div className="h-1 bg-[#2563EB] rounded-full w-6" />
                  <div className="h-1 bg-[#22D3EE] rounded-full w-5 transition-all group-hover:w-6" />
                </div>
                <span className="text-lg font-extrabold tracking-tight text-white font-sans truncate">
                  iMex <span className="text-[var(--cyan)] font-extrabold">AI</span>
                </span>
              </NavLink>

              <button
                type="button"
                onClick={() => setCollapsed(true)}
                aria-label="Collapse sidebar"
                className="flex-shrink-0 h-7 w-7 flex items-center justify-center rounded-xl text-slate-300 hover:bg-white/20 hover:text-white transition-all"
              >
                <FiChevronLeft size={16} />
              </button>
            </>
          ) : (
            <>
              <div 
                onClick={() => setCollapsed(false)}
                title="Expand sidebar"
                className="flex flex-col gap-1 w-6 py-1 cursor-pointer hover:scale-105 transition-transform"
              >
                <div className="h-1 bg-[#22D3EE] rounded-full w-4" />
                <div className="h-1 bg-[#2563EB] rounded-full w-6" />
                <div className="h-1 bg-[#22D3EE] rounded-full w-5" />
              </div>
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                aria-label="Expand sidebar"
                className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-lg text-slate-300 hover:bg-white/20 hover:text-white transition-all mt-1"
                title="Expand sidebar"
              >
                <FiChevronRight size={14} />
              </button>
            </>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
          {NAV_SECTIONS.map((section, i) => (
            <div key={i} className="space-y-1">
              {section.title && !collapsed && (
                <p className="px-3pt-2 pb-1 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      [
                        'flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm transition-all duration-200 group relative font-medium',
                        collapsed ? 'justify-center' : '',
                        isActive
                          ? 'bg-white text-[var(--blue)] font-bold shadow-lg shadow-slate-950/20'
                          : 'text-slate-200 hover:bg-white/15 hover:text-white',
                      ].join(' ')
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          size={19}
                          className={`flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                            isActive ? 'text-[var(--blue)]' : 'text-slate-300 group-hover:text-white'
                          }`}
                        />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </>
                    )}
                  </NavLink>
                )
              })}
            </div>
          ))}
        </nav>

        {/* User Info Footer in Sidebar */}
        <div className="p-3 border-t border-slate-800/80 bg-[#06090f]">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-2xl bg-[var(--blue)] flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0">
              SH
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="font-mono text-xs font-bold text-slate-200 truncate">DR. S. HASSAN</p>
                <p className="text-[10px] font-mono text-slate-400 uppercase">Radiologist</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 z-10 relative my-3 mr-3 ml-3 h-[calc(100vh-24px)] overflow-hidden">
        
        {/* Floating Top Header Navbar (Matching RIS Geometry with iMex AI Tokens) */}
        <header className="flex-shrink-0 h-14 bg-white rounded-3xl border border-[var(--line)] px-6 flex items-center justify-between shadow-xs mb-3">
          <div className="flex items-center gap-3">
            <div className="h-6 w-1 bg-[var(--blue)] rounded-full" />
            <div>
              <h2 className="text-base font-bold text-[var(--ink)] tracking-tight leading-none">
                {currentTitle}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-[var(--muted)] hidden sm:inline-block">
              iMex AI · RIS & PACS
            </span>
            <button
              type="button"
              className="p-2 text-[var(--ink)] hover:bg-[var(--mist)] rounded-full transition-all relative border border-[var(--line)]"
              title="Notifications"
            >
              <FiBell size={16} />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <Outlet />
        </main>
      </div>

    </div>
  )
}
