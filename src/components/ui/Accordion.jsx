import { useState } from 'react'

export default function Accordion({ title, defaultOpen = false, headerClassName = '', children }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between px-4 py-3 font-bold text-brand-700 ${headerClassName}`}
      >
        <span>{title}</span>
        <span className={`transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && <div className="p-4 bg-brand-50">{children}</div>}
    </div>
  )
}
