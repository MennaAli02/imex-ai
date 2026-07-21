// Static UI selection option constants.
// These are hard-coded UI labels that mirror the Odoo selection field values.
// They are NOT fetched from Odoo — they are fixed by the data model definition.

export const STATE_OPTIONS = [
  { value: '4', label: 'Appointment' },
  { value: '1', label: 'Arrived' },
  { value: '2', label: 'Paid' },
  { value: '3', label: 'Pending' },
  { value: '7', label: 'Under Inspection' },
  { value: '8', label: 'Completed' },
  { value: '5', label: 'Cancelled' },
  { value: '10', label: 'Photos Delivered' },
  { value: '11', label: 'Report Delivered' },
  { value: '9', label: 'Fully Delivered' },
  { value: '6', label: 'Refunded' },
]

export const REPORT_STATE_OPTIONS = [
  { value: 'partial', label: 'Pending' },
  { value: 'not_verified', label: 'InProgress' },
  { value: 'verified', label: 'Reported' },
  { value: 'approved', label: 'Approved' },
]

export const STATE_OF_EXAM_OPTIONS = [
  { value: '1', label: 'Arrived' },
  { value: '4', label: 'Appointment' },
]

export const PATIENT_CONDITION_OPTIONS = [
  { value: 'Natural', label: 'Natural' },
  { value: 'emergency', label: 'Emergency' },
]

export const GENDER_OPTIONS_CAP = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
]

export const GENDER_OPTIONS_LOWER = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
]

export const DOCTOR_TYPE_OPTIONS = [
  { value: 'doctor', label: 'Doctor' },
  { value: 'specialist', label: 'Specialist' },
  { value: 'referral', label: 'Referral Doctor' },
]

export const FILE_TYPE_OPTIONS = [
  { value: 'docx', label: 'Word Document' },
  { value: 'xlsx', label: 'Excel Spreadsheet' },
  { value: 'pptx', label: 'PowerPoint Presentation' },
]

export const PATIENT_TYPE_OPTIONS = [
  { value: 'cash', label: 'Cash' },
  { value: 'insurance', label: 'Contract' },
  { value: 'pricelist', label: 'Pricelist' },
]

export const PATIENT_STATE_OPTIONS = [
  { value: 'vip', label: 'VIP' },
  { value: 'normal', label: 'Normal' },
]

export const STATE2_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'editing', label: 'Being Edited' },
  { value: 'done', label: 'Completed' },
]
