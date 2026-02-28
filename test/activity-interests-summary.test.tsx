// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { ActivityInterestsSummary } from '~/components/activity-interests-summary'
import { render, screen } from './test-utils'

const ratings = [
  {
    activityId: 'act-1',
    rating: 1,
    activityName: 'Dining Out',
    activityIcon: null,
  },
  {
    activityId: 'act-2',
    rating: 2,
    activityName: 'Hiking',
    activityIcon: null,
  },
  {
    activityId: 'act-3',
    rating: 4,
    activityName: 'Karaoke',
    activityIcon: null,
  },
]

// Stub react-router Link as a plain anchor
vi.mock('react-router', () => ({
  Link: ({
    to,
    children,
    ...props
  }: {
    to: string
    children: React.ReactNode
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}))

describe('ActivityInterestsSummary', () => {
  it('renders activity names grouped by rating', async () => {
    await render(
      <ActivityInterestsSummary
        ratings={ratings}
        friendId="friend-1"
        friendName="Sarah"
      />,
    )
    expect(screen.getByText('Dining Out')).toBeInTheDocument()
    expect(screen.getByText('Hiking')).toBeInTheDocument()
    expect(screen.getByText('Karaoke')).toBeInTheDocument()
  })

  it('renders plan event links for each activity', async () => {
    await render(
      <ActivityInterestsSummary
        ratings={ratings}
        friendId="friend-1"
        friendName="Sarah"
      />,
    )
    const links = screen.getAllByTitle('Plan event with Sarah')
    expect(links).toHaveLength(3)
  })

  it('links include correct query params', async () => {
    await render(
      <ActivityInterestsSummary
        ratings={ratings}
        friendId="friend-1"
        friendName="Sarah"
      />,
    )
    const links = screen.getAllByTitle('Plan event with Sarah')
    const href = links[0].getAttribute('href')
    expect(href).toContain('/events/new')
    expect(href).toContain('activityId=act-1')
    expect(href).toContain('friendId=friend-1')
    expect(href).toContain('friendName=Sarah')
  })

  it('encodes friendName in the URL', async () => {
    await render(
      <ActivityInterestsSummary
        ratings={[ratings[0]]}
        friendId="friend-1"
        friendName="Mary Jane"
      />,
    )
    const link = screen.getByTitle('Plan event with Mary Jane')
    const href = link.getAttribute('href')
    expect(href).toContain('friendName=Mary%20Jane')
  })
})
