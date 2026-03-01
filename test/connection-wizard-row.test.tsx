// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { ConnectionWizardRow } from '~/components/connection-wizard-row'
import { render, screen, userEvent } from './test-utils'

const mockSubmit = vi.fn()

vi.mock('react-router', () => ({
  useFetcher: () => ({
    submit: mockSubmit,
    formData: null,
    state: 'idle',
  }),
}))

const friend = {
  id: 'friend-2',
  name: 'Bob Smith',
  tierLabel: 'Close',
  tierColor: '#22c55e',
}

const selectedFriendId = 'friend-1'

describe('ConnectionWizardRow', () => {
  beforeEach(() => {
    mockSubmit.mockClear()
  })

  it('renders friend name and tier label', async () => {
    await render(
      <ConnectionWizardRow
        friend={friend}
        selectedFriendId={selectedFriendId}
        currentConnection={null}
      />,
    )
    expect(screen.getByText('Bob Smith')).toBeInTheDocument()
    expect(screen.getByText('Close')).toBeInTheDocument()
  })

  it('renders avatar with friend name', async () => {
    await render(
      <ConnectionWizardRow
        friend={friend}
        selectedFriendId={selectedFriendId}
        currentConnection={null}
      />,
    )
    expect(screen.getByRole('img', { name: 'Bob Smith' })).toBeInTheDocument()
  })

  it('renders type dropdown with all connection types', async () => {
    await render(
      <ConnectionWizardRow
        friend={friend}
        selectedFriendId={selectedFriendId}
        currentConnection={null}
      />,
    )
    const select = screen.getByLabelText('Connection type')
    expect(select).toBeInTheDocument()
    expect(select).toHaveValue('')
  })

  it('renders 5 strength dots', async () => {
    await render(
      <ConnectionWizardRow
        friend={friend}
        selectedFriendId={selectedFriendId}
        currentConnection={null}
      />,
    )
    const dots = screen.getAllByTitle(
      /Acquaintances|Casual|Friendly|Close|Inseparable/,
    )
    expect(dots).toHaveLength(5)
  })

  it('shows existing connection type and strength', async () => {
    await render(
      <ConnectionWizardRow
        friend={friend}
        selectedFriendId={selectedFriendId}
        currentConnection={{ id: 'conn-1', type: 'Coworkers', strength: 4 }}
      />,
    )
    const select = screen.getByLabelText('Connection type')
    expect(select).toHaveValue('Coworkers')
  })

  it('shows remove button when connection exists', async () => {
    await render(
      <ConnectionWizardRow
        friend={friend}
        selectedFriendId={selectedFriendId}
        currentConnection={{ id: 'conn-1', type: 'Friends', strength: 3 }}
      />,
    )
    expect(screen.getByTitle('Remove connection')).toBeInTheDocument()
  })

  it('does not show remove button when no connection', async () => {
    await render(
      <ConnectionWizardRow
        friend={friend}
        selectedFriendId={selectedFriendId}
        currentConnection={null}
      />,
    )
    expect(screen.queryByTitle('Remove connection')).not.toBeInTheDocument()
  })

  it('submits set-connection when changing type', async () => {
    const user = userEvent.setup()
    await render(
      <ConnectionWizardRow
        friend={friend}
        selectedFriendId={selectedFriendId}
        currentConnection={null}
      />,
    )
    const select = screen.getByLabelText('Connection type')
    await user.selectOptions(select, 'Friends')
    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        intent: 'set-connection',
        selectedFriendId: 'friend-1',
        otherFriendId: 'friend-2',
        type: 'Friends',
        strength: '3',
      }),
      { method: 'post' },
    )
  })

  it('submits set-connection when clicking a strength dot', async () => {
    const user = userEvent.setup()
    await render(
      <ConnectionWizardRow
        friend={friend}
        selectedFriendId={selectedFriendId}
        currentConnection={null}
      />,
    )
    const dot = screen.getByTitle('Close') // Strength 4
    await user.click(dot)
    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        intent: 'set-connection',
        selectedFriendId: 'friend-1',
        otherFriendId: 'friend-2',
        strength: '4',
      }),
      { method: 'post' },
    )
  })

  it('submits delete-connection when clicking remove', async () => {
    const user = userEvent.setup()
    await render(
      <ConnectionWizardRow
        friend={friend}
        selectedFriendId={selectedFriendId}
        currentConnection={{ id: 'conn-1', type: 'Friends', strength: 3 }}
      />,
    )
    await user.click(screen.getByTitle('Remove connection'))
    expect(mockSubmit).toHaveBeenCalledWith(
      {
        intent: 'delete-connection',
        selectedFriendId: 'friend-1',
        otherFriendId: 'friend-2',
        connectionId: 'conn-1',
      },
      { method: 'post' },
    )
  })

  it('includes connectionId when updating existing connection', async () => {
    const user = userEvent.setup()
    await render(
      <ConnectionWizardRow
        friend={friend}
        selectedFriendId={selectedFriendId}
        currentConnection={{ id: 'conn-1', type: 'Friends', strength: 3 }}
      />,
    )
    const select = screen.getByLabelText('Connection type')
    await user.selectOptions(select, 'Coworkers')
    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        intent: 'set-connection',
        connectionId: 'conn-1',
        type: 'Coworkers',
      }),
      { method: 'post' },
    )
  })

  it('renders without tier label when null', async () => {
    await render(
      <ConnectionWizardRow
        friend={{ ...friend, tierLabel: null, tierColor: null }}
        selectedFriendId={selectedFriendId}
        currentConnection={null}
      />,
    )
    expect(screen.getByText('Bob Smith')).toBeInTheDocument()
    expect(screen.queryByText('Close')).not.toBeInTheDocument()
  })
})
