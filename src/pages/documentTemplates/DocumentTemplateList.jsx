import { useNavigate } from 'react-router-dom'
import { useData } from '../../data/DataContext'
import DataTable from '../../components/ui/DataTable'

export default function DocumentTemplateList() {
  const navigate = useNavigate()
  const { getAll } = useData()
  const templates = getAll('documentTemplates')

  const columns = [
    { key: 'name', label: 'Template Name' },
    { key: 'fileName', label: 'File Name' },
    { key: 'fileType', label: 'File Type' },
    { key: 'description', label: 'Description' },
  ]

  return (
    <DataTable
      title="Document Templates"
      columns={columns}
      rows={templates}
      searchKeys={['name', 'fileName', 'description']}
      onRowClick={(row) => navigate(`/document-templates/${row.id}`)}
      onCreate={() => navigate('/document-templates/new')}
    />
  )
}
