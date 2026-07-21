// Stand-in for Odoo's <field widget="statusbar"/> - shows the workflow steps
// as pills and lets you click ahead to a later state, same as the real widget.
export default function StatusBar({ options, value, onChange }) {
  const currentIndex = options.findIndex((o) => o.value === value)

  return (
    <div className="flex flex-wrap gap-1 bg-white/10 rounded-lg p-1">
      {options.map((o, i) => {
        const isCurrent = o.value === value
        const isPast = currentIndex >= 0 && i < currentIndex
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange?.(o.value)}
            className={[
              'px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors',
              isCurrent
                ? 'bg-white text-brand-700 shadow'
                : isPast
                ? 'bg-white/40 text-brand-700'
                : 'bg-transparent text-white/80 hover:bg-white/20',
            ].join(' ')}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
