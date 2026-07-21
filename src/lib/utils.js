export function computeAge(dob) {
  if (!dob) return 0
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return 0
  const today = new Date()
  let age = today.getFullYear() - d.getFullYear()
  const monthDiff = today.getMonth() - d.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d.getDate())) age--
  return age
}

export function formatCurrency(value) {
  const n = Number(value) || 0
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatDateTime(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString()
}

const PALETTE = [
  '#2F6FA3', '#5BB95A', '#F16975', '#FF9800', '#9C27B0',
  '#26C6DA', '#8D6E63', '#EC407A', '#009688', '#7E57C2',
]

// Deterministic color for a given id, used to color-code calendar events by
// patient the same way Odoo's calendar widget does with color="patient".
export function colorForId(id) {
  if (!id && id !== 0) return '#90A4AE'
  return PALETTE[Number(id) % PALETTE.length]
}

export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function startOfWeek(d) {
  // Saturday-start week, matching the addon's own calendar widget.
  const day = d.getDay()
  const diff = -((day - 6 + 7) % 7)
  const s = new Date(d)
  s.setDate(d.getDate() + diff)
  s.setHours(0, 0, 0, 0)
  return s
}

export function formatHeaderDate(d) {
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatTime(value) {

  if (!value) return ''

  const d = new Date(value)

  if (Number.isNaN(d.getTime())) return ''

  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })

}

