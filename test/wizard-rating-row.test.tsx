// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { WizardRatingRow } from '~/components/wizard-rating-row'
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
  id: 'friend-1',
  name: 'Alice Johnson',
  tierLabel: 'Close',
  tierColor: '#22c55e',
}

describe('WizardRatingRow', () => {
  beforeEach(() => {
    mockSubmit.mockClear()
  })

  it('renders friend name and tier label', async () => {
    await render(
      <WizardRatingRow
        friend={friend}
        activityId="act-1"
        currentRating={null}
      />,
    )
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
    expect(screen.getByText('Close')).toBeInTheDocument()
  })

  it('renders avatar with friend initials', async () => {
    await render(
      <WizardRatingRow
        friend={friend}
        activityId="act-1"
        currentRating={null}
      />,
    )
    expect(
      screen.getByRole('img', { name: 'Alice Johnson' }),
    ).toBeInTheDocument()
  })

  it('renders 5 rating buttons', async () => {
    await render(
      <WizardRatingRow
        friend={friend}
        activityId="act-1"
        currentRating={null}
      />,
    )
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(5)
    expect(buttons[0]).toHaveTextContent('1')
    expect(buttons[4]).toHaveTextContent('5')
  })

  it('highlights the active rating button', async () => {
    await render(
      <WizardRatingRow friend={friend} activityId="act-1" currentRating={2} />,
    )
    const buttons = screen.getAllByRole('button')
    // Button 2 (index 1) should have a colored background (jsdom converts hex to rgb)
    expect(buttons[1].style.backgroundColor).toBe('rgb(132, 204, 22)')
    // Other buttons should be transparent
    expect(buttons[0].style.backgroundColor).toBe('transparent')
    expect(buttons[2].style.backgroundColor).toBe('transparent')
  })

  it('submits set-rating when clicking an unselected rating', async () => {
    const user = userEvent.setup()
    await render(
      <WizardRatingRow
        friend={friend}
        activityId="act-1"
        currentRating={null}
      />,
    )
    const buttons = screen.getAllByRole('button')
    await user.click(buttons[2]) // Click rating 3
    expect(mockSubmit).toHaveBeenCalledWith(
      {
        intent: 'set-rating',
        friendId: 'friend-1',
        activityId: 'act-1',
        rating: '3',
      },
      { method: 'post' },
    )
  })

  it('submits clear-rating when clicking the already-selected rating', async () => {
    const user = userEvent.setup()
    await render(
      <WizardRatingRow friend={friend} activityId="act-1" currentRating={3} />,
    )
    const buttons = screen.getAllByRole('button')
    await user.click(buttons[2]) // Click rating 3 again to clear
    expect(mockSubmit).toHaveBeenCalledWith(
      {
        intent: 'clear-rating',
        friendId: 'friend-1',
        activityId: 'act-1',
      },
      { method: 'post' },
    )
  })

  it('submits set-rating when switching from one rating to another', async () => {
    const user = userEvent.setup()
    await render(
      <WizardRatingRow friend={friend} activityId="act-1" currentRating={2} />,
    )
    const buttons = screen.getAllByRole('button')
    await user.click(buttons[4]) // Click rating 5
    expect(mockSubmit).toHaveBeenCalledWith(
      {
        intent: 'set-rating',
        friendId: 'friend-1',
        activityId: 'act-1',
        rating: '5',
      },
      { method: 'post' },
    )
  })

  it('renders without tier label when null', async () => {
    await render(
      <WizardRatingRow
        friend={{ ...friend, tierLabel: null, tierColor: null }}
        activityId="act-1"
        currentRating={null}
      />,
    )
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
    expect(screen.queryByText('Close')).not.toBeInTheDocument()
  })

  it('has correct title attributes on rating buttons', async () => {
    await render(
      <WizardRatingRow
        friend={friend}
        activityId="act-1"
        currentRating={null}
      />,
    )
    expect(screen.getByTitle('Loves it')).toBeInTheDocument()
    expect(screen.getByTitle('Interested')).toBeInTheDocument()
    expect(screen.getByTitle('Maybe')).toBeInTheDocument()
    expect(screen.getByTitle('Probably not')).toBeInTheDocument()
    expect(screen.getByTitle('Definitely not')).toBeInTheDocument()
  })
})
