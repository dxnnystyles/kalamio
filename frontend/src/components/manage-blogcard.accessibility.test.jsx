import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../App', async () => {
  const { createContext } = await import('react')
  return { UserContext: createContext({}) }
})

vi.mock('../hooks/mutations', () => ({
  useDeleteBlog: () => ({ isPending: false, mutate: vi.fn() }),
}))

import { ManagePublishedBlogsCard } from './manage-blogcard.component'

afterEach(cleanup)

describe('ManagePublishedBlogsCard selection accessible name', () => {
  it('names the selection action according to the current state', () => {
    const props = {
      blog: {
        blog_id: 'post-1',
        title: 'A useful article',
        publishedAt: '2026-10-28T12:00:00.000Z',
        activity: {},
      },
      onToggleSelect: vi.fn(),
    }
    const card = (isSelected) => (
      <MemoryRouter>
        <ManagePublishedBlogsCard {...props} isSelected={isSelected} />
      </MemoryRouter>
    )
    const { rerender } = render(card(false))

    const selectButton = screen.getByRole('button', { name: 'Select A useful article' })
    expect(selectButton.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')

    rerender(card(true))

    const deselectButton = screen.getByRole('button', { name: 'Deselect A useful article' })
    expect(deselectButton.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})
