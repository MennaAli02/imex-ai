import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useData } from '../../data/DataContext'
import { computeAge } from '../../lib/utils'
import { TextField, NumberField, DateField, SelectField } from '../../components/ui/fields'
import { GENDER_OPTIONS_CAP } from '../../data/seed'
import { FaHospitalUser } from 'react-icons/fa6'

const EMPTY = {
  nickname: '',
  firstName: '',
  middleName: '',
  lastName: '',
  dob: '',
  natId: '',
  gender: 'Male',
  phone: '',
  address: '',
}

export default function PatientForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getOne, create, update, remove } = useData()
  const isNew = !id || id === 'new'

  const [form, setForm] = useState(() => {
    if (isNew) return EMPTY
    const existing = getOne('patients', id)
    return existing ? { ...EMPTY, ...existing } : EMPTY
  })
  const [error, setError] = useState(null)

  const set = (field) => (val) => setForm((f) => ({ ...f, [field]: val }))

  const handleSave = async () => {
    setError(null)
    if (!form.nickname && !form.firstName) {
      setError('Please provide a Nickname or First Name.')
      return
    }
    try {
      if (isNew) {
        const created = await create('patients', form)
        navigate(`/patients/${created.id}`)
      } else {
        await update('patients', id, form)
        navigate('/patients')
      }
    } catch (e) {
      setError('Save failed: ' + e.message)
    }
  }

  const handleDelete = async () => {
    if (!isNew && confirm('Delete this patient?')) {
      try {
        await remove('patients', id)
        navigate('/patients')
      } catch (e) {
        setError('Delete failed: ' + e.message)
      }
    }
  }

  const age = computeAge(form.dob)

  return (
    <div className="h-full min-h-0 flex-1 overflow-y-auto px-4 pb-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate('/patients')} className="text-xs text-[#00828a] hover:underline font-medium">
            ← Back to Patients
          </button>
          <div className="flex gap-2">
            {!isNew && (
              <button onClick={handleDelete} className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                Delete
              </button>
            )}
            <button onClick={handleSave} className="px-4 py-1.5 rounded-full text-xs font-medium bg-[#00828a] text-white hover:bg-[#006c73]">
              Save
            </button>
          </div>
        </div>

        <div className="rounded-3xl overflow-hidden shadow-md border border-[#e2f1f1] max-w-4xl mx-auto bg-white mb-6">
          <div className="bg-[#00828a] text-white text-center py-4">
            <h1 className="text-lg font-bold flex items-center justify-center gap-2">
              <FaHospitalUser size={20} className="text-cyan-200" />
              <span>Patient Registration</span>
            </h1>
          </div>
          <div className="section-card !mb-0 !border-0 !rounded-none">
            <div className="section-title">Personal Information</div>
            {error && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
              <TextField label="Nickname" value={form.nickname} onChange={set('nickname')} />
              <DateField label="Date Of Birth" value={form.dob} onChange={set('dob')} />
              <TextField label="First Name" value={form.firstName} onChange={set('firstName')} />
              <TextField label="National ID" value={form.natId} onChange={set('natId')} />
              <TextField label="Middle Name" value={form.middleName} onChange={set('middleName')} />
              <SelectField label="Gender" value={form.gender} onChange={set('gender')} options={GENDER_OPTIONS_CAP} />
              <TextField label="Last Name" value={form.lastName} onChange={set('lastName')} />
              <TextField label="Phone Number" value={form.phone} onChange={set('phone')} />
              <NumberField label="Age" value={age} disabled />
              <TextField label="Address" value={form.address} onChange={set('address')} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
