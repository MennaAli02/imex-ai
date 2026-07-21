import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useData } from '../../data/DataContext'
import {
  TextField,
  NumberField,
  DateField,
  SelectField,
  RadioField,
  Many2OneField,
  Many2ManyField,
} from '../../components/ui/fields'
import { DOCTOR_TYPE_OPTIONS, GENDER_OPTIONS_LOWER } from '../../data/seed'
import { FaUserDoctor } from 'react-icons/fa6'

const EMPTY = {
  partnerName: '',
  phone: '',
  specialization: '',
  email: '',
  degree: '',
  doctorType: '',
  gender: 'male',
  age: 0,
  dob: '',
  userId: null,
  doctorTemplateIds: [],
}

export default function DoctorForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getOne, getAll, create, update, remove } = useData()
  const isNew = !id || id === 'new'

  const users = getAll('users')
  const templates = getAll('documentTemplates')

  const [form, setForm] = useState(() => {
    if (isNew) return EMPTY
    const existing = getOne('doctors', id)
    return existing ? { ...EMPTY, ...existing } : EMPTY
  })
  const [error, setError] = useState(null)

  const set = (field) => (val) => setForm((f) => ({ ...f, [field]: val }))

  const handleSave = async () => {
    setError(null)
    if (!form.partnerName && !form.email) {
      setError('Please provide a Partner Name or Email.')
      return
    }
    try {
      if (isNew) {
        const created = await create('doctors', form)
        navigate(`/doctors/${created.id}`)
      } else {
        await update('doctors', id, form)
        navigate('/doctors')
      }
    } catch (e) {
      setError(e.message || 'Failed to save doctor.')
    }
  }

  const handleDelete = async () => {
    if (!isNew && confirm('Delete this doctor?')) {
      try {
        await remove('doctors', id)
        navigate('/doctors')
      } catch (e) {
        setError(e.message || 'Failed to delete doctor.')
      }
    }
  }

  return (
    <div className="h-full min-h-0 flex-1 overflow-y-auto px-4 pb-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate('/doctors')} className="text-xs text-[#00828a] hover:underline font-medium">
            ← Back to Doctors
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
              <FaUserDoctor size={20} className="text-cyan-200" />
              <span>Doctor Registration</span>
            </h1>
          </div>
          <div className="p-6">
            {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

            <div className="section-card">
              <div className="section-title">Professional Information</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                <TextField label="Name (Partner)" value={form.partnerName} onChange={set('partnerName')} placeholder="اختر أو أنشئ شريك" />
                <TextField label="Phone" value={form.phone} onChange={set('phone')} placeholder="+20 XXX XXX XXXX" />
                <TextField label="Specialization" value={form.specialization} onChange={set('specialization')} placeholder="e.g. Radiology, Cardiology" />
                <TextField label="Email" value={form.email} onChange={set('email')} placeholder="doctor@example.com" />
                <TextField label="Degree" value={form.degree} onChange={set('degree')} placeholder="e.g. PhD, MSc" />
                <SelectField label="Doctor Type" value={form.doctorType} onChange={set('doctorType')} options={DOCTOR_TYPE_OPTIONS} />
              </div>
            </div>

            <div className="section-card">
              <div className="section-title">Personal Information</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                <RadioField label="Gender" value={form.gender} onChange={set('gender')} options={GENDER_OPTIONS_LOWER} />
                <NumberField label="Age (years)" value={form.age} onChange={set('age')} />
                <DateField label="Date of Birth" value={form.dob} onChange={set('dob')} />
                <Many2OneField label="Related User" value={form.userId} onChange={set('userId')} options={users.map((u) => ({ id: u.id, name: u.name }))} />
                <Many2ManyField
                  label="Doctor Templates"
                  value={form.doctorTemplateIds}
                  onChange={set('doctorTemplateIds')}
                  options={templates.map((t) => ({ id: t.id, name: t.name }))}
                  className="md:col-span-2"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
