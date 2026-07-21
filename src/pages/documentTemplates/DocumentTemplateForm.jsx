import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useData } from '../../data/DataContext'
import { TextField, TextAreaField, SelectField, CheckboxField, BinaryField } from '../../components/ui/fields'
import { FILE_TYPE_OPTIONS } from '../../data/seed'

const EMPTY = {
  name: '',
  fileName: '',
  fileType: '',
  description: '',
  active: true,
  userId: null,
}

function deriveFileType(fileName) {
  if (!fileName) return ''
  const ext = fileName.split('.').pop().toLowerCase()
  if (['doc', 'docx', 'odt'].includes(ext)) return 'docx'
  if (['xls', 'xlsx', 'ods'].includes(ext)) return 'xlsx'
  if (['ppt', 'pptx', 'odp'].includes(ext)) return 'pptx'
  return ''
}

export default function DocumentTemplateForm() {
  const { id } = useParams()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const { getById, create, update, remove, uploadTemplateFile } = useData()

  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)

  useEffect(() => {
    if (!isNew) {
      const rec = getById('documentTemplates', id)
      if (rec) setForm(rec)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))

  const handleFileChange = (fileName, file) => {
    setForm((f) => ({ ...f, fileName, fileType: deriveFileType(fileName) }))
    setSelectedFile(file)
  }

  const handleSave = async () => {
    if (!form.name?.trim()) {
      setError('Template Name is required.')
      return
    }
    if (!form.fileName) {
      setError('Template File is required.')
      return
    }
    setError('')
    try {
      let createdOrUpdated
      if (isNew) {
        createdOrUpdated = await create('documentTemplates', form)
      } else {
        createdOrUpdated = await update('documentTemplates', id, form)
      }

      if (selectedFile) {
        await uploadTemplateFile(createdOrUpdated.id, selectedFile)
      }

      if (isNew) {
        navigate(`/document-templates/${createdOrUpdated.id}`)
      }
    } catch (e) {
      setError(e.message || 'Failed to save document template.')
    }
  }

  const handleDelete = async () => {
    if (!isNew && confirm('Delete this document template?')) {
      try {
        await remove('documentTemplates', id)
        navigate('/document-templates')
      } catch (e) {
        setError(e.message || 'Failed to delete document template.')
      }
    }
  }

  return (
    <div className="h-full min-h-0 flex-1 overflow-y-auto px-4 pb-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate('/document-templates')} className="text-xs text-[#00828a] hover:underline font-medium">
            ← Back to Document Templates
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

        <div className="section-card max-w-3xl mx-auto bg-white rounded-3xl border border-[#e2f1f1] shadow-md p-6">
          {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
            <TextField label="Template Name" value={form.name} onChange={set('name')} />
            <SelectField label="File Type" value={form.fileType} onChange={() => {}} options={FILE_TYPE_OPTIONS} disabled placeholder="—" />
            <BinaryField label="Template File" fileName={form.fileName} onChange={handleFileChange} />
            <CheckboxField label="Active" checked={form.active} onChange={set('active')} />
          </div>
          <div className="mt-3">
            <TextAreaField label="Description" value={form.description} onChange={set('description')} rows={4} />
          </div>
        </div>
      </div>
    </div>
  )
}
