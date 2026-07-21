export default function SectionCard({ title, actions, className = '', children }) {
  return (
    <div className={`section-card ${className}`}>
      <div className="flex items-center justify-between">
        <div className="section-title flex-1">{title}</div>
        {actions}
      </div>
      {children}
    </div>
  )
}
