import { useState } from 'react'
import StatusBar from '../../components/ui/StatusBar'
import { REPORT_STATE_OPTIONS } from '../../data/seed'
import { useData } from '../../data/DataContext'

export default function ReportViewerModal({ record, onChange, onClose }) {
  const {
    getAll,
    reportPartial,
    reportNotVerified,
    reportVerify,
    saveReportSummary,
    applyTemplate,
  } = useData()

  const defaultFindings =
    record.summary ||
    `The lungs are clear without focal consolidation, effusion, or pneumothorax. A 6 mm solid nodule is noted in the right lower lobe, unchanged from prior. The heart size is normal. No pericardial effusion. Mediastinal and hilar contours are within normal limits.`
  
  const defaultImpression = `1. Stable 6 mm right lower lobe nodule. Follow-up per Fleischner criteria.\n2. No acute cardiopulmonary process.`

  const [findings, setFindings] = useState(defaultFindings)
  const [impression, setImpression] = useState(defaultImpression)
  const [aiInserted, setAiInserted] = useState(false)
  const templates = getAll('documentTemplates') || []

  const setReportState = (value) => onChange({ reportState: value })

  const handleVerify = async () => {
    try {
      const data = await reportVerify(record.id)
      onChange(data)
    } catch (e) {
      console.error('Failed to verify report', e)
    }
  }

  const handleSaveSummary = async () => {
    const combined = `FINDINGS:\n${findings}\n\nIMPRESSION:\n${impression}`
    try {
      const data = await saveReportSummary(record.id, combined)
      onChange(data)
    } catch (e) {
      console.error('Failed to save report summary', e)
    }
  }

  const handleInsertAiFindings = () => {
    if (!aiInserted) {
      setFindings((prev) =>
        prev.includes('6 mm solid nodule')
          ? prev
          : `${prev}\nAI Finding: 6mm RLL nodule confirmed (confidence 0.94).`
      )
      setAiInserted(true)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 sm:p-6 select-none">
      <div className="max-w-5xl w-full flex flex-col md:flex-row gap-6 max-h-[92vh] overflow-y-auto">
        
        {/* Left Card: Report Editor (PDF RIS 03 Concept) */}
        <div className="flex-1 bg-white border border-[var(--line)] rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-6">
          
          <div>
            {/* Header / Meta */}
            <div className="flex items-start justify-between border-b border-[var(--line)] pb-4 mb-4">
              <div>
                <h2 className="text-xl font-extrabold text-[var(--ink)] font-sans">
                  {record.studyDescription || record.studyName || 'CT Chest w/o contrast'}
                </h2>
                <p className="font-mono text-xs text-[var(--muted)] mt-1 tracking-wide">
                  {record.patientName || 'A. MOSTAFA'} · MRN {record.mrn || record.patientId || '49201'} · #{record.accessionNumber || '20413'}
                </p>
              </div>

              <span className="pill-ai font-bold">
                ● DRAFT
              </span>
            </div>

            {/* Findings Field */}
            <div className="mb-5">
              <label className="field-label text-xs">FINDINGS</label>
              <textarea
                rows={5}
                value={findings}
                onChange={(e) => setFindings(e.target.value)}
                className="w-full border border-[var(--line)] rounded-xl p-3.5 text-sm font-sans text-[var(--ink)] leading-relaxed focus:outline-none focus:border-[var(--blue)] focus:ring-1 focus:ring-[var(--blue)] shadow-xs"
              />
            </div>

            {/* Impression Field */}
            <div>
              <label className="field-label text-xs">IMPRESSION</label>
              <textarea
                rows={3}
                value={impression}
                onChange={(e) => setImpression(e.target.value)}
                className="w-full border border-[var(--line)] rounded-xl p-3.5 text-sm font-sans text-[var(--ink)] leading-relaxed focus:outline-none focus:border-[var(--blue)] focus:ring-1 focus:ring-[var(--blue)] shadow-xs"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-[var(--line)]">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  handleSaveSummary()
                  handleVerify()
                  onClose()
                }}
                className="btn-primary"
              >
                Sign & finalize
              </button>

              <button
                type="button"
                onClick={handleSaveSummary}
                className="btn-secondary"
              >
                Save draft
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)]"
            >
              Close
            </button>
          </div>
        </div>

        {/* Right Floating Card: AI ASSIST Panel (PDF RIS 03 Concept) */}
        <div className="w-full md:w-80 bg-[var(--ink)] text-white rounded-2xl p-6 shadow-xl flex flex-col justify-between border border-slate-800 space-y-6">
          
          <div className="space-y-4">
            {/* AI ASSIST Header */}
            <div className="flex items-center gap-2.5">
              <div className="flex flex-col gap-1 w-4">
                <div className="h-0.5 bg-[var(--cyan)] rounded-full w-3" />
                <div className="h-0.5 bg-[var(--cyan)] rounded-full w-4" />
                <div className="h-0.5 bg-[var(--cyan)] rounded-full w-2" />
              </div>
              <span className="font-mono text-xs font-bold tracking-widest text-[var(--cyan)] uppercase">
                AI ASSIST
              </span>
            </div>

            {/* Description Text */}
            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              Detected 1 pulmonary nodule. Suggested measurement and Fleischner follow-up inserted into findings.
            </p>

            {/* Detection List */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between bg-[#112440] p-3 rounded-xl border border-slate-700/60">
                <span className="text-xs font-semibold font-sans text-white">RLL nodule</span>
                <span className="font-mono text-xs font-bold text-[var(--cyan)]">6 mm · 0.94</span>
              </div>

              <div className="flex items-center justify-between bg-[#112440]/60 p-3 rounded-xl border border-slate-800">
                <span className="text-xs font-medium font-sans text-slate-400">Cardiomegaly</span>
                <span className="font-mono text-xs text-slate-400">none · 0.02</span>
              </div>

              <div className="flex items-center justify-between bg-[#112440]/60 p-3 rounded-xl border border-slate-800">
                <span className="text-xs font-medium font-sans text-slate-400">Effusion</span>
                <span className="font-mono text-xs text-slate-400">none · 0.01</span>
              </div>
            </div>
          </div>

          {/* Action Button for AI (Cyan action button as per PDF Cyan = AI rule!) */}
          <button
            type="button"
            onClick={handleInsertAiFindings}
            className="btn-ai w-full text-center font-bold font-sans text-sm shadow-md"
          >
            {aiInserted ? '✓ Inserted into report' : 'Insert all into report'}
          </button>
        </div>

      </div>
    </div>
  )
}
