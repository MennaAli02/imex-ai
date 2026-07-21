
import { Routes, Route, Navigate } from 'react-router-dom'

import AppLayout from './components/layout/AppLayout'

import AppointmentHome from './pages/appointments/AppointmentHome'

import AppointmentForm from './pages/appointments/AppointmentForm'

import ManagementHome from './pages/management/ManagementHome'

import ManagementForm from './pages/management/ManagementForm'

import PatientList from './pages/patients/PatientList'

import PatientForm from './pages/patients/PatientForm'

import DoctorList from './pages/doctors/DoctorList'

import DoctorForm from './pages/doctors/DoctorForm'

import TechnicianList from './pages/technicians/TechnicianList'

import TechnicianForm from './pages/technicians/TechnicianForm'

import DocumentTemplateList from './pages/documentTemplates/DocumentTemplateList'

import DocumentTemplateForm from './pages/documentTemplates/DocumentTemplateForm'

export default function AppRoutes() {

  return (

    <Routes>

      <Route path="/" element={<AppLayout />}>

        <Route index element={<Navigate to="/appointments" replace />} />

        <Route path="appointments" element={<AppointmentHome />} />

        <Route path="appointments/:id" element={<AppointmentForm />} />

        <Route path="management" element={<ManagementHome />} />

        <Route path="management/:id" element={<ManagementForm />} />

        <Route path="patients" element={<PatientList />} />

        <Route path="patients/:id" element={<PatientForm />} />

        <Route path="doctors" element={<DoctorList />} />

        <Route path="doctors/:id" element={<DoctorForm />} />

        <Route path="radiographers" element={<TechnicianList />} />

        <Route path="radiographers/:id" element={<TechnicianForm />} />

        <Route path="document-templates" element={<DocumentTemplateList />} />

        <Route path="document-templates/:id" element={<DocumentTemplateForm />} />

        <Route path="*" element={<Navigate to="/appointments" replace />} />

      </Route>

    </Routes>

  )

}

