import { CheckboxField } from '../../components/ui/fields'

// Stand-in for the ID-card scan strip at the top of the RIS Appointment form
// (card image + "Manual Extract" OCR buttons). There is no real OCR backend
// here, so the extract buttons just fill in representative sample data.
export default function PatientIdCard({ foreigner, onForeignerChange, cardImageName, onCardImageChange, onExtract }) {
  const handleFile = (e) => {
    const file = e.target.files?.[0]
    onCardImageChange(file?.name ?? '', file)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap items-center gap-4">
      <div className="flex flex-col items-center gap-1">
        <div className="w-20 h-16 rounded-md border border-dashed border-gray-300 flex items-center justify-center text-2xl bg-gray-50">
          🪪
        </div>
        <input type="file" onChange={handleFile} className="text-xs" />
        {cardImageName && <span className="text-xs text-gray-500">{cardImageName}</span>}
      </div>

      <div className="flex flex-wrap gap-2">
        {!foreigner ? (
          <button type="button" onClick={() => onExtract('national')} className="bg-brand-500 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2 rounded-md">
            ⬇ Manual Extract
          </button>
        ) : (
          <button type="button" onClick={() => onExtract('passport')} className="bg-brand-500 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2 rounded-md">
            ⬇ Manual Extract (Passport)
          </button>
        )}
        <button type="button" onClick={() => onExtract('crop')} className="bg-brand-700 hover:bg-brand-500 text-white text-sm font-semibold px-4 py-2 rounded-md">
          Manual Crop
        </button>
      </div>

      <CheckboxField label="Foreigner" checked={foreigner} onChange={onForeignerChange} className="ml-auto" />
    </div>
  )
}
