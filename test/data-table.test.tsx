// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { type Column, DataTable } from '~/components/ui/data-table'
import { render, screen, userEvent } from './test-utils'

type User = { id: string; name: string; email: string }

const columns: Column<User>[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email' },
]

const data: User[] = [
  { id: '1', name: 'Alice', email: 'alice@example.com' },
  { id: '2', name: 'Bob', email: 'bob@example.com' },
]

describe('DataTable', () => {
  it('renders column headers', async () => {
    await render(<DataTable columns={columns} data={data} />)
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
  })

  it('renders row data', async () => {
    await render(<DataTable columns={columns} data={data} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('bob@example.com')).toBeInTheDocument()
  })

  it('shows empty state when data is empty', async () => {
    await render(
      <DataTable
        columns={columns}
        data={[]}
        emptyTitle="No users"
        emptyDescription="No users have been created yet."
      />,
    )
    expect(screen.getByText('No users')).toBeInTheDocument()
    expect(
      screen.getByText('No users have been created yet.'),
    ).toBeInTheDocument()
  })

  it('calls onSort when sortable column header is clicked', async () => {
    const onSort = vi.fn()
    const user = userEvent.setup()
    await render(<DataTable columns={columns} data={data} onSort={onSort} />)
    await user.click(screen.getByRole('button', { name: /name/i }))
    expect(onSort).toHaveBeenCalledWith('name')
  })

  it('renders custom cell content via render function', async () => {
    const columnsWithRender: Column<User>[] = [
      {
        key: 'name',
        label: 'Name',
        render: row => <strong>{row.name}</strong>,
      },
    ]
    await render(<DataTable columns={columnsWithRender} data={data} />)
    const strong = screen.getByText('Alice').closest('strong')
    expect(strong).toBeInTheDocument()
  })
})
