import { FiSearch } from 'react-icons/fi'

export default function SearchInput({ value, onChange, placeholder = 'Search...', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#00828a]" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-56 pl-9 pr-3.5 py-1.5 text-xs font-normal bg-white border border-[#d8f1f2] rounded-full transition-all focus:outline-none focus:border-[#00828a] focus:ring-2 focus:ring-[#00828a]/15 text-slate-800 placeholder:text-slate-400 shadow-xs"
      />
    </div>
  )
}
