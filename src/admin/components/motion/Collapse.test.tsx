// src/admin/components/motion/Collapse.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import Collapse from './Collapse'

describe('Collapse', () => {
  it('renders its children when open and removes them after closing', async () => {
    const { rerender } = render(
      <Collapse open>
        <p>Body</p>
      </Collapse>
    )
    expect(screen.getByText('Body')).toBeInTheDocument()

    rerender(
      <Collapse open={false}>
        <p>Body</p>
      </Collapse>
    )
    // Still in the DOM while it shrinks, but hidden from assistive tech…
    expect(screen.getByText('Body').closest('[aria-hidden="true"]')).toBeTruthy()
    fireEvent.transitionEnd(screen.getByTestId('collapse'))
    // …then gone.
    await waitFor(() => expect(screen.queryByText('Body')).not.toBeInTheDocument())
  })

  it('renders nothing when mounted closed', () => {
    render(
      <Collapse open={false}>
        <p>Body</p>
      </Collapse>
    )
    expect(screen.queryByText('Body')).not.toBeInTheDocument()
  })

  it('finishes closing even if no transition event arrives', async () => {
    const { rerender } = render(
      <Collapse open duration={20}>
        <p>Body</p>
      </Collapse>
    )
    rerender(
      <Collapse open={false} duration={20}>
        <p>Body</p>
      </Collapse>
    )
    await waitFor(() => expect(screen.queryByText('Body')).not.toBeInTheDocument())
  })
})
