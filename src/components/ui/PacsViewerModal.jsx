import { useState } from 'react'
import { FiX, FiMaximize2, FiSliders, FiPlus, FiZoomIn, FiMove, FiClock, FiEdit3 } from 'react-icons/fi'

export default function PacsViewerModal({ row, onClose }) {
  const [viewMode, setViewMode] = useState('viewer') // 'browser' or 'viewer'
  const [aiOverlay, setAiOverlay] = useState(true)
  const [activeTool, setActiveTool] = useState('measure')

  const patientName = row?.patientName || 'A. MOSTAFA'
  const mrn = row?.mrn || row?.patientId || '49201'
  const accession = row?.accessionNumber || '#20413'
  const studyName = row?.studyName || row?.studyDescription || 'CT Chest w/o'

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col font-sans select-none overflow-hidden text-white">
      
      {/* PACS Top Navigation Header Bar (PDF Page 5 & 6 Concept) */}
      <header className="bg-[#0B1B33] border-b border-slate-800 px-5 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-1 w-5">
              <div className="h-1 bg-[#22D3EE] rounded-full w-3" />
              <div className="h-1 bg-[#2563EB] rounded-full w-5" />
              <div className="h-1 bg-[#22D3EE] rounded-full w-4" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-white">
              iMex <span className="text-[var(--cyan)]">AI</span>
            </span>
          </div>

          {/* Mode Pill Badge */}
          <span className="bg-[#112440] text-slate-300 font-mono text-[11px] font-semibold px-2.5 py-0.5 rounded-md border border-slate-700/60 uppercase tracking-widest">
            PACS
          </span>

          {/* Title Info */}
          <span className="font-mono text-xs text-slate-300 tracking-wider hidden sm:inline-block ml-2 border-l border-slate-700 pl-4">
            {patientName} · {studyName.toUpperCase()} · {accession}
          </span>
        </div>

        {/* Header Right Controls */}
        <div className="flex items-center gap-3">
          {viewMode === 'viewer' ? (
            <>
              <button
                type="button"
                onClick={() => setAiOverlay(!aiOverlay)}
                className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all ${
                  aiOverlay
                    ? 'bg-[var(--cyan)] text-[#042f2e] shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                AI OVERLAY {aiOverlay ? 'ON' : 'OFF'}
              </button>

              <button
                type="button"
                onClick={() => setViewMode('browser')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-md text-xs font-mono font-semibold text-slate-200"
              >
                2×2
              </button>

              <button
                type="button"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-md text-xs font-mono font-semibold text-slate-200"
              >
                W/L
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setViewMode('viewer')}
              className="btn-primary text-xs !py-1.5 !px-3"
            >
              Open viewer
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2"
          >
            <FiX size={18} />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex min-h-0 overflow-hidden bg-[#06090f]">
        
        {viewMode === 'browser' ? (
          /* PACS 01: Study Browser Screen */
          <div className="flex-1 flex p-6 gap-6 max-w-7xl mx-auto w-full">
            
            {/* Prior Studies List */}
            <div className="w-80 flex flex-col gap-3 shrink-0">
              <h3 className="font-mono text-xs uppercase font-bold tracking-widest text-slate-400 mb-1">
                PRIOR STUDIES
              </h3>

              <div className="bg-[#0B1B33] border-2 border-[var(--blue)] rounded-2xl p-4 cursor-pointer">
                <h4 className="font-bold text-white font-sans text-sm">{studyName}</h4>
                <p className="font-mono text-xs text-slate-400 mt-1">JUN 24 2026 · 412 img</p>
              </div>

              <div className="bg-[#0B1B33]/60 border border-slate-800 rounded-2xl p-4 hover:border-slate-700 cursor-pointer">
                <h4 className="font-semibold text-slate-200 font-sans text-sm">CT Chest w/o</h4>
                <p className="font-mono text-xs text-slate-400 mt-1">DEC 11 2025 · 388 img</p>
              </div>

              <div className="bg-[#0B1B33]/60 border border-slate-800 rounded-2xl p-4 hover:border-slate-700 cursor-pointer">
                <h4 className="font-semibold text-slate-200 font-sans text-sm">CXR PA/LAT</h4>
                <p className="font-mono text-xs text-slate-400 mt-1">MAR 02 2025 · 2 img</p>
              </div>
            </div>

            {/* Series Thumbnails View */}
            <div className="flex-1 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white font-sans">
                  {studyName} · 4 series
                </h2>
                <button
                  type="button"
                  onClick={() => setViewMode('viewer')}
                  className="btn-primary"
                >
                  Open viewer
                </button>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                {[
                  { name: 'AXIAL', count: 120 },
                  { name: 'CORONAL', count: 96 },
                  { name: 'SAGITTAL', count: 96 },
                  { name: 'MIP', count: 100 },
                ].map((s, idx) => (
                  <div
                    key={idx}
                    onClick={() => setViewMode('viewer')}
                    className="bg-[#0B1B33] border border-slate-800 rounded-2xl p-3 flex flex-col justify-between h-48 cursor-pointer hover:border-[var(--blue)] transition-all group"
                  >
                    <div className="w-full flex-1 bg-slate-900/80 rounded-xl mb-3 flex items-center justify-center relative overflow-hidden">
                      <div className="w-20 h-20 rounded-full border border-slate-700/50 bg-radial from-slate-700/30 to-transparent flex items-center justify-center">
                        <span className="font-mono text-[10px] text-slate-500">DICOM</span>
                      </div>
                    </div>
                    <span className="font-mono text-xs text-slate-300 group-hover:text-white transition-colors">
                      {s.name} · {s.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          /* PACS 02: DICOM Viewer Multi-pane Screen */
          <div className="flex-1 flex">
            
            {/* Left Toolbar Icons */}
            <div className="w-14 bg-[#0B1B33] border-r border-slate-800 flex flex-col items-center py-4 gap-4 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTool('add')}
                className={`p-2.5 rounded-xl transition-all ${
                  activeTool === 'add' ? 'bg-[var(--blue)] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FiPlus size={18} />
              </button>

              <button
                type="button"
                onClick={() => setActiveTool('zoom')}
                className={`p-2.5 rounded-xl transition-all ${
                  activeTool === 'zoom' ? 'bg-[var(--blue)] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FiZoomIn size={18} />
              </button>

              <button
                type="button"
                onClick={() => setActiveTool('move')}
                className={`p-2.5 rounded-xl transition-all ${
                  activeTool === 'move' ? 'bg-[var(--blue)] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FiMove size={18} />
              </button>

              <button
                type="button"
                onClick={() => setActiveTool('clock')}
                className={`p-2.5 rounded-xl transition-all ${
                  activeTool === 'clock' ? 'bg-[var(--blue)] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FiClock size={18} />
              </button>

              <button
                type="button"
                onClick={() => setActiveTool('edit')}
                className={`p-2.5 rounded-xl transition-all ${
                  activeTool === 'edit' ? 'bg-[var(--blue)] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FiEdit3 size={18} />
              </button>
            </div>

            {/* 4-Pane Grid Viewports */}
            <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-1 bg-slate-950 p-1">
              
              {/* Pane 1: AXIAL with AI Marker Overlay */}
              <div className="bg-[#06090f] relative p-3 flex flex-col justify-between border border-slate-800/80">
                <span className="font-mono text-xs text-slate-300">AX · 120/412</span>

                {/* Simulated DICOM Image & AI Marker Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-56 h-56 rounded-full bg-radial from-slate-800/40 via-slate-900/60 to-transparent border border-slate-800 flex items-center justify-center relative">
                    {aiOverlay && (
                      <div className="absolute top-16 right-16 flex flex-col items-center gap-1">
                        <span className="font-mono text-[11px] font-bold text-[var(--cyan)] tracking-tight">
                          6mm · 0.94
                        </span>
                        <div className="w-12 h-12 rounded-full border-2 border-[var(--cyan)] shadow-[0_0_15px_rgba(34,211,238,0.4)] animate-pulse" />
                      </div>
                    )}
                  </div>
                </div>

                <span className="font-mono text-[11px] text-slate-500">WL 40 / WW 400</span>
              </div>

              {/* Pane 2: CORONAL */}
              <div className="bg-[#06090f] relative p-3 flex flex-col justify-between border border-slate-800/80">
                <span className="font-mono text-xs text-slate-300">COR · 48/96</span>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                  <div className="w-48 h-48 rounded-full bg-slate-800/50 border border-slate-700" />
                </div>
              </div>

              {/* Pane 3: SAGITTAL */}
              <div className="bg-[#06090f] relative p-3 flex flex-col justify-between border border-slate-800/80">
                <span className="font-mono text-xs text-slate-300">SAG · 50/96</span>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                  <div className="w-48 h-48 rounded-full bg-slate-800/50 border border-slate-700" />
                </div>
              </div>

              {/* Pane 4: MIP 3D */}
              <div className="bg-[#06090f] relative p-3 flex flex-col justify-between border border-slate-800/80">
                <span className="font-mono text-xs text-slate-300">MIP · 3D</span>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                  <div className="w-48 h-48 rounded-full bg-slate-800/50 border border-slate-700" />
                </div>
              </div>

            </div>

            {/* Right Sidebar: AI FINDINGS (PDF PACS 02 Concept) */}
            <div className="w-80 bg-[#0B1B33] border-l border-slate-800 p-5 flex flex-col justify-between shrink-0">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[var(--cyan)]" />
                  <span className="font-mono text-xs font-bold tracking-widest text-[var(--cyan)] uppercase">
                    AI FINDINGS
                  </span>
                </div>

                {/* Findings Card 1: Nodule (Active Highlight Border) */}
                <div className="bg-[#112440] border-2 border-[var(--cyan)] rounded-2xl p-4 space-y-1 shadow-lg">
                  <h4 className="font-bold text-white font-sans text-sm">Pulmonary nodule</h4>
                  <p className="font-mono text-xs text-slate-300">RLL · 6 mm · AX 120</p>
                  <p className="font-mono text-xs text-[var(--cyan)] font-semibold pt-1">
                    confidence 0.94
                  </p>
                </div>

                {/* Findings Card 2: No effusion */}
                <div className="bg-[#112440]/60 border border-slate-800 rounded-2xl p-4 space-y-1">
                  <h4 className="font-semibold text-slate-200 font-sans text-sm">No effusion</h4>
                  <p className="font-mono text-xs text-slate-400">confidence 0.99</p>
                </div>

                {/* Findings Card 3: Normal cardiac silhouette */}
                <div className="bg-[#112440]/60 border border-slate-800 rounded-2xl p-4 space-y-1">
                  <h4 className="font-semibold text-slate-200 font-sans text-sm">Normal cardiac silhouette</h4>
                  <p className="font-mono text-xs text-slate-400">confidence 0.97</p>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={onClose}
                className="btn-ai w-full text-center font-bold font-sans text-sm shadow-md"
              >
                Send to report
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
