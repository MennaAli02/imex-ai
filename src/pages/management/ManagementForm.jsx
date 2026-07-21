import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useData } from '../../data/DataContext'
import { computeAge, formatCurrency } from '../../lib/utils'
import {
  TextField,
  NumberField,
  DateField,
  DateTimeField,
  SelectField,
  Many2OneField,
  BinaryField,
} from '../../components/ui/fields'
import StatusBar from '../../components/ui/StatusBar'
import SectionCard from '../../components/ui/SectionCard'
import Accordion from '../../components/ui/Accordion'
import ConsumableServiceTable from './ConsumableServiceTable'
import ReportViewerModal from './ReportViewerModal'
import {
  STATE_OPTIONS,
  STATE_OF_EXAM_OPTIONS,
  PATIENT_CONDITION_OPTIONS,
} from '../../data/seed'

const EMPTY = {
  patientId: null,
  dob: '',
  natId: '',
  gender: 'Male',
  phone: '',
  address: '',
  contractId: null,
  plansId: null,
  consumableServiceIds: [],
  examReason: '',
  medicalInfo: '',
  description: '',
  otherComments: '',
  examDate: '',
  stateOfExamSelection: '1',
  categoryId: null,
  cashProductId: null,
  radDoctorId: null,
  machineId: null,
  technicianId: null,
  doctorId: null,
  body: '',
  patientCondition: 'Natural',
  requestPro: '',
  accession: '',
  createUid: null,
  reportFilename: '',
  priceList: '',
  examPrice: 0,
  additionalPrice: 0,
  companyShare: 0,
  discountReason1Id: null,
  generalAmountDiscount: 0,
  generalPercentageDiscount: 0,
  additional: 0,
  additionalReason: '',
  cash: 0,
  cashReceipt: '',
  state: '4',
  reportState: 'partial',
  summary: '',
  pdfSaved: false,
  pdfFilename: '',
  googleDriveFileId: '',
  googleDriveLink: '',
  assignedDoctorId: null,
  reportDurationDisplay: '',
}

const toOptions = (list, nameKey) => list.map((i) => ({ id: i.id, name: i[nameKey] }))

export default function ManagementForm() {
  const { id } = useParams()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const {
    getById,
    getAll,
    create,
    update,
    remove,
    payManagement,
    saveReportPdf,
    reportVerify,
  } = useData()

  const [form, setForm] = useState(EMPTY)
  const [showReportViewer, setShowReportViewer] = useState(false)

  useEffect(() => {
    if (isNew) {
      // WorkList is read/edit only (create="false" in the real view) - new
      // bookings are created from the Ris Appointment screen instead.
      navigate('/appointments/new', { replace: true })
      return
    }
    const rec = getById('managements', id)
    if (rec) setForm(rec)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))

  const patients = getAll('patients')
  const insuranceCompanies = getAll('insuranceCompanies')
  const insurancePlans = getAll('insurancePlans')
  const categories = getAll('categories')
  const products = getAll('products')
  const doctors = getAll('doctors')
  const technicians = getAll('technicians')
  const machines = getAll('machines')
  const discountReasons = getAll('discountReasons')
  const users = getAll('users')

  const age = computeAge(form.dob)

  const handlePatientChange = (patientId) => {
    const patient = patients.find((p) => p.id === patientId)
    setForm((f) => ({
      ...f,
      patientId,
      dob: patient?.dob ?? '',
      natId: patient?.natId ?? '',
      gender: patient?.gender ?? 'Male',
      phone: patient?.phone ?? '',
      address: patient?.address ?? '',
      contractId: patient?.contractId ?? null,
      plansId: patient?.plansId ?? null,
    }))
  }

  const handleProductChange = (productId) => {
    const product = products.find((p) => p.id === productId)
    setForm((f) => ({ ...f, cashProductId: productId, examPrice: product?.price ?? f.examPrice }))
  }

  const plansOptions = insurancePlans.filter((p) => !form.contractId || p.companyId === form.contractId)
  const radDoctors = doctors.filter((d) => d.doctorType === 'doctor')
  const referralDoctors = doctors.filter((d) => d.doctorType === 'referral')

  const totalAmountAfterAll = useMemo(() => {
    return (
      (Number(form.examPrice) || 0) +
      (Number(form.additionalPrice) || 0) +
      (Number(form.additional) || 0) -
      (Number(form.generalAmountDiscount) || 0)
    )
  }, [form.examPrice, form.additionalPrice, form.additional, form.generalAmountDiscount])

  const remaining = totalAmountAfterAll - (Number(form.companyShare) || 0) - (Number(form.cash) || 0)

  const accountingDisplay = [
    form.cashProductId && { label: products.find((p) => p.id === form.cashProductId)?.name, price: form.examPrice },
    ...form.consumableServiceIds.map((l) => ({
      label: products.find((p) => p.id === l.productId)?.name,
      price: l.totalPrice,
    })),
  ].filter(Boolean)

  const persist = (vals) => {
    setForm((f) => ({ ...f, ...vals }))
    if (!isNew) update('managements', id, vals)
  }

  const handleSave = async () => {
    const vals = { ...form, totalAmountAfterAll, remaining }
    try {
      if (isNew) {
        const created = await create('managements', vals)
        navigate(`/management/${created.id}`)
      } else {
        await update('managements', id, vals)
      }
    } catch (e) {
      console.error('Save failed', e)
    }
  }

  const handleDelete = async () => {
    if (!isNew && confirm('Delete this record?')) {
      try {
        await remove('managements', id)
        navigate('/management')
      } catch (e) {
        console.error('Delete failed', e)
      }
    }
  }

  const handlePay = async () => {
    try {
      const amount = totalAmountAfterAll - (Number(form.companyShare) || 0)
      const data = await payManagement(id, { amount })
      persist(data)
    } catch (e) {
      console.error('Payment failed', e)
    }
  }

  const handleSaveReport = async () => {
    try {
      const data = await saveReportPdf(id, { summary: form.summary })
      persist(data)
    } catch (e) {
      console.error('Failed to save report PDF', e)
    }
  }

  const handleVerifyReport = async () => {
    try {
      const data = await reportVerify(id)
      persist(data)
    } catch (e) {
      console.error('Verification failed', e)
    }
  }

  return (
    <div dir="rtl" className="h-full min-h-0 flex-1 overflow-y-auto pr-2 pb-12">
      <div className="flex items-center justify-between mb-4" dir="ltr">
        <button onClick={() => navigate('/management')} className="text-sm text-brand-700 hover:underline">
          ← Back to WorkList
        </button>
        <div className="flex gap-2">
          {!isNew && (
            <button onClick={handleDelete} className="px-4 py-2 rounded-md text-sm font-semibold bg-red-100 text-red-700">
              Delete
            </button>
          )}
          <button onClick={handleSave} className="px-4 py-2 rounded-md text-sm font-semibold bg-brand-500 text-white">
            Save
          </button>
        </div>
      </div>

      <div className="bg-brand-700 rounded-xl p-3 mb-4" dir="ltr">
        <StatusBar options={STATE_OPTIONS} value={form.state} onChange={set('state')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-9 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <SectionCard title="Patient Info">
                <div className="flex flex-wrap gap-3">
                  <Many2OneField
                    label="Patient"
                    value={form.patientId}
                    onChange={handlePatientChange}
                    options={toOptions(patients, 'nickname')}
                    className="w-full"
                  />
                  <NumberField label="Age" value={age} disabled className="w-24" />
                  <DateField label="Date of Birth" value={form.dob} onChange={set('dob')} className="flex-1" />
                </div>
                <div className="flex flex-wrap gap-3 mt-3">
                  <TextField label="National ID" value={form.natId} onChange={set('natId')} className="flex-1" />
                  <SelectField
                    label="Gender"
                    value={form.gender}
                    onChange={set('gender')}
                    options={[{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }]}
                    className="w-32"
                  />
                  <TextField label="Phone" value={form.phone} onChange={set('phone')} className="flex-1" />
                  <TextField label="Address" value={form.address} onChange={set('address')} className="flex-1" />
                </div>
              </SectionCard>

              <SectionCard title="Contract Info">
                <div className="flex gap-3">
                  <Many2OneField
                    label="Contract"
                    value={form.contractId}
                    onChange={(v) => setForm((f) => ({ ...f, contractId: v, plansId: null }))}
                    options={toOptions(insuranceCompanies, 'name')}
                    className="w-1/2"
                  />
                  <Many2OneField
                    label="Plans"
                    value={form.plansId}
                    onChange={set('plansId')}
                    options={toOptions(plansOptions, 'name')}
                    className="w-1/2"
                  />
                </div>
              </SectionCard>

              <SectionCard title="Consumable Service">
                <ConsumableServiceTable lines={form.consumableServiceIds} onChange={set('consumableServiceIds')} />
              </SectionCard>

              <Accordion title="Visit Notes" defaultOpen>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <TextField label="Exam Reason" value={form.examReason} onChange={set('examReason')} />
                  <TextField label="Medical Info" value={form.medicalInfo} onChange={set('medicalInfo')} />
                  <TextField label="Description" value={form.description} onChange={set('description')} />
                  <TextField label="Other Comments" value={form.otherComments} onChange={set('otherComments')} />
                </div>
              </Accordion>
            </div>

            <div className="space-y-4">
              <SectionCard title="Visit Info">
                <div className="grid grid-cols-2 gap-3">
                  <DateTimeField label="Exam Date" value={form.examDate} onChange={set('examDate')} />
                  <SelectField
                    label="State of Exam"
                    value={form.stateOfExamSelection}
                    onChange={set('stateOfExamSelection')}
                    options={STATE_OF_EXAM_OPTIONS}
                  />
                  <Many2OneField label="Category" value={form.categoryId} onChange={set('categoryId')} options={toOptions(categories, 'name')} />
                  <Many2OneField label="Procedure" value={form.cashProductId} onChange={handleProductChange} options={toOptions(products, 'name')} />
                  <Many2OneField label="Rad Doctor" value={form.radDoctorId} onChange={set('radDoctorId')} options={toOptions(radDoctors, 'partnerName')} />
                  <Many2OneField label="Machine" value={form.machineId} onChange={set('machineId')} options={toOptions(machines, 'name')} />
                  <Many2OneField label="Radiographer" value={form.technicianId} onChange={set('technicianId')} options={toOptions(technicians, 'partnerName')} />
                  <Many2OneField label="Referral Doctor" value={form.doctorId} onChange={set('doctorId')} options={toOptions(referralDoctors, 'partnerName')} />
                  <TextField label="Body" value={form.body} onChange={set('body')} />
                  <SelectField label="Patient Condition" value={form.patientCondition} onChange={set('patientCondition')} options={PATIENT_CONDITION_OPTIONS} />
                  <TextField label="Request Pro" value={form.requestPro} onChange={set('requestPro')} />
                  <TextField label="Accession" value={form.accession} disabled />
                  <Many2OneField label="Created By" value={form.createUid} disabled options={toOptions(users, 'name')} />
                </div>
              </SectionCard>

              <SectionCard title="Report">
                <BinaryField label="Report File" fileName={form.reportFilename} onChange={set('reportFilename')} />
              </SectionCard>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <Accordion title="Checking Account" headerClassName="bg-amber-100">
            <div className="mb-3 text-sm bg-white rounded-md border border-gray-200 divide-y">
              {accountingDisplay.length === 0 && <div className="px-3 py-2 text-gray-400">No services yet</div>}
              {accountingDisplay.map((item, i) => (
                <div key={i} className="flex justify-between px-3 py-1.5">
                  <span>{item.label}</span>
                  <span className="font-semibold">{formatCurrency(item.price)}</span>
                </div>
              ))}
            </div>
            <hr className="my-3" />
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Price List" value={form.priceList} onChange={set('priceList')} />
              <NumberField label="Exam Price" value={form.examPrice} onChange={set('examPrice')} />
              <NumberField label="Additional Price" value={form.additionalPrice} onChange={set('additionalPrice')} />
              <NumberField label="Company Share" value={form.companyShare} onChange={set('companyShare')} />
            </div>
            <hr className="my-3" />
            <Many2OneField
              label="Discount Reason"
              value={form.discountReason1Id}
              onChange={set('discountReason1Id')}
              options={toOptions(discountReasons, 'name')}
              className="mb-3"
            />
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="Gen Amount Discount" value={form.generalAmountDiscount} onChange={set('generalAmountDiscount')} disabled={!!form.discountReason1Id} />
              <NumberField label="Gen % Discount" value={form.generalPercentageDiscount} onChange={set('generalPercentageDiscount')} disabled={!!form.discountReason1Id} />
              <TextField label="Additional" value={form.additional} onChange={set('additional')} />
              <TextField label="Additional Reason" value={form.additionalReason} onChange={set('additionalReason')} />
            </div>
            <hr className="my-3" />
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="Cash" value={form.cash} onChange={set('cash')} disabled={form.state === '2'} />
              <NumberField label="Net Due (Remaining)" value={remaining} disabled />
              <NumberField label="Total After All" value={totalAmountAfterAll} disabled />
              <TextField label="Invoice" value={form.cashReceipt} disabled />
            </div>
          </Accordion>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mt-4 p-4 flex flex-wrap items-center gap-3" dir="ltr">
        {form.state !== '2' && (
          <button onClick={handlePay} className="bg-brand-500 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2 rounded-md">
            Pay
          </button>
        )}
        {form.reportState === 'partial' && (
          <button onClick={handleSaveReport} className="bg-brand-500 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2 rounded-md">
            💾 Save Report
          </button>
        )}
        {['partial', 'not_verified', 'verified'].includes(form.reportState) && (
          <button onClick={handleVerifyReport} className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-md">
            ✔ Verify Report
          </button>
        )}
        <button
          onClick={() => setShowReportViewer(true)}
          className="bg-gray-700 hover:bg-gray-800 text-white text-sm font-semibold px-4 py-2 rounded-md"
        >
          Open Report Workflow
        </button>

        <div className="ml-auto flex flex-wrap gap-4 text-sm text-gray-600">
          <span>PDF Saved: <strong>{form.pdfSaved ? 'Yes' : 'No'}</strong></span>
          <span>PDF Filename: <strong>{form.pdfFilename || '—'}</strong></span>
          <span>Drive Link: <strong>{form.googleDriveLink || '—'}</strong></span>
        </div>
      </div>

      {showReportViewer && (
        <ReportViewerModal record={form} onChange={persist} onClose={() => setShowReportViewer(false)} />
      )}
    </div>
  )
}
