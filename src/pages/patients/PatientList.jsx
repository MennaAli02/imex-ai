import { useNavigate } from 'react-router-dom'
import { useData } from '../../data/DataContext'
import DataTable from '../../components/ui/DataTable'

export default function PatientList() {
  const navigate = useNavigate()
  const { getAll } = useData()
  const patients = getAll('patients')

  const columns = [
    { key: 'pid', label: 'Patient ID' },
    { key: 'nickname', label: 'Nickname' },
    { key: 'firstName', label: 'First Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'gender', label: 'Gender' },
  ]

  return (
    <DataTable
      title="Patients"
      columns={columns}
      rows={patients}
      searchKeys={['nickname', 'firstName', 'pid', 'phone']}
      onRowClick={(row) => navigate(`/patients/${row.id}`)}
      onCreate={() => navigate('/patients/new')}
    />
  )
}
