function Wrapper({ label, className = '', children }) {
  return (
    <div className={className}>
      {label ? <label className="field-label">{label}</label> : null}
      {children}
    </div>
  )
}

export function TextField({ label, value, onChange, disabled, placeholder, className = '' }) {
  return (
    <Wrapper label={label} className={className}>
      <input
        type="text"
        className="field-input"
        value={value ?? ''}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </Wrapper>
  )
}

export function NumberField({ label, value, onChange, disabled, placeholder, className = '', step }) {
  return (
    <Wrapper label={label} className={className}>
      <input
        type="number"
        step={step ?? 'any'}
        className="field-input"
        value={value ?? ''}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value === '' ? '' : Number(e.target.value))}
      />
    </Wrapper>
  )
}

export function DateField({ label, value, onChange, disabled, className = '' }) {
  return (
    <Wrapper label={label} className={className}>
      <input
        type="date"
        className="field-input"
        value={value ?? ''}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </Wrapper>
  )
}

export function DateTimeField({ label, value, onChange, disabled, className = '' }) {
  return (
    <Wrapper label={label} className={className}>
      <input
        type="datetime-local"
        className="field-input"
        value={value ?? ''}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </Wrapper>
  )
}

export function TextAreaField({ label, value, onChange, disabled, rows = 3, className = '' }) {
  return (
    <Wrapper label={label} className={className}>
      <textarea
        className="field-input"
        rows={rows}
        value={value ?? ''}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </Wrapper>
  )
}

export function SelectField({ label, value, onChange, options, disabled, placeholder, className = '' }) {
  return (
    <Wrapper label={label} className={className}>
      <select
        className="field-input"
        value={value ?? ''}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
      >
        <option value="">{placeholder ?? '-'}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Wrapper>
  )
}

export function CheckboxField({ label, checked, onChange, disabled, className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <input
        type="checkbox"
        className="h-4 w-4 accent-brand-500"
        checked={!!checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
      />
      {label ? <label className="field-label mb-0">{label}</label> : null}
    </div>
  )
}

// Many2one stand-in: renders a <select> sourced from a lookup collection.
// `options` is an array of { id, name } records already filtered by any domain.
export function Many2OneField({ label, value, onChange, options, disabled, placeholder, className = '' }) {
  return (
    <Wrapper label={label} className={className}>
      <select
        className="field-input"
        value={value ?? ''}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">{placeholder ?? '-'}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </Wrapper>
  )
}

// Many2many stand-in: chips for selected values + a select to add more.
export function Many2ManyField({ label, value = [], onChange, options, disabled, className = '' }) {
  const selected = options.filter((o) => value.includes(o.id))
  const remaining = options.filter((o) => !value.includes(o.id))

  return (
    <Wrapper label={label} className={className}>
      <div className="flex flex-wrap gap-2 mb-2">
        {selected.map((o) => (
          <span
            key={o.id}
            className="inline-flex items-center gap-1 bg-brand-100 text-brand-700 text-xs font-medium px-2 py-1 rounded-full"
          >
            {o.name}
            {!disabled && (
              <button
                type="button"
                className="ml-1 text-brand-700/70 hover:text-brand-700"
                onClick={() => onChange?.(value.filter((id) => id !== o.id))}
              >
                ×
              </button>
            )}
          </span>
        ))}
        {selected.length === 0 && <span className="text-xs text-gray-400">None</span>}
      </div>
      {!disabled && remaining.length > 0 && (
        <select
          className="field-input"
          value=""
          onChange={(e) => {
            if (e.target.value) onChange?.([...value, Number(e.target.value)])
          }}
        >
          <option value="">+ Add...</option>
          {remaining.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      )}
    </Wrapper>
  )
}

// Binary field stand-in: no real backend, so we just remember the chosen file's name.
export function BinaryField({ label, fileName, onChange, disabled, className = '' }) {
  return (
    <Wrapper label={label} className={className}>
      <div className="flex items-center gap-2">
        <input
          type="file"
          disabled={disabled}
          className="text-sm"
          onChange={(e) => onChange?.(e.target.files?.[0]?.name ?? '', e.target.files?.[0])}
        />
      </div>
      {fileName ? <p className="text-xs text-gray-500 mt-1">📄 {fileName}</p> : null}
    </Wrapper>
  )
}

export function RadioField({ label, value, onChange, options, disabled, className = '' }) {
  return (
    <Wrapper label={label} className={className}>
      <div className="flex gap-4">
        {options.map((o) => (
          <label key={o.value} className="flex items-center gap-1 text-sm">
            <input
              type="radio"
              name={label}
              value={o.value}
              checked={value === o.value}
              disabled={disabled}
              onChange={(e) => onChange?.(e.target.value)}
            />
            {o.label}
          </label>
        ))}
      </div>
    </Wrapper>
  )
}
