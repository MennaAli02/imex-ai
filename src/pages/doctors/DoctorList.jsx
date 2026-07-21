import { useNavigate } from 'react-router-dom'
import { useData } from '../../data/DataContext'
import DataTable from '../../components/ui/DataTable'

export default function DoctorList() {
  const navigate = useNavigate()
  const { getAll } = useData()
  const doctors = getAll('doctors')

  const columns = [
    { key: 'partnerName', label: 'Name' },
    { key: 'specialization', label: 'Specialization' },
    { key: 'degree', label: 'Degree' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
  ]

  return (
    <DataTable
      title="Doctors"
      columns={columns}
      rows={doctors}
      searchKeys={['partnerName', 'specialization', 'phone', 'email']}
      onRowClick={(row) => navigate(`/doctors/${row.id}`)}
      onCreate={() => navigate('/doctors/new')}
    />
  )
}
