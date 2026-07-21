const STYLES = {
  gray: {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  },
  danger: {
    bg: 'bg-[#ffe3e3] text-[#c53030] border-[#feb2b2]',
    dot: 'bg-[#e53e3e]',
  },
  info: {
    bg: 'bg-[#d8f1f2] text-[#00828a] border-[#bce5e7]',
    dot: 'bg-[#00828a]',
  },
  success: {
    bg: 'bg-[#e6f4ea] text-[#137333] border-[#ceead6]',
    dot: 'bg-[#34a853]',
  },
  warning: {
    bg: 'bg-[#ffe8d6] text-[#c05621] border-[#fbd38d]',
    dot: 'bg-[#ffa834]',
  },
}

export default function Badge({ text, color = 'gray' }) {
  const style = STYLES[color] || STYLES.info
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-normal border ${style.bg}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {text}
    </span>
  )
}
