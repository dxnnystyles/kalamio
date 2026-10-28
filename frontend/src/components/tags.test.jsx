import { createContext } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../pages/editor.pages', () => ({ EditorContext: createContext(null) }))

import { EditorContext } from '../pages/editor.pages'
import Tag from './tags.component'

describe('Tag accessibility', () => {
  it('names the remove action and keeps it keyboard-activatable', async () => {
    const user = userEvent.setup()
    const setBlog = vi.fn()
    render(
      <EditorContext.Provider value={{ blog: { tags: ['writing'] }, setBlog }}>
        <Tag tag="writing" tagIndex={0} />
      </EditorContext.Provider>,
    )

    const removeButton = screen.getByRole('button', { name: 'Remove tag writing' })
    expect(removeButton.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')

    await user.tab()
    expect(removeButton).toHaveFocus()
    await user.keyboard('{Enter}')

    expect(setBlog).toHaveBeenCalledWith({ tags: [] })
  })
})
